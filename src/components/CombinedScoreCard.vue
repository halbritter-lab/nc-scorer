<template>
  <v-card class="combined-score-card">
    <v-card-title tag="h2" class="score-title"
      >Nephro Candidate Score (NCS)</v-card-title
    >
    <v-card-text class="score-body">
      <div class="score-overview">
        <div class="score-result">
          <div class="score-value">
            {{ combinedScoreFormatted }}<span> / 10</span>
          </div>
          <v-chip
            class="score-tier"
            :style="{ '--tier-color': scoreColor }"
            variant="outlined"
            size="small"
            >{{ interpretation }}</v-chip
          >
        </div>
        <dl
          class="weighted-breakdown"
          aria-label="Weighted score contributions"
        >
          <div>
            <dt>Gene</dt>
            <dd>
              {{ formattedGeneScore }} × 4 =
              <strong>{{ weightedGeneScore }}</strong>
            </dd>
          </div>
          <div>
            <dt>Variant</dt>
            <dd>
              {{ formattedVariantScore }} × 4 =
              <strong>{{ weightedVariantScore }}</strong>
            </dd>
          </div>
          <div>
            <dt>Inheritance</dt>
            <dd>
              {{ formattedInheritanceScore }} × 2 =
              <strong>{{ weightedInheritanceScore }}</strong>
            </dd>
          </div>
        </dl>
      </div>
      <p class="summary-text">
        {{ dynamicSummary }}
      </p>

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
import { calculateNCS } from '@/utils/scoringUtils.js';

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
    // New props for the summary
    inheritancePattern: {
      type: String,
      default: 'Unknown',
    },
  },
  setup(props, { expose }) {
    // Compute the combined (final) score.
    // The final score = geneScore * 4 + variantScore * 4 + inheritanceScore * 2.
    // Since each component is on a 0–1 scale, the maximum is 4+4+2 = 10.
    const combinedScore = computed(() => {
      return calculateNCS(
        props.geneScore,
        props.variantScore,
        props.inheritanceScore,
      );
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
      return formatValue(props.variantScore * 4, {
        format: 'number',
        round: 2,
      });
    });

    const weightedInheritanceScore = computed(() => {
      return formatValue(props.inheritanceScore * 2, {
        format: 'number',
        round: 2,
      });
    });

    // Format individual scores for display
    const formattedGeneScore = computed(() => {
      return formatValue(props.geneScore, { format: 'number', round: 2 });
    });

    const formattedVariantScore = computed(() => {
      return formatValue(props.variantScore, { format: 'number', round: 2 });
    });

    const formattedInheritanceScore = computed(() => {
      return formatValue(props.inheritanceScore, {
        format: 'number',
        round: 2,
      });
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

    // Determine the interpretation label (e.g., "High Priority")
    const interpretation = computed(() => {
      const score = combinedScore.value;
      const ranges = scoreInterpretationConfig.ranges;
      if (score >= ranges[2].min) return ranges[2].label;
      if (score >= ranges[1].min) return ranges[1].label;
      return ranges[0].label;
    });

    const dynamicSummary = computed(() => {
      // Create an array of score components with their weighted values and explanations
      const components = [
        {
          name: 'gene',
          weightedScore: props.geneScore * 4,
          // Explanation for a high score
          explanation: 'the gene score contribution',
          // Explanation for a low score
          lowScoreExplanation: 'the smaller gene score contribution',
        },
        {
          name: 'variant',
          weightedScore: props.variantScore * 4,
          explanation: 'the variant score contribution',
          lowScoreExplanation: 'the smaller variant score contribution',
        },
        {
          name: 'inheritance',
          weightedScore: props.inheritanceScore * 2,
          explanation: `the inheritance score contribution for the '${props.inheritancePattern}' pattern`,
          lowScoreExplanation: 'the smaller inheritance score contribution',
        },
      ];

      // Sort components by their contribution to the score, descending
      components.sort((a, b) => b.weightedScore - a.weightedScore);

      const topDriver = components[0];
      const secondDriver = components[1];
      let summaryText = '';

      // Logic for High/Moderate priority scores
      if (
        interpretation.value === 'High Priority' ||
        interpretation.value === 'Moderate Priority'
      ) {
        summaryText = `This score is primarily driven by ${topDriver.explanation}`;
        // If the second driver is also significant, mention it
        if (secondDriver.weightedScore > 2.0) {
          // Threshold for significance
          summaryText += ` and ${secondDriver.explanation}.`;
        } else {
          summaryText += '.';
        }
      }
      // Logic for Low priority scores
      else {
        // For low scores, explain what's holding it back
        const weakestLink = components[2];
        summaryText = `This score is primarily limited by ${weakestLink.lowScoreExplanation}.`;
      }

      return `${interpretation.value}: ${summaryText}`;
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
      interpretation,
      // Dynamic summary
      dynamicSummary,
    };
  },
};
</script>

<style scoped>
.combined-score-card {
  width: 100%;
}
.score-title {
  padding: 20px 24px 0;
  font-size: 1.125rem;
  white-space: normal;
}
.score-body {
  padding: 16px 24px 24px;
}
.score-overview {
  display: flex;
  align-items: center;
  gap: 24px 40px;
  flex-wrap: wrap;
}
.score-value {
  color: rgb(var(--v-theme-on-surface));
  font-size: 2.75rem;
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  margin-bottom: 8px;
}
.score-value span {
  font-size: 1.125rem;
  font-weight: 400;
}
.score-tier {
  color: rgb(var(--v-theme-on-surface));
  border-color: var(--tier-color);
}
.weighted-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 32px;
  line-height: 1.5;
  font-size: 0.875rem;
}
.weighted-breakdown dt {
  font-weight: 600;
  margin-bottom: 4px;
}
.weighted-breakdown dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}
.summary-text {
  max-width: 72ch;
  margin: 20px 0 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  font-size: 0.875rem;
  line-height: 1.6;
  color: rgb(var(--v-theme-on-surface));
}
</style>
