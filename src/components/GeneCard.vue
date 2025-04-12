<!-- src/components/GeneCard.vue -->
<template>
  <v-card class="gene-card">
    <v-card-title>
      Gene Details for "{{ symbol }}"
      <!-- Retry count badge - shown when retries have occurred -->
      <v-badge
        v-if="retryStates.gene.attempts > 0"
        color="warning"
        :content="retryStates.gene.attempts"
        :title="`Retried ${retryStates.gene.attempts} times due to network issues`"
        offset-x="5"
        offset-y="5"
      >
        <v-icon size="small" color="warning">mdi-refresh</v-icon>
      </v-badge>

      <!-- Spinning icon when retry is in progress -->
      <v-tooltip
        v-if="retryStates.gene.inProgress"
        location="top"
        text="Retrying API request..."
      >
        <template v-slot:activator="{ props }">
          <v-icon v-bind="props" size="small" color="warning" class="ml-2 retry-spinner">
            mdi-refresh
          </v-icon>
        </template>
      </v-tooltip>
    </v-card-title>
    <v-card-text>
      <div v-if="loading">
        <v-progress-linear indeterminate color="primary"></v-progress-linear>
      </div>
      <div v-else-if="error">
        <v-alert type="error" dismissible>{{ error }}</v-alert>
      </div>
      <div v-else>
        <v-table class="gene-info-table">
          <tbody>
            <DataDisplayRow
              v-for="(item, key) in filteredGeneData"
              :key="key"
              :config="{
                label: item.label,
                description: item.description,
                style: item.style,
                font: item.font,
                colorThresholds: item.colorThresholds,
              }"
              :value="item.value"
              :defaultValue="'NA'"
            />
          </tbody>
        </v-table>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { ref, onMounted, computed, inject, watchEffect } from 'vue';
import { fetchGeneDetails } from '@/api/geneApi.js';
import { geneDetailsConfig } from '@/config/geneDetailsConfig.js';
import { getColor, formatValue } from '@/utils/format.js';
import useRetryState from '@/composables/useRetryState.js';
import DataDisplayRow from '@/components/DataDisplayRow.vue';

export default {
  name: 'GeneCard',
  components: {
    DataDisplayRow,
  },
  props: {
    symbol: {
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    const geneData = ref({});
    const loading = ref(true);
    const error = ref(null);

    // Get shared retry state from parent or create a new one
    const { retryStates } = inject('retryState', useRetryState());

    // Compute gene details formatted by the configuration.
    const filteredGeneData = computed(() => {
      const formattedData = {};
      if (geneData.value) {
        Object.entries(geneData.value).forEach(([key, value]) => {
          const config = geneDetailsConfig[key];
          if (config && config.visibility) {
            formattedData[key] = {
              label: config.label,
              description: config.description,
              value: formatValue(value, config),
              color: getColor(value, config),
              style: config.style,
              font: config.font,
            };
          }
        });
      }
      return formattedData;
    });

    onMounted(async () => {
      try {
        // Reset retry state before making the API call
        retryStates.gene.reset();
        retryStates.gene.component = 'GeneCard';

        // Create a shared state object to track retries
        const retryState = retryStates.gene;

        geneData.value = await fetchGeneDetails(props.symbol, {
          retryState,
          onRetry: () => {
            retryState.inProgress = true;
            // Using global notification system only
          },
          onSuccess: () => {
            retryState.inProgress = false;
            // Using global notification system only
          },
        });
      } catch (err) {
        retryStates.gene.inProgress = false;
        error.value = err.message || 'Error fetching gene data.';
      } finally {
        loading.value = false;
      }
    });

    // Watch for changes in the gene data and emit them to parent component
    watchEffect(() => {
      if (!loading.value && !error.value && geneData.value && geneData.value.ngs) {
        emit('gene-score-updated', {
          score: geneData.value.ngs,
          symbol: props.symbol,
          formattedData: filteredGeneData.value,
        });
      }
    });

    return {
      loading,
      error,
      filteredGeneData,
      retryStates,
    };
  },
};
</script>

<style scoped>
.gene-card {
  max-width: 600px;
  margin: auto;
  padding: 16px;
}
.gene-info-table {
  width: 100%;
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

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.retry-spinner {
  animation: spin 1.5s linear infinite;
}
</style>
