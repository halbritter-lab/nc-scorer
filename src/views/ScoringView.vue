<template>
  <!-- Use ContentContainer for consistent width across the application -->
  <ContentContainer class="scoring-page">
    <!-- Scoring View Header with semantic H1 -->
    <header class="page-header">
      <div>
        <h1 class="page-title">Candidate Variant Assessment</h1>
        <p class="assessment-context">
          Prioritization evaluation for variant
          <strong>{{ variantInput }}</strong>
          <span v-if="isCompoundHet && variantInput2">
            and <strong>{{ variantInput2 }}</strong></span
          >
          ({{ assembly || 'Unsupported assembly' }})
        </p>
      </div>
      <router-link class="page-header-link" to="/methodology">
        How the score works <v-icon size="18">mdi-arrow-right</v-icon>
      </router-link>
    </header>

    <v-alert v-if="assessmentError" type="error" variant="tonal" class="mb-4">
      {{ assessmentError }}
    </v-alert>

    <!-- Combined Score Card at the top with stable container -->
    <v-row>
      <v-col cols="12">
        <div class="combined-score-wrapper d-flex flex-column">
          <!-- Placeholder card with skeleton loader while data loads -->
          <v-card
            v-if="!combinedScoreAvailable && !assessmentError"
            class="combined-score-card"
          >
            <v-card-title class="px-4 py-3"
              >Nephro Candidate Score (NCS)</v-card-title
            >
            <v-card-text class="text-center pa-4">
              <v-skeleton-loader
                class="mx-auto"
                :type="scoreInterpretationConfig.skeletonLoaders.combined.type"
                :loading="true"
              ></v-skeleton-loader>
            </v-card-text>
          </v-card>

          <!-- Actual score card when data is available -->
          <CombinedScoreCard
            v-else-if="combinedScoreAvailable"
            :geneScore="geneScore"
            :variantScore="variantScore"
            :inheritanceScore="inheritanceScore"
            :inheritancePattern="inheritancePattern"
          />

          <!-- Action buttons group - always present to prevent layout shifts -->
          <div
            class="action-toolbar"
            role="group"
            aria-label="Assessment actions"
          >
            <!-- Download menu for exporting results -->
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn
                  color="primary"
                  prepend-icon="mdi-download"
                  v-bind="props"
                  :disabled="!combinedScoreAvailable"
                  variant="flat"
                  min-height="44"
                  min-width="150"
                  class="font-weight-medium"
                >
                  Download Results
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item
                  @click="downloadResults('csv')"
                  prepend-icon="mdi-file-delimited"
                  title="Download as CSV"
                  min-height="44"
                />
                <v-list-item
                  @click="downloadResults('excel')"
                  prepend-icon="mdi-file-excel"
                  title="Download as Excel"
                  min-height="44"
                />
              </v-list>
            </v-menu>

            <!-- Collaboration links -->
            <CollaborationLinks
              :gene-symbol="geneSymbol"
              :variant-input="variantInput"
            />

            <!-- Edit Search button -->
            <v-btn
              color="primary"
              prepend-icon="mdi-pencil"
              variant="outlined"
              min-height="44"
              min-width="120"
              class="font-weight-medium"
              @click="navigateToEditSearch"
              title="Modify your search parameters"
            >
              Edit Search
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Main content row with reduced gutters for more cohesive appearance -->
    <v-row class="evidence-grid">
      <!-- Left column: InheritanceCard (top) and GeneCard (bottom) - reordered to reduce layout shifts -->
      <v-col cols="12" md="6" class="pr-md-2">
        <!-- Inheritance Card (now first to reduce layout shifts) -->
        <InheritanceCard
          :key="assessmentKey"
          :inheritance="inheritance"
          :segregation="segregation"
          class="mb-4"
          @inheritance-score-updated="handleInheritanceScoreUpdate"
        />

        <!-- Gene Card Container with stable placeholder -->
        <div class="gene-card-container">
          <GeneCard
            v-if="geneSymbol !== ''"
            :key="`${assessmentKey}:${geneSymbol}`"
            :symbol="geneSymbol"
            @gene-score-updated="handleGeneScoreUpdate"
          />
          <v-card
            class="mb-4 gene-placeholder-card"
            v-else-if="!assessmentError"
          >
            <v-card-title class="px-4 py-3">Gene Details</v-card-title>
            <v-card-text class="pa-4">
              <div class="d-flex align-center justify-center py-4 mb-2">
                <v-progress-circular
                  indeterminate
                  color="primary"
                  size="20"
                  class="mr-2"
                ></v-progress-circular>
                <span class="text-caption text-medium-emphasis"
                  >Resolving gene information...</span
                >
              </div>
              <v-skeleton-loader
                class="mx-auto"
                :type="scoreInterpretationConfig.skeletonLoaders.gene.type"
                :loading="true"
              ></v-skeleton-loader>
            </v-card-text>
          </v-card>
        </div>
      </v-col>

      <!-- Variant Card with tabs when in compound heterozygous mode -->
      <v-col cols="12" md="6" class="pl-md-2">
        <VariantCard
          v-if="assembly"
          :key="assessmentKey"
          :variantInput="variantInput"
          :variantInput2="isCompoundHet ? variantInput2 : ''"
          :assembly="assembly"
          @variant-score-updated="handleVariantScoreUpdate"
        />
      </v-col>
    </v-row>
  </ContentContainer>
</template>

<script>
import { computed, provide, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import VariantCard from '@/components/VariantCard.vue';
import GeneCard from '@/components/GeneCard.vue';
import InheritanceCard from '@/components/InheritanceCard.vue';
import CombinedScoreCard from '@/components/CombinedScoreCard.vue';
import ContentContainer from '@/components/ContentContainer.vue';
import CollaborationLinks from '@/components/CollaborationLinks.vue';
import useRetryState from '@/composables/useRetryState.js';
import { useNotifications } from '@/composables/useNotifications.js';
import { requiresSecondVariant } from '@/config/inheritanceConfig';
import { scoreInterpretationConfig } from '@/config/scoreInterpretationConfig';
import {
  generateCSV,
  downloadFile,
  sanitizeFilename,
  generateExcel,
} from '@/utils/exportUtils';
import { coordinateCache } from '@/services/coordinateCache.js';
import { calculateNCS, parseUnitScore } from '@/utils/scoringUtils.js';
import {
  normalizeAssembly,
  UNSUPPORTED_ASSEMBLY_MESSAGE,
} from '@/utils/assemblyUtils.js';

export default {
  name: 'ScoringView',
  components: {
    VariantCard,
    GeneCard,
    InheritanceCard,
    CombinedScoreCard,
    ContentContainer,
    CollaborationLinks,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();

    // Set up retry state for the API requests
    const { retryStates } = useRetryState();
    const { notifyRetry } = useNotifications();

    // Provide retry state and notification method to child components
    provide('retryState', { retryStates, notifyRetry });

    // Retrieve parameters from the URL (with defaults).
    const scalarRouteValue = (value) => {
      const scalar = Array.isArray(value) ? value[0] : value;
      return typeof scalar === 'string' ? scalar : '';
    };
    const routeSetting = (name) =>
      scalarRouteValue(route.query?.[name] ?? route.params[name]);
    const variantInput = computed(() =>
      scalarRouteValue(route.params.variantInput),
    );
    const inheritance = computed(
      () => routeSetting('inheritance') || 'Inherited dominant',
    );
    // Handle 'null' string from ScoringSearch component - convert back to null
    const segregation = computed(() =>
      routeSetting('segregation') === 'null'
        ? null
        : routeSetting('segregation') || null,
    );
    const variantInput2 = computed(() =>
      scalarRouteValue(route.query?.variant2 ?? routeSetting('variantInput2')),
    );
    const assembly = computed(() =>
      normalizeAssembly(routeSetting('assembly') || 'GRCh38'),
    );
    const assessmentKey = computed(() =>
      JSON.stringify([
        variantInput.value,
        inheritance.value,
        segregation.value,
        variantInput2.value,
        assembly.value,
      ]),
    );

    // Fast gene pre-resolution from coordinate cache for concurrent fetching
    const initialGeneSymbol =
      coordinateCache.getGeneSymbol(variantInput.value, assembly.value) || '';

    // Create reactive state to store component data
    const scoreState = reactive({
      geneScore: null,
      geneSymbol: initialGeneSymbol,
      variantScore: null,
      inheritanceScore: null,
      // Add new properties to hold the driver data
      inheritancePattern: inheritance.value || 'Unknown',
      // Store additional data that might be needed
      variantData: null,
      secondVariantData: null,
      geneData: null,
      inheritanceData: null,
    });

    watch(
      assessmentKey,
      () => {
        Object.assign(scoreState, {
          geneScore: null,
          variantScore: null,
          inheritanceScore: null,
          geneSymbol:
            coordinateCache.getGeneSymbol(variantInput.value, assembly.value) ||
            '',
          inheritancePattern: inheritance.value,
          variantData: null,
          secondVariantData: null,
          geneData: null,
          inheritanceData: null,
        });
      },
      { flush: 'sync' },
    );

    // Check if current inheritance pattern is compound heterozygous
    const isCompoundHet = computed(() => {
      return requiresSecondVariant.includes(inheritance.value);
    });
    const assessmentError = computed(() => {
      if (!assembly.value)
        return `${UNSUPPORTED_ASSEMBLY_MESSAGE} Use Edit Search to update it.`;
      if (isCompoundHet.value && !variantInput2.value.trim()) {
        return 'A second variant is required for this inheritance pattern. Use Edit Search to provide it.';
      }
      if (scoreState.variantData) {
        if (scoreState.variantData.error)
          return `${scoreState.variantData.error} Use Edit Search to try the assessment again.`;
        if (scoreState.variantScore === null)
          return 'Variant score is unavailable. Use Edit Search to check the variant and try the assessment again.';
        if (!geneSymbol.value)
          return 'No gene could be resolved for this variant. A candidate score is unavailable; use Edit Search to check the variant and genome assembly.';
      }
      if (scoreState.geneData && scoreState.geneScore === null) {
        return 'Gene score is unavailable. Use Edit Search to try the assessment again.';
      }
      return '';
    });

    // Get prioritized gene symbol from the reactive state
    const geneSymbol = computed(() => {
      let sym = '';
      // Use the prioritizedGeneSymbol if available, which applies our gene prioritization logic
      if (
        scoreState.variantData &&
        scoreState.variantData.prioritizedGeneSymbol
      ) {
        sym = scoreState.variantData.prioritizedGeneSymbol;
      } else if (scoreState.variantData && scoreState.variantData.geneSummary) {
        const gs = scoreState.variantData.geneSummary.gene_symbol;
        sym = Array.isArray(gs) ? gs[0] : gs;
      } else {
        sym =
          scoreState.geneSymbol ||
          coordinateCache.getGeneSymbol(variantInput.value, assembly.value) ||
          '';
      }
      if (Array.isArray(sym)) {
        sym = sym[0];
      }
      return typeof sym === 'string' ? sym.trim() : '';
    });

    // Use the reactive state value directly for gene score
    const geneScore = computed(() => scoreState.geneScore || 0);

    // Use the reactive state value directly for variant score
    const variantScore = computed(() => scoreState.variantScore || 0);

    // Use the reactive state value directly for inheritance score
    const inheritanceScore = computed(() => scoreState.inheritanceScore || 0);

    // Create a computed property for inheritance pattern with safe fallback
    const inheritancePattern = computed(
      () => scoreState.inheritancePattern || inheritance.value || 'Unknown',
    );

    // Zero is a valid score. Missing and invalid inputs must remain unavailable.
    const combinedScoreAvailable = computed(() => {
      return (
        !assessmentError.value &&
        [
          scoreState.geneScore,
          scoreState.variantScore,
          scoreState.inheritanceScore,
        ].every((score) => Number.isFinite(score) && score >= 0 && score <= 1)
      );
    });

    function parseScore(value) {
      return parseUnitScore(value);
    }

    // Event handlers for component events
    function handleVariantScoreUpdate(data) {
      const previousGene = geneSymbol.value;
      // Store the score and variant data
      scoreState.variantScore = parseScore(data.score);
      scoreState.variantData = data;

      // Handle compound heterozygous data (from a single VariantCard with both variants)
      if (data.isCompoundHet) {
        // Store both individual scores for potential display
        scoreState.variant1Score = Number(data.score1) || 0;
        scoreState.variant2Score = Number(data.score2) || 0;

        // Keep track of both variants
        scoreState.variant1 = data.variant1;
        scoreState.variant2 = data.variant2;

        // The main variantScore is already set to the averaged/combined score
      }

      // Set gene symbol for gene card component
      if (data.prioritizedGeneSymbol) {
        scoreState.geneSymbol = data.prioritizedGeneSymbol;
      } else if (data.geneSummary && data.geneSummary.gene_symbol) {
        scoreState.geneSymbol = Array.isArray(data.geneSummary.gene_symbol)
          ? data.geneSummary.gene_symbol[0]
          : data.geneSummary.gene_symbol;
      }
      if (geneSymbol.value !== previousGene) {
        scoreState.geneScore = null;
        scoreState.geneData = null;
      }
    }

    function handleGeneScoreUpdate(data) {
      if (data.symbol && data.symbol !== geneSymbol.value) return;
      scoreState.geneScore = parseScore(data.score);
      scoreState.geneData = data;
    }

    function handleInheritanceScoreUpdate(data) {
      scoreState.inheritanceScore = parseScore(data.score);
      scoreState.inheritanceData = data;

      // Store the inheritance pattern
      scoreState.inheritancePattern = data.pattern || inheritance.value;
    }

    /**
     * Generate a filename for the downloaded results
     * @returns {string} - Sanitized filename
     */
    /**
     * Generate a filename for the downloaded results
     * @param {string} format - The file format ('csv' or 'excel')
     * @returns {string} - Sanitized filename with appropriate extension
     */
    function generateFilename(format = 'csv') {
      // Make sure we're passing string values to sanitizeFilename, not ref objects
      const variant = sanitizeFilename(variantInput.value || '');
      const gene = sanitizeFilename(geneSymbol.value || '');
      const dateStr = new Date().toISOString().substring(0, 10); // YYYY-MM-DD format
      const extension = format === 'excel' ? '.xlsx' : '.csv';

      return `nc_scorer_${dateStr}_${gene}_${variant}${extension}`;
    }

    /**
     * Download scoring results as CSV or Excel file
     * @param {string} format - Format to download ('csv' or 'excel')
     */
    function downloadResults(format = 'csv') {
      if (!combinedScoreAvailable.value) return;

      // Define headers for the export
      const headers = [
        // Input parameters
        'Input_Variant1',
        'Input_Variant2',
        'Inheritance_Pattern',
        'Segregation_Probability',

        // Scores
        'NCS_Combined_Score',
        'Gene_Score',
        'Variant_Score',
        'Inheritance_Score',

        // Gene details
        'Gene_Symbol',
      ];

      // Add base data values
      let data = [
        variantInput.value,
        variantInput2.value || '',
        inheritance.value,
        segregation.value,

        // Format scores to 2 decimal places
        calculateNCS(
          geneScore.value,
          variantScore.value,
          inheritanceScore.value,
        ).toFixed(2),
        geneScore.value.toFixed(2),
        variantScore.value.toFixed(2),
        inheritanceScore.value.toFixed(2),

        geneSymbol.value,
      ];

      // Add gene data if available
      if (scoreState.geneData && scoreState.geneData.formattedData) {
        const geneData = scoreState.geneData.formattedData;

        // Add gene-specific headers and data
        if (geneData.evidenceCount) {
          headers.push('Evidence_Count');
          data.push(geneData.evidenceCount.value);
        }

        if (geneData.geneSet) {
          headers.push('Gene_Set');
          data.push(geneData.geneSet.value);
        }
      }

      // Add variant data if available
      if (scoreState.variantData) {
        const variantData = scoreState.variantData;

        // Add common variant data headers
        if (
          variantData.geneSummary &&
          variantData.geneSummary.most_severe_consequence
        ) {
          headers.push('Most_Severe_Consequence');
          data.push(variantData.geneSummary.most_severe_consequence);
        }

        if (variantData.geneSummary && variantData.geneSummary.hgnc_id) {
          headers.push('HGNC_ID');
          data.push(variantData.geneSummary.hgnc_id);
        }

        // Add gnomAD frequency if available
        if (
          variantData.frequencyExtracted &&
          variantData.frequencyExtracted.gnomade !== undefined &&
          variantData.frequencyExtracted.gnomade !== null
        ) {
          headers.push('gnomADe_Frequency');
          data.push(variantData.frequencyExtracted.gnomade);
        }

        if (
          variantData.frequencyExtracted &&
          variantData.frequencyExtracted.gnomadg !== undefined &&
          variantData.frequencyExtracted.gnomadg !== null
        ) {
          headers.push('gnomADg_Frequency');
          data.push(variantData.frequencyExtracted.gnomadg);
        }

        // Add transcript information if available
        if (variantData.selectedTranscript) {
          const transcript = variantData.selectedTranscript;

          headers.push('Transcript_ID');
          data.push(transcript.transcript_id || '');

          if (transcript.cadd_phred != null) {
            headers.push('CADD_Phred');
            data.push(transcript.cadd_phred);
          }

          if (transcript.hgvsc) {
            headers.push('HGVSc');
            data.push(transcript.hgvsc);
          }

          if (transcript.mane) {
            headers.push('MANE_Status');
            data.push(transcript.mane);
          }
        }
      }

      // Add second variant data if this is a compound heterozygous case
      if (
        isCompoundHet.value &&
        scoreState.variantData &&
        scoreState.variantData.secondVariantData
      ) {
        const variant2Data = scoreState.variantData.secondVariantData;

        // Add V2 prefix to distinguish second variant data
        if (
          variant2Data.geneSummary &&
          variant2Data.geneSummary.most_severe_consequence
        ) {
          headers.push('V2_Most_Severe_Consequence');
          data.push(variant2Data.geneSummary.most_severe_consequence);
        }

        // Add transcript information for second variant if available
        if (variant2Data.selectedTranscript) {
          const transcript = variant2Data.selectedTranscript;

          headers.push('V2_Transcript_ID');
          data.push(transcript.transcript_id || '');

          if (transcript.cadd_phred != null) {
            headers.push('V2_CADD_Phred');
            data.push(transcript.cadd_phred);
          }

          if (transcript.hgvsc) {
            headers.push('V2_HGVSc');
            data.push(transcript.hgvsc);
          }

          if (transcript.mane) {
            headers.push('V2_MANE_Status');
            data.push(transcript.mane);
          }
        }

        // Add frequency data for second variant
        if (variant2Data.frequencyExtracted) {
          if (variant2Data.frequencyExtracted.gnomade != null) {
            headers.push('V2_gnomADe_Frequency');
            data.push(variant2Data.frequencyExtracted.gnomade);
          }

          if (variant2Data.frequencyExtracted.gnomadg != null) {
            headers.push('V2_gnomADg_Frequency');
            data.push(variant2Data.frequencyExtracted.gnomadg);
          }
        }
      }

      // Generate file based on format selection
      if (format === 'excel') {
        // Generate Excel file
        generateExcel(headers, data, generateFilename('excel')).catch(() => {
          const csvContent = generateCSV(headers, data);
          downloadFile(csvContent, generateFilename('csv'));
        });
      } else {
        // Generate CSV and trigger download
        const csvContent = generateCSV(headers, data);
        downloadFile(csvContent, generateFilename('csv'));
      }
    }

    /**
     * Navigate back to the search page with current parameters pre-filled
     */
    function navigateToEditSearch() {
      router.push({
        name: 'SearchPage',
        query: {
          // Add all relevant search parameters to pre-fill the form
          variant: variantInput.value,
          variant2: variantInput2.value,
          inheritance: inheritance.value,
          segregation: segregation.value,
          assembly: assembly.value,
        },
      });
    }

    return {
      assessmentError,
      assessmentKey,
      variantInput,
      variantInput2,
      inheritance,
      segregation,
      assembly,
      geneSymbol,
      geneScore,
      variantScore,
      inheritanceScore,
      inheritancePattern,
      combinedScoreAvailable,
      isCompoundHet,
      scoreInterpretationConfig, // Make available to the template for skeleton loaders
      handleVariantScoreUpdate,
      handleGeneScoreUpdate,
      handleInheritanceScoreUpdate,
      downloadResults,
      navigateToEditSearch,
    };
  },
};
</script>

<style scoped>
.combined-score-wrapper {
  width: 100%;
}

.combined-score-card {
  width: 100%;
  min-height: 180px;
}

.action-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}
.action-toolbar :deep(.v-btn) {
  margin-left: 0 !important;
  letter-spacing: normal;
  text-transform: none;
}
.evidence-grid {
  margin-top: 8px;
}

.gene-card-container {
  width: 100%;
}

.gene-placeholder-card {
  min-height: 380px;
  width: 100%;
}

@media (max-width: 600px) {
  .action-toolbar {
    justify-content: flex-start;
  }
  .action-toolbar :deep(.v-btn) {
    flex-grow: 1;
  }
}
</style>
