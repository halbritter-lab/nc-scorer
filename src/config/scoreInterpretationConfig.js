// src/config/scoreInterpretationConfig.js

/**
 * Configuration for NCS (Nephro Candidate Score) interpretation ranges
 * These ranges determine how scores are interpreted and visually presented
 */
export const scoreInterpretationConfigVersion = '0.1.0';

export const scoreInterpretationConfig = {
  // Thresholds for score interpretation
  ranges: [
    { min: 0, max: 3, label: 'Low Priority', color: '#757575' }, // Grey color
    { min: 3, max: 7, label: 'Moderate Priority', color: '#FF8F00' }, // Amber color
    { min: 7, max: 10, label: 'High Priority', color: '#E53935' }, // Red color
  ],
  // Standard decimal places for number formatting across the application
  standardRounding: 2,
  // Weight factors for score components
  weights: {
    geneScore: 4,
    variantScore: 4,
    inheritanceScore: 2,
  },
  // Distinctive color schemes for each sub-score
  subScoreColors: {
    gene: 'indigo', // Blue-based theme for gene scores
    variant: 'deep-purple', // Purple-based theme for variant scores
    inheritance: 'teal', // Teal-based theme for inheritance scores
  },
  // Skeleton loader configurations
  skeletonLoaders: {
    gene: { type: 'table-heading, list-item-two-line, list-item-two-line, list-item-two-line' },
    variant: { type: 'table-heading, list-item-two-line, list-item-two-line, list-item-two-line, list-item-two-line, list-item-two-line' },
    inheritance: { type: 'table-heading, list-item-two-line, list-item-two-line, list-item-two-line' },
    combined: { type: 'chip, image' },
  },
};
