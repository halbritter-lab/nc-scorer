<!-- src/components/InheritanceCard.vue -->
<template>
  <v-card class="inheritance-card">
    <v-card-title>Inheritance Parameters</v-card-title>
    <v-card-text>
      <v-table class="summary-table">
        <tbody>
          <!-- Inheritance Score Row (first row) -->
          <tr>
            <td class="info-col">
              <strong>Inheritance Score:</strong>
              <v-tooltip activator="parent" location="start">
                Combined score based on the inheritance pattern and segregation probability.
              </v-tooltip>
            </td>
            <td class="value-col">
              <v-chip color="primary" small>
                {{ finalScoreFormatted }}
              </v-chip>
            </td>
          </tr>
          <!-- Inheritance Pattern Row -->
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
          <!-- Segregation Probability Row -->
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
</template>

<script>
import { computed } from 'vue';

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
  setup(props, { expose }) {
    // Convert the segregation prop to a number.
    const segregationProb = computed(() => Number(props.segregation));

    // Base score mapping for inheritance patterns.
    // (This mapping can later be moved to a separate configuration file.)
    const baseScores = {
      Denovo: 0.95,
      'Inherited dominant': 0.7,
      'Homozygous recessive': 0.8,
      'X-linked': 0.6,
      'Compound heterozygous': 0.65,
      Unknown: 0.1,
    };

    // Determine the base score for the current inheritance pattern.
    const baseScore = computed(() =>
      baseScores[props.inheritance] !== undefined ? baseScores[props.inheritance] : 0.1
    );

    // Compute the final inheritance score.
    const finalScore = computed(() => computeVariantScore(baseScore.value, segregationProb.value));

    // Format the final score to three decimal places.
    const finalScoreFormatted = computed(() => finalScore.value.toFixed(3));

    // Expose the computed scores so that parent components can use them.
    expose({
      finalScore,
      finalScoreFormatted,
    });

    return {
      finalScore,
      finalScoreFormatted,
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
