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
        <!-- Placeholder card that maintains exact dimensions while data loads -->
        <v-card v-if="!combinedScoreAvailable" class="combined-score-card">
          <v-card-title class="px-4 py-3">Nephro Candidate Score (NSC)</v-card-title>
          <v-card-text class="text-center pa-0 pb-4">
            <div class="placeholder-score-chip">...</div>
            <v-progress-linear
              indeterminate
              color="primary"
              style="opacity: 0.7"
            ></v-progress-linear>
            <span class="empty-tooltip-space"></span>
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
          ref="inheritanceCardRef"
          :inheritance="inheritance"
          :segregation="segregation"
          class="mb-4"
        />

        <!-- Gene Card (now second since it loads data asynchronously) -->
        <v-card class="mb-4" v-if="geneSymbol && geneSymbol.trim() !== ''">
          <GeneCard ref="geneCardRef" :symbol="geneSymbol" />
        </v-card>
        <v-card class="mb-4" v-else>
          <v-alert type="info"> Waiting for gene data... </v-alert>
        </v-card>
      </v-col>

      <!-- Variant Card(s) -->
      <v-col cols="12" md="6" class="pl-md-2">
        <VariantCard ref="variantCardRef" :variantInput="variantInput" />

        <!-- Second Variant Card (only for compound heterozygous variants) -->
        <VariantCard
          v-if="isCompoundHet && variantInput2"
          ref="variantCard2Ref"
          :variantInput="variantInput2"
          class="mt-4"
        />
      </v-col>
    </v-row>
  </ContentContainer>
</template>

<script>
import { ref, computed, provide } from 'vue';
import { useRoute } from 'vue-router';
import VariantCard from '@/components/VariantCard.vue';
import GeneCard from '@/components/GeneCard.vue';
import InheritanceCard from '@/components/InheritanceCard.vue';
import CombinedScoreCard from '@/components/CombinedScoreCard.vue';
import ContentContainer from '@/components/ContentContainer.vue';
import useRetryState from '@/composables/useRetryState.js';
import { requiresSecondVariant } from '@/config/inheritanceConfig';

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

    // Create refs to access child component instances.
    const variantCardRef = ref(null);
    const variantCard2Ref = ref(null);
    const geneCardRef = ref(null);
    const inheritanceCardRef = ref(null);

    // Check if current inheritance pattern is compound heterozygous
    const isCompoundHet = computed(() => {
      return requiresSecondVariant.includes(inheritance);
    });

    // Compute geneSymbol from VariantCard’s exposed annotationSummary.
    const geneSymbol = computed(() => {
      if (variantCardRef.value && variantCardRef.value.annotationSummary) {
        const gs = variantCardRef.value.annotationSummary.gene_symbol;
        return Array.isArray(gs) ? gs[0] : gs;
      }
      return '';
    });

    // Compute geneScore from GeneCard’s exposed filteredGeneData.
    // We assume that the gene score is stored under the key "ngs".
    const geneScore = computed(() => {
      if (
        geneCardRef.value &&
        geneCardRef.value.filteredGeneData &&
        geneCardRef.value.filteredGeneData.ngs
      ) {
        return Number(geneCardRef.value.filteredGeneData.ngs.value) || 0;
      }
      return 0;
    });

    // Compute variantScore from VariantCard’s exposed scoreSummary.
    const variantScore = computed(() => {
      if (
        variantCardRef.value &&
        variantCardRef.value.scoreSummary &&
        variantCardRef.value.scoreSummary.nephro_variant_score !== undefined
      ) {
        return Number(variantCardRef.value.scoreSummary.nephro_variant_score) || 0;
      }
      return 0;
    });

    // Compute inheritanceScore from InheritanceCard’s exposed finalScore.
    const inheritanceScore = computed(() => {
      if (inheritanceCardRef.value && inheritanceCardRef.value.finalScore !== undefined) {
        return Number(inheritanceCardRef.value.finalScore) || 0;
      }
      return 0;
    });

    // Only consider the combined score available if all three component scores are greater than 0.
    const combinedScoreAvailable = computed(() => {
      return geneScore.value > 0 && variantScore.value > 0 && inheritanceScore.value > 0;
    });

    return {
      variantInput,
      variantInput2,
      inheritance,
      segregation,
      variantCardRef,
      variantCard2Ref,
      geneCardRef,
      inheritanceCardRef,
      geneSymbol,
      geneScore,
      variantScore,
      inheritanceScore,
      combinedScoreAvailable,
      isCompoundHet,
      retrySnackbar, // Expose retry snackbar to the template
    };
  },
};
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}

/* Adding a comment to keep custom styles applied to both placeholder and real NSC card */
/* The combined-score-card class is now used for both placeholder and real component */

/* Match the exact dimensions and appearance of the score chip in the real component */
.placeholder-score-chip {
  display: inline-block;
  background-color: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.38);
  border-radius: 16px;
  font-size: 1.5rem;
  font-weight: 500;
  padding: 12px 24px;
  min-width: 80px;
  height: 48px;
  line-height: 24px;
  margin-top: 8px;
  margin-bottom: 8px;
}

/* Match the score tooltip styling from the CombinedScoreCard */
.score-tooltip {
  margin-left: 8px;
  font-size: 0.8rem;
  color: #555;
}

/* Empty space element to maintain height of the tooltip area */
.empty-tooltip-space {
  display: inline-block;
  height: 16px;
  width: 100%;
}
</style>
