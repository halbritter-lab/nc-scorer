<!-- src/components/InheritanceCard.vue -->
<template>
  <v-card class="inheritance-card">
    <v-card-title>Inheritance Parameters</v-card-title>
    <v-card-text>
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
              isKeyScore: true, // Mark as a key score for visual highlighting
              scoreType: 'inheritance', // Identify as inheritance score for consistent coloring
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
</template>

<script>
import { computed, watchEffect } from 'vue';
import { baseScores, scoringParameters } from '@/config/inheritanceConfig';
import DataDisplayRow from '@/components/DataDisplayRow.vue';
import { formatValue } from '@/utils/format';

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
    // Convert the segregation prop to a number.
    const segregationProb = computed(() => Number(props.segregation));

    // Determine the base score for the current inheritance pattern.
    const baseScore = computed(() =>
      baseScores[props.inheritance] !== undefined ? baseScores[props.inheritance] : 0.1
    );

    // Compute the final inheritance score.
    const finalScore = computed(() => {
      // For Compound heterozygous (suspected), ignore segregation probability
      const segregationToUse =
        props.inheritance === 'Compound heterozygous (suspected)' ? 1 : segregationProb.value;
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
    // Use watchEffect to trigger on component creation and whenever the score changes
    watchEffect(() => {
      emit('inheritance-score-updated', {
        score: finalScore.value,
        formatted: finalScoreFormatted.value,
        baseScore: baseScore.value,
        pattern: props.inheritance,
        segregation: segregationProb.value,
      });
    });

    return {
      finalScore,
      finalScoreFormatted,
      segregationProb, // Include segregationProb to fix the template warning
    };
  },
};
</script>

<style scoped>
.inheritance-card {
  max-width: 600px;
  margin: auto;
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
</style>
