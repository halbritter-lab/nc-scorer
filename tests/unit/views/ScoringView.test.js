// tests/unit/views/ScoringView.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ScoringView from '@/views/ScoringView.vue';
import { mountWithPlugins } from '../../utils/testUtils.js';
import * as exportUtils from '@/utils/exportUtils.js';

// Mock vue-router
const mockPush = vi.fn();
const mockRoute = {
  params: {
    variantInput: 'chr16-2138714-C-T',
    inheritance: 'Inherited dominant',
    segregation: '0.05',
    variantInput2: '',
    assembly: 'GRCh38',
  },
};

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Spy on export functions
vi.spyOn(exportUtils, 'generateCSV');
vi.spyOn(exportUtils, 'downloadFile').mockImplementation(() => {});
vi.spyOn(exportUtils, 'generateExcel').mockResolvedValue(undefined);

describe('ScoringView View (ScoringView.vue)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders skeleton loader before child scores are emitted', () => {
    const wrapper = mountWithPlugins(ScoringView, {
      global: {
        stubs: {
          VariantCard: true,
          GeneCard: true,
          InheritanceCard: true,
          CombinedScoreCard: true,
          CollaborationLinks: true,
        },
      },
    });

    // Score is not yet available
    expect(wrapper.find('.combined-score-card').exists()).toBe(true);
    expect(wrapper.text()).toContain('Nephro Candidate Score (NCS)');
  });

  it('computes combined score and displays action buttons once all sub-scores are received', async () => {
    const wrapper = mountWithPlugins(ScoringView, {
      global: {
        stubs: {
          VariantCard: {
            name: 'VariantCard',
            template: '<div class="variant-stub"></div>',
            emits: ['variant-score-updated'],
          },
          GeneCard: {
            name: 'GeneCard',
            template: '<div class="gene-stub"></div>',
            emits: ['gene-score-updated'],
          },
          InheritanceCard: {
            name: 'InheritanceCard',
            template: '<div class="inheritance-stub"></div>',
            emits: ['inheritance-score-updated'],
          },
          CombinedScoreCard: {
            name: 'CombinedScoreCard',
            template: '<div class="combined-score-stub">Combined Score Displayed</div>',
            props: ['geneScore', 'variantScore', 'inheritanceScore', 'inheritancePattern'],
          },
          CollaborationLinks: true,
        },
      },
    });

    // 1. Emit variant score
    const variantComp = wrapper.findComponent({ name: 'VariantCard' });
    variantComp.vm.$emit('variant-score-updated', {
      score: 0.8,
      prioritizedGeneSymbol: 'PKD1',
      frequencyExtracted: { gnomade: 0.0001, gnomadg: 0.0002 },
      geneSummary: { most_severe_consequence: 'missense_variant', hgnc_id: 'HGNC:9008' },
    });
    await wrapper.vm.$nextTick();

    // 2. Emit gene score
    const geneComp = wrapper.findComponent({ name: 'GeneCard' });
    geneComp.vm.$emit('gene-score-updated', {
      score: 0.9,
      symbol: 'PKD1',
      formattedData: {
        evidenceCount: { value: 10 },
        geneSet: { value: 'Kidney Genetics' },
      },
    });
    await wrapper.vm.$nextTick();

    // 3. Emit inheritance score
    const inheritanceComp = wrapper.findComponent({ name: 'InheritanceCard' });
    inheritanceComp.vm.$emit('inheritance-score-updated', {
      score: 0.85,
      pattern: 'Inherited dominant',
    });
    await wrapper.vm.$nextTick();

    // Verify CombinedScoreCard is rendered with combined data
    expect(wrapper.find('.combined-score-stub').exists()).toBe(true);
    expect(wrapper.text()).toContain('Combined Score Displayed');
    expect(wrapper.text()).toContain('Download Results');
    expect(wrapper.text()).toContain('Edit Search');
  });

  it('triggers CSV export on downloadResults("csv")', async () => {
    const wrapper = mountWithPlugins(ScoringView, {
      global: {
        stubs: {
          VariantCard: {
            name: 'VariantCard',
            template: '<div></div>',
            emits: ['variant-score-updated'],
          },
          GeneCard: {
            name: 'GeneCard',
            template: '<div></div>',
            emits: ['gene-score-updated'],
          },
          InheritanceCard: {
            name: 'InheritanceCard',
            template: '<div></div>',
            emits: ['inheritance-score-updated'],
          },
          CombinedScoreCard: true,
          CollaborationLinks: true,
        },
      },
    });

    // Populate variant score first so geneSymbol becomes available and GeneCard renders
    wrapper.findComponent({ name: 'VariantCard' }).vm.$emit('variant-score-updated', {
      score: 0.75,
      prioritizedGeneSymbol: 'PKD1',
      frequencyExtracted: { gnomade: 0.0, gnomadg: 0.0001 },
      geneSummary: { most_severe_consequence: 'missense_variant', hgnc_id: 'HGNC:9008' },
    });
    await wrapper.vm.$nextTick();

    // Now GeneCard is rendered
    wrapper.findComponent({ name: 'GeneCard' }).vm.$emit('gene-score-updated', {
      score: 0.85,
      symbol: 'PKD1',
    });
    await wrapper.vm.$nextTick();

    wrapper.findComponent({ name: 'InheritanceCard' }).vm.$emit('inheritance-score-updated', {
      score: 0.6,
      pattern: 'Inherited dominant',
    });
    await wrapper.vm.$nextTick();

    // Call downloadResults CSV
    wrapper.vm.downloadResults('csv');

    expect(exportUtils.generateCSV).toHaveBeenCalledTimes(1);
    expect(exportUtils.downloadFile).toHaveBeenCalledTimes(1);
  });

  it('triggers Excel export on downloadResults("excel")', async () => {
    const wrapper = mountWithPlugins(ScoringView, {
      global: {
        stubs: {
          VariantCard: {
            name: 'VariantCard',
            template: '<div></div>',
            emits: ['variant-score-updated'],
          },
          GeneCard: {
            name: 'GeneCard',
            template: '<div></div>',
            emits: ['gene-score-updated'],
          },
          InheritanceCard: {
            name: 'InheritanceCard',
            template: '<div></div>',
            emits: ['inheritance-score-updated'],
          },
          CombinedScoreCard: true,
          CollaborationLinks: true,
        },
      },
    });

    // Populate variant score first
    wrapper.findComponent({ name: 'VariantCard' }).vm.$emit('variant-score-updated', {
      score: 0.75,
      prioritizedGeneSymbol: 'PKD1',
      frequencyExtracted: { gnomade: 0.0, gnomadg: 0.0001 },
      geneSummary: { most_severe_consequence: 'missense_variant' },
    });
    await wrapper.vm.$nextTick();

    wrapper.findComponent({ name: 'GeneCard' }).vm.$emit('gene-score-updated', {
      score: 0.85,
      symbol: 'PKD1',
    });
    await wrapper.vm.$nextTick();

    wrapper.findComponent({ name: 'InheritanceCard' }).vm.$emit('inheritance-score-updated', {
      score: 0.6,
    });
    await wrapper.vm.$nextTick();

    // Call downloadResults Excel
    wrapper.vm.downloadResults('excel');

    expect(exportUtils.generateExcel).toHaveBeenCalledTimes(1);
  });

  it('navigates to search view with query parameters on navigateToEditSearch', async () => {
    const wrapper = mountWithPlugins(ScoringView, {
      global: {
        stubs: {
          VariantCard: true,
          GeneCard: true,
          InheritanceCard: true,
          CombinedScoreCard: true,
          CollaborationLinks: true,
        },
      },
    });

    wrapper.vm.navigateToEditSearch();

    expect(mockPush).toHaveBeenCalledWith({
      name: 'SearchPage',
      query: {
        variant: 'chr16-2138714-C-T',
        variant2: '',
        inheritance: 'Inherited dominant',
        segregation: '0.05',
        assembly: 'GRCh38',
      },
    });
  });
});
