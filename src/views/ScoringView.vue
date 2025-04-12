<template>
  <v-container>
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
        <CombinedScoreCard
          v-if="combinedScoreAvailable"
          :geneScore="geneScore"
          :variantScore="variantScore"
          :inheritanceScore="inheritanceScore"
        />
      </v-col>
    </v-row>

    <!-- Next row: Left column with GeneCard (top) and InheritanceCard (bottom); right column with VariantCard -->
    <v-row>
      <v-col cols="12" md="6">
        <!-- Gene Card -->
        <v-card class="mb-4" v-if="geneSymbol && geneSymbol.trim() !== ''">
          <GeneCard ref="geneCardRef" :symbol="geneSymbol" />
        </v-card>
        <v-card class="mb-4" v-else>
          <v-alert type="info"> Waiting for gene data... </v-alert>
        </v-card>
        <!-- Inheritance Card -->
        <InheritanceCard
          ref="inheritanceCardRef"
          :inheritance="inheritance"
          :segregation="segregation"
        />
      </v-col>

      <!-- Variant Card -->
      <v-col cols="12" md="6">
        <VariantCard ref="variantCardRef" :variantInput="variantInput" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, computed, provide } from 'vue';
import { useRoute } from 'vue-router';
import VariantCard from '@/components/VariantCard.vue';
import GeneCard from '@/components/GeneCard.vue';
import InheritanceCard from '@/components/InheritanceCard.vue';
import CombinedScoreCard from '@/components/CombinedScoreCard.vue';
import useRetryState from '@/composables/useRetryState.js';

export default {
  name: 'ScoringView',
  components: {
    VariantCard,
    GeneCard,
    InheritanceCard,
    CombinedScoreCard,
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

    // Create refs to access child component instances.
    const variantCardRef = ref(null);
    const geneCardRef = ref(null);
    const inheritanceCardRef = ref(null);

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
      inheritance,
      segregation,
      variantCardRef,
      geneCardRef,
      inheritanceCardRef,
      geneSymbol,
      geneScore,
      variantScore,
      inheritanceScore,
      combinedScoreAvailable,
      retrySnackbar, // Expose retry snackbar to the template
    };
  },
};
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>
