// tests/unit/scoring/nephroVariantScore.test.js
import { describe, it, expect } from 'vitest';
import {
  calculateNCS,
  calculateInheritanceScore,
  validateScore,
  safeParseScore,
} from '@/utils/scoringUtils.js';
import {
  baseScores,
  scoringParameters,
  noSegregationPatterns,
  missingSegregationPenalty,
} from '@/config/inheritanceConfig.js';
import { scoreInterpretationConfig } from '@/config/scoreInterpretationConfig.js';
import formulaConfig from '@/config/scoring/nephro_variant_score/formula_config.json';
import variableConfig from '@/config/scoring/nephro_variant_score/variable_assignment_config.json';

describe('Nephro Candidate Score (NCS) - Mathematical Engine', () => {
  describe('calculateNCS', () => {
    it('calculates linear weighted sum: Gene*4 + Variant*4 + Inheritance*2', () => {
      // Perfect scores: 1.0 * 4 + 1.0 * 4 + 1.0 * 2 = 10.0
      expect(calculateNCS(1.0, 1.0, 1.0)).toBe(10.0);

      // Half scores: 0.5 * 4 + 0.5 * 4 + 0.5 * 2 = 5.0
      expect(calculateNCS(0.5, 0.5, 0.5)).toBe(5.0);

      // Asymmetric scores
      expect(calculateNCS(0.8, 0.6, 0.4)).toBeCloseTo(0.8 * 4 + 0.6 * 4 + 0.4 * 2, 6);
    });

    it('returns 0 when any input is NaN (MAT-01 guard)', () => {
      expect(calculateNCS(NaN, 0.5, 0.5)).toBe(0);
      expect(calculateNCS(0.5, NaN, 0.5)).toBe(0);
      expect(calculateNCS(0.5, 0.5, NaN)).toBe(0);
    });

    it('returns 0 when inputs are non-numbers or non-finite', () => {
      expect(calculateNCS(null, 0.5, 0.5)).toBe(0);
      expect(calculateNCS(undefined, 0.5, 0.5)).toBe(0);
      expect(calculateNCS('0.8', 0.5, 0.5)).toBe(0);
      expect(calculateNCS(Infinity, 0.5, 0.5)).toBe(0);
      expect(calculateNCS(-Infinity, 0.5, 0.5)).toBe(0);
    });

    it('handles zero boundaries correctly', () => {
      expect(calculateNCS(0, 0, 0)).toBe(0);
      expect(calculateNCS(0, 1, 0)).toBe(4);
      expect(calculateNCS(1, 0, 0)).toBe(4);
      expect(calculateNCS(0, 0, 1)).toBe(2);
    });
  });

  describe('calculateInheritanceScore', () => {
    it('applies base scores accurately for all supported patterns', () => {
      for (const [pattern, expectedBase] of Object.entries(baseScores)) {
        // Without segregation penalty (p-value = 1.0)
        const score = calculateInheritanceScore(pattern, 1.0);
        expect(score).toBeCloseTo(expectedBase, 6);
      }
    });

    it('defaults to base score 0.1 for unrecognized inheritance patterns', () => {
      const score = calculateInheritanceScore('NonExistentPattern', 1.0);
      expect(score).toBeCloseTo(0.1, 6);
    });

    it('boosts score towards 1.0 when segregation p-value is significant (p <= gamma)', () => {
      // For p <= 0.001, rawFactor reaches 1.0, boosting score to 1.0
      const score = calculateInheritanceScore('Inherited dominant', 0.0005);
      expect(score).toBeCloseTo(1.0, 6);
    });

    it('handles p-value = 0 with floor epsilon (1e-10) without division by zero or NaN', () => {
      const score = calculateInheritanceScore('Inherited dominant', 0);
      expect(Number.isFinite(score)).toBe(true);
      expect(score).toBeCloseTo(1.0, 6);
    });

    it('applies 20% penalty (0.8x) when segregation is missing for expected patterns', () => {
      const pattern = 'Inherited dominant'; // Base 0.4
      expect(noSegregationPatterns.includes(pattern)).toBe(false);

      const penalizedScoreNull = calculateInheritanceScore(pattern, null);
      expect(penalizedScoreNull).toBeCloseTo(0.4 * missingSegregationPenalty, 6);

      const penalizedScoreEmpty = calculateInheritanceScore(pattern, '');
      expect(penalizedScoreEmpty).toBeCloseTo(0.4 * missingSegregationPenalty, 6);

      const penalizedScoreUndefined = calculateInheritanceScore(pattern, undefined);
      expect(penalizedScoreUndefined).toBeCloseTo(0.4 * missingSegregationPenalty, 6);
    });

    it('does NOT apply penalty for patterns in noSegregationPatterns', () => {
      for (const pattern of noSegregationPatterns) {
        const baseScore = baseScores[pattern] ?? 0.1;
        const score = calculateInheritanceScore(pattern, null);
        expect(score).toBeCloseTo(baseScore, 6);
      }
    });

    it('throws error when p-value or base score are out of [0, 1] range', () => {
      expect(() => calculateInheritanceScore('Inherited dominant', -0.1)).toThrow();
      expect(() => calculateInheritanceScore('Inherited dominant', 1.5)).toThrow();
    });
  });

  describe('validateScore and safeParseScore', () => {
    it('clamps scores within [0, 1]', () => {
      expect(validateScore(1.5)).toBe(1);
      expect(validateScore(-0.5)).toBe(0);
      expect(validateScore(0.75)).toBe(0.75);
    });

    it('guards against NaN and non-numbers in validateScore', () => {
      expect(validateScore(NaN)).toBe(0);
      expect(validateScore('0.8')).toBe(0);
      expect(validateScore(null)).toBe(0);
    });

    it('safely parses scores with fallbacks in safeParseScore', () => {
      expect(safeParseScore('0.85')).toBe(0.85);
      expect(safeParseScore(0.5)).toBe(0.5);
      expect(safeParseScore(null, 0.2)).toBe(0.2);
      expect(safeParseScore(undefined, 0.3)).toBe(0.3);
      expect(safeParseScore('invalid', 0.1)).toBe(0.1);
      expect(safeParseScore('', 0.1)).toBe(0.1);
    });
  });

  describe('Score Interpretation Ranges', () => {
    it('matches configured ranges [0, 3], [3, 7], [7, 10]', () => {
      const ranges = scoreInterpretationConfig.ranges;
      expect(ranges).toHaveLength(3);

      expect(ranges[0]).toEqual({ min: 0, max: 3, label: 'Low Priority', color: '#757575' });
      expect(ranges[1]).toEqual({ min: 3, max: 7, label: 'Moderate Priority', color: '#FF8F00' });
      expect(ranges[2]).toEqual({ min: 7, max: 10, label: 'High Priority', color: '#E53935' });
    });

    it('verifies standard rounding configuration is 2', () => {
      expect(scoreInterpretationConfig.standardRounding).toBe(2);
    });
  });

  describe('Formula Config Logistic Regression Evaluation', () => {
    const formulaStr = formulaConfig.formulas.annotationLevel[0].nephro_variant_score;

    function evaluateFormula(variables) {
      const keys = Object.keys(variables);
      const values = Object.values(variables);
      // eslint-disable-next-line no-new-func
      const fn = new Function(...keys, `return ${formulaStr}`);
      return fn(...values);
    }

    const defaultVariables = {
      gnomade_variant: 1.626e-05,
      gnomadg_variant: 5.256e-05,
      consequence_terms_variant: ['missense_variant'],
      cadd_phred_variant: 7.226,
      impact_variant: ['LOW'],
    };

    it('evaluates baseline defaults from variable_assignment_config', () => {
      const score = evaluateFormula(defaultVariables);
      expect(Number.isFinite(score)).toBe(true);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('heavily penalizes common variants with high gnomAD allele frequencies', () => {
      const commonVariant = {
        ...defaultVariables,
        gnomade_variant: 0.05, // 5% allele frequency
        gnomadg_variant: 0.05,
      };
      const score = evaluateFormula(commonVariant);
      // Large negative coefficient (-309.33) forces logit to huge negative -> score near 0
      expect(score).toBeLessThan(1e-4);
    });

    it('boosts pathogenic variants with zero gnomAD, high CADD, and frameshift consequence', () => {
      const severePathogenic = {
        gnomade_variant: 0.0,
        gnomadg_variant: 0.0,
        consequence_terms_variant: ['frameshift_variant'],
        cadd_phred_variant: 35.0,
        impact_variant: ['HIGH'],
      };
      const score = evaluateFormula(severePathogenic);
      expect(score).toBeGreaterThan(0.9);
    });

    it('handles scientific notation allele frequencies accurately', () => {
      const rareVariant = {
        ...defaultVariables,
        gnomade_variant: 1.626e-05,
        gnomadg_variant: 5.256e-05,
      };
      const score = evaluateFormula(rareVariant);
      expect(Number.isFinite(score)).toBe(true);
      expect(score).toBeGreaterThan(0);
    });

    it('evaluates impact tiers hierarchy: HIGH > MODERATE > LOW > MODIFIER', () => {
      const base = {
        gnomade_variant: 0.0,
        gnomadg_variant: 0.0,
        consequence_terms_variant: ['missense_variant'],
        cadd_phred_variant: 20.0,
      };

      const scoreHigh = evaluateFormula({ ...base, impact_variant: ['HIGH'] });
      const scoreMod = evaluateFormula({ ...base, impact_variant: ['MODERATE'] });
      const scoreLow = evaluateFormula({ ...base, impact_variant: ['LOW'] });
      const scoreModifier = evaluateFormula({ ...base, impact_variant: ['MODIFIER'] });

      expect(scoreHigh).toBeGreaterThan(scoreMod);
      expect(scoreMod).toBeGreaterThan(scoreLow);
      expect(scoreLow).toBeGreaterThan(scoreModifier);
    });

    it('evaluates consequence terms effect: frameshift > missense > synonymous', () => {
      const base = {
        gnomade_variant: 0.0,
        gnomadg_variant: 0.0,
        cadd_phred_variant: 20.0,
        impact_variant: ['MODERATE'],
      };

      const scoreFrameshift = evaluateFormula({
        ...base,
        impact_variant: ['HIGH'],
        consequence_terms_variant: ['frameshift_variant'],
      });
      const scoreMissense = evaluateFormula({
        ...base,
        consequence_terms_variant: ['missense_variant'],
      });
      const scoreSynonymous = evaluateFormula({
        ...base,
        impact_variant: ['LOW'],
        consequence_terms_variant: ['synonymous_variant'],
      });

      expect(scoreFrameshift).toBeGreaterThan(scoreMissense);
      expect(scoreMissense).toBeGreaterThan(scoreSynonymous);
    });
  });
});
