/**
 * Utility functions for scoring calculations used in batch processing
 */

import { baseScores, scoringParameters, noSegregationPatterns } from '@/config/inheritanceConfig.js';

/**
 * Computes inheritance score based on inheritance pattern and segregation probability
 * This is extracted from InheritanceCard.vue computeVariantScore function
 * 
 * @param {number} baseScore - The base score for the inheritance pattern (0-1)
 * @param {number} [pValue=1] - Segregation probability (0-1)
 * @param {number} [gamma=0.001] - Threshold p-value for maximal evidence
 * @param {number} [epsilon=1e-10] - Small floor to avoid logarithm of zero
 * @returns {number} - Final inheritance score, scaled between baseScore and 1.0
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
 * Calculate inheritance score from inheritance pattern and segregation probability
 * 
 * @param {string} inheritance - The inheritance pattern
 * @param {string|number} segregation - The segregation probability
 * @returns {number} - The calculated inheritance score
 */
export function calculateInheritanceScore(inheritance, segregation) {
  // Get base score for inheritance pattern
  const baseScore = baseScores[inheritance] !== undefined ? baseScores[inheritance] : 0.1;
  
  // Convert segregation to number
  const segregationProb = Number(segregation);
  
  // Check if segregation should be ignored based on config
  const ignoreSegregation = noSegregationPatterns.includes(inheritance);
  const segregationToUse = ignoreSegregation ? 1 : segregationProb;
  
  return computeVariantScore(
    baseScore,
    segregationToUse,
    scoringParameters.gamma,
    scoringParameters.epsilon
  );
}

/**
 * Calculate the combined NCS (Nephro Candidate Score)
 * Formula: geneScore * 4 + variantScore * 4 + inheritanceScore * 2
 * 
 * @param {number} geneScore - Gene score (0-1)
 * @param {number} variantScore - Variant score (0-1)
 * @param {number} inheritanceScore - Inheritance score (0-1)
 * @returns {number} - The combined NCS score (0-10)
 */
export function calculateNCS(geneScore, variantScore, inheritanceScore) {
  return geneScore * 4 + variantScore * 4 + inheritanceScore * 2;
}