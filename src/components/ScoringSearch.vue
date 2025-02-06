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
        <v-btn color="primary" @click="searchScoring" class="mx-auto d-block">
          Search
        </v-btn>
      </v-card-text>
      <v-card-actions>
        <div class="example-text">
          <p>
            <router-link :to="exampleLink1">
              Example: "1-55051215-G-GA", Inherited dominant, Segregation 0.95
            </router-link>
          </p>
          <p>
            <router-link :to="exampleLink2">
              Example: "ENST00000302118:c.524-1063_524-1062insA", Denovo, (no segregation)
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

    // Initialize parameters from URL if available; otherwise use defaults.
    const variantInput = ref(route.params.variantInput || '');
    const inheritance = ref(route.params.inheritance || 'Unknown');
    const segregation = ref(route.params.segregation || '1');

    // Define the inheritance options.
    const inheritanceOptions = [
      'Denovo',
      'Inherited dominant',
      'Homozygous recessive',
      'X-linked',
      'Compound heterozygous',
      'Unknown'
    ];

    // Compute whether the segregation input should be active.
    // It is active if the inheritance is not "Denovo" or "Unknown".
    const showSegregationInput = computed(() => {
      return !(
        inheritance.value === 'Denovo' ||
        inheritance.value === 'Unknown'
      );
    });

    // Example links for quick navigation.
    const exampleLink1 = computed(() => ({
      name: 'ScoringView',
      params: {
        variantInput: '1-55051215-G-GA',
        inheritance: 'Inherited dominant',
        segregation: '0.95'
      }
    }));
    const exampleLink2 = computed(() => ({
      name: 'ScoringView',
      params: {
        variantInput: 'ENST00000302118:c.524-1063_524-1062insA',
        inheritance: 'Denovo',
        segregation: '1'
      }
    }));

    // Validate inputs and navigate to ScoringView with the parameters.
    const error = ref(null);
    const searchScoring = () => {
      if (!variantInput.value) {
        error.value = 'Please enter a variant.';
        return;
      }
      // If segregation should be active but is empty, set an error.
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
      exampleLink1,
      exampleLink2,
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
