// src/utils/scoringUtils.js
// Centralized scoring logic for batch processing and component reuse

import { baseScores, scoringParameters, noSegregationPatterns, missingSegregationPenalty } from '@/config/inheritanceConfig.js';

/**
 * Computes the final genetic variant score based on a base inheritance score and a segregation p-value.
 *
 * The function uses a negative-log transformation of the p-value to boost
 * the base score toward 1.0 for very low p-values (i.e. strong segregation evidence).
 *
 * @param {number} baseScore - Base inheritance pattern score (must be between 0 and 1).
 * @param {number} [pValue=1] - Segregation p-value (must be between 0 and 1). Defaults to 1 (i.e. no added evidence).
 * @param {number} [gamma=0.001] - Threshold p-value for maximal evidence.
 * @param {number} [epsilon=1e-10] - Small floor to avoid logarithm of zero.
 * @returns {number} - Final inheritance score, scaled between baseScore and 1.0.
 * @throws {Error} - If baseScore or pValue are out of the [0,1] range.
 */
function computeVariantScore(baseScore, pValue = 1, gamma = 0.001, epsilon = 1e-10) {
  if (baseScore < 0 || baseScore > 1) {
    throw new Error('baseScore must be between 0 and 1');
  }
  if (pValue < 0 || pValue > 1) {
    throw new Error('pValue must be between 0 and 1');
  }
  const adjustedP = Math.max(pValue, epsilon);
  const numerator = -Math.log(adjustedP);
  const denominator = -Math.log(gamma);
  let rawFactor = numerator / denominator;
  if (rawFactor > 1) {
    rawFactor = 1;
  }
  return baseScore + (1 - baseScore) * rawFactor;
}

/**
 * Calculates the final inheritance score from a pattern and segregation value.
 * This is extracted from InheritanceCard.vue for reuse in batch processing.
 * 
 * Implements penalty for missing segregation data when it's expected:
 * - If segregation is null/missing and the inheritance pattern requires segregation data,
 *   the final score is penalized by multiplying with missingSegregationPenalty
 * - This reflects increased uncertainty when expected evidence is not provided
 * 
 * @param {string} inheritance - Inheritance pattern (e.g., 'Denovo', 'Inherited dominant')
 * @param {string|number|null} segregation - Segregation probability value, or null if missing
 * @returns {number} - Final inheritance score (0-1 range)
 */
export function calculateInheritanceScore(inheritance, segregation) {
  const baseScore = baseScores[inheritance] ?? 0.1;
  
  // Determine if segregation data was missing (null) or provided
  const isSegregationMissing = segregation === null || segregation === '';
  
  // If data is missing, use a neutral p-value of 1 for the core calculation.
  // If provided, convert to a number.
  const pValueForCalculation = isSegregationMissing ? 1.0 : Number(segregation);
  
  // Check if a penalty should be applied for this inheritance type
  const penaltyShouldApply = !noSegregationPatterns.includes(inheritance) && isSegregationMissing;
  
  // Calculate the raw score
  const rawScore = computeVariantScore(baseScore, pValueForCalculation, scoringParameters.gamma, scoringParameters.epsilon);

  // Apply the penalty only if the conditions are met
  return penaltyShouldApply ? rawScore * missingSegregationPenalty : rawScore;
}

/**
 * Calculates the final Nephro Candidate Score (NCS).
 * This is extracted from CombinedScoreCard.vue for reuse in batch processing.
 * 
 * Formula: (Gene × 4 + Variant × 4 + Inheritance × 2)
 * Maximum possible score: 10 (when all component scores are 1.0)
 * 
 * @param {number} geneScore - Gene score (0-1 range)
 * @param {number} variantScore - Variant score (0-1 range) 
 * @param {number} inheritanceScore - Inheritance score (0-1 range)
 * @returns {number} - Final NCS score (0-10 range)
 */
export function calculateNCS(geneScore, variantScore, inheritanceScore) {
  if (typeof geneScore !== 'number' || typeof variantScore !== 'number' || typeof inheritanceScore !== 'number') {
    return 0;
  }
  // Formula: (Gene × 4 + Variant × 4 + Inheritance × 2)
  return (geneScore * 4) + (variantScore * 4) + (inheritanceScore * 2);
}

/**
 * Validates that a score is within the expected 0-1 range
 * @param {number} score - Score to validate
 * @param {string} scoreName - Name of the score for error messages
 * @returns {number} - The validated score, or 0 if invalid
 */
export function validateScore(score, scoreName = 'score') {
  if (typeof score !== 'number' || isNaN(score)) {
    console.warn(`Invalid ${scoreName}: ${score}. Using 0 instead.`);
    return 0;
  }
  if (score < 0 || score > 1) {
    console.warn(`${scoreName} out of range [0,1]: ${score}. Clamping to valid range.`);
    return Math.max(0, Math.min(1, score));
  }
  return score;
}

/**
 * Helper function to safely extract numeric scores from API responses
 * @param {any} value - Value to convert to number
 * @param {number} defaultValue - Default value if conversion fails
 * @returns {number} - Numeric score
 */
export function safeParseScore(value, defaultValue = 0) {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}