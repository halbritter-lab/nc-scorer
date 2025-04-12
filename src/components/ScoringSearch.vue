<!-- src/components/ScoringSearch.vue -->
<template>
  <v-container class="pa-4">
    <v-card class="scoring-search-card">
      <v-card-text>
        <!-- Arrange inputs horizontally in a single row -->
        <v-row>
          <!-- Input 1: Variant (wider) -->
          <v-col cols="12" md="6">
            <v-text-field
              v-model="variantInput"
              label="1a. Enter Variant (VCF or HGVS)"
              outlined
              @keyup.enter="searchScoring"
              id="scoring-variant-input"
              aria-label="Enter primary variant in VCF or HGVS format"
              density="comfortable"
              hint="Format examples: '1-55051215-G-GA' or 'NM_001009944.3:c.11935C>T'"
              persistent-hint
            ></v-text-field>
            <!-- Input 1b: Second Variant for Compound Heterozygous -->
            <v-text-field
              v-if="showSecondVariantInput"
              v-model="variantInput2"
              label="1b. Second Variant (for Compound Het)"
              outlined
              @keyup.enter="searchScoring"
              class="mt-2"
              id="scoring-variant-input-2"
              aria-label="Enter second variant for compound heterozygous analysis"
              density="comfortable"
              hint="Enter the second variant for compound heterozygous inheritance"
              persistent-hint
            ></v-text-field>
          </v-col>
          <!-- Input 2: Inheritance Options -->
          <v-col cols="12" md="3">
            <v-select
              v-model="inheritance"
              :items="inheritanceOptions"
              label="2. Inheritance Pattern"
              outlined
              id="inheritance-pattern-select"
              aria-label="Select inheritance pattern"
              density="comfortable"
              menu-props="{ maxHeight: '300px' }"
            ></v-select>
          </v-col>
          <!-- Input 3: Segregation Probability -->
          <v-col cols="12" md="3">
            <v-text-field
              v-model="segregation"
              label="3. Segregation Probability"
              type="number"
              min="0"
              max="1"
              step="0.01"
              outlined
              :disabled="!showSegregationInput"
              id="segregation-probability-input"
              aria-label="Enter segregation probability value between 0 and 1"
              density="comfortable"
              hint="Value between 0 and 1, representing segregation probability"
              persistent-hint
            ></v-text-field>
          </v-col>
        </v-row>
        <v-btn
          color="primary"
          @click="searchScoring"
          class="mx-auto d-block mt-4"
          min-width="120px"
          min-height="44px"
          aria-label="Calculate variant scores"
        >
          Search
        </v-btn>
      </v-card-text>
      <v-card-actions>
        <div class="example-text">
          <!-- Previous Examples -->
          <p>
            <router-link
              :to="exampleLinkOld1"
              class="example-link"
              aria-label="Example with VCF format 1-55051215-G-GA, Inherited dominant pattern, segregation 0.95"
            >
              Example: "1-55051215-G-GA", Inherited dominant, Segregation 0.95
            </router-link>
          </p>
          <p>
            <router-link
              :to="exampleLinkOld2"
              class="example-link"
              aria-label="Example with HGVS format ENST00000302118:c.524-1063_524-1062insA, Denovo pattern"
            >
              Example: "ENST00000302118:c.524-1063_524-1062insA", Denovo (no segregation)
            </router-link>
          </p>
          <!-- New Coding Variant Examples -->
          <p>
            <router-link
              :to="exampleLinkPKD1"
              class="example-link"
              aria-label="Example with PKD1 gene variant NM_001009944.3:c.11935C>T, Inherited dominant, segregation 0.95"
            >
              Example: NM_001009944.3:c.11935C>T in PKD1, Inherited dominant, Segregation 0.95
            </router-link>
          </p>
          <p>
            <router-link
              :to="exampleLinkCOL4A5"
              class="example-link"
              aria-label="Example with COL4A5 gene variant NM_033380.3:c.1871G>A, Denovo pattern"
            >
              Example: NM_033380.3:c.1871G>A in COL4A5, Denovo (no segregation)
            </router-link>
          </p>
        </div>
      </v-card-actions>
      <v-alert v-if="error" type="error" dismissible>
        {{ error }}
      </v-alert>
    </v-card>
  </v-container>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { noSegregationPatterns, requiresSecondVariant } from '@/config/inheritanceConfig';

export default {
  name: 'ScoringSearch',

  setup() {
    const router = useRouter();
    const route = useRoute();

    // Initialize form fields from URL parameters if available; otherwise, use defaults.
    const variantInput = ref(route.params.variantInput || '');
    const variantInput2 = ref(route.params.variantInput2 || '');
    const inheritance = ref(route.params.inheritance || 'Unknown');
    const segregation = ref(route.params.segregation || '1');

    // Inheritance options for selection.
    const inheritanceOptions = [
      'Denovo',
      'Inherited dominant',
      'Homozygous recessive',
      'X-linked',
      'Compound heterozygous (confirmed)',
      'Compound heterozygous (suspected)',
      'Unknown',
    ];

    // Only allow segregation input if the inheritance pattern allows it
    const showSegregationInput = computed(() => {
      return !noSegregationPatterns.includes(inheritance.value);
    });

    // Show second variant input field only for compound heterozygous patterns
    const showSecondVariantInput = computed(() => {
      return requiresSecondVariant.includes(inheritance.value);
    });

    /**
     * Computed router-link for the first (previous) example.
     *
     * @return {object} The route object for the first previous example.
     */
    const exampleLinkOld1 = computed(() => ({
      name: 'ScoringView',
      params: {
        variantInput: '1-55051215-G-GA',
        inheritance: 'Inherited dominant',
        segregation: '0.95',
      },
    }));

    /**
     * Computed router-link for the second (previous) example.
     *
     * @return {object} The route object for the second previous example.
     */
    const exampleLinkOld2 = computed(() => ({
      name: 'ScoringView',
      params: {
        variantInput: 'ENST00000302118:c.524-1063_524-1062insA',
        inheritance: 'Denovo',
        segregation: '1',
      },
    }));

    /**
     * Computed router-link for a PKD1 coding variant example.
     *
     * @return {object} The route object for the PKD1 example.
     */
    const exampleLinkPKD1 = computed(() => ({
      name: 'ScoringView',
      params: {
        variantInput: 'NM_001009944.3:c.11935C>T',
        inheritance: 'Inherited dominant',
        segregation: '0.95',
      },
    }));

    /**
     * Computed router-link for a COL4A5 coding variant example.
     *
     * @return {object} The route object for the COL4A5 example.
     */
    const exampleLinkCOL4A5 = computed(() => ({
      name: 'ScoringView',
      params: {
        variantInput: 'NM_033380.3:c.1871G>A',
        inheritance: 'Denovo',
        segregation: '1',
      },
    }));

    // Reactive variable for error messages.
    const error = ref(null);

    /**
     * Validates the user input and navigates to the ScoringView route if the input is valid.
     *
     * @return {void}
     */
    const searchScoring = () => {
      if (!variantInput.value) {
        error.value = 'Please enter a variant.';
        return;
      }
      // If second variant input is required but missing, show an error
      if (showSecondVariantInput.value && !variantInput2.value) {
        error.value = 'Please enter a second variant for compound heterozygous analysis.';
        return;
      }
      // If segregation input is active but missing, show an error.
      if (showSegregationInput.value && !segregation.value) {
        error.value = 'Please enter a segregation probability.';
        return;
      }
      error.value = null;

      // Prepare route params - conditionally include variantInput2 only when needed
      const routeParams = {
        variantInput: variantInput.value,
        inheritance: inheritance.value,
        segregation: segregation.value,
      };

      // Add second variant to params only if it exists and is needed
      if (showSecondVariantInput.value && variantInput2.value) {
        routeParams.variantInput2 = variantInput2.value;
      }

      router.push({
        name: 'ScoringView',
        params: routeParams,
      });
    };

    return {
      variantInput,
      variantInput2,
      inheritance,
      segregation,
      inheritanceOptions,
      showSegregationInput,
      showSecondVariantInput,
      searchScoring,
      error,
      exampleLinkOld1,
      exampleLinkOld2,
      exampleLinkPKD1,
      exampleLinkCOL4A5,
    };
  },
};
</script>

<style scoped>
.scoring-search-card {
  max-width: 900px;
  margin: auto;
  padding: 16px;
}

.example-text {
  margin-top: 16px;
  font-size: 0.9rem;
  color: #666;
}

.example-link {
  padding: 6px;
  display: inline-block; /* Ensures the padding is applied effectively */
  margin: 2px 0;
}
</style>
