<!-- src/components/GeneCard.vue -->
<template>
  <v-card class="gene-card">
    <v-card-title>
      Gene Details for "{{ symbol }}"
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
          <template v-slot:default>
            <tbody>
              <tr v-for="(item, key) in filteredGeneData" :key="key">
                <td>
                  <span class="label-hover" :title="item.description">
                    {{ item.label }}
                  </span>
                  <v-tooltip activator="parent" location="start">
                    {{ item.description }}
                  </v-tooltip>
                </td>
                <td>
                  <v-chip
                    v-if="item.style === 'chip'"
                    :class="{
                      'italic-font': item.font === 'italic',
                      'bold-font': item.font === 'bold',
                    }"
                    :color="item.color"
                  >
                    {{ item.value }}
                  </v-chip>
                  <span v-else>{{ item.value }}</span>
                </td>
              </tr>
            </tbody>
          </template>
        </v-table>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { ref, onMounted, computed, inject } from 'vue';
import { fetchGeneDetails } from '@/api/geneApi.js';
import { geneDetailsConfig } from '@/config/geneDetailsConfig.js';
import { getColor, formatValue } from '@/utils/format.js';
import useRetryState from '@/composables/useRetryState.js';

export default {
  name: 'GeneCard',
  props: {
    symbol: {
      type: String,
      required: true,
    },
  },
  setup(props, { expose }) {
    const geneData = ref({});
    const loading = ref(true);
    const error = ref(null);

    // Get shared retry state from parent or create a new one
    const { retryStates, showSnackbar } = inject('retryState', useRetryState());

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
          onRetry: (error, attempt) => {
            retryState.inProgress = true;
            showSnackbar(`Retrying gene data (attempt ${attempt})...`, 'warning');
          },
          onSuccess: (attempts) => {
            retryState.inProgress = false;
            showSnackbar(`Successfully loaded gene data after ${attempts} retries`, 'success');
          },
        });
      } catch (err) {
        retryStates.gene.inProgress = false;
        error.value = err.message || 'Error fetching gene data.';
      } finally {
        loading.value = false;
      }
    });

    // Expose filteredGeneData so parent components can access it.
    expose({
      filteredGeneData,
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
</style>
