<!-- src/views/GeneView.vue -->
<template>
  <v-container>
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
  </v-container>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { geneDetailsConfig } from '@/config/geneDetailsConfig.js';
import { getColor, formatValue } from '@/utils/format.js';
import { fetchGeneDetails } from '@/api/geneApi.js'; // Use the new API module

export default {
  name: 'GeneView',
  props: {
    symbol: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const geneData = ref({});
    const router = useRouter();

    // Compute the formatted gene data based on configuration.
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
      if (props.symbol) {
        try {
          geneData.value = await fetchGeneDetails(props.symbol);
        } catch (error) {
          // Redirect to the PageNotFound view if there is an error (e.g., file not found)
          router.push({ path: '/404' });
        }
      }
    });

    return {
      geneData,
      filteredGeneData,
    };
  },
};
</script>

<style scoped>
.label-hover {
  cursor: help;
}

.italic-font {
  font-style: italic;
}

.bold-font {
  font-weight: bold;
}

.gene-info-table {
  max-width: 400px; /* Adjust this value as needed */
  margin: auto; /* Centers the table if it's smaller than the container */
}
</style>
