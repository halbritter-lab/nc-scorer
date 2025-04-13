<!-- src/components/VariantCard.vue -->
<template>
  <v-card class="variant-card">
    <v-card-title class="d-flex flex-wrap align-center">
      <div class="variant-title text-truncate" :title="hasSecondVariant ? `Variants: ${variantInput}, ${variantInput2}` : variantInput">
        {{ hasSecondVariant ? 'Compound Heterozygous Variants' : `Variant Details for "${variantInput}"` }}
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
      <!-- Add tabs for compound heterozygous variants -->
      <v-tabs v-if="hasSecondVariant" v-model="activeTab" class="mb-4" grow>
        <v-tab :value="0">
          <v-icon start>mdi-numeric-1-circle</v-icon>
          Variant 1
        </v-tab>
        <v-tab :value="1">
          <v-icon start>mdi-numeric-2-circle</v-icon>
          Variant 2
        </v-tab>
      </v-tabs>
      
      <!-- Loading state for the active tab -->
      <div v-if="(activeTab === 0 && loading) || (activeTab === 1 && loading2)" class="loading-container">
        <v-skeleton-loader
          class="mx-auto"
          :type="scoreInterpretationConfig.skeletonLoaders.variant.type"
          :loading="activeTab === 0 ? loading : loading2"
        ></v-skeleton-loader>
      </div>
      
      <!-- Error state for the active tab -->
      <div v-else-if="(activeTab === 0 && error) || (activeTab === 1 && error2)">
        <v-alert type="error" dismissible>
          <template v-if="activeTab === 0 && isMaxRetriesError || activeTab === 1 && isMaxRetriesError2">
            Failed to load variant data after multiple attempts. There might be a temporary issue
            with external services (e.g., Ensembl/VEP). Please try again later.
          </template>
          <template v-else>{{ activeTab === 0 ? error : error2 }}</template>
        </v-alert>
      </div>
      
      <div v-else>
        <!-- Score Section -->
        <v-card class="mb-4 score-section" v-if="activeTab === 0 ? Object.keys(scoreSummary).length > 0 : Object.keys(scoreSummary2).length > 0">
          <v-card-text>
            <v-table class="summary-table">
              <tbody>
                <DataDisplayRow
                  v-for="[scoreKey, config] in visibleScoreConfig"
                  :key="scoreKey"
                  :config="config"
                  :value="activeTab === 0 ? scoreSummary[scoreKey] : scoreSummary2[scoreKey]"
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
                  :value="activeTab === 0 ? annotationSummary.most_severe_consequence : annotationSummary2.most_severe_consequence"
                  :defaultValue="'NA'"
                />

                <DataDisplayRow
                  v-if="activeTab === 0 ? prioritizedGeneSymbol : prioritizedGeneSymbol2"
                  :config="{
                    label: 'Gene Symbol',
                    description: 'Prioritized gene symbol based on MANE Select status and impact severity.',
                    style: 'chip',
                    font: 'italic',
                  }"
                  :value="activeTab === 0 ? prioritizedGeneSymbol : prioritizedGeneSymbol2"
                  :title="activeTab === 0 ? annotationSummary.gene_symbol : annotationSummary2.gene_symbol"
                />

                <DataDisplayRow
                  v-if="
                    activeTab === 0 ?
                      (annotationSummary.gene_symbol &&
                      annotationSummary.gene_symbol !== prioritizedGeneSymbol &&
                      annotationSummary.gene_symbol.includes(',')) :
                      (annotationSummary2.gene_symbol &&
                      annotationSummary2.gene_symbol !== prioritizedGeneSymbol2 &&
                      annotationSummary2.gene_symbol.includes(','))
                  "
                  :config="{
                    label: 'All Gene Symbols',
                    description: 'All gene symbols associated with this variant.',
                    style: 'text',
                    font: 'italic',
                  }"
                  :value="activeTab === 0 ? annotationSummary.gene_symbol : annotationSummary2.gene_symbol"
                />

                <DataDisplayRow
                  v-if="activeTab === 0 ? annotationSummary.hgnc_id : annotationSummary2.hgnc_id"
                  :config="{
                    label: 'HGNC ID',
                    description: 'HGNC Identifier.',
                  }"
                  :value="activeTab === 0 ? annotationSummary.hgnc_id : annotationSummary2.hgnc_id"
                />
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

        <!-- Frequency Section -->
        <v-card class="mb-4" v-if="activeTab === 0 ? frequencyExtracted : frequencyExtracted2">
          <v-card-text>
            <v-table class="summary-table">
              <tbody>
                <DataDisplayRow
                  v-for="[freqKey, config] in visibleFrequencyConfig"
                  :key="freqKey"
                  :config="config"
                  :value="(activeTab === 0 ? frequencyExtracted : frequencyExtracted2)[freqKey]"
                  :defaultValue="'NA'"
                />
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

        <!-- Transcript Consequences Section -->
        <v-card class="mb-4" v-if="activeTab === 0 ? transcriptIds.length : transcriptIds2.length">
          <v-card-text>
            <v-select
              :model-value="activeTab === 0 ? selectedTranscriptId : selectedTranscriptId2"
              @update:model-value="value => activeTab === 0 ? selectedTranscriptId = value : selectedTranscriptId2 = value"
              :items="activeTab === 0 ? formattedTranscriptOptions : formattedTranscriptOptions2"
              item-title="title"
              item-value="value"
              label="Select Transcript"
              return-object
            >
              <template v-slot:item="{ item, props }">
                <v-list-item
                  v-bind="props"
                  :title="item.raw.title"
                  :class="{'font-weight-bold': item.raw.mane}"
                >
                  <!-- Add visual indicator for MANE Select transcripts -->
                  <template v-slot:prepend>
                    <v-icon
                      v-if="item.raw.mane"
                      color="primary"
                      size="small"
                      class="mr-2"
                    >
                      mdi-check-decagram
                    </v-icon>
                  </template>
                  
                  <!-- Add impact badges -->
                  <template v-slot:append>
                    <v-chip
                      v-if="item.raw.impact"
                      size="x-small"
                      :color="getImpactColor(item.raw.impact)"
                      class="ml-2"
                      density="compact"
                    >
                      {{ item.raw.impact }}
                    </v-chip>
                  </template>
                </v-list-item>
              </template>
            </v-select>
            <div v-if="activeTab === 0 ? selectedTranscript : selectedTranscript2">
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
                          v-for="(item, idx) in (activeTab === 0 ? selectedTranscript : selectedTranscript2)[entry[0]]"
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
                          :color="getColor((activeTab === 0 ? selectedTranscript : selectedTranscript2)[entry[0]], entry[1])"
                        >
                          {{ formatValue((activeTab === 0 ? selectedTranscript : selectedTranscript2)[entry[0]], entry[1]) }}
                        </v-chip>
                        <span v-else>
                          {{ formatValue((activeTab === 0 ? selectedTranscript : selectedTranscript2)[entry[0]], entry[1]) }}
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
import { prioritizeTranscript, formatTranscriptOptions } from '@/utils/transcriptUtils.js';
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
    variantInput2: {
      type: String,
      default: '',
    },
    showTabs: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    // State for the first variant (primary)
    const result = ref(null);
    const loading = ref(true);
    const error = ref(null);
    const isMaxRetriesError = ref(false);
    const fromCache = ref(false);
    const showCacheIndicator = ref(false);
    
    // State for the second variant (when using compound heterozygous)
    const result2 = ref(null);
    const loading2 = ref(props.variantInput2 ? true : false);
    const error2 = ref(null);
    const isMaxRetriesError2 = ref(false);
    const fromCache2 = ref(false);
    const showCacheIndicator2 = ref(false);
    
    // Tab control for compound heterozygous display
    const activeTab = ref(0);
    const hasSecondVariant = computed(() => Boolean(props.variantInput2));

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

    // Find the prioritized transcript based on MANE status and impact
    const prioritizedTranscript = computed(() => {
      return prioritizeTranscript(transcriptOptions.value);
    });
    
    // Format transcript options for the dropdown with MANE indicators
    const formattedTranscriptOptions = computed(() => {
      return formatTranscriptOptions(transcriptOptions.value);
    });

    // Maintain a list of transcript IDs for backward compatibility
    const transcriptIds = computed(() => transcriptOptions.value.map((tc) => tc.transcript_id));
    
    // Track selected transcript ID object
    const selectedTranscriptId = ref(null);
    
    // Find the currently selected transcript detail
    const selectedTranscript = computed(() => {
      if (!selectedTranscriptId.value) return null;
      const transcriptId = typeof selectedTranscriptId.value === 'object' ? 
        selectedTranscriptId.value.value : selectedTranscriptId.value;
      return transcriptOptions.value.find((tc) => tc.transcript_id === transcriptId);
    });
    
    // VARIANT 2 - Similar computed properties for the second variant
    const transcriptOptions2 = computed(() => {
      if (
        result2.value &&
        result2.value.annotationData &&
        result2.value.annotationData.length > 0 &&
        result2.value.annotationData[0].transcript_consequences
      ) {
        return result2.value.annotationData[0].transcript_consequences;
      }
      return [];
    });

    const prioritizedTranscript2 = computed(() => {
      return prioritizeTranscript(transcriptOptions2.value);
    });
    
    const formattedTranscriptOptions2 = computed(() => {
      return formatTranscriptOptions(transcriptOptions2.value);
    });

    const transcriptIds2 = computed(() => transcriptOptions2.value.map((tc) => tc.transcript_id));
    
    const selectedTranscriptId2 = ref(null);
    
    const selectedTranscript2 = computed(() => {
      if (!selectedTranscriptId2.value) return null;
      const transcriptId = typeof selectedTranscriptId2.value === 'object' ? 
        selectedTranscriptId2.value.value : selectedTranscriptId2.value;
      return transcriptOptions2.value.find((tc) => tc.transcript_id === transcriptId);
    });
    
    // Function to get color for impact badges
    const getImpactColor = (impact) => {
      const impactColors = {
        'HIGH': 'error',
        'MODERATE': 'warning',
        'LOW': 'info',
        'MODIFIER': 'grey'
      };
      return impactColors[impact] || 'grey';
    };

    // Compute a filtered array of [propKey, config] entries for annotation details.
    const visibleAnnotationConfig = computed(() => {
      return Object.entries(variantAnnotationConfig).filter(([, config]) => config.visibility);
    });

    // VARIANT 1 - Compute summary data from the first annotation object.
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
    
    // VARIANT 2 - Compute summary data from the second annotation object
    const annotationSummary2 = computed(() => {
      if (result2.value && result2.value.annotationData && result2.value.annotationData.length > 0) {
        const anno = result2.value.annotationData[0];
        return {
          most_severe_consequence: anno.most_severe_consequence,
          gene_symbol: Array.isArray(anno.gene_symbol)
            ? anno.gene_symbol.join(', ')
            : anno.gene_symbol,
          hgnc_id: Array.isArray(anno.hgnc_id) ? anno.hgnc_id.join(', ') : anno.hgnc_id,
          fullAnnotation: anno,
        };
      }
      return {};
    });
    
    const prioritizedGeneSymbol2 = computed(() => {
      if (!annotationSummary2.value.fullAnnotation) {
        return annotationSummary2.value.gene_symbol || '';
      }
      return getPrioritizedGeneSymbol(annotationSummary2.value.fullAnnotation);
    });

    const frequencyData2 = computed(() => {
      if (
        result2.value &&
        result2.value.annotationData &&
        result2.value.annotationData[0].colocated_variants &&
        result2.value.annotationData[0].colocated_variants.length > 0 &&
        result2.value.annotationData[0].colocated_variants[0].frequencies
      ) {
        return result2.value.annotationData[0].colocated_variants[0].frequencies;
      }
      return null;
    });

    const frequencyExtracted2 = computed(() => {
      if (frequencyData2.value && typeof frequencyData2.value === 'object') {
        const keys = Object.keys(frequencyData2.value);
        if (keys.length > 0) {
          return frequencyData2.value[keys[0]];
        }
      }
      return null;
    });

    const scoreSummary2 = computed(() => {
      if (
        result2.value &&
        result2.value.annotationData &&
        result2.value.annotationData.length > 0 &&
        result2.value.annotationData[0].nephro_variant_score_gnomadg_missing !== undefined
      ) {
        return {
          nephro_variant_score: result2.value.annotationData[0].nephro_variant_score_gnomadg_missing,
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

    // Helper function to load variant data
    const loadVariantData = async (
      variantInput,
      resultRef,
      loadingRef,
      errorRef,
      isMaxRetriesErrorRef,
      fromCacheRef,
      showCacheIndicatorRef,
      retryStateKey,
      formattedOptionsRef,
      prioritizedRef,
      selectedIdRef
    ) => {
      if (!variantInput) return false;
      
      try {
        loadingRef.value = true;
        
        // Reset retry state before making the API call
        retryStates[retryStateKey].reset();
        retryStates[retryStateKey].component = 'VariantCard';
        
        // Create a shared state object to track retries
        const retryState = retryStates[retryStateKey];
        
        const response = await queryVariant(variantInput, {
          retryState,
          onRetry: () => {
            retryState.inProgress = true;
          },
          onSuccess: () => {
            retryState.inProgress = false;
          },
        });
        
        // Handle the response
        resultRef.value = response.data;
        
        // Set cache indicator if data was from cache
        if (response.source && response.source.fromCache) {
          fromCacheRef.value = true;
          showCacheIndicatorRef.value = true;
          
          // Auto-hide the indicator after 3 seconds
          setTimeout(() => {
            showCacheIndicatorRef.value = false;
          }, 3000);
        }

        // Pre-select prioritized transcript
        if (formattedOptionsRef.value.length > 0) {
          if (prioritizedRef.value) {
            const prioritizedOption = formattedOptionsRef.value.find(
              option => option.value === prioritizedRef.value.transcript_id
            );
            selectedIdRef.value = prioritizedOption || formattedOptionsRef.value[0];
          } else {
            selectedIdRef.value = formattedOptionsRef.value[0];
          }
        }
        
        return true;
      } catch (err) {
        retryStates[retryStateKey].inProgress = false;
        // Check if we've exhausted retry attempts
        if (retryStates[retryStateKey].attempts >= 4) {
          isMaxRetriesErrorRef.value = true;
          errorRef.value = 'Maximum retry attempts reached';
        } else {
          isMaxRetriesErrorRef.value = false;
          errorRef.value = err.message || 'Error fetching variant data.';
        }
        return false;
      } finally {
        loadingRef.value = false;
      }
    };

    // scoreInterpretationConfig is already imported and available to the template
    
    onMounted(async () => {
      // Load the primary variant
      await loadVariantData(
        props.variantInput,
        result,
        loading,
        error,
        isMaxRetriesError,
        fromCache,
        showCacheIndicator,
        'variant',
        formattedTranscriptOptions,
        prioritizedTranscript,
        selectedTranscriptId
      );
      
      // If there is a second variant, load it too
      if (props.variantInput2) {
        // Initialize the variant2 retry state if needed
        if (!retryStates.variant2) {
          retryStates.variant2 = {
            attempts: 0,
            inProgress: false,
            component: '',
            reset: function() {
              this.attempts = 0;
              this.inProgress = false;
            }
          };
        }
        
        await loadVariantData(
          props.variantInput2,
          result2,
          loading2,
          error2,
          isMaxRetriesError2,
          fromCache2,
          showCacheIndicator2,
          'variant2',
          formattedTranscriptOptions2,
          prioritizedTranscript2,
          selectedTranscriptId2
        );
      }
    });

    // Calculate combined score for compound heterozygous cases
    const combinedVariantScore = computed(() => {
      // If we have two variant scores (compound heterozygous)
      if (hasSecondVariant.value && 
          Object.keys(scoreSummary.value).length > 0 && 
          Object.keys(scoreSummary2.value).length > 0) {
        // Average of both scores
        const score1 = scoreSummary.value.nephro_variant_score || 0;
        const score2 = scoreSummary2.value.nephro_variant_score || 0;
        return (Number(score1) + Number(score2)) / 2;
      } 
      // If only first variant has a score
      else if (Object.keys(scoreSummary.value).length > 0) {
        return scoreSummary.value.nephro_variant_score || 0;
      }
      // Fallback
      return 0;
    });

    // Emit variant data changes to parent component
    watchEffect(() => {
      if (!loading.value && !error.value) {
        // Determine which data to emit based on whether we have a second variant
        if (hasSecondVariant.value) {
          // For compound heterozygous, include both scores and the combined score
          emit('variant-score-updated', {
            score: combinedVariantScore.value,
            variant1: props.variantInput,
            variant2: props.variantInput2,
            score1: scoreSummary.value.nephro_variant_score || 0,
            score2: scoreSummary2.value.nephro_variant_score || 0,
            isCompoundHet: true,
            geneSummary: annotationSummary.value,
            prioritizedGeneSymbol: prioritizedGeneSymbol.value,
          });
        } else {
          // For single variant, emit standard data
          emit('variant-score-updated', {
            score: scoreSummary.value.nephro_variant_score || 0,
            variant: props.variantInput,
            geneSummary: annotationSummary.value,
            prioritizedGeneSymbol: prioritizedGeneSymbol.value,
          });
        }
      }
    });

    return {
      // UI Control
      activeTab,
      hasSecondVariant,
      
      // First variant data
      loading,
      error,
      transcriptIds,
      selectedTranscriptId,
      selectedTranscript,
      formattedTranscriptOptions,
      prioritizedTranscript,
      result,
      annotationSummary,
      frequencyExtracted,
      scoreSummary,
      prioritizedGeneSymbol,
      isMaxRetriesError,
      showCacheIndicator,
      fromCache,
      
      // Second variant data
      loading2,
      error2,
      transcriptIds2,
      selectedTranscriptId2,
      selectedTranscript2,
      formattedTranscriptOptions2,
      prioritizedTranscript2,
      result2,
      annotationSummary2,
      frequencyExtracted2,
      scoreSummary2,
      prioritizedGeneSymbol2,
      isMaxRetriesError2,
      showCacheIndicator2,
      fromCache2,
      
      // Shared utils and config
      visibleAnnotationConfig,
      getColor,
      getImpactColor,
      formatValue,
      formatOrDefault,
      visibleFrequencyConfig,
      visibleScoreConfig,
      hasScore,
      retryStates,
      scoreInterpretationConfig,
      combinedVariantScore
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
