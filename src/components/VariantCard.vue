<!-- src/components/VariantCard.vue -->
<template>
  <v-card class="variant-card">
    <v-card-title>Variant Details for "{{ variantInput }}"</v-card-title>
    <v-card-text>
      <div v-if="loading">
        <v-progress-linear indeterminate color="primary"></v-progress-linear>
      </div>
      <div v-else-if="error">
        <v-alert type="error" dismissible>{{ error }}</v-alert>
      </div>
      <div v-else>
        <!-- Score Section -->
        <v-card class="mb-4 score-section" v-if="hasScore">
          <v-card-text>
            <v-table class="summary-table">
              <tbody>
                <tr v-for="([scoreKey, config]) in visibleScoreConfig" :key="scoreKey">
                  <td class="info-col">
                    <strong>{{ config.label }}:</strong>
                    <v-tooltip activator="parent" location="start">
                      {{ config.description }}
                    </v-tooltip>
                  </td>
                  <td class="value-col">
                    <v-chip
                      v-if="config.style === 'chip'"
                      :class="{'italic-font': config.font === 'italic', 'bold-font': config.font === 'bold'}"
                      :color="getColor(scoreSummary[scoreKey], config)"
                      small
                    >
                      {{ formatOrDefault(scoreSummary[scoreKey], config) }}
                    </v-chip>
                    <span v-else>
                      {{ formatOrDefault(scoreSummary[scoreKey], config) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

        <!-- Overall Summary Section -->
        <v-card class="mb-4 summary-section">
          <v-card-text>
            <v-table class="summary-table">
              <tbody>
                <tr>
                  <td class="info-col">
                    <strong>Most Severe Consequence:</strong>
                    <v-tooltip activator="parent" location="start">
                      The top predicted impact for this variant.
                    </v-tooltip>
                  </td>
                  <td class="value-col">
                    <span>{{ annotationSummary.most_severe_consequence || 'NA' }}</span>
                  </td>
                </tr>
                <tr v-if="annotationSummary.gene_symbol">
                  <td class="info-col">
                    <strong>Gene Symbol:</strong>
                    <v-tooltip activator="parent" location="start">
                      Official gene symbol.
                    </v-tooltip>
                  </td>
                  <td class="value-col">
                    <span>{{ annotationSummary.gene_symbol }}</span>
                  </td>
                </tr>
                <tr v-if="annotationSummary.hgnc_id">
                  <td class="info-col">
                    <strong>HGNC ID:</strong>
                    <v-tooltip activator="parent" location="start">
                      HGNC Identifier.
                    </v-tooltip>
                  </td>
                  <td class="value-col">
                    <span>{{ annotationSummary.hgnc_id }}</span>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

        <!-- Frequency Section -->
        <v-card class="mb-4" v-if="frequencyExtracted">
          <v-card-text>
            <v-table class="summary-table">
              <tbody>
                <tr v-for="([freqKey, config]) in visibleFrequencyConfig" :key="freqKey">
                  <td class="info-col">
                    <strong>{{ config.label }}:</strong>
                    <v-tooltip activator="parent" location="start">
                      {{ config.description }}
                    </v-tooltip>
                  </td>
                  <td class="value-col">
                    <v-chip
                      v-if="config.style === 'chip'"
                      :class="{'italic-font': config.font === 'italic', 'bold-font': config.font === 'bold'}"
                      :color="getColor(frequencyExtracted[freqKey], config)"
                      small
                    >
                      {{ formatOrDefault(frequencyExtracted[freqKey], config) }}
                    </v-chip>
                    <span v-else>
                      {{ formatOrDefault(frequencyExtracted[freqKey], config) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

        <!-- Transcript Consequences Section -->
        <v-card class="mb-4" v-if="transcriptIds.length">
          <v-card-text>
            <v-select
              v-model="selectedTranscriptId"
              :items="transcriptIds"
              label="Select Transcript ID"
            ></v-select>
            <div v-if="selectedTranscript">
              <v-table class="annotation-table">
                <tbody>
                  <tr v-for="entry in visibleAnnotationConfig" :key="entry[0]">
                    <td class="info-col">
                      <span class="label-hover" :title="entry[1].description">
                        {{ entry[1].label }}
                      </span>
                      <v-tooltip activator="parent" location="start">
                        {{ entry[1].description }}
                      </v-tooltip>
                    </td>
                    <td class="value-col">
                      <template v-if="entry[1].format === 'array'">
                        <v-chip
                          v-for="(item, idx) in selectedTranscript[entry[0]]"
                          :key="idx"
                          class="mr-1"
                          small
                        >
                          {{ item }}
                        </v-chip>
                      </template>
                      <template v-else>
                        <v-chip
                          v-if="entry[1].style === 'chip'"
                          :class="{'italic-font': entry[1].font === 'italic', 'bold-font': entry[1].font === 'bold'}"
                          :color="getColor(selectedTranscript[entry[0]], entry[1])"
                        >
                          {{ formatValue(selectedTranscript[entry[0]], entry[1]) }}
                        </v-chip>
                        <span v-else>
                          {{ formatValue(selectedTranscript[entry[0]], entry[1]) }}
                        </span>
                      </template>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </v-card-text>
        </v-card>

        <!-- Final Score Section (unchanged) -->
        <v-card v-if="result && result.finalScore !== undefined" class="mt-4">
          <v-card-title>Final Score</v-card-title>
          <v-card-text>{{ result.finalScore }}</v-card-text>
        </v-card>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { queryVariant } from '@/api/variantApi.js';
import { variantAnnotationConfig } from '@/config/variantAnnotationConfig.js';
import { variantFrequencyConfig } from '@/config/variantFrequencyConfig.js';
import { variantScoreConfig } from '@/config/variantScoreConfig.js';
import { getColor, formatValue } from '@/utils/format.js';

export default {
  name: 'VariantCard',
  props: {
    variantInput: {
      type: String,
      required: true,
    },
  },
  setup(props, { expose }) {
    const result = ref(null);
    const loading = ref(true);
    const error = ref(null);

    // Compute transcript consequences from the first annotationData object.
    const transcriptOptions = computed(() => {
      if (
        result.value &&
        result.value.annotationData &&
        result.value.annotationData.length > 0 &&
        result.value.annotationData[0].transcript_consequences
      ) {
        return result.value.annotationData[0].transcript_consequences;
      }
      return [];
    });

    // Compute a list of transcript IDs.
    const transcriptIds = computed(() =>
      transcriptOptions.value.map(tc => tc.transcript_id)
    );
    const selectedTranscriptId = ref(null);
    const selectedTranscript = computed(() =>
      transcriptOptions.value.find(tc => tc.transcript_id === selectedTranscriptId.value)
    );

    // Compute a filtered array of [propKey, config] entries for annotation details.
    const visibleAnnotationConfig = computed(() => {
      return Object.entries(variantAnnotationConfig).filter(
        ([, config]) => config.visibility
      );
    });

    // Compute summary data from the first annotation object.
    const annotationSummary = computed(() => {
      if (
        result.value &&
        result.value.annotationData &&
        result.value.annotationData.length > 0
      ) {
        const anno = result.value.annotationData[0];
        return {
          most_severe_consequence: anno.most_severe_consequence,
          gene_symbol: Array.isArray(anno.gene_symbol)
            ? anno.gene_symbol.join(', ')
            : anno.gene_symbol,
          hgnc_id: Array.isArray(anno.hgnc_id)
            ? anno.hgnc_id.join(', ')
            : anno.hgnc_id,
        };
      }
      return {};
    });

    // Compute frequency data from the first colocated variant.
    const frequencyData = computed(() => {
      if (
        result.value &&
        result.value.annotationData &&
        result.value.annotationData[0].colocated_variants &&
        result.value.annotationData[0].colocated_variants.length > 0 &&
        result.value.annotationData[0].colocated_variants[0].frequencies
      ) {
        return result.value.annotationData[0].colocated_variants[0].frequencies;
      }
      return null;
    });

    // Extract the first nested object value from frequencies (regardless of its key).
    const frequencyExtracted = computed(() => {
      if (frequencyData.value && typeof frequencyData.value === 'object') {
        const keys = Object.keys(frequencyData.value);
        if (keys.length > 0) {
          return frequencyData.value[keys[0]];
        }
      }
      return null;
    });

    // Compute visible frequency config entries.
    const visibleFrequencyConfig = computed(() => {
      return Object.entries(variantFrequencyConfig).filter(
        ([, config]) => config.visibility
      );
    });

    // Compute score summary from the first annotation object.
    const scoreSummary = computed(() => {
      if (
        result.value &&
        result.value.annotationData &&
        result.value.annotationData.length > 0 &&
        result.value.annotationData[0].nephro_variant_score_gnomadg_missing !== undefined
      ) {
        return {
          nephro_variant_score: result.value.annotationData[0].nephro_variant_score_gnomadg_missing,
        };
      }
      return {};
    });

    // Compute visible score config entries.
    const visibleScoreConfig = computed(() => {
      return Object.entries(variantScoreConfig).filter(
        ([, config]) => config.visibility
      );
    });

    // Determine if a score exists.
    const hasScore = computed(() => Object.keys(scoreSummary.value).length > 0);

    // Helper: Format value or return a default ("NA") if value is null/undefined or empty.
    const formatOrDefault = (value, config) => {
      const formatted = formatValue(value, config);
      return (formatted === null || formatted === undefined || formatted === '')
        ? 'NA'
        : formatted;
    };

    onMounted(async () => {
      try {
        result.value = await queryVariant(props.variantInput);
        if (transcriptIds.value.length > 0) {
          selectedTranscriptId.value = transcriptIds.value[0];
        }
      } catch (err) {
        error.value = err.message || 'Error fetching variant data.';
      } finally {
        loading.value = false;
      }
    });

    // Expose scoreSummary and annotationSummary to the parent component.
    expose({
      scoreSummary,
      annotationSummary,
    });

    return {
      loading,
      error,
      transcriptIds,
      selectedTranscriptId,
      selectedTranscript,
      visibleAnnotationConfig,
      getColor,
      formatValue,
      formatOrDefault,
      result,
      annotationSummary,
      frequencyExtracted,
      visibleFrequencyConfig,
      scoreSummary,
      visibleScoreConfig,
      hasScore,
    };
  },
};
</script>

<style scoped>
.variant-card {
  max-width: 600px;
  margin: auto;
  padding: 16px;
}
.summary-table {
  width: 100%;
}
.annotation-table {
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
.label-hover {
  cursor: help;
}
.italic-font {
  font-style: italic;
}
.bold-font {
  font-weight: bold;
}
.mt-4 {
  margin-top: 16px;
}
.summary-section {
  margin-bottom: 16px;
  padding: 8px;
  border-radius: 4px;
}
.summary-item {
  margin-bottom: 4px;
}
</style>
