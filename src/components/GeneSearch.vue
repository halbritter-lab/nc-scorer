<!-- src/components/GeneSearch.vue -->
<template>
  <form class="gene-search-form" @submit.prevent="search">
    <div class="form-heading">
      <h2>Find a gene</h2>
      <p>Search the gene index by symbol or HGNC identifier.</p>
    </div>
    <v-autocomplete
      v-model="searchQuery"
      :items="filteredItems"
      label="Gene symbol or HGNC ID"
      :loading="isLoading"
      variant="outlined"
      @update:search="onTextInput"
      id="gene-search-input"
      clearable
      item-title="title"
      item-value="value"
      auto-select-first
      no-filter
      autocomplete="off"
      :menu-props="{ maxHeight: '300px' }"
      hint="For example: PKD1, HGNC:9008, or 9008."
      persistent-hint
    />
    <v-alert v-if="error" type="error" variant="tonal" class="my-4">{{
      error.message
    }}</v-alert>
    <v-btn
      type="submit"
      color="primary"
      min-height="48"
      class="mt-5"
      append-icon="mdi-arrow-right"
      >Look up gene</v-btn
    >
    <div class="form-examples">
      <h3>Explore kidney disease genes</h3>
      <div class="example-list">
        <router-link :to="{ name: 'GeneView', params: { symbol: 'PKD1' } }"
          >PKD1</router-link
        ><router-link :to="{ name: 'GeneView', params: { symbol: 'COL4A5' } }"
          >COL4A5</router-link
        >
      </div>
    </div>
  </form>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { logService } from '@/services/logService';
import { useRouter } from 'vue-router';
import { fetchGeneSearchIndices } from '@/api/geneApi.js';

export default {
  name: 'GeneSearch',
  setup() {
    const searchQuery = ref('');
    const router = useRouter();
    const autocompleteItems = ref([]);
    const isLoading = ref(false);
    const error = ref(null);
    const hgncToSymbolMap = ref({});

    // Store the current filter text for manual filtering
    const filterText = ref('');

    // Handle manual text input for filtering
    const onTextInput = (text) => {
      filterText.value = text;
    };

    // Filtered items based on current search query - limited to 10 suggestions
    const filteredItems = computed(() => {
      if (!filterText.value) return [];

      const query = filterText.value.toLowerCase();
      return autocompleteItems.value
        .filter((item) => {
          // Match against symbol
          if (item.symbol && item.symbol.toLowerCase().includes(query))
            return true;

          // Match against HGNC ID
          if (item.hgncId) {
            const hgncIdStr = String(item.hgncId);
            if (query.includes(hgncIdStr)) return true;
            if (hgncIdStr.includes(query)) return true;
          }

          // Match against display string
          if (item.display && item.display.toLowerCase().includes(query))
            return true;

          return false;
        })
        .slice(0, 10); // Limited to 10 suggestions for better UX
    });

    // Load both symbol and HGNC indices
    const loadIndices = async () => {
      isLoading.value = true;
      try {
        const result = await fetchGeneSearchIndices();

        hgncToSymbolMap.value = result.hgncToSymbolMap || {};

        // Create properly validated items
        autocompleteItems.value = result.combinedItems.map((item) => ({
          symbol: item.symbol || '',
          hgncId: item.hgncId || '',
          display: item.display || item.symbol || '',
          value: item.symbol || '',
          title: item.display || item.symbol || '',
        }));

        logService.info(
          `Loaded ${result.symbolsIndex.length} gene symbols and ${result.hgncIndex.length} HGNC IDs for search`,
        );
      } catch (err) {
        logService.error('Error loading gene search indices:', err);
        error.value = err;
      } finally {
        isLoading.value = false;
      }
    };

    // Extract gene symbol from user input
    const getGeneSymbolFromInput = (input) => {
      if (!input) return null;

      // Handle case when v-autocomplete returns an object
      if (typeof input === 'object' && input !== null) {
        // If it's an autocomplete item object, extract the symbol directly
        if (input.symbol) {
          return input.symbol;
        }
        // If for some reason we have an object without a symbol, try to stringify it
        input = String(input);
      }

      const query = String(input).trim().toUpperCase();

      // Check if it's a display format like "PKD1 (HGNC:9008)"
      const displayMatch = query.match(/^([A-Za-z0-9]+)\s+\(HGNC:[0-9]+\)$/);
      if (displayMatch) {
        return displayMatch[1]; // Return the symbol part
      }

      // Check if it's an HGNC ID with prefix
      if (query.startsWith('HGNC:')) {
        const hgncId = query.substring(5);
        return hgncToSymbolMap.value[hgncId] || query;
      }

      // Check if it's a numeric HGNC ID
      if (/^\d+$/.test(query)) {
        return hgncToSymbolMap.value[query] || query;
      }

      // Otherwise, use as-is (likely a gene symbol)
      return query;
    };

    // Perform search
    const search = () => {
      const input = searchQuery.value || filterText.value;
      if (!input) return;

      try {
        const symbol = getGeneSymbolFromInput(input);
        if (symbol) {
          logService.info(`Navigating to gene: ${symbol}`);
          router.push({ name: 'GeneView', params: { symbol } });
        }
      } catch (err) {
        logService.error('Error performing search:', err);
        error.value = new Error('An error occurred while searching');
      }
    };

    // Initialize on component mount
    onMounted(loadIndices);

    return {
      searchQuery,
      search,
      autocompleteItems,
      filteredItems,
      isLoading,
      error,
      onTextInput,
    };
  },
};
</script>
