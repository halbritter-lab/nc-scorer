// src/config/variantScoreConfig.js

export const variantScoreConfigVersion = '0.1.0';

export const variantScoreConfig = {
  nephro_variant_score: {
    label: 'Nephro Variant Score',
    format: 'number',
    description: 'The nephro candidate variant score based on missing gnomAD data',
    round: 6,
    visibility: true,
    style: 'chip',
    font: 'bold',
  },
};
