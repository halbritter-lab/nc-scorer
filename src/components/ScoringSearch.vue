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
              label="1. Enter Variant (VCF or HGVS)"
              outlined
              @keyup.enter="searchScoring"
            ></v-text-field>
          </v-col>
          <!-- Input 2: Inheritance Options -->
          <v-col cols="12" md="3">
            <v-select
              v-model="inheritance"
              :items="inheritanceOptions"
              label="2. Inheritance Pattern"
              outlined
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
            ></v-text-field>
          </v-col>
        </v-row>
        <v-btn color="primary" @click="searchScoring" class="mx-auto d-block"> Search </v-btn>
      </v-card-text>
      <v-card-actions>
        <div class="example-text">
          <!-- Previous Examples -->
          <p>
            <router-link :to="exampleLinkOld1">
              Example: "1-55051215-G-GA", Inherited dominant, Segregation 0.95
            </router-link>
          </p>
          <p>
            <router-link :to="exampleLinkOld2">
              Example: "ENST00000302118:c.524-1063_524-1062insA", Denovo (no segregation)
            </router-link>
          </p>
          <!-- New Coding Variant Examples -->
          <p>
            <router-link :to="exampleLinkPKD1">
              Example: NM_001009944.3:c.11935C>T in PKD1, Inherited dominant, Segregation 0.95
            </router-link>
          </p>
          <p>
            <router-link :to="exampleLinkCOL4A5">
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

export default {
  name: 'ScoringSearch',

  setup() {
    const router = useRouter();
    const route = useRoute();

    // Initialize form fields from URL parameters if available; otherwise, use defaults.
    const variantInput = ref(route.params.variantInput || '');
    const inheritance = ref(route.params.inheritance || 'Unknown');
    const segregation = ref(route.params.segregation || '1');

    // Inheritance options for selection.
    const inheritanceOptions = [
      'Denovo',
      'Inherited dominant',
      'Homozygous recessive',
      'X-linked',
      'Compound heterozygous',
      'Unknown',
    ];

    // Only allow segregation input if the inheritance mode is not 'Denovo' or 'Unknown'.
    const showSegregationInput = computed(() => {
      return inheritance.value !== 'Denovo' && inheritance.value !== 'Unknown';
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
      // If segregation input is active but missing, show an error.
      if (showSegregationInput.value && !segregation.value) {
        error.value = 'Please enter a segregation probability.';
        return;
      }
      error.value = null;
      router.push({
        name: 'ScoringView',
        params: {
          variantInput: variantInput.value,
          inheritance: inheritance.value,
          segregation: segregation.value,
        },
      });
    };

    return {
      variantInput,
      inheritance,
      segregation,
      inheritanceOptions,
      showSegregationInput,
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
</style>
