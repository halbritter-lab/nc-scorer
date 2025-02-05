<!-- src/views/VariantView.vue -->
<template>
  <v-container>
    <v-card>
      <v-card-title>
        Variant Details for "{{ variantValue }}"
      </v-card-title>
      <v-card-text>
        <div v-if="loading">
          <v-progress-linear indeterminate color="primary"></v-progress-linear>
        </div>
        <div v-else-if="error">
          <v-alert type="error" dismissible>
            {{ error }}
          </v-alert>
        </div>
        <div v-else>
          <!-- Display Transcript Consequences -->
          <v-card class="mb-4" v-if="transcriptIds.length">
            <v-card-title>Transcript Consequences</v-card-title>
            <v-card-text>
              <v-select
                v-model="selectedTranscriptId"
                :items="transcriptIds"
                label="Select Transcript ID"
              ></v-select>
              <div v-if="selectedTranscript">
                <pre>{{ JSON.stringify(selectedTranscript, null, 2) }}</pre>
              </div>
            </v-card-text>
          </v-card>

          <!-- Display Final Score (if available) -->
          <v-card v-if="result && result.finalScore !== undefined">
            <v-card-title>Final Score</v-card-title>
            <v-card-text>{{ result.finalScore }}</v-card-text>
          </v-card>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { queryVariant } from '@/api/variantApi.js';

export default {
  name: 'VariantView',
  props: {
    variantInput: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const route = useRoute();
    // Use the prop or route parameter for the variant value
    const variantValue = props.variantInput || route.params.variantInput;
    const result = ref(null);
    const loading = ref(true);
    const error = ref(null);

    // Compute transcript consequences from the first annotation data object
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

    // Compute a list of transcript IDs from the transcript consequences
    const transcriptIds = computed(() => {
      return transcriptOptions.value.map(tc => tc.transcript_id);
    });

    // The selected transcript ID (default will be set after loading data)
    const selectedTranscriptId = ref(null);

    // Compute the selected transcript consequence object
    const selectedTranscript = computed(() => {
      return transcriptOptions.value.find(tc => tc.transcript_id === selectedTranscriptId.value);
    });

    onMounted(async () => {
      try {
        result.value = await queryVariant(variantValue);
        console.log('Variant result:', result.value);
        // If transcript consequences exist, default to the first transcript ID
        if (transcriptIds.value.length > 0) {
          selectedTranscriptId.value = transcriptIds.value[0];
        }
      } catch (err) {
        error.value = err.message || 'Error fetching variant data.';
      } finally {
        loading.value = false;
      }
    });

    return {
      variantValue,
      result,
      loading,
      error,
      transcriptIds,
      selectedTranscriptId,
      selectedTranscript,
    };
  },
};
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>
