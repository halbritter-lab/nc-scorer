import { expect, it } from 'vitest';
import { mountWithPlugins } from '../../utils/testUtils.js';
import CombinedScoreCard from '@/components/CombinedScoreCard.vue';
import InheritanceCard from '@/components/InheritanceCard.vue';

it('shows inheritance evidence and missing-data explanation on one surface', () => {
  const wrapper = mountWithPlugins(InheritanceCard, {
    props: { inheritance: 'Inherited dominant', segregation: null },
  });
  expect(wrapper.text()).toContain('Inheritance Pattern');
  expect(wrapper.text()).toContain('Score penalized');
  expect(wrapper.findAll('.v-card .v-card')).toHaveLength(0);
  wrapper.unmount();
});

it('makes weighted contributions visible without hover or another card', () => {
  const wrapper = mountWithPlugins(CombinedScoreCard, {
    props: { geneScore: 0.5, variantScore: 0.75, inheritanceScore: 1 },
  });
  expect(
    wrapper.find('dl[aria-label="Weighted score contributions"]').text(),
  ).toContain('Gene');
  expect(wrapper.text()).toContain('× 4');
  expect(wrapper.text()).toContain('× 2');
  expect(wrapper.findAll('.v-card .v-card')).toHaveLength(0);
  wrapper.unmount();
});

it('describes prioritization contributions without inferring pathogenicity from the score', () => {
  const wrapper = mountWithPlugins(CombinedScoreCard, {
    props: { geneScore: 0.9, variantScore: 0.8, inheritanceScore: 0.8 },
  });
  expect(wrapper.text()).not.toContain('high pathogenicity');
  expect(wrapper.text()).not.toContain('strong relevance');
  expect(wrapper.text()).toContain('contribution');
  wrapper.unmount();
});

it.each([Infinity, -1, 2])(
  'guards invalid combined card inputs: %s',
  (geneScore) => {
    const wrapper = mountWithPlugins(CombinedScoreCard, {
      props: { geneScore, variantScore: 1, inheritanceScore: 1 },
    });
    expect(wrapper.vm.combinedScore).toBe(0);
    wrapper.unmount();
  },
);

it('displays zero segregation as evidence instead of missing data', () => {
  const wrapper = mountWithPlugins(InheritanceCard, {
    props: { inheritance: 'Inherited dominant', segregation: 0 },
  });
  expect(wrapper.text()).not.toContain('Not provided');
  expect(wrapper.vm.finalScore).toBe(1);
  wrapper.unmount();
});

it('shows invalid segregation input without crashing or emitting a usable score', () => {
  const wrapper = mountWithPlugins(InheritanceCard, {
    props: { inheritance: 'Inherited dominant', segregation: 'invalid' },
  });
  expect(wrapper.text()).toContain(
    'Segregation probability must be a number between 0 and 1.',
  );
  expect(wrapper.emitted('inheritance-score-updated')[0][0].score).toBe(null);
  wrapper.unmount();
});

it.each([
  [
    { geneScore: 0.9, variantScore: 0.8, inheritanceScore: 0.8 },
    'High Priority',
    'variant score contribution',
  ],
  [
    { geneScore: 0.5, variantScore: 0.2, inheritanceScore: 0.4 },
    'Moderate Priority',
    'gene score contribution',
  ],
  [
    { geneScore: 0, variantScore: 0, inheritanceScore: 0 },
    'Low Priority',
    'limited by',
  ],
])(
  'explains score priority and contributing evidence: %s',
  (props, tier, evidence) => {
    const wrapper = mountWithPlugins(CombinedScoreCard, { props });
    expect(wrapper.text()).toContain(tier);
    expect(wrapper.text()).toContain(evidence);
    wrapper.unmount();
  },
);

it.each([
  ['Inherited dominant', null, 0.32, true],
  ['Unknown', null, 0.1, false],
  ['Unrecognized', 1, 0.1, false],
])(
  'explains missing segregation for %s',
  (inheritance, segregation, score, penalized) => {
    const wrapper = mountWithPlugins(InheritanceCard, {
      props: { inheritance, segregation },
    });
    expect(wrapper.vm.finalScore).toBeCloseTo(score);
    expect(wrapper.text().includes('Score penalized')).toBe(penalized);
    wrapper.unmount();
  },
);
