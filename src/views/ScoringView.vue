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
      <!-- Optional fallback message while waiting for geneSymbol -->
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
 * It passes the variant input (from the route parameter) to VariantCard,
 * then retrieves the exposed annotationSummary from VariantCard and uses its
 * gene_symbol value as the input for GeneCard.
 */
export default {
  name: 'ScoringView',
  components: {
    VariantCard,
    GeneCard,
  },
  setup() {
    const route = useRoute();
    // Get the variant input from route parameters.
    const variantInput = route.params.variantInput;
    // Create a ref to access the VariantCard component instance.
    const variantCardRef = ref(null);

    // Compute the gene symbol from the exposed annotationSummary.
    // If gene_symbol is an array, use the first element; otherwise, use the string value.
    const geneSymbol = computed(() => {
      if (variantCardRef.value && variantCardRef.value.annotationSummary) {
        const gs = variantCardRef.value.annotationSummary.gene_symbol;
        return Array.isArray(gs) ? gs[0] : gs;
      }
      return '';
    });

    return {
      variantInput,
      variantCardRef,
      geneSymbol,
    };
  },
};
</script>

<style scoped>
/* Add any additional styling if needed */
</style>
