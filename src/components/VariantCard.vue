<!-- src/components/VariantCard.vue -->
<template>
  <v-card class="variant-card">
    <v-card-title class="d-flex flex-wrap align-center">
      <div class="variant-title text-truncate" :title="hasSecondVariant ? `Variants: ${variantInput}, ${variantInput2}` : variantInput">
        <template v-if="hasSecondVariant">
          Compound Heterozygous Variants
        </template>
        <template v-else>
          <div class="d-flex align-center">
            <span>Variant Details for "{{ variantInput }}"</span>
            <v-menu v-if="variantLinks && Object.keys(variantLinks).length > 0">
              <template v-slot:activator="{ props }">
                <v-btn v-bind="props" icon="mdi-open-in-new" size="x-small" class="ml-1" variant="text" color="primary" title="View in external databases"></v-btn>
              </template>
              <v-list density="compact">
                <v-list-item v-if="variantLinks.ensembl" :href="variantLinks.ensembl" target="_blank" rel="noopener noreferrer">
                  <v-list-item-title class="d-flex align-center">
                    <v-icon start size="small">mdi-dna</v-icon>
                    View in Ensembl
                  </v-list-item-title>
                </v-list-item>
                <v-list-item v-if="variantLinks.ucsc" :href="variantLinks.ucsc" target="_blank" rel="noopener noreferrer">
                  <v-list-item-title class="d-flex align-center">
                    <v-icon start size="small">mdi-chart-timeline-variant</v-icon>
                    View in UCSC Browser
                  </v-list-item-title>
                </v-list-item>
                <v-list-item v-if="variantLinks.gnomad" :href="variantLinks.gnomad" target="_blank" rel="noopener noreferrer">
                  <v-list-item-title class="d-flex align-center">
                    <v-icon start size="small">mdi-chart-bar</v-icon>
                    View in gnomAD
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </template>
      </div>

      <div class="d-flex flex-nowrap ml-auto">
        <!-- Retry count badge - shown when retries have occurred -->
        <v-badge
          v-if="retryStates.variant.attempts > 0 || (hasSecondVariant && retryStates.variant2 && retryStates.variant2.attempts > 0)"
          color="warning"
          :content="hasSecondVariant ? (retryStates.variant.attempts + (retryStates.variant2?.attempts || 0)) : retryStates.variant.attempts"
          :title="`Retried ${hasSecondVariant ? (retryStates.variant.attempts + (retryStates.variant2?.attempts || 0)) : retryStates.variant.attempts} times due to network issues`"
          offset-x="5"
          offset-y="5"
          class="mr-1"
        >
          <v-icon size="small" color="warning">mdi-refresh</v-icon>
        </v-badge>

        <!-- Spinning icon when retry is in progress -->
        <v-tooltip
          v-if="retryStates.variant.inProgress || (hasSecondVariant && retryStates.variant2?.inProgress)"
          location="top"
          text="Retrying API request..."
        >
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" size="small" color="warning" class="ml-1 retry-spinner">
              mdi-refresh
            </v-icon>
          </template>
        </v-tooltip>

        <!-- Cache indicator - shows briefly when data is from cache -->
        <v-fade-transition>
          <v-chip
            v-if="(activeTab === 0 && showCacheIndicator) || (activeTab === 1 && showCacheIndicator2)"
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
          Variant 1: {{ variantInput }}
        </v-tab>
        <v-tab :value="1">
          <v-icon start>mdi-numeric-2-circle</v-icon>
          Variant 2: {{ variantInput2 }}
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
          <template v-if="(activeTab === 0 && isMaxRetriesError) || (activeTab === 1 && isMaxRetriesError2)">
            Failed to load variant data after multiple attempts. There might be a temporary issue
            with external services (e.g., Ensembl/VEP). Please try again later.
          </template>
          <template v-else>{{ activeTab === 0 ? error : error2 }}</template>
        </v-alert>
      </div>

      <div v-else>
        <!-- Score Section -->
        <v-card class="mb-2 score-section pa-2" variant="outlined" v-if="activeTab === 0 ? Object.keys(scoreSummary).length > 0 : Object.keys(scoreSummary2).length > 0">
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
        </v-card>

        <!-- Overall Summary Section -->
        <v-card class="mb-2 summary-section pa-2" variant="outlined">
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
                  :config="{
                    label: 'Genomic Position',
                    description: 'Genomic position based on GRCh38 assembly.',
                    style: 'text',
                    linkPattern: externalDbUrls.ucscGenome
                  }"
                  :value="activeTab === 0 ? annotationSummary.genomicPosition : annotationSummary2.genomicPosition"
                  :linkValue="activeTab === 0 ? annotationSummary.genomicRegion : annotationSummary2.genomicRegion"
                  :defaultValue="'N/A'"
                />

                <DataDisplayRow
                  v-if="activeTab === 0 ? prioritizedGeneSymbol : prioritizedGeneSymbol2"
                  :config="{
                    label: 'Gene Symbol',
                    description: 'Prioritized gene symbol based on MANE Select status and impact severity.',
                    style: 'chip',
                    font: 'italic',
                    linkPattern: externalDbUrls.ensemblGene
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
                    font: 'italic'
                  }"
                  :value="activeTab === 0 ? annotationSummary.gene_symbol : annotationSummary2.gene_symbol"
                />
              </tbody>
            </v-table>
        </v-card>

        <!-- Frequency Section -->
        <v-card class="mb-4" variant="outlined" v-if="activeTab === 0 ? frequencyExtracted : frequencyExtracted2">
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
        </v-card>

        <!-- Transcript Consequences Section -->
        <v-card class="mb-4" variant="outlined" v-if="activeTab === 0 ? transcriptIds.length : transcriptIds2.length">
          <v-card-text>
            <v-select
              :model-value="activeTab === 0 ? selectedTranscriptId : selectedTranscriptId2"
              @update:model-value="value => activeTab === 0 ? selectedTranscriptId = value : selectedTranscriptId2 = value"
              :items="activeTab === 0 ? formattedTranscriptOptions : formattedTranscriptOptions2"
              item-title="title"
              item-value="value"
              label="Select Transcript"
              variant="outlined"
              density="compact"
              return-object
              hide-details
              class="mb-3"
            >
              <!-- Corrected v-slot:item -->
              <template v-slot:item="{ item, props }">
                 <v-list-item
                  v-bind="props"
                  :title="item.title"
                  :class="{'font-weight-bold': item.mane}"
                >
                  <!-- Add visual indicator for MANE Select transcripts -->
                  <template v-slot:prepend>
                    <v-icon
                      v-if="item.mane"
                      color="primary"
                      size="small"
                      class="mr-2"
                      title="MANE Select Transcript"
                    >
                      mdi-check-decagram
                    </v-icon>
                     <v-icon
                      v-else
                      size="small"
                      class="mr-2"
                      color="transparent"
                    >
                      mdi-checkbox-blank-outline
                    </v-icon>
                    <!-- Placeholder for alignment -->
                  </template>

                  <!-- Add external link to the title -->
                  <template v-slot:title>
                    <div class="d-flex align-center">
                      <a
                        :href="generateExternalLink(item.value, externalDbUrls.ensemblTranscript)"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="external-link"
                        @click.stop
                      >
                        {{ item.title }}
                        <v-icon size="x-small" class="ml-1">mdi-open-in-new</v-icon>
                      </a>
                    </div>
                  </template>

                  <!-- Add impact badges -->
                  <template v-slot:append>
                    <v-chip
                      v-if="item.impact"
                      size="small"
                      :color="getImpactColor(item.impact)"
                      class="ml-2"
                      density="compact"
                    >
                      {{ item.impact }}
                    </v-chip>
                  </template>
                </v-list-item>
              </template>
            </v-select>
            <!-- Transcript Details Table -->
            <div v-if="activeTab === 0 ? selectedTranscript : selectedTranscript2">
              <v-table class="annotation-table">
                <tbody>
                  <DataDisplayRow
                    v-for="entry in visibleAnnotationConfig"
                    :key="entry[0]"
                    :config="entry[1]"
                    :value="(activeTab === 0 ? selectedTranscript : selectedTranscript2)[entry[0]]"
                    :defaultValue="'NA'"
                  />
                </tbody>
              </v-table>
            </div>
          </v-card-text>
        </v-card>

      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { ref, onMounted, computed, inject, watchEffect } from 'vue';
import { logService } from '@/services/logService';
import DataDisplayRow from '@/components/DataDisplayRow.vue';
import { queryVariant } from '@/api/variantApi.js';
import { generateVariantLinks, generateExternalLink, parseVariantString } from '@/utils/linkUtils.js';
import { variantAnnotationConfig, externalDbUrls } from '@/config/variantAnnotationConfig.js';
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

    // Generate external links for variants if they match the expected format
    const variantLinks = computed(() => {
      if (!props.variantInput) return null;
      // Use the currently active variant for links if tabs are shown
      const inputForLinks = (hasSecondVariant.value && activeTab.value === 1) ? props.variantInput2 : props.variantInput;
      return generateVariantLinks(inputForLinks, externalDbUrls);
    });

    // Get shared retry state from parent or create a new one
    const { retryStates } = inject('retryState', useRetryState());

    // Ensure retry state for variant2 exists if needed
    if (props.variantInput2 && !retryStates.variant2) {
       retryStates.variant2 = {
          attempts: 0, inProgress: false, component: '',
          reset: function() { this.attempts = 0; this.inProgress = false; }
       };
    }

    // Helper function to extract annotation summary including genomic position
    const getAnnotationSummary = (apiResult) => {
      logService.debug('getAnnotationSummary input:', apiResult);

      const summary = {
        most_severe_consequence: 'N/A',
        gene_symbol: 'N/A',
        hgnc_id: 'N/A',
        fullAnnotation: null,
        genomicPosition: 'N/A',
        genomicRegion: null, // For linking
      };

      // Check if apiResult and annotationData exist
      if (apiResult && apiResult.annotationData && apiResult.annotationData.length > 0) {
         const anno = apiResult.annotationData[0]; // Use first annotation entry
         const topLevel = apiResult; // Also check top-level response data

         logService.debug('Processing annotation:', {
           anno_data: anno,
           top_level: topLevel,
           has_variant_key: !!topLevel.variantKey,
           has_region: !!(topLevel.seq_region_name && topLevel.start)
         });

         summary.most_severe_consequence = anno.most_severe_consequence || 'N/A';
         summary.gene_symbol = Array.isArray(anno.gene_symbol) ? anno.gene_symbol.join(', ') : anno.gene_symbol || 'N/A';
         summary.hgnc_id = Array.isArray(anno.hgnc_id) ? anno.hgnc_id.join(', ') : anno.hgnc_id || 'N/A';
         summary.fullAnnotation = anno; // Keep full annotation

         // Extract Genomic Position
         const assembly = topLevel.assembly_name || 'GRCh38'; // Default to GRCh38 if missing
         
         // Look for position data in both top level and annotation
         const positionData = {
           variantKey: topLevel.variantKey || anno.variantKey,
           seq_region_name: topLevel.seq_region_name || anno.seq_region_name,
           start: topLevel.start || anno.start,
           end: topLevel.end || anno.end || topLevel.start || anno.start,
           assembly: assembly
         };

         logService.debug('Position data extracted:', positionData);

         if (positionData.variantKey) { // Prioritize variantKey
            const variantKeyWithoutAssembly = positionData.variantKey;
            summary.genomicPosition = `${variantKeyWithoutAssembly} (${assembly})`;
            // Use parseVariantString for proper UCSC region formatting
            const parsed = parseVariantString(variantKeyWithoutAssembly);
            if (parsed) {
                summary.genomicRegion = parsed.ucscRegion;
            }
         } else if (positionData.seq_region_name && positionData.start) { // Fallback
            const chr = positionData.seq_region_name.startsWith('chr') ? positionData.seq_region_name : `chr${positionData.seq_region_name}`;
            const pos = positionData.start;
            summary.genomicPosition = `${chr}-${pos} (${assembly})`;
            summary.genomicRegion = `${chr}:${pos}`;
         }

         logService.debug('Final genomic data:', {
           position: summary.genomicPosition,
           region: summary.genomicRegion
         });
      }
      return summary;
    };

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
      return Object.entries(variantAnnotationConfig).filter(([key, config]) => {
        // Skip gene_symbol in transcript details as it's redundant with main display
        if (key === 'gene_symbol') return false;
        // Skip low-importance fields to reduce clutter
        if (key === 'gene_symbol_source' || key === 'used_ref' || key === 'given_ref' || key === 'source') return false;
        // Only show cadd_phred, not both cadd scores
        if (key === 'cadd_raw' && variantAnnotationConfig.cadd_phred.visibility) return false;

        return config.visibility;
      });
    });

    // VARIANT 1 - Compute summary data from the first annotation object.
    const annotationSummary = computed(() => getAnnotationSummary(result.value));
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
        result.value.annotationData[0].nephro_variant_score !== undefined
      ) {
        return {
          nephro_variant_score: result.value.annotationData[0].nephro_variant_score,
        };
      }
      return {};
    });

    // VARIANT 2 - Compute summary data from the second annotation object
    const annotationSummary2 = computed(() => getAnnotationSummary(result2.value));

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
      if (frequencyData2.value && typeof frequencyData.value === 'object') {
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
        result2.value.annotationData[0].nephro_variant_score !== undefined
      ) {
        return {
          nephro_variant_score: result2.value.annotationData[0].nephro_variant_score,
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
      variantInputToLoad,
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
      if (!variantInputToLoad) return false;

      try {
        loadingRef.value = true;
        errorRef.value = null;
        isMaxRetriesErrorRef.value = false;

        // Reset retry state before making the API call
        retryStates[retryStateKey].reset();
        retryStates[retryStateKey].component = 'VariantCard';

        // Create a shared state object to track retries
        const retryState = retryStates[retryStateKey];

        const response = await queryVariant(variantInputToLoad, {
          retryState,
          onRetry: (err, attempt) => {
            retryState.inProgress = true;
            logService.warn(`Retry attempt ${attempt} for ${retryStateKey}: ${err.message}`);
          },
          onSuccess: (attempts) => {
            retryState.inProgress = false;
             if (attempts > 0) {
                logService.info(`Successfully fetched ${retryStateKey} after ${attempts} retries.`);
             }
          },
        });

        // Handle the response
        logService.debug('API Response:', response);
        
        // Ensure we have a properly structured response
        let responseData = response.data;
        
        // Handle case where response.data might be an array
        if (Array.isArray(responseData)) {
          // Avoid reactive logging that might cause infinite loops
          console.log('Response data is an array, taking first item');
          responseData = responseData[0];
        }

        // Ensure we have an annotationData array
        if (!responseData.annotationData) {
          // Avoid reactive logging that might cause infinite loops
          console.log('No annotationData found in response, restructuring...');
          // If the response itself looks like annotation data, wrap it
          if (responseData.most_severe_consequence || responseData.gene_symbol) {
            responseData = { annotationData: [responseData] };
          } else {
            responseData = { annotationData: [] };
          }
        }

        logService.debug('Final structured response:', responseData);
        resultRef.value = responseData;

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
        logService.error(`Error fetching ${retryStateKey}:`, err);
        // Check if we've exhausted retry attempts
        if (retryStates[retryStateKey].attempts >= 4) {
          isMaxRetriesErrorRef.value = true;
          errorRef.value = `Maximum retry attempts reached for ${variantInputToLoad}.`;
        } else {
          isMaxRetriesErrorRef.value = false;
          errorRef.value = err.message || `Error fetching variant data for ${variantInputToLoad}.`;
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
      // This watcher needs to be careful not to emit before data is loaded
      if (loading.value || (hasSecondVariant.value && loading2.value)) {
        return; // Don't emit during initial load
      }

      // Determine which data to emit based on whether we have a second variant
      if (hasSecondVariant.value) {
        // Ensure both results are available before emitting compound het data
        if (!error.value && !error2.value && result.value && result2.value) {
          emit('variant-score-updated', {
            score: combinedVariantScore.value,
            variant1: props.variantInput,
            variant2: props.variantInput2,
            score1: scoreSummary.value.nephro_variant_score || 0,
            score2: scoreSummary2.value.nephro_variant_score || 0,
            isCompoundHet: true,
            geneSummary: annotationSummary.value, // Provide primary variant's gene summary
            prioritizedGeneSymbol: prioritizedGeneSymbol.value, // Use primary prioritized symbol
            // Optionally include second variant's data if needed by parent
            secondVariantData: {
               geneSummary: annotationSummary2.value,
               prioritizedGeneSymbol: prioritizedGeneSymbol2.value,
               frequencyExtracted: frequencyExtracted2.value,
               selectedTranscript: selectedTranscript2.value
            }
          });
        }
      } else {
        // For single variant, ensure data is loaded and no error
         if (!error.value && result.value) {
            emit('variant-score-updated', {
              score: scoreSummary.value.nephro_variant_score || 0,
              variant: props.variantInput,
              geneSummary: annotationSummary.value,
              prioritizedGeneSymbol: prioritizedGeneSymbol.value,
              frequencyExtracted: frequencyExtracted.value, // Include frequency data
              selectedTranscript: selectedTranscript.value // Include selected transcript data
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
      variantLinks,

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
      combinedVariantScore,
      // *** Make sure imported utils/configs used in template are returned ***
      generateExternalLink,
      externalDbUrls // Needed for the link pattern in the template
    };
  },
};
</script>

<style scoped>
.variant-card {
  /* max-width: 600px; <-- Can be removed if parent container controls width */
  margin: auto;
  /* padding: 16px; <-- Padding handled by v-card-text */
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
  margin-bottom: 12px;
  border-radius: 4px;
  background-color: var(--v-theme-surface);
  padding: 12px;
}
.summary-item {
  margin-bottom: 4px;
  padding: 4px 0;
}

.summary-item.key-score {
  background-color: var(--v-theme-surface-variant);
  border-left: 4px solid var(--v-theme-primary);
  padding-left: 8px;
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
  min-height: 240px; /* Or adjust based on content */
  display: flex;
  align-items: center;
  justify-content: center;
}

.cache-indicator {
  font-size: 0.75rem;
}

.variant-title {
  max-width: calc(100% - 100px); /* Reserve space for indicators */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.external-link {
  color: var(--v-theme-primary);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: opacity 0.2s ease;
}

.external-link:hover {
  text-decoration: underline;
  opacity: 0.9;
}

.link-icon {
  margin-left: 4px;
  opacity: 0.7;
}

.info-label {
  cursor: help;
}
</style>