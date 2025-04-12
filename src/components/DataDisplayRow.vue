<!-- src/components/DataDisplayRow.vue -->
<template>
  <tr>
    <td class="info-col">
      <strong>{{ config.label }}:</strong>
      <v-tooltip activator="parent" location="start">
        {{ config.description }}
      </v-tooltip>
    </td>
    <td class="value-col">
      <v-chip
        v-if="config.style === 'chip' && formattedValue !== 'NA'"
        :class="{
          'italic-font': config.font === 'italic',
          'bold-font': config.font === 'bold',
        }"
        :color="colorValue"
        small
      >
        {{ formattedValue }}
      </v-chip>
      <span v-else>{{ formattedValue }}</span>
    </td>
  </tr>
</template>

<script>
import { computed } from 'vue';
import { formatValue, getColor } from '@/utils/format';

export default {
  name: 'DataDisplayRow',
  props: {
    /**
     * Configuration object for this data field
     */
    config: {
      type: Object,
      required: true,
    },
    /**
     * The value to display
     */
    value: {
      type: [String, Number, Boolean, Array, Object],
      default: null,
    },
    /**
     * Optional override for the default NA display
     */
    defaultValue: {
      type: String,
      default: 'NA',
    },
  },
  setup(props) {
    // Format the value according to configuration
    const formattedValue = computed(() => {
      const formatted = formatValue(props.value, props.config);
      return formatted === null || formatted === undefined || formatted === ''
        ? props.defaultValue
        : formatted;
    });

    // Compute the appropriate color based on the value and configuration
    const colorValue = computed(() => {
      return getColor(props.value, props.config);
    });

    return {
      formattedValue,
      colorValue,
    };
  },
};
</script>

<style scoped>
.italic-font {
  font-style: italic;
}

.bold-font {
  font-weight: bold;
}
</style>
