<template>
  <v-card class="combined-score-card">
    <v-card-title>Nephro Candidate Score (NSC)</v-card-title>
    <v-card-text>
      <v-chip :color="scoreColor" class="score-chip" large elevation="2">
        {{ combinedScoreFormatted }}
      </v-chip>
      <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <span class="score-tooltip" v-bind="props">
            (Gene×4 + Variant×4 + Inheritance×2) / 10
          </span>
        </template>
        <div class="weighted-breakdown">
          <div><strong>Weighted Score Breakdown:</strong></div>
          <div>Gene: {{ formattedGeneScore }} × 4 = {{ weightedGeneScore }}</div>
          <div>Variant: {{ formattedVariantScore }} × 4 = {{ weightedVariantScore }}</div>
          <div>Inheritance: {{ formattedInheritanceScore }} × 2 = {{ weightedInheritanceScore }}</div>
        </div>
      </v-tooltip>
      <!-- Score Interpretation Guide with current score marker -->
      <ScoreInterpretationGuide class="mt-3" :currentScore="combinedScore" />
    </v-card-text>
  </v-card>
</template>

<script>
import { computed } from 'vue';
import ScoreInterpretationGuide from '@/components/ScoreInterpretationGuide.vue';
import { formatValue } from '@/utils/format';
import { scoreInterpretationConfig } from '@/config/scoreInterpretationConfig';

export default {
  name: 'CombinedScoreCard',
  components: {
    ScoreInterpretationGuide,
  },
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
    const combinedScoreFormatted = computed(() => {
      return formatValue(combinedScore.value, { format: 'number', round: 2 });
    });
    
    // Calculate weighted scores for each component
    const weightedGeneScore = computed(() => {
      return formatValue(props.geneScore * 4, { format: 'number', round: 2 });
    });
    
    const weightedVariantScore = computed(() => {
      return formatValue(props.variantScore * 4, { format: 'number', round: 2 });
    });
    
    const weightedInheritanceScore = computed(() => {
      return formatValue(props.inheritanceScore * 2, { format: 'number', round: 2 });
    });
    
    // Format individual scores for display
    const formattedGeneScore = computed(() => {
      return formatValue(props.geneScore, { format: 'number', round: 2 });
    });
    
    const formattedVariantScore = computed(() => {
      return formatValue(props.variantScore, { format: 'number', round: 2 });
    });
    
    const formattedInheritanceScore = computed(() => {
      return formatValue(props.inheritanceScore, { format: 'number', round: 2 });
    });
    
    // Determine score color based on value ranges
    const scoreColor = computed(() => {
      const score = combinedScore.value;
      const ranges = scoreInterpretationConfig.ranges;
      
      if (score >= ranges[2].min) {
        return ranges[2].color; // High priority color
      } else if (score >= ranges[1].min) {
        return ranges[1].color; // Moderate priority color
      } else {
        return ranges[0].color; // Low priority color
      }
    });

    // Expose the computed values to parent components
    expose({
      combinedScore,
      combinedScoreFormatted,
    });

    return {
      // Formatted scores for display
      formattedGeneScore,
      formattedVariantScore,
      formattedInheritanceScore,
      // Weighted values
      weightedGeneScore,
      weightedVariantScore,
      weightedInheritanceScore,
      // Combined score
      combinedScore,
      combinedScoreFormatted,
      scoreColor,
    };
  },
};
</script>

<style scoped>
.combined-score-card {
  width: 100%;
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
  text-decoration: underline dotted;
}

.weighted-breakdown {
  padding: 8px;
  line-height: 1.5;
  font-size: 0.9rem;
}
</style>
