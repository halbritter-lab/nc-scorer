<template>
  <v-container>
    <v-row>
      <!-- Left Column: Gene Card (top) and Inheritance Card (below) -->
      <v-col cols="12" md="6">
        <!-- Gene Card -->
        <v-card class="mb-4" v-if="geneSymbol && geneSymbol.trim() !== ''">
          <GeneCard :symbol="geneSymbol" />
        </v-card>
        <v-card class="mb-4" v-else>
          <v-alert type="info">
            Waiting for gene data...
          </v-alert>
        </v-card>
        <!-- Inheritance Parameters Card -->
        <InheritanceCard :inheritance="inheritance" :segregation="segregation" />
      </v-col>
      
      <!-- Right Column: Variant Card -->
      <v-col cols="12" md="6">
        <VariantCard ref="variantCardRef" :variantInput="variantInput" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import VariantCard from '@/components/VariantCard.vue';
import GeneCard from '@/components/GeneCard.vue';
import InheritanceCard from '@/components/InheritanceCard.vue';

/**
 * ScoringView integrates the VariantCard, GeneCard, and the InheritanceCard.
 * It accepts three URL parameters:
 * - variantInput: the variant (VCF or HGVS) to analyze,
 * - inheritance: the inheritance pattern (default "Inherited dominant"),
 * - segregation: the segregation probability (default "1").
 *
 * VariantCard receives variantInput and exposes an annotationSummary that
 * includes the gene_symbol, which is then passed to GeneCard.
 * InheritanceCard displays the inheritance parameters.
 */
export default {
  name: 'ScoringView',
  components: {
    VariantCard,
    GeneCard,
    InheritanceCard,
  },
  setup() {
    const route = useRoute();
    // Retrieve parameters from the URL with defaults.
    const variantInput = route.params.variantInput;
    const inheritance = route.params.inheritance || 'Inherited dominant';
    const segregation = route.params.segregation || '1';

    // Create a ref to access the VariantCard instance.
    const variantCardRef = ref(null);

    // Compute geneSymbol from the exposed annotationSummary of VariantCard.
    // If gene_symbol is an array, use the first element.
    const geneSymbol = computed(() => {
      if (variantCardRef.value && variantCardRef.value.annotationSummary) {
        const gs = variantCardRef.value.annotationSummary.gene_symbol;
        return Array.isArray(gs) ? gs[0] : gs;
      }
      return '';
    });

    return {
      variantInput,
      inheritance,
      segregation,
      variantCardRef,
      geneSymbol,
    };
  },
};
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>
