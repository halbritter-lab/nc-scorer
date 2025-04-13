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
        <CombinedScoreCard
          v-else
          :geneScore="geneScore"
          :variantScore="variantScore"
          :inheritanceScore="inheritanceScore"
        />
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
