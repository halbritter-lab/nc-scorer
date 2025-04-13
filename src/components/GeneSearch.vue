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
                :items="symbols"
                label="Search genes"
                :loading="isLoading"
                variant="plain"
                hide-details
                @keyup.enter="search"
                id="gene-search-input"
                aria-label="Search for a gene by symbol"
                density="comfortable"
                class="google-search-input"
                style="width: 100%;"
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
          Enter a gene symbol (e.g. PKD1)
        </div>
      </div>

      <!-- Display an error alert if symbols fail to load -->
      <v-alert v-if="error" type="error" dismissible>
        {{ error.message }}
      </v-alert>

      <!-- Search Button (replaced by the one in the search bar) -->
    </v-card-text>
  </v-card>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchSymbolsIndex } from '@/api/geneApi.js'; // Use the new API module

export default {
  name: 'GeneSearch',
  setup() {
    const searchQuery = ref('');
    const router = useRouter();
    const symbols = ref([]);
    const isLoading = ref(false);
    const error = ref(null);

    const loadSymbols = async () => {
      isLoading.value = true;
      try {
        symbols.value = await fetchSymbolsIndex();
      } catch (err) {
        error.value = err;
      } finally {
        isLoading.value = false;
      }
    };

    onMounted(loadSymbols);

    const search = () => {
      if (searchQuery.value) {
        router.push({ path: `/symbols/${searchQuery.value}` });
      }
    };

    return {
      searchQuery,
      search,
      symbols,
      isLoading,
      error,
    };
  },
};
</script>

<style scoped>
.search-card {
  max-width: 900px; /* Adjust this value as needed */
  margin: auto; /* Centers the input if it's smaller than the container */
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

.full-width {
  width: 100%;
  flex: 1 1 auto;
}

.full-width .v-field {
  width: 100%;
}

/* Force autocomplete to use available width */
.v-autocomplete.full-width {
  width: 100% !important;
  min-width: 100%;
}

.v-autocomplete.full-width .v-field__input {
  width: 100% !important;
}

.v-autocomplete.full-width .v-field__field {
  width: 100% !important;
}

.vertical-divider {
  border-left: 1px solid #dfe1e5;
  height: 24px;
}

.v-theme--dark .vertical-divider {
  border-left-color: #666;
  border-left-width: 1.5px;
}

/* Hint text styling with theme support */
.hint-text {
  color: #666;
}

.v-theme--dark .hint-text {
  color: rgba(255, 255, 255, 0.6);
}
</style>
