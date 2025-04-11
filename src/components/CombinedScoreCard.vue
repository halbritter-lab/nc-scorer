<template>
  <v-card class="combined-score-card">
    <v-card-title>Nephro Candidate Score (NSC)</v-card-title>
    <v-card-text>
      <v-chip color="primary" class="score-chip" large>
        {{ combinedScoreFormatted }}
      </v-chip>
      <v-tooltip location="bottom" activator="parent">
        <span>
          Final score is computed as the weighted sum of the three scores, with maximum 10.
        </span>
      </v-tooltip>
      <span class="score-tooltip">
        (Gene×4 + Variant×4 + Inheritance×2) / 10
      </span>
    </v-card-text>
  </v-card>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'CombinedScoreCard',
  props: {
    geneScore: {
      type: Number,
      required: true,
    },
    variantScore: {
      type: Number,
      required: true,
    },
    inheritanceScore: {
      type: Number,
      required: true,
    },
  },
  setup(props, { expose }) {
    // Compute the combined (final) score.
    // The final score = geneScore * 4 + variantScore * 4 + inheritanceScore * 2.
    // Since each component is on a 0–1 scale, the maximum is 4+4+2 = 10.
    const combinedScore = computed(() => {
      return props.geneScore * 4 + props.variantScore * 4 + props.inheritanceScore * 2;
    });

    // Format the combined score to two decimals.
    const combinedScoreFormatted = computed(() => combinedScore.value.toFixed(2));

    // Expose the computed values to parent components.
    expose({
      combinedScore,
      combinedScoreFormatted,
    });

    return {
      combinedScore,
      combinedScoreFormatted,
    };
  },
};
</script>

<style scoped>
.combined-score-card {
  max-width: 600px;
  margin: auto;
  padding: 16px;
  text-align: center;
}
.score-chip {
  font-size: 1.5rem;
  padding: 12px 24px;
}
.score-tooltip {
  margin-left: 8px;
  font-size: 0.8rem;
  color: #555;
  cursor: pointer;
}
</style>
