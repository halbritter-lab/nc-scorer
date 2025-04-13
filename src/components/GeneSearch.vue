<!-- src/components/GeneSearch.vue -->
<template>
  <v-card class="search-card">
    <v-card-text>
      <div class="search-container mx-auto mb-4">
        <!-- Main search area with Google-like styling -->  
        <div class="google-search-wrapper">
          <div class="search-inputs-row d-flex align-center" @keyup.enter="search">
            <!-- Input area with magnifying glass icon -->
            <div class="search-input-area d-flex align-center" style="width: calc(100% - 56px);">
              <v-icon class="search-icon ml-3 mr-2">mdi-magnify</v-icon>
              <v-autocomplete
                v-model="searchQuery"
                :items="filteredItems"
                label="Search genes"
                :loading="isLoading"
                variant="plain"
                hide-details
                @keyup.enter="search"
                @update:search="onTextInput"
                id="gene-search-input"
                aria-label="Search for a gene by symbol or HGNC ID"
                density="comfortable"
                class="google-search-input"
                style="width: 100%;"
                clearable
                item-title="title"
                item-value="value"
                auto-select-first
                no-filter
                autocomplete="off"
                :menu-props="{ maxHeight: '300px' }"
              ></v-autocomplete>
            </div>
            
            <!-- Simple search button -->
            <div class="search-button-area d-flex align-center px-2" style="width: 56px;">
              <v-btn
                color="primary"
                variant="text"
                icon
                @click="search"
                aria-label="Search"
                size="large"
              >
                <v-icon>mdi-arrow-right</v-icon>
              </v-btn>
            </div>
          </div>
        </div>
        
        <!-- Hint text below search box -->
        <div class="mt-1 text-caption hint-text">
          Search by gene symbol or HGNC ID (e.g. PKD1, HGNC:9008, or just 9008)
        </div>
      </div>

      <!-- Display an error alert if symbols fail to load -->
      <v-alert v-if="error" type="error" dismissible>
        {{ error.message }}
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
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
      return autocompleteItems.value.filter(item => {
        // Match against symbol
        if (item.symbol && item.symbol.toLowerCase().includes(query)) return true;
        
        // Match against HGNC ID
        if (item.hgncId) {
          const hgncIdStr = String(item.hgncId);
          if (query.includes(hgncIdStr)) return true;
          if (hgncIdStr.includes(query)) return true;
        }
        
        // Match against display string
        if (item.display && item.display.toLowerCase().includes(query)) return true;
        
        return false;
      }).slice(0, 10); // Limited to 10 suggestions for better UX
    });

    // Load both symbol and HGNC indices
    const loadIndices = async () => {
      isLoading.value = true;
      try {
        const result = await fetchGeneSearchIndices();
        
        hgncToSymbolMap.value = result.hgncToSymbolMap || {};
        
        // Create properly validated items
        autocompleteItems.value = result.combinedItems.map(item => ({
          symbol: item.symbol || '',
          hgncId: item.hgncId || '',
          display: item.display || item.symbol || '',
          value: item.symbol || '',
          title: item.display || item.symbol || ''
        }));
        
        console.info(`Loaded ${result.symbolsIndex.length} gene symbols and ${result.hgncIndex.length} HGNC IDs for search`);
      } catch (err) {
        console.error('Error loading gene search indices:', err);
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
      
      const query = String(input).trim();
      
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
      if (!searchQuery.value) return;
      
      try {
        const symbol = getGeneSymbolFromInput(searchQuery.value);
        if (symbol) {
          console.log(`Navigating to gene: ${symbol}`);
          router.push({ path: `/symbols/${symbol}` });
        }
      } catch (err) {
        console.error('Error performing search:', err);
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
      onTextInput
    };
  }
};
</script>

<style scoped>
.search-card {
  max-width: 900px;
  margin: auto;
  padding: 16px;
}

.search-container {
  max-width: 700px;
  margin: 0 auto;
}

.google-search-wrapper {
  border: 1px solid #dfe1e5;
  border-radius: 24px;
  padding: 8px 0;
  overflow: hidden;
  background: white;
}

/* Dark mode adjustments */
.v-theme--dark .google-search-wrapper {
  background: #1e1e1e;
  border-color: #666;
  border-width: 1.5px;
}

.google-search-wrapper:hover {
  box-shadow: 0 1px 6px rgba(32, 33, 36, 0.28);
  border-color: rgba(223, 225, 229, 0);
}

.v-theme--dark .google-search-wrapper:hover {
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.4);
  border-color: rgba(50, 50, 50, 0.8);
}

.google-search-input {
  border: none !important;
  font-size: 16px;
}

/* Dark mode input text */
.v-theme--dark .google-search-input {
  color: rgba(255, 255, 255, 0.87) !important;
}

.v-theme--dark .google-search-input .v-field__input {
  color: rgba(255, 255, 255, 0.87) !important;
}

.search-inputs-row {
  min-height: 44px;
}

.search-icon {
  color: #9aa0a6;
}

.v-theme--dark .search-icon {
  color: rgba(255, 255, 255, 0.7);
}

/* Hint text styling with theme support */
.hint-text {
  color: #666;
}

.v-theme--dark .hint-text {
  color: rgba(255, 255, 255, 0.6);
}
</style>
