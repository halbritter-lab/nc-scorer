<!-- src/components/InheritanceCard.vue -->
<template>
  <v-card class="inheritance-card">
    <v-card-title>Inheritance Parameters</v-card-title>
    <v-card-text>
      <!-- Loading state -->
      <div v-if="loading" class="loading-container">
        <v-skeleton-loader
          class="mx-auto"
          :type="scoreInterpretationConfig.skeletonLoaders.inheritance.type"
          :loading="loading"
        ></v-skeleton-loader>
      </div>

      <!-- Content Section (Wrapped in outlined card) -->
      <div v-else>
        <v-card variant="outlined" class="mb-2"> <!-- Use outlined variant -->
           <v-card-text class="pa-0"> <!-- Remove padding if table has its own -->
            <v-table class="summary-table">
              <tbody>
                <!-- Inheritance Score Row -->
                <DataDisplayRow
                  :config="{
                    label: 'Inheritance Score',
                    description:
                      'Combined score based on the inheritance pattern and segregation probability.',
                    style: 'chip',
                    font: 'bold',
                    defaultColor: 'primary',
                    format: 'number',
                    round: 2,
                    isKeyScore: true,
                    scoreType: 'inheritance',
                  }"
                  :value="finalScore"
                />
                <!-- Inheritance Pattern Row -->
                <DataDisplayRow
                  :config="{
                    label: 'Inheritance Pattern',
                    description: 'The mode of inheritance used in scoring.',
                  }"
                  :value="inheritance"
                />
                <!-- Segregation Probability Row -->
                <DataDisplayRow
                  :config="{
                    label: 'Segregation Probability',
                    description: 'The probability of segregation (value between 0 and 1).',
                    format: 'number',
                    round: 3,
                  }"
                  :value="segregationProb || 'Not provided'"
                />
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
        
        <!-- Penalty Alert -->
        <v-alert v-if="wasPenalized" density="compact" type="info" variant="tonal" class="mt-3">
          <v-icon class="mr-2">mdi-information</v-icon>
          Score penalized due to missing segregation data for this inheritance pattern.
        </v-alert>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
// Script section remains unchanged - no logic changes needed for styling
import { computed, watchEffect, ref, onMounted } from 'vue';
import { noSegregationPatterns, baseScores } from '@/config/inheritanceConfig'; // Import for penalty detection and base scores
import { calculateInheritanceScore } from '@/utils/scoringUtils.js'; // Use centralized scoring
import DataDisplayRow from '@/components/DataDisplayRow.vue';
import { formatValue } from '@/utils/format';
import { scoreInterpretationConfig } from '@/config/scoreInterpretationConfig.js';


export default {
  name: 'InheritanceCard',
  components: {
    DataDisplayRow,
  },
  props: {
    inheritance: {
      type: String,
      required: true,
    },
    segregation: {
      // Accept String, Number, or null for penalty logic
      type: [String, Number],
      required: true,
    },
  },
  setup(props, { emit }) {
    // Add loading state
    const loading = ref(true);

    // Handle segregation value - preserve null for penalty detection
    const segregationValue = computed(() => {
      if (props.segregation === null || props.segregation === '') {
        return null;
      }
      return props.segregation;
    });

    // Convert to number for display (only when not null)
    const segregationProb = computed(() => {
      return segregationValue.value !== null ? Number(segregationValue.value) : null;
    });

    // Determine the base score for the current inheritance pattern (for emit compatibility)
    const baseScore = computed(() =>
      baseScores[props.inheritance] !== undefined ? baseScores[props.inheritance] : 0.1
    );

    // Simulate a brief loading state for better UX
    onMounted(() => {
      // Short timeout to show the skeleton (better UX for quick calculations)
      setTimeout(() => {
        loading.value = false;
      }, 500); // Adjust delay if needed
    });

    // Compute the final inheritance score using centralized logic
    const finalScore = computed(() => {
      return calculateInheritanceScore(props.inheritance, segregationValue.value);
    });

    // Detect if penalty was applied
    const wasPenalized = computed(() => {
      const isSegregationMissing = segregationValue.value === null || segregationValue.value === '';
      return !noSegregationPatterns.includes(props.inheritance) && isSegregationMissing;
    });

    // Format the final score to two decimal places for consistency.
    const finalScoreFormatted = computed(() => {
      return formatValue(finalScore.value, {
        format: 'number',
        round: 2,
      });
    });

    // Emit the score when it changes
    watchEffect(() => {
       if (!loading.value) { // Only emit after initial loading/calculation
          emit('inheritance-score-updated', {
            score: finalScore.value,
            formatted: finalScoreFormatted.value,
            baseScore: baseScore.value,
            pattern: props.inheritance,
            segregation: segregationProb.value,
          });
       }
    });

    return {
      loading,
      finalScore,
      finalScoreFormatted,
      segregationProb, // Make computed prob available for template
      wasPenalized, // Make penalty detection available for template
      scoreInterpretationConfig, // Expose config for skeleton loader
    };
  },
};
</script>

<style scoped>
/* Styles remain unchanged */
.inheritance-card {
 /* max-width: 600px; <-- Can be removed if parent container controls width */
  margin: auto;
 /* padding: 16px; <-- Padding handled by v-card-text */
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

.loading-container {
  min-height: 180px; /* Or adjust based on content */
  display: flex;
  align-items: center;
  justify-content: center;
}
/* Ensure tables within cards don't add extra padding/background */
.v-card .v-table {
  background-color: transparent;
}
.v-card > .v-table > .v-table__wrapper > table > tbody > tr > td {
    font-size: 0.875rem;
}
.v-card > .v-table > .v-table__wrapper > table > tbody > tr:hover {
   background: transparent !important;
}
</style>
