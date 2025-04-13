<!-- src/components/DataDisplayRow.vue -->
<template>
  <tr
    :class="{
      'key-score-row': config.isKeyScore,
      'key-score-gene-row': config.isKeyScore && config.scoreType === 'gene',
      'key-score-variant-row': config.isKeyScore && config.scoreType === 'variant',
      'key-score-inheritance-row': config.isKeyScore && config.scoreType === 'inheritance',
    }"
  >
    <td class="info-col">
      <v-tooltip location="start">
        <template v-slot:activator="{ props }">
          <span v-bind="props" class="info-label">
            <strong>{{ config.label }}:</strong>
          </span>
        </template>
        {{ config.description }}
      </v-tooltip>
    </td>
    <td class="value-col">
      <v-chip
        v-if="config.style === 'chip' && formattedValue !== 'NA'"
        :class="{
          'italic-font': config.font === 'italic',
          'bold-font': config.font === 'bold',
          'key-score-chip': config.isKeyScore,
          'key-score-gene-chip': config.isKeyScore && config.scoreType === 'gene',
          'key-score-variant-chip': config.isKeyScore && config.scoreType === 'variant',
          'key-score-inheritance-chip': config.isKeyScore && config.scoreType === 'inheritance',
        }"
        :color="chipColor"
        :size="config.isKeyScore ? 'large' : 'small'"
        :elevation="config.isKeyScore ? 2 : 0"
      >
        <a 
          v-if="config.linkPattern && isValidLinkValue" 
          :href="generatedLink" 
          target="_blank" 
          rel="noopener noreferrer"
          class="link-no-decoration"
        >
          {{ formattedValue }}
          <v-icon size="x-small" class="link-icon">mdi-open-in-new</v-icon>
        </a>
        <template v-else>{{ formattedValue }}</template>
      </v-chip>
      
      <template v-else>
        <a 
          v-if="config.linkPattern && isValidLinkValue" 
          :href="generatedLink" 
          target="_blank" 
          rel="noopener noreferrer"
          class="external-link"
        >
          {{ formattedValue }}
          <v-icon size="x-small" class="link-icon">mdi-open-in-new</v-icon>
        </a>
        <span v-else>{{ formattedValue }}</span>
      </template>
    </td>
  </tr>
</template>

<script>
import { computed } from 'vue';
import { formatValue, getColor } from '@/utils/format';
import { generateExternalLink } from '@/utils/linkUtils';
import { scoreInterpretationConfig } from '@/config/scoreInterpretationConfig';

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
    
    // Determine chip color based on score type and key score status
    const chipColor = computed(() => {
      if (props.config.isKeyScore) {
        // Use specialized color scheme based on score type
        if (props.config.scoreType === 'gene') {
          return scoreInterpretationConfig.subScoreColors.gene;
        } else if (props.config.scoreType === 'variant') {
          return scoreInterpretationConfig.subScoreColors.variant;
        } else if (props.config.scoreType === 'inheritance') {
          return scoreInterpretationConfig.subScoreColors.inheritance;
        }
        return 'primary'; // Default primary color if no score type specified
      }
      return colorValue.value; // Use regular color logic for non-key scores
    });

    // Generate an external link if link pattern is available
    const generatedLink = computed(() => {
      if (!props.config.linkPattern || !props.value) return '';
      return generateExternalLink(props.value, props.config.linkPattern);
    });
    
    // Check if we have a valid value for the link
    const isValidLinkValue = computed(() => {
      return props.value !== null && 
             props.value !== undefined && 
             props.value !== '' &&
             formattedValue.value !== 'NA';
    });

    return {
      formattedValue,
      colorValue,
      chipColor,
      generatedLink,
      isValidLinkValue,
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

/* External link styling */
.external-link {
  color: var(--v-theme-primary);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.external-link:hover {
  text-decoration: underline;
}

.link-icon {
  margin-left: 4px;
  opacity: 0.7;
}

.link-no-decoration {
  text-decoration: none;
  color: inherit;
  display: inline-flex;
  align-items: center;
}

/* General key score styling */
.key-score-row {
  background-color: rgba(var(--v-theme-primary), 0.05);
  border-left: 4px solid var(--v-theme-primary);
}

.key-score-chip {
  font-weight: bold !important;
  font-size: 1.1rem !important;
  padding: 0 12px !important;
}

/* Score type specific styling */
.key-score-gene-row {
  background-color: rgba(var(--v-theme-indigo), 0.05);
  border-left: 4px solid var(--v-theme-indigo);
}

.key-score-variant-row {
  background-color: rgba(var(--v-theme-deep-purple), 0.05);
  border-left: 4px solid var(--v-theme-deep-purple);
}

.key-score-inheritance-row {
  background-color: rgba(var(--v-theme-teal), 0.05);
  border-left: 4px solid var(--v-theme-teal);
}
</style>
