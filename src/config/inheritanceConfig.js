/**
 * Configuration for inheritance pattern scoring settings
 */

/**
 * Base scores for different inheritance patterns
 * These scores represent the initial weight assigned based purely on the inheritance pattern,
 * assuming a potentially relevant variant in a potentially relevant gene for a rare Mendelian condition.
 */
export const baseScores = {
  Denovo: 0.95, // Highest - Strongest signal for sporadic cases
  'Homozygous recessive': 0.8, // High - Confirmed Biallelic
  'Compound heterozygous (confirmed)': 0.8, // High - Confirmed Biallelic (Equal to Homozygous)
  'X-linked': 0.6, // Moderate - Positioned below confirmed biallelic
  'Inherited dominant': 0.4, // Lowered Significantly - Requires more evidence from other sources
  'Compound heterozygous (suspected)': 0.4, // Low - Reflects phase uncertainty
  Unknown: 0.1, // Lowest - Baseline
};

/**
 * Parameters for the variant score computation
 */
export const scoringParameters = {
  // Threshold p-value for maximal evidence
  gamma: 0.001,
  // Small floor to avoid logarithm of zero
  epsilon: 1e-10,
};

/**
 * List of inheritance patterns where segregation probability should be disabled
 */
export const noSegregationPatterns = ['Denovo', 'Unknown', 'Compound heterozygous (suspected)'];

/**
 * List of inheritance patterns that require a second variant input
 */
export const requiresSecondVariant = [
  'Compound heterozygous (confirmed)',
  'Compound heterozygous (suspected)',
];
