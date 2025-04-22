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
                  :value="segregationProb"
                />
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
// Script section remains unchanged - no logic changes needed for styling
import { computed, watchEffect, ref, onMounted } from 'vue';
import { baseScores, scoringParameters, noSegregationPatterns, requiresSecondVariant } from '@/config/inheritanceConfig'; // Import all needed
import DataDisplayRow from '@/components/DataDisplayRow.vue';
import { formatValue } from '@/utils/format';
import { scoreInterpretationConfig } from '@/config/scoreInterpretationConfig.js';

/**
 * Computes the final genetic variant score based on a base inheritance score and a segregation p-value.
 *
 * The function uses a negative-log transformation of the p-value to boost
 * the base score toward 1.0 for very low p-values (i.e. strong segregation evidence).
 *
 * @param {number} baseScore - Base inheritance pattern score (must be between 0 and 1).
 * @param {number} [pValue=1] - Segregation p-value (must be between 0 and 1). Defaults to 1 (i.e. no added evidence).
 * @param {number} [gamma=0.001] - Threshold p-value for maximal evidence.
 * @param {number} [epsilon=1e-10] - Small floor to avoid logarithm of zero.
 * @returns {number} - Final inheritance score, scaled between baseScore and 1.0.
 * @throws {Error} - If baseScore or pValue are out of the [0,1] range.
 */
function computeVariantScore(baseScore, pValue = 1, gamma = 0.001, epsilon = 1e-10) {
  if (baseScore < 0 || baseScore > 1) {
    throw new Error('baseScore must be between 0 and 1');
  }
  if (pValue < 0 || pValue > 1) {
    throw new Error('pValue must be between 0 and 1');
  }
  const adjustedP = Math.max(pValue, epsilon);
  const numerator = -Math.log(adjustedP);
  const denominator = -Math.log(gamma);
  let rawFactor = numerator / denominator;
  if (rawFactor > 1) {
    rawFactor = 1;
  }
  return baseScore + (1 - baseScore) * rawFactor;
}

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
      // Accept both String and Number so that URL parameters are handled gracefully.
      type: [String, Number],
      required: true,
    },
  },
  setup(props, { emit }) {
    // Add loading state
    const loading = ref(true);

    // Convert the segregation prop to a number.
    const segregationProb = computed(() => Number(props.segregation));

    // Determine the base score for the current inheritance pattern.
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

    // Compute the final inheritance score.
    const finalScore = computed(() => {
      // Check if segregation should be ignored based on config
      const ignoreSegregation = noSegregationPatterns.includes(props.inheritance);
      const segregationToUse = ignoreSegregation ? 1 : segregationProb.value;

      return computeVariantScore(
        baseScore.value,
        segregationToUse,
        scoringParameters.gamma,
        scoringParameters.epsilon
      );
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
      inheritance: props.inheritance, // Make prop available for template
      segregationProb, // Make computed prob available for template
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
