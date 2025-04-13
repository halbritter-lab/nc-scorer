<!-- src/components/VariantCard.vue -->
<template>
  <v-card class="variant-card">
    <v-card-title class="d-flex flex-wrap align-center">
      <div class="variant-title text-truncate" :title="variantInput">
        Variant Details for "{{ variantInput }}"
      </div>
      
      <div class="d-flex flex-nowrap ml-auto">
        <!-- Retry count badge - shown when retries have occurred -->
        <v-badge
          v-if="retryStates.variant.attempts > 0"
          color="warning"
          :content="retryStates.variant.attempts"
          :title="`Retried ${retryStates.variant.attempts} times due to network issues`"
          offset-x="5"
          offset-y="5"
        >
          <v-icon size="small" color="warning">mdi-refresh</v-icon>
        </v-badge>

        <!-- Spinning icon when retry is in progress -->
        <v-tooltip
          v-if="retryStates.variant.inProgress"
          location="top"
          text="Retrying API request..."
        >
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" size="small" color="warning" class="ml-2 retry-spinner">
              mdi-refresh
            </v-icon>
          </template>
        </v-tooltip>
        
        <!-- Cache indicator - shows briefly when data is from cache -->
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
      <div v-if="loading" class="loading-container">
        <!-- Skeleton loader for better visual experience during loading -->
        <v-skeleton-loader
          class="mx-auto"
          :type="scoreInterpretationConfig.skeletonLoaders.variant.type"
          :loading="loading"
        ></v-skeleton-loader>
      </div>
      <div v-else-if="error">
        <v-alert type="error" dismissible>
          <template v-if="isMaxRetriesError">
            Failed to load variant data after multiple attempts. There might be a temporary issue
            with external services (e.g., Ensembl/VEP). Please try again later.
          </template>
          <template v-else>{{ error }}</template>
        </v-alert>
      </div>
      <div v-else>
        <!-- Score Section -->
        <v-card class="mb-4 score-section" v-if="hasScore">
          <v-card-text>
            <v-table class="summary-table">
              <tbody>
                <DataDisplayRow
                  v-for="[scoreKey, config] in visibleScoreConfig"
                  :key="scoreKey"
                  :config="config"
                  :value="scoreSummary[scoreKey]"
                  :defaultValue="'NA'"
                />
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

        <!-- Overall Summary Section -->
        <v-card class="mb-4 summary-section">
          <v-card-text>
            <v-table class="summary-table">
              <tbody>
                <DataDisplayRow
                  :config="{
                    label: 'Most Severe Consequence',
                    description: 'The top predicted impact for this variant.',
                  }"
                  :value="annotationSummary.most_severe_consequence"
                  :defaultValue="'NA'"
                />

                <DataDisplayRow
                  v-if="prioritizedGeneSymbol"
                  :config="{
                    label: 'Gene Symbol',
                    description: 'Prioritized gene symbol based on MANE Select status and impact severity.',
                    style: 'chip',
                    font: 'italic',
                  }"
                  :value="prioritizedGeneSymbol"
                  :title="annotationSummary.gene_symbol"
                />

                <DataDisplayRow
                  v-if="
                    annotationSummary.gene_symbol &&
                    annotationSummary.gene_symbol !== prioritizedGeneSymbol &&
                    annotationSummary.gene_symbol.includes(',')
                  "
                  :config="{
                    label: 'All Gene Symbols',
                    description: 'All gene symbols associated with this variant.',
                    style: 'text',
                    font: 'italic',
                  }"
                  :value="annotationSummary.gene_symbol"
                />

                <DataDisplayRow
                  v-if="annotationSummary.hgnc_id"
                  :config="{
                    label: 'HGNC ID',
                    description: 'HGNC Identifier.',
                  }"
                  :value="annotationSummary.hgnc_id"
                />
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

        <!-- Frequency Section -->
        <v-card class="mb-4" v-if="frequencyExtracted">
          <v-card-text>
            <v-table class="summary-table">
              <tbody>
                <DataDisplayRow
                  v-for="[freqKey, config] in visibleFrequencyConfig"
                  :key="freqKey"
                  :config="config"
                  :value="frequencyExtracted[freqKey]"
                  :defaultValue="'NA'"
                />
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

        <!-- Transcript Consequences Section -->
        <v-card class="mb-4" v-if="transcriptIds.length">
          <v-card-text>
            <v-select
              v-model="selectedTranscriptId"
              :items="transcriptIds"
              label="Select Transcript ID"
            ></v-select>
            <div v-if="selectedTranscript">
              <v-table class="annotation-table">
                <tbody>
                  <tr v-for="entry in visibleAnnotationConfig" :key="entry[0]">
                    <td class="info-col">
                      <span class="label-hover" :title="entry[1].description">
                        {{ entry[1].label }}
                      </span>
                      <v-tooltip activator="parent" location="start">
                        {{ entry[1].description }}
                      </v-tooltip>
                    </td>
                    <td class="value-col">
                      <template v-if="entry[1].format === 'array'">
                        <v-chip
                          v-for="(item, idx) in selectedTranscript[entry[0]]"
                          :key="idx"
                          class="mr-1"
                          small
                        >
                          {{ item }}
                        </v-chip>
                      </template>
                      <template v-else>
                        <v-chip
                          v-if="entry[1].style === 'chip'"
                          :class="{
                            'italic-font': entry[1].font === 'italic',
                            'bold-font': entry[1].font === 'bold',
                          }"
                          :color="getColor(selectedTranscript[entry[0]], entry[1])"
                        >
                          {{ formatValue(selectedTranscript[entry[0]], entry[1]) }}
                        </v-chip>
                        <span v-else>
                          {{ formatValue(selectedTranscript[entry[0]], entry[1]) }}
                        </span>
                      </template>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </v-card-text>
        </v-card>

        <!-- Final Score Section (unchanged) -->
        <v-card v-if="result && result.finalScore !== undefined" class="mt-4">
          <v-card-title>Final Score</v-card-title>
          <v-card-text>{{ result.finalScore }}</v-card-text>
        </v-card>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { ref, onMounted, computed, inject, watchEffect } from 'vue';
import DataDisplayRow from '@/components/DataDisplayRow.vue';
import { queryVariant } from '@/api/variantApi.js';
import { variantAnnotationConfig } from '@/config/variantAnnotationConfig.js';
import { variantFrequencyConfig } from '@/config/variantFrequencyConfig.js';
import { variantScoreConfig } from '@/config/variantScoreConfig.js';
import { getColor, formatValue } from '@/utils/format.js';
import useRetryState from '@/composables/useRetryState.js';
import { getPrioritizedGeneSymbol } from '@/utils/geneSymbolUtils.js';
import { scoreInterpretationConfig } from '@/config/scoreInterpretationConfig.js';

export default {
  name: 'VariantCard',
  components: {
    DataDisplayRow,
  },
  props: {
    variantInput: {
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    const result = ref(null);
    const loading = ref(true);
    const error = ref(null);
    const isMaxRetriesError = ref(false);
    const fromCache = ref(false);
    const showCacheIndicator = ref(false);

    // Get shared retry state from parent or create a new one
    const { retryStates } = inject('retryState', useRetryState());

    // Compute transcript consequences from the first annotationData object.
    const transcriptOptions = computed(() => {
      if (
        result.value &&
        result.value.annotationData &&
        result.value.annotationData.length > 0 &&
        result.value.annotationData[0].transcript_consequences
      ) {
        return result.value.annotationData[0].transcript_consequences;
      }
      return [];
    });

    // Compute a list of transcript IDs.
    const transcriptIds = computed(() => transcriptOptions.value.map((tc) => tc.transcript_id));
    const selectedTranscriptId = ref(null);
    const selectedTranscript = computed(() =>
      transcriptOptions.value.find((tc) => tc.transcript_id === selectedTranscriptId.value)
    );

    // Compute a filtered array of [propKey, config] entries for annotation details.
    const visibleAnnotationConfig = computed(() => {
      return Object.entries(variantAnnotationConfig).filter(([, config]) => config.visibility);
    });

    // Compute summary data from the first annotation object.
    const annotationSummary = computed(() => {
      if (result.value && result.value.annotationData && result.value.annotationData.length > 0) {
        const anno = result.value.annotationData[0];
        return {
          most_severe_consequence: anno.most_severe_consequence,
          gene_symbol: Array.isArray(anno.gene_symbol)
            ? anno.gene_symbol.join(', ')
            : anno.gene_symbol,
          hgnc_id: Array.isArray(anno.hgnc_id) ? anno.hgnc_id.join(', ') : anno.hgnc_id,
          fullAnnotation: anno, // Store full annotation for prioritization
        };
      }
      return {};
    });
    // Prioritized single gene symbol based on MANE Select and impact severity
    const prioritizedGeneSymbol = computed(() => {
      if (!annotationSummary.value.fullAnnotation) {
        return annotationSummary.value.gene_symbol || '';
      }
      return getPrioritizedGeneSymbol(annotationSummary.value.fullAnnotation);
    });

    // Compute frequency data from the first colocated variant.
    const frequencyData = computed(() => {
      if (
        result.value &&
        result.value.annotationData &&
        result.value.annotationData[0].colocated_variants &&
        result.value.annotationData[0].colocated_variants.length > 0 &&
        result.value.annotationData[0].colocated_variants[0].frequencies
      ) {
        return result.value.annotationData[0].colocated_variants[0].frequencies;
      }
      return null;
    });

    // Extract the first nested object value from frequencies (regardless of its key).
    const frequencyExtracted = computed(() => {
      if (frequencyData.value && typeof frequencyData.value === 'object') {
        const keys = Object.keys(frequencyData.value);
        if (keys.length > 0) {
          return frequencyData.value[keys[0]];
        }
      }
      return null;
    });

    // Compute visible frequency config entries.
    const visibleFrequencyConfig = computed(() => {
      return Object.entries(variantFrequencyConfig).filter(([, config]) => config.visibility);
    });

    // Compute score summary from the first annotation object.
    const scoreSummary = computed(() => {
      if (
        result.value &&
        result.value.annotationData &&
        result.value.annotationData.length > 0 &&
        result.value.annotationData[0].nephro_variant_score_gnomadg_missing !== undefined
      ) {
        return {
          nephro_variant_score: result.value.annotationData[0].nephro_variant_score_gnomadg_missing,
        };
      }
      return {};
    });

    // Compute visible score config entries.
    const visibleScoreConfig = computed(() => {
      return Object.entries(variantScoreConfig).filter(([, config]) => config.visibility);
    });

    // Determine if a score exists.
    const hasScore = computed(() => Object.keys(scoreSummary.value).length > 0);

    // Helper: Format value or return a default ("NA") if value is null/undefined or empty.
    const formatOrDefault = (value, config) => {
      const formatted = formatValue(value, config);
      return formatted === null || formatted === undefined || formatted === '' ? 'NA' : formatted;
    };

    // scoreInterpretationConfig is already imported and available to the template
    
    onMounted(async () => {
      try {
        // Reset retry state before making the API call
        retryStates.variant.reset();
        retryStates.variant.component = 'VariantCard';

        // Create a shared state object to track retries
        const retryState = retryStates.variant;

        const response = await queryVariant(props.variantInput, {
          retryState,
          onRetry: () => {
            retryState.inProgress = true;
            // Using global notification system only
          },
          onSuccess: () => {
            retryState.inProgress = false;
            // Using global notification system only
          },
        });
        
        // Handle the new response format with source information
        result.value = response.data;
        
        // Set cache indicator if data was from cache
        if (response.source && response.source.fromCache) {
          fromCache.value = true;
          showCacheIndicator.value = true;
          
          // Auto-hide the indicator after 3 seconds
          setTimeout(() => {
            showCacheIndicator.value = false;
          }, 3000);
        }

        if (transcriptIds.value.length > 0) {
          selectedTranscriptId.value = transcriptIds.value[0];
        }
      } catch (err) {
        retryStates.variant.inProgress = false;
        // Check if we've exhausted retry attempts
        if (retryStates.variant.attempts >= 4) { // Using default maxRetries value from retryWithBackoff
          isMaxRetriesError.value = true;
          error.value = 'Maximum retry attempts reached';
          // Notify via global state that we've reached max retries
        } else {
          isMaxRetriesError.value = false;
          error.value = err.message || 'Error fetching variant data.';
        }
      } finally {
        loading.value = false;
      }
    });

    // Emit variant data changes to parent component
    watchEffect(() => {
      if (!loading.value && !error.value && Object.keys(scoreSummary.value).length > 0) {
        emit('variant-score-updated', {
          score: scoreSummary.value.nephro_variant_score || 0,
          variant: props.variantInput,
          geneSummary: annotationSummary.value,
          prioritizedGeneSymbol: prioritizedGeneSymbol.value, // Include the prioritized gene symbol
        });
      }
    });

    return {
      loading,
      error,
      transcriptIds,
      selectedTranscriptId,
      selectedTranscript,
      visibleAnnotationConfig,
      getColor,
      formatValue,
      formatOrDefault,
      result,
      annotationSummary,
      frequencyExtracted,
      visibleFrequencyConfig,
      scoreSummary,
      visibleScoreConfig,
      hasScore,
      retryStates,
      prioritizedGeneSymbol, // Expose the prioritized gene symbol
      scoreInterpretationConfig, // Make available to the template
      isMaxRetriesError,
      showCacheIndicator,
      fromCache
    };
  },
};
</script>

<style scoped>
.variant-card {
  max-width: 600px;
  margin: auto;
  padding: 16px;
}
.summary-table {
  width: 100%;
}
.annotation-table {
  width: 100%;
}
.info-col {
  width: 40%;
  vertical-align: top;
}
.value-col {
  width: 60%;
  vertical-align: top;
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
.mt-4 {
  margin-top: 16px;
}
.summary-section {
  margin-bottom: 16px;
  padding: 8px;
  border-radius: 4px;
}
.summary-item {
  margin-bottom: 4px;
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
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cache-indicator {
  font-size: 0.75rem;
}

.variant-title {
  max-width: calc(100% - 100px); /* Reserve space for indicators */
}
</style>
