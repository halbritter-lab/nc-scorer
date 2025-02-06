<!-- src/components/GeneCard.vue -->
<template>
  <v-card class="gene-card">
    <v-card-title>Gene Details for "{{ symbol }}"</v-card-title>
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
                    :class="{'italic-font': item.font === 'italic', 'bold-font': item.font === 'bold'}"
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
import { ref, onMounted, computed } from 'vue';
import { fetchGeneDetails } from '@/api/geneApi.js';
import { geneDetailsConfig } from '@/config/geneDetailsConfig.js';
import { getColor, formatValue } from '@/utils/format.js';

export default {
  name: 'GeneCard',
  props: {
    symbol: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const geneData = ref({});
    const loading = ref(true);
    const error = ref(null);

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
        geneData.value = await fetchGeneDetails(props.symbol);
      } catch (err) {
        error.value = err.message || 'Error fetching gene data.';
      } finally {
        loading.value = false;
      }
    });

    return {
      loading,
      error,
      filteredGeneData,
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
