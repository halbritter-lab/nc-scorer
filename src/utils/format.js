// src/utils/format.js

/**
 * Maps semantic color names to Vuetify theme colors
 */
const colorMap = {
  negative: 'error',
  warning: 'warning',
  positive: 'success',
  neutral: 'grey',

  // Legacy color mappings for backward compatibility
  red: 'error',
  yellow: 'warning',
  green: 'success',
};

/**
 * Get the appropriate color for a value based on configuration thresholds
 *
 * @param {any} value - The value to evaluate
 * @param {Object} config - Configuration object containing color thresholds
 * @param {Object} [config.colorThresholds] - Threshold values for color determination
 * @param {number|string} [config.colorThresholds.low] - Low threshold (negative/red)
 * @param {number|string} [config.colorThresholds.medium] - Medium threshold (warning/yellow)
 * @param {number|string} [config.colorThresholds.high] - High threshold (positive/green)
 * @param {string} [config.defaultColor] - Default color to use if no threshold matches
 * @returns {string} - The color to use, mapped to Vuetify theme
 */
export const getColor = (value, config = {}) => {
  // If value is null/undefined/empty string, return neutral or default color
  if (value === null || value === undefined || value === '') {
    return colorMap.neutral || '';
  }

  if (config.colorThresholds) {
    let result = '';

    if (typeof value === 'number') {
      if (value < config.colorThresholds.low) {
        result = 'negative';
      } else if (value < config.colorThresholds.medium) {
        result = 'warning';
      } else if (value >= config.colorThresholds.high) {
        result = 'positive';
      }
    } else if (typeof value === 'string') {
      if (value === config.colorThresholds.low) {
        result = 'negative';
      } else if (value === config.colorThresholds.medium) {
        result = 'warning';
      } else if (value === config.colorThresholds.high) {
        result = 'positive';
      }
    }

    // Map the semantic color to theme color
    return result ? colorMap[result] || result : config.defaultColor || '';
  }

  return config.defaultColor || '';
};

/**
 * Format a value according to configuration
 *
 * @param {any} value - The value to format
 * @param {Object} config - Configuration object
 * @param {string} [config.format] - Format type ('number', 'percent', etc.)
 * @param {number} [config.round] - Number of decimal places to round to
 * @param {string} [config.defaultValue=''] - Default value to return if input is null/undefined/empty
 * @returns {string|number} - The formatted value
 */
export const formatValue = (value, config = {}) => {
  // Handle null/undefined/empty values
  if (value === null || value === undefined || value === '') {
    return config.defaultValue !== undefined ? config.defaultValue : '';
  }

  // Format numbers
  if (config.format === 'number' && typeof value === 'number') {
    return value.toFixed(config.round || 0);
  }

  // Format percentages
  if (config.format === 'percent' && typeof value === 'number') {
    return `${(value * 100).toFixed(config.round || 0)}%`;
  }

  // Format arrays
  if (Array.isArray(value)) {
    return value.join(config.arraySeparator || ', ');
  }

  return value;
};
