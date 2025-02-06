<!-- src/views/ScoringView.vue -->
<template>
  <v-container>
    <v-row>
      <!-- Left Column: Variant Card -->
      <v-col cols="12" md="6">
        <VariantCard ref="variantCardRef" :variantInput="variantInput" />
      </v-col>
      <!-- Right Column: Gene Card (only render when geneSymbol is available) -->
      <v-col cols="12" md="6" v-if="geneSymbol">
        <GeneCard :symbol="geneSymbol" />
      </v-col>
      <!-- Fallback message while waiting for gene data -->
      <v-col cols="12" md="6" v-else>
        <v-alert type="info">
          Waiting for gene data...
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import VariantCard from '@/components/VariantCard.vue';
import GeneCard from '@/components/GeneCard.vue';

/**
 * ScoringView integrates both the VariantCard and the GeneCard.
 * It accepts three parameters via the URL:
 * - variantInput: the variant (VCF or HGVS) to be analyzed,
 * - inheritance: the inheritance pattern (default "Inherited dominant"),
 * - segregation: the segregation probability (default "1").
 *
 * The component passes the variantInput to VariantCard and then retrieves the
 * exposed annotationSummary (which includes gene_symbol) from VariantCard to pass
 * to GeneCard.
 */
export default {
  name: 'ScoringView',
  components: {
    VariantCard,
    GeneCard,
  },
  setup() {
    const route = useRoute();
    // Retrieve parameters from the URL; use defaults if necessary.
    const variantInput = route.params.variantInput;
    const inheritance = route.params.inheritance || 'Inherited dominant';
    const segregation = route.params.segregation || '1';

    // Create a ref to access the VariantCard component instance.
    const variantCardRef = ref(null);

    // Compute the gene symbol from the exposed annotationSummary of VariantCard.
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
/* Add any additional styling if needed */
</style>
