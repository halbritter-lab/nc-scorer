// src/config/variantFrequencyConfig.js

export const variantFrequencyConfigVersion = '0.1.0';

export const variantFrequencyConfig = {
  gnomade: {
    label: 'gnomade',
    format: 'number',
    description: 'gnomade frequency',
    round: 6,
    visibility: true,
    style: 'chip',
    font: 'bold',
  },
  gnomadg: {
    label: 'gnomadg',
    format: 'number',
    description: 'gnomadg frequency',
    round: 6,
    visibility: true,
    style: 'chip',
    font: 'bold',
  },
  // Add additional frequency fields as needed
};
