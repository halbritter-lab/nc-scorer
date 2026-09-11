import { describe, expect, it } from 'vitest';
import {
  calculateNCS,
  calculateInheritanceScore,
  safeParseScore,
} from '@/utils/scoringUtils.js';

describe('scoring input boundaries', () => {
  it.each([-0.1, 1.1, Infinity, NaN])(
    'rejects invalid NCS sub-score %s',
    (invalid) => {
      expect(calculateNCS(invalid, 1, 1)).toBe(0);
      expect(calculateNCS(1, invalid, 1)).toBe(0);
      expect(calculateNCS(1, 1, invalid)).toBe(0);
    },
  );

  it.each(['Infinity', Infinity, -Infinity])(
    'does not parse non-finite scores: %s',
    (input) => {
      expect(safeParseScore(input, 0.2)).toBe(0.2);
    },
  );

  it('treats whitespace segregation as missing instead of maximal evidence', () => {
    expect(calculateInheritanceScore('Inherited dominant', '  ')).toBeCloseTo(
      0.32,
    );
  });

  it('treats prototype property names as unknown inheritance patterns', () => {
    expect(calculateInheritanceScore('constructor', 1)).toBe(0.1);
  });
});
