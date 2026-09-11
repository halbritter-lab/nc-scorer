// tests/unit/views/ScoringView.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ScoringView from '@/views/ScoringView.vue';
import { mountWithPlugins } from '../../utils/testUtils.js';
import * as exportUtils from '@/utils/exportUtils.js';
import { reactive } from 'vue';

// Mock vue-router
const mockPush = vi.fn();
const mockRoute = reactive({
  params: {
    variantInput: 'chr16-2138714-C-T',
    inheritance: 'Inherited dominant',
    segregation: '0.05',
    variantInput2: '',
    assembly: 'GRCh38',
  },
});

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
    mockRoute.query = {};
    Object.assign(mockRoute.params, {
      variantInput: 'chr16-2138714-C-T',
      inheritance: 'Inherited dominant',
      segregation: '0.05',
      variantInput2: '',
      assembly: 'GRCh38',
    });
  });

  function mountScoring() {
    return mountWithPlugins(ScoringView, {
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
  }

  it('groups assessment actions accessibly and avoids wrapping the gene card in a second surface', async () => {
    const wrapper = mountScoring();
    wrapper.vm.handleVariantScoreUpdate({
      score: 0.8,
      prioritizedGeneSymbol: 'PKD1',
    });
    await wrapper.vm.$nextTick();
    expect(
      wrapper.find('[role="group"][aria-label="Assessment actions"]').text(),
    ).toContain('Edit Search');
    expect(wrapper.find('gene-card-stub').element.closest('.v-card')).toBe(
      null,
    );
    wrapper.unmount();
  });

  it('reads optional scoring settings from query parameters without positional ambiguity', () => {
    mockRoute.query = {
      inheritance: 'Homozygous recessive',
      segregation: '',
      variantInput2: '',
      assembly: 'GRCh37',
    };
    const wrapper = mountScoring();
    expect(wrapper.vm.assembly).toBe('GRCh37');
    expect(wrapper.vm.inheritance).toBe('Homozygous recessive');
    expect(wrapper.vm.segregation).toBe(null);
    wrapper.unmount();
  });

  it('normalizes repeated query parameters before reading assembly-specific caches', () => {
    mockRoute.query = {
      assembly: ['GRCh37', 'GRCh38'],
      inheritance: ['Inherited dominant', 'Unknown'],
    };
    const wrapper = mountScoring();
    expect(wrapper.vm.assembly).toBe('GRCh37');
    expect(wrapper.vm.inheritance).toBe('Inherited dominant');
    wrapper.unmount();
  });

  it('canonicalizes lowercase assembly query values for annotation and display', () => {
    mockRoute.query = { assembly: ' grch37 ' };
    const wrapper = mountScoring();
    expect(wrapper.vm.assembly).toBe('GRCh37');
    expect(
      wrapper.findComponent({ name: 'VariantCard' }).props('assembly'),
    ).toBe('GRCh37');
    wrapper.unmount();
  });

  it('shows unsupported assembly as unavailable without starting annotation', () => {
    mockRoute.query = { assembly: 'GRCh36' };
    const wrapper = mountScoring();
    expect(wrapper.text()).toContain('Unsupported genome assembly');
    expect(wrapper.vm.combinedScoreAvailable).toBe(false);
    expect(wrapper.findComponent({ name: 'VariantCard' }).exists()).toBe(false);
    wrapper.unmount();
  });

  it.each([
    [
      { score: null, error: 'Annotation request failed' },
      'Annotation request failed',
    ],
    [
      { score: null, prioritizedGeneSymbol: '' },
      'Variant score is unavailable',
    ],
    [
      { score: 0.4, prioritizedGeneSymbol: '', geneSummary: {} },
      'No gene could be resolved',
    ],
  ])(
    'shows a terminal unavailable state for completed unusable evidence: %s',
    async (data, message) => {
      const wrapper = mountScoring();
      wrapper.vm.handleVariantScoreUpdate(data);
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.combinedScoreAvailable).toBe(false);
      expect(wrapper.text()).toContain(message);
      expect(wrapper.findComponent({ name: 'VSkeletonLoader' }).exists()).toBe(
        false,
      );
      wrapper.unmount();
    },
  );

  it('requires a second variant before completing a compound assessment from a direct URL', () => {
    mockRoute.query = {
      inheritance: 'Compound heterozygous (confirmed)',
      variant2: '',
    };
    const wrapper = mountScoring();
    wrapper.vm.handleVariantScoreUpdate({
      score: 0.5,
      prioritizedGeneSymbol: 'PKD1',
    });
    wrapper.vm.handleGeneScoreUpdate({ score: 0.5, symbol: 'PKD1' });
    wrapper.vm.handleInheritanceScoreUpdate({ score: 0.8 });
    expect(wrapper.vm.combinedScoreAvailable).toBe(false);
    expect(wrapper.text()).toContain('second variant');
    wrapper.unmount();
  });

  it('preserves zero frequency and CADD values in compound variant exports', () => {
    mockRoute.query = {
      inheritance: 'Compound heterozygous (confirmed)',
      variantInput2: 'chr16-2138715-C-T',
    };
    const wrapper = mountScoring();
    wrapper.vm.handleVariantScoreUpdate({
      score: 0.5,
      prioritizedGeneSymbol: 'PKD1',
      selectedTranscript: { transcript_id: 'T1', cadd_phred: 0 },
      secondVariantData: {
        selectedTranscript: { transcript_id: 'T2', cadd_phred: 0 },
        frequencyExtracted: { gnomade: 0, gnomadg: 0 },
      },
    });
    wrapper.vm.handleGeneScoreUpdate({ score: 0.5, symbol: 'PKD1' });
    wrapper.vm.handleInheritanceScoreUpdate({ score: 0.8 });
    wrapper.vm.downloadResults();
    const [headers, data] = exportUtils.generateCSV.mock.calls[0];
    for (const field of [
      'CADD_Phred',
      'V2_CADD_Phred',
      'V2_gnomADe_Frequency',
      'V2_gnomADg_Frequency',
    ]) {
      expect(data[headers.indexOf(field)]).toBe(0);
    }
    wrapper.unmount();
  });

  it('allows complete zero-valued scores to display and export', async () => {
    const wrapper = mountScoring();
    wrapper.vm.handleVariantScoreUpdate({
      score: 0,
      prioritizedGeneSymbol: 'PKD1',
    });
    wrapper.vm.handleGeneScoreUpdate({ score: 0, symbol: 'PKD1' });
    wrapper.vm.handleInheritanceScoreUpdate({ score: 0, pattern: 'Unknown' });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.combinedScoreAvailable).toBe(true);
    wrapper.vm.downloadResults();
    expect(exportUtils.generateCSV.mock.calls[0][1][4]).toBe('0.00');
    wrapper.unmount();
  });

  it.each([Infinity, -1, 2, ' ', [], {}])(
    'does not display an invalid gene score %s as a completed assessment',
    async (score) => {
      const wrapper = mountScoring();
      wrapper.vm.handleVariantScoreUpdate({
        score: 0.5,
        prioritizedGeneSymbol: 'PKD1',
      });
      wrapper.vm.handleGeneScoreUpdate({ score, symbol: 'PKD1' });
      wrapper.vm.handleInheritanceScoreUpdate({ score: 0.4 });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.combinedScoreAvailable).toBe(false);
      wrapper.unmount();
    },
  );

  it('resets prior scores and updates inputs when the reused route changes', async () => {
    const wrapper = mountScoring();
    wrapper.vm.handleVariantScoreUpdate({
      score: 0.5,
      prioritizedGeneSymbol: 'PKD1',
    });
    wrapper.vm.handleGeneScoreUpdate({ score: 0.5, symbol: 'PKD1' });
    wrapper.vm.handleInheritanceScoreUpdate({ score: 0.4 });
    mockRoute.params.variantInput = 'chr16-2138715-C-T';
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.variantInput).toBe('chr16-2138715-C-T');
    expect(wrapper.vm.combinedScoreAvailable).toBe(false);
    wrapper.unmount();
  });

  it('invalidates the previous gene score when the prioritized gene changes', async () => {
    const wrapper = mountScoring();
    wrapper.vm.handleVariantScoreUpdate({
      score: 0.5,
      prioritizedGeneSymbol: 'PKD1',
    });
    wrapper.vm.handleGeneScoreUpdate({ score: 0.9, symbol: 'PKD1' });
    wrapper.vm.handleInheritanceScoreUpdate({ score: 0.4 });
    await wrapper.vm.$nextTick();
    wrapper.vm.handleVariantScoreUpdate({
      score: 0.7,
      prioritizedGeneSymbol: 'PKD2',
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.combinedScoreAvailable).toBe(false);
    wrapper.vm.handleGeneScoreUpdate({ score: 0.9, symbol: 'PKD1' });
    expect(wrapper.vm.combinedScoreAvailable).toBe(false);
    wrapper.unmount();
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
            template:
              '<div class="combined-score-stub">Combined Score Displayed</div>',
            props: [
              'geneScore',
              'variantScore',
              'inheritanceScore',
              'inheritancePattern',
            ],
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
      geneSummary: {
        most_severe_consequence: 'missense_variant',
        hgnc_id: 'HGNC:9008',
      },
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
    wrapper
      .findComponent({ name: 'VariantCard' })
      .vm.$emit('variant-score-updated', {
        score: 0.75,
        prioritizedGeneSymbol: 'PKD1',
        frequencyExtracted: { gnomade: 0.0, gnomadg: 0.0001 },
        geneSummary: {
          most_severe_consequence: 'missense_variant',
          hgnc_id: 'HGNC:9008',
        },
      });
    await wrapper.vm.$nextTick();

    // Now GeneCard is rendered
    wrapper.findComponent({ name: 'GeneCard' }).vm.$emit('gene-score-updated', {
      score: 0.85,
      symbol: 'PKD1',
    });
    await wrapper.vm.$nextTick();

    wrapper
      .findComponent({ name: 'InheritanceCard' })
      .vm.$emit('inheritance-score-updated', {
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
    wrapper
      .findComponent({ name: 'VariantCard' })
      .vm.$emit('variant-score-updated', {
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

    wrapper
      .findComponent({ name: 'InheritanceCard' })
      .vm.$emit('inheritance-score-updated', {
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
