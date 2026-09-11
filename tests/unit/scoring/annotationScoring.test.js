import { describe, expect, it } from 'vitest';
import scoring from 'variant-linker/src/scoring.js';
import formulaConfig from '@/config/scoring/nephro_variant_score/formula_config.json';
import variableConfig from '@/config/scoring/nephro_variant_score/variable_assignment_config.json';

const config = scoring.parseScoringConfig(variableConfig, formulaConfig);
const evaluate = (consequence, impact) => {
  const formula =
    formulaConfig.formulas.annotationLevel[0].nephro_variant_score;
  const variables = {
    consequence_terms_variant: consequence,
    impact_variant: impact,
    gnomade_variant: 0,
    gnomadg_variant: 0,
    cadd_phred_variant: 20,
  };
  return new Function(...Object.keys(variables), `return ${formula}`)(
    ...Object.values(variables),
  );
};

describe('annotation scoring input shape', () => {
  it.each([
    {},
    { transcript_consequences: [] },
    { transcript_consequences: [{ impact: 'LOW' }] },
  ])('leaves absent consequence evidence unavailable: %s', (annotation) => {
    const [result] = scoring.applyScoring([annotation], config);
    expect(result.nephro_variant_score).toBe(null);
  });

  it('treats scalar consequence and impact identically to one-element arrays', () => {
    expect(evaluate('missense_variant', 'MODERATE')).toBe(
      evaluate(['missense_variant'], ['MODERATE']),
    );
  });

  it('uses the configured LOW impact default when transcript impact is missing', () => {
    const [missing, explicit] = scoring.applyScoring(
      [
        {
          transcript_consequences: [
            { consequence_terms: ['missense_variant'], cadd_phred: 20 },
          ],
        },
        {
          transcript_consequences: [
            {
              consequence_terms: ['missense_variant'],
              cadd_phred: 20,
              impact: 'LOW',
            },
          ],
        },
      ],
      config,
    );
    expect(missing.nephro_variant_score).toBe(explicit.nephro_variant_score);
    expect(missing.nephro_variant_score).toBeGreaterThan(0);
  });

  it('evaluates cleanly through variant-linker expression parser without unsafe construct errors', () => {
    const [scored] = scoring.applyScoring(
      [
        {
          transcript_consequences: [
            {
              consequence_terms: ['stop_gained'],
              cadd_phred: 35,
              impact: 'HIGH',
            },
          ],
        },
      ],
      config,
    );
    expect(scored.nephro_variant_score).toBeGreaterThan(0.5);
    expect(Number.isFinite(scored.nephro_variant_score)).toBe(true);
  });
});
