<!-- src/views/ScoringView.vue -->
<template>
  <v-container>
    <v-row>
      <!-- Left Column: Gene Card (top) and Inheritance Parameters Card (bottom) -->
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
        <v-card class="scoring-params-card">
          <v-card-title>Inheritance</v-card-title>
          <v-card-text>
            <v-table class="summary-table">
              <tbody>
                <tr>
                  <td class="info-col">
                    <strong>Inheritance Pattern:</strong>
                    <v-tooltip activator="parent" location="start">
                      The mode of inheritance used in scoring.
                    </v-tooltip>
                  </td>
                  <td class="value-col">
                    <span>{{ inheritance }}</span>
                  </td>
                </tr>
                <tr>
                  <td class="info-col">
                    <strong>Segregation Probability:</strong>
                    <v-tooltip activator="parent" location="start">
                      The probability of segregation (value between 0 and 1).
                    </v-tooltip>
                  </td>
                  <td class="value-col">
                    <span>{{ segregation }}</span>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
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

/**
 * ScoringView integrates the VariantCard, GeneCard, and an Inheritance Parameters card.
 * It accepts three parameters via the URL:
 * - variantInput: the variant (VCF or HGVS) to be analyzed,
 * - inheritance: the inheritance pattern (default "Inherited dominant"),
 * - segregation: the segregation probability (default "1").
 *
 * The component passes variantInput to VariantCard and then retrieves the exposed
 * annotationSummary (which includes gene_symbol) from VariantCard to pass to GeneCard.
 * Additionally, it displays the inheritance parameters in a dedicated card.
 */
export default {
  name: 'ScoringView',
  components: {
    VariantCard,
    GeneCard,
  },
  setup() {
    const route = useRoute();
    // Retrieve URL parameters; provide defaults for inheritance and segregation.
    const variantInput = route.params.variantInput;
    const inheritance = route.params.inheritance || 'Inherited dominant';
    const segregation = route.params.segregation || '1';

    // Create a ref to access the VariantCard instance.
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
.scoring-params-card {
  max-width: 600px;
  margin-bottom: 16px;
  padding: 16px;
}
.summary-table {
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
.mb-4 {
  margin-bottom: 16px;
}
</style>
