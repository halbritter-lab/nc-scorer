// src/utils/format.js
export const getColor = (value, config) => {
    if (config.colorThresholds) {
      if (typeof value === 'number') {
        if (value < config.colorThresholds.low) return 'red';
        if (value < config.colorThresholds.medium) return 'yellow';
        if (value >= config.colorThresholds.high) return 'green';
      } else if (typeof value === 'string') {
        if (value === config.colorThresholds.low) return 'red';
        if (value === config.colorThresholds.medium) return 'yellow';
        if (value === config.colorThresholds.high) return 'green';
      }
    }
    return '';
  };
  
  export const formatValue = (value, config) => {
    if (config.format === 'number' && typeof value === 'number') {
      return value.toFixed(config.round);
    }
    return value;
  };
  