<template>
  <!-- Use ContentContainer for consistent width across the application -->
  <ContentContainer>
    <!-- Retry Snackbar -->
    <v-snackbar
      v-model="retrySnackbar.visible"
      :color="retrySnackbar.color"
      :timeout="retrySnackbar.timeout"
    >
      {{ retrySnackbar.message }}
    </v-snackbar>

    <!-- Combined Score Card at the top -->
    <v-row>
      <v-col cols="12">
        <!-- Placeholder card with skeleton loader while data loads -->
        <v-card v-if="!combinedScoreAvailable" class="combined-score-card">
          <v-card-title class="px-4 py-3">Nephro Candidate Score (NSC)</v-card-title>
          <v-card-text class="text-center pa-4">
            <v-skeleton-loader
              class="mx-auto"
              :type="scoreInterpretationConfig.skeletonLoaders.combined.type"
              :loading="true"
            ></v-skeleton-loader>
          </v-card-text>
        </v-card>

        <!-- Actual score card when data is available -->
        <div v-else class="d-flex flex-column">
          <CombinedScoreCard
            :geneScore="geneScore"
            :variantScore="variantScore"
            :inheritanceScore="inheritanceScore"
          />
          
          <!-- Download menu for exporting results -->
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn
                color="primary"
                prepend-icon="mdi-download"
                class="mt-2 align-self-end"
                v-bind="props"
                :disabled="!combinedScoreAvailable"
                size="small"
                variant="tonal"
              >
                Download Results
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item
                @click="downloadResults('csv')"
                prepend-icon="mdi-file-delimited"
                title="Download as CSV"
              />
              <v-list-item
                @click="downloadResults('excel')"
                prepend-icon="mdi-file-excel"
                title="Download as Excel"
              />
            </v-list>
          </v-menu>
        </div>
      </v-col>
    </v-row>

    <!-- Main content row with reduced gutters for more cohesive appearance -->
    <v-row dense>
      <!-- Left column: InheritanceCard (top) and GeneCard (bottom) - reordered to reduce layout shifts -->
      <v-col cols="12" md="6" class="pr-md-2">
        <!-- Inheritance Card (now first to reduce layout shifts) -->
        <InheritanceCard
          :inheritance="inheritance"
          :segregation="segregation"
          class="mb-4"
          @inheritance-score-updated="handleInheritanceScoreUpdate"
        />

        <!-- Gene Card (now second since it loads data asynchronously) -->
        <v-card class="mb-4" v-if="geneSymbol && geneSymbol.trim() !== ''">
          <GeneCard :symbol="geneSymbol" @gene-score-updated="handleGeneScoreUpdate" />
        </v-card>
        <v-card class="mb-4" v-else>
          <v-alert type="info"> Waiting for gene data... </v-alert>
        </v-card>
      </v-col>

      <!-- Variant Card with tabs when in compound heterozygous mode -->
      <v-col cols="12" md="6" class="pl-md-2">
        <VariantCard
          :variantInput="variantInput"
          :variantInput2="isCompoundHet ? variantInput2 : ''"
          @variant-score-updated="handleVariantScoreUpdate"
        />
      </v-col>
    </v-row>
  </ContentContainer>
</template>

<script>
import { computed, provide, reactive } from 'vue';
import { useRoute } from 'vue-router';
import VariantCard from '@/components/VariantCard.vue';
import GeneCard from '@/components/GeneCard.vue';
import InheritanceCard from '@/components/InheritanceCard.vue';
import CombinedScoreCard from '@/components/CombinedScoreCard.vue';
import ContentContainer from '@/components/ContentContainer.vue';
import useRetryState from '@/composables/useRetryState.js';
import { requiresSecondVariant } from '@/config/inheritanceConfig';
import { scoreInterpretationConfig } from '@/config/scoreInterpretationConfig';
import { generateCSV, downloadFile, sanitizeFilename, generateExcel } from '@/utils/exportUtils';

export default {
  name: 'ScoringView',
  components: {
    VariantCard,
    GeneCard,
    InheritanceCard,
    CombinedScoreCard,
    ContentContainer,
  },
  setup() {
    const route = useRoute();

    // Set up retry state for the API requests
    const { retryStates, showSnackbar, snackbar: retrySnackbar } = useRetryState();

    // Provide retry state to child components
    provide('retryState', { retryStates, showSnackbar });

    // Retrieve parameters from the URL (with defaults).
    const variantInput = route.params.variantInput;
    const inheritance = route.params.inheritance || 'Inherited dominant';
    const segregation = route.params.segregation || '1';
    const variantInput2 = route.params.variantInput2 || '';

    // Create reactive state to store component data
    const scoreState = reactive({
      geneScore: 0,
      geneSymbol: '',
      variantScore: 0,
      inheritanceScore: 0,
      // Store additional data that might be needed
      variantData: null,
      secondVariantData: null,
      geneData: null,
      inheritanceData: null,
    });

    // Check if current inheritance pattern is compound heterozygous
    const isCompoundHet = computed(() => {
      return requiresSecondVariant.includes(inheritance);
    });

    // Get prioritized gene symbol from the reactive state
    const geneSymbol = computed(() => {
      // Use the prioritizedGeneSymbol if available, which applies our gene prioritization logic
      if (scoreState.variantData && scoreState.variantData.prioritizedGeneSymbol) {
        return scoreState.variantData.prioritizedGeneSymbol;
      }
      // Fallback to the original logic if prioritizedGeneSymbol is not available
      if (scoreState.variantData && scoreState.variantData.geneSummary) {
        const gs = scoreState.variantData.geneSummary.gene_symbol;
        return Array.isArray(gs) ? gs[0] : gs;
      }
      return '';
    });

    // Use the reactive state value directly for gene score
    const geneScore = computed(() => scoreState.geneScore || 0);

    // Use the reactive state value directly for variant score
    const variantScore = computed(() => scoreState.variantScore || 0);

    // Use the reactive state value directly for inheritance score
    const inheritanceScore = computed(() => scoreState.inheritanceScore || 0);

    // Only consider the combined score available if all three component scores are greater than 0.
    const combinedScoreAvailable = computed(() => {
      return geneScore.value > 0 && variantScore.value > 0 && inheritanceScore.value > 0;
    });

    // Event handlers for component events
    function handleVariantScoreUpdate(data) {
      // Store the score and variant data
      scoreState.variantScore = Number(data.score) || 0;
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
    }

    function handleGeneScoreUpdate(data) {
      scoreState.geneScore = Number(data.score) || 0;
      scoreState.geneData = data;
    }

    function handleInheritanceScoreUpdate(data) {
      scoreState.inheritanceScore = Number(data.score) || 0;
      scoreState.inheritanceData = data;
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
      const variant = sanitizeFilename(variantInput || '');
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
        variantInput,
        variantInput2 || '',
        inheritance,
        segregation,
        
        // Format scores to 2 decimal places
        (geneScore.value * 4 + variantScore.value * 4 + inheritanceScore.value * 2).toFixed(2),
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
        if (variantData.geneSummary && variantData.geneSummary.most_severe_consequence) {
          headers.push('Most_Severe_Consequence');
          data.push(variantData.geneSummary.most_severe_consequence);
        }
        
        if (variantData.geneSummary && variantData.geneSummary.hgnc_id) {
          headers.push('HGNC_ID');
          data.push(variantData.geneSummary.hgnc_id);
        }
        
        // Add gnomAD frequency if available
        if (variantData.frequencyExtracted && variantData.frequencyExtracted.gnomade) {
          headers.push('gnomADe_Frequency');
          data.push(variantData.frequencyExtracted.gnomade);
        }
        
        if (variantData.frequencyExtracted && variantData.frequencyExtracted.gnomadg) {
          headers.push('gnomADg_Frequency');
          data.push(variantData.frequencyExtracted.gnomadg);
        }
        
        // Add transcript information if available
        if (variantData.selectedTranscript) {
          const transcript = variantData.selectedTranscript;
          
          headers.push('Transcript_ID');
          data.push(transcript.transcript_id || '');
          
          if (transcript.cadd_phred) {
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
      if (isCompoundHet.value && scoreState.variantData && scoreState.variantData.secondVariantData) {
        const variant2Data = scoreState.variantData.secondVariantData;
        
        // Add V2 prefix to distinguish second variant data
        if (variant2Data.geneSummary && variant2Data.geneSummary.most_severe_consequence) {
          headers.push('V2_Most_Severe_Consequence');
          data.push(variant2Data.geneSummary.most_severe_consequence);
        }
        
        // Add transcript information for second variant if available
        if (variant2Data.selectedTranscript) {
          const transcript = variant2Data.selectedTranscript;
          
          headers.push('V2_Transcript_ID');
          data.push(transcript.transcript_id || '');
          
          if (transcript.cadd_phred) {
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
          if (variant2Data.frequencyExtracted.gnomade) {
            headers.push('V2_gnomADe_Frequency');
            data.push(variant2Data.frequencyExtracted.gnomade);
          }
          
          if (variant2Data.frequencyExtracted.gnomadg) {
            headers.push('V2_gnomADg_Frequency');
            data.push(variant2Data.frequencyExtracted.gnomadg);
          }
        }
      }
      
      // Generate file based on format selection
      if (format === 'excel') {
        // Generate Excel file
        generateExcel(headers, data, generateFilename('excel'));
      } else {
        // Generate CSV and trigger download
        const csvContent = generateCSV(headers, data);
        downloadFile(csvContent, generateFilename('csv'));
      }
    }
    
    return {
      variantInput,
      variantInput2,
      inheritance,
      segregation,
      geneSymbol,
      geneScore,
      variantScore,
      inheritanceScore,
      combinedScoreAvailable,
      isCompoundHet,
      retrySnackbar,
      scoreInterpretationConfig, // Make available to the template for skeleton loaders
      handleVariantScoreUpdate,
      handleGeneScoreUpdate,
      handleInheritanceScoreUpdate,
      downloadResults, // Add the download function
    };
  },
};
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}

/* Style for both placeholder and real score cards */
.combined-score-card {
  width: 100%;
}

.score-tooltip {
  margin-left: 8px;
  font-size: 0.8rem;
  color: #555;
}
</style>
