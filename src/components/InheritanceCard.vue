<!-- src/components/InheritanceCard.vue -->
<template>
  <v-card class="inheritance-card">
    <v-card-title tag="h2" class="evidence-title"
      >Inheritance Parameters</v-card-title
    >
    <v-divider />
    <v-card-text class="evidence-body">
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
        <v-alert
          v-if="invalidSegregation"
          type="error"
          variant="tonal"
          class="mb-3"
        >
          Segregation probability must be a number between 0 and 1.
        </v-alert>
        <section aria-label="Inheritance evidence">
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
                  description:
                    'The probability of segregation (value between 0 and 1).',
                  format: 'number',
                  round: 3,
                }"
                :value="segregationProb ?? 'Not provided'"
              />
            </tbody>
          </v-table>
        </section>

        <!-- Penalty Alert -->
        <v-alert
          v-if="wasPenalized"
          density="compact"
          type="info"
          variant="tonal"
          class="mt-3 font-weight-medium"
        >
          Score penalized due to missing segregation data for this inheritance
          pattern.
        </v-alert>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
// Script section remains unchanged - no logic changes needed for styling
import { computed, watchEffect, ref } from 'vue';
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
    // Score calculation is synchronous and immediate
    const loading = ref(false);

    // Handle segregation value - preserve null for penalty detection
    const segregationValue = computed(() => {
      if (
        props.segregation == null ||
        (typeof props.segregation === 'string' &&
          props.segregation.trim() === '')
      ) {
        return null;
      }
      return props.segregation;
    });

    // Convert to number for display (only when not null)
    const segregationProb = computed(() => {
      return segregationValue.value !== null
        ? Number(segregationValue.value)
        : null;
    });
    const invalidSegregation = computed(
      () =>
        segregationProb.value !== null &&
        (!Number.isFinite(segregationProb.value) ||
          segregationProb.value < 0 ||
          segregationProb.value > 1),
    );

    // Determine the base score for the current inheritance pattern (for emit compatibility)
    const baseScore = computed(() =>
      Object.hasOwn(baseScores, props.inheritance)
        ? baseScores[props.inheritance]
        : 0.1,
    );

    // Compute the final inheritance score using centralized logic
    const finalScore = computed(() => {
      if (invalidSegregation.value) return null;
      return calculateInheritanceScore(
        props.inheritance,
        segregationValue.value,
      );
    });

    // Detect if penalty was applied
    const wasPenalized = computed(() => {
      const isSegregationMissing =
        segregationValue.value === null || segregationValue.value === '';
      return (
        !noSegregationPatterns.includes(props.inheritance) &&
        isSegregationMissing
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
      if (!loading.value) {
        // Only emit after initial loading/calculation
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
      invalidSegregation,
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
.evidence-title {
  padding: 16px 20px;
  font-size: 1.125rem;
  line-height: 1.5;
  white-space: normal;
}
.evidence-body {
  padding: 12px 20px 20px;
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
