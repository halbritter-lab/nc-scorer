<!-- src/components/GeneCard.vue -->
<template>
  <v-card class="gene-card">
    <v-card-title class="d-flex flex-wrap align-center">
      <!-- Gene Title -->
      <div class="gene-title text-truncate" :title="symbol">
        Gene Details for "{{ symbol }}"
      </div>

      <!-- Indicators (Retry/Cache) -->
      <div class="d-flex flex-nowrap ml-auto">
        <!-- Retry count badge -->
        <v-badge
          v-if="retryStates.gene.attempts > 0"
          color="warning"
          :content="retryStates.gene.attempts"
          :title="`Retried ${retryStates.gene.attempts} times due to network issues`"
          offset-x="5"
          offset-y="5"
          class="mr-1"
        >
          <v-icon size="small" color="warning">mdi-refresh</v-icon>
        </v-badge>
        <!-- Spinning icon when retry is in progress -->
        <v-tooltip v-if="retryStates.gene.inProgress" location="top" text="Retrying API request...">
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" size="small" color="warning" class="ml-1 retry-spinner">
              mdi-refresh
            </v-icon>
          </template>
        </v-tooltip>
        <!-- Cache indicator -->
        <v-fade-transition>
          <v-chip
            v-if="showCacheIndicator"
            size="small"
            color="primary"
            class="ml-2 cache-indicator"
          >
            <v-icon start size="small">mdi-database-check-outline</v-icon>
            Cached
          </v-chip>
        </v-fade-transition>
      </div>
    </v-card-title>

    <v-card-text>
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <v-skeleton-loader
          class="mx-auto"
          :type="scoreInterpretationConfig.skeletonLoaders.gene.type"
          :loading="loading"
        ></v-skeleton-loader>
      </div>
      <!-- Error State -->
      <div v-else-if="error">
        <v-alert type="error" dismissible>
          <template v-if="isMaxRetriesError">
            Failed to load gene data after multiple attempts. There might be a temporary issue with
            external services. Please try again later.
          </template>
          <template v-else>{{ error }}</template>
        </v-alert>
      </div>

      <!-- Content Section (Wrapped in outlined card) -->
      <div v-else>
        <v-card variant="outlined" class="mb-2"> <!-- Use outlined variant -->
          <v-card-text class="pa-0"> <!-- Remove padding if table has its own -->
            <v-table class="gene-info-table">
              <tbody>
                <DataDisplayRow
                  v-for="(item, key) in filteredGeneData"
                  :key="key"
                  :config="{
                    label: item.label,
                    description: item.description,
                    style: item.style,
                    font: item.font,
                    colorThresholds: item.colorThresholds,
                    isKeyScore: item.isKeyScore,
                    scoreType: item.scoreType
                  }"
                  :value="item.value"
                  :defaultValue="'NA'"
                />
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
// Script section remains unchanged - no logic changes needed for styling
import { ref, onMounted, computed, inject, watchEffect } from 'vue';
import { fetchGeneDetails } from '@/api/geneApi.js';
import { logService } from '@/services/logService';
import { geneDetailsConfig } from '@/config/geneDetailsConfig.js';
import { getColor, formatValue } from '@/utils/format.js';
import useRetryState from '@/composables/useRetryState.js';
import DataDisplayRow from '@/components/DataDisplayRow.vue';
import { scoreInterpretationConfig } from '@/config/scoreInterpretationConfig.js';
import { API_CACHE_KEY } from '@/composables/useApiCache';

export default {
  name: 'GeneCard',
  components: {
    DataDisplayRow,
  },
  props: {
    symbol: {
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    const geneData = ref({});
    const loading = ref(true);
    const error = ref(null);
    const isMaxRetriesError = ref(false);
    const fromCache = ref(false);
    const showCacheIndicator = ref(false);

    // Get shared retry state from parent or create a new one
    const { retryStates } = inject('retryState', useRetryState());
    
    // Inject API cache instance
    const apiCache = inject(API_CACHE_KEY, null);

    // Compute gene details formatted by the configuration.
    const filteredGeneData = computed(() => {
      const formattedData = {};
      if (geneData.value) {
        Object.entries(geneData.value).forEach(([key, value]) => {
          const config = geneDetailsConfig[key];
          if (config && config.visibility) {
            formattedData[key] = {
              label: config.label,
              description: config.description,
              value: formatValue(value, config),
              color: getColor(value, config),
              style: config.style,
              font: config.font,
              isKeyScore: config.isKeyScore || false, // Pass the isKeyScore flag
              scoreType: config.scoreType || null, // Pass the scoreType for styling
            };
          }
        });
      }
      return formattedData;
    });

    // scoreInterpretationConfig is available directly in the template

    onMounted(async () => {
      try {
        // Reset retry state before making the API call
        retryStates.gene.reset();
        retryStates.gene.component = 'GeneCard';

        // Create a shared state object to track retries
        const retryState = retryStates.gene;

        const result = await fetchGeneDetails(props.symbol, {
          retryState,
          apiCache,
          onRetry: (err, attempt) => { // Add params to onRetry
             retryState.inProgress = true;
             logService.warn(`Retry attempt ${attempt} for gene ${props.symbol}: ${err.message}`);
          },
          onSuccess: (attempts) => { // Add params to onSuccess
            retryState.inProgress = false;
            if (attempts > 0) {
               logService.info(`Successfully fetched gene ${props.symbol} after ${attempts} retries.`);
            }
          },
        });

        // Handle the new response format with source information
        geneData.value = result.data;

        // Set cache indicator if data was from cache
        if (result.source && result.source.fromCache) {
          fromCache.value = true;
          showCacheIndicator.value = true;

          // Auto-hide the indicator after 3 seconds
          setTimeout(() => {
            showCacheIndicator.value = false;
          }, 3000);
        }
      } catch (err) {
        retryStates.gene.inProgress = false;
        logService.error(`Error fetching gene ${props.symbol}:`, err); // Log error
        // Check if we've exhausted retry attempts
        if (retryStates.gene.attempts >= 4) { // Using default maxRetries value from retryWithBackoff
          isMaxRetriesError.value = true;
          error.value = `Maximum retry attempts reached for gene ${props.symbol}.`;
        } else {
          isMaxRetriesError.value = false;
          error.value = err.message || `Error fetching gene data for ${props.symbol}.`;
        }
      } finally {
        loading.value = false;
      }
    });

    // Watch for changes in the gene data and emit them to parent component
    watchEffect(() => {
      if (!loading.value && !error.value && geneData.value && geneData.value.ngs !== undefined) { // Check ngs specifically
        emit('gene-score-updated', {
          score: geneData.value.ngs,
          symbol: props.symbol,
          formattedData: filteredGeneData.value,
        });
      }
    });

    return {
      loading,
      error,
      filteredGeneData,
      retryStates,
      scoreInterpretationConfig,
      isMaxRetriesError,
      showCacheIndicator,
      fromCache
    };
  },
};
</script>

<style scoped>
/* Styles remain unchanged */
.gene-card {
  /* max-width: 600px; <-- Can be removed if parent container controls width */
  margin: auto;
  /* padding: 16px; <-- Padding handled by v-card-text */
}
.gene-info-table {
  width: 100%;
}
.label-hover {
  cursor: help;
}
.italic-font {
  font-style: italic;
}
.bold-font {
  font-weight: bold;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.retry-spinner {
  animation: spin 1.5s linear infinite;
}

.loading-container {
  min-height: 200px; /* Or adjust based on content */
  display: flex;
  align-items: center;
  justify-content: center;
}

.cache-indicator {
  font-size: 0.75rem;
}

.gene-title {
  max-width: calc(100% - 100px); /* Reserve space for indicators */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* Ensure tables within cards don't add extra padding/background */
.v-card .v-table {
  background-color: transparent;
}
.v-card > .v-table > .v-table__wrapper > table > tbody > tr > td {
    font-size: 0.875rem;
}
.v-card > .v-table > .v-table__wrapper > table > tbody > tr:hover {
   background: transparent !important;
}
</style>
