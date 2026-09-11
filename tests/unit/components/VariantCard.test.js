// tests/unit/components/VariantCard.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import VariantCard from '@/components/VariantCard.vue';
import { queryVariant } from '@/api/variantApi.js';
import { mountWithPlugins } from '../../utils/testUtils.js';

// Mock queryVariant
vi.mock('@/api/variantApi.js', () => ({
  queryVariant: vi.fn(),
}));

describe('VariantCard Component (VariantCard.vue)', () => {
  const createMockVariantResult = (
    variantKey,
    score = 0.75,
    symbol = 'PKD1',
  ) => ({
    variantKey,
    assembly_name: 'GRCh38',
    seq_region_name: '16',
    start: 2138714,
    end: 2138714,
    annotationData: [
      {
        variantKey,
        most_severe_consequence: 'missense_variant',
        gene_symbol: symbol,
        hgnc_id: 'HGNC:9008',
        nephro_variant_score: score,
        colocated_variants: [
          {
            frequencies: {
              gnomad: {
                gnomade: 0.0001,
                gnomadg: 0.0002,
              },
            },
          },
        ],
        transcript_consequences: [
          {
            transcript_id: 'ENST00000262304',
            gene_symbol: symbol,
            consequence_terms: ['missense_variant'],
            impact: 'MODERATE',
            mane: 1,
            cadd_phred: 24.5,
          },
        ],
      },
    ],
  });

  const createMockRetryState = () => ({
    retryStates: {
      variant: {
        attempts: 0,
        inProgress: false,
        component: '',
        reset: vi.fn(),
      },
      variant2: {
        attempts: 0,
        inProgress: false,
        component: '',
        reset: vi.fn(),
      },
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['primary', { annotationData: [] }],
    ['secondary', { annotationData: [] }],
    ['primary', {}],
    ['secondary', {}],
  ])(
    'reports unavailable evidence for %s variant with empty annotations %j',
    async (variant, emptyData) => {
      const errors = [];
      queryVariant.mockResolvedValueOnce({
        data:
          variant === 'primary'
            ? emptyData
            : createMockVariantResult('16-2138714-C-T'),
      });
      if (variant === 'secondary')
        queryVariant.mockResolvedValueOnce({ data: emptyData });
      const wrapper = mountWithPlugins(VariantCard, {
        props: {
          variantInput: '16-2138714-C-T',
          ...(variant === 'secondary'
            ? { variantInput2: '16-2139000-A-G' }
            : {}),
        },
        global: {
          config: { errorHandler: (error) => errors.push(error) },
          provide: { retryState: createMockRetryState() },
        },
      });
      await flushPromises();
      expect(errors).toEqual([]);
      expect(
        wrapper.emitted('variant-score-updated').at(-1)[0].score,
      ).toBeNull();
      expect(
        wrapper.vm[
          variant === 'primary' ? 'frequencyExtracted' : 'frequencyExtracted2'
        ],
      ).toBeNull();
      expect(wrapper.text()).toContain('Variant score is missing or invalid');
      expect(wrapper.find('.loading-container').exists()).toBe(false);
      wrapper.unmount();
    },
  );

  it('keeps loaded variant sections and transcript controls on one surface', async () => {
    queryVariant.mockResolvedValueOnce({
      data: createMockVariantResult('16-2138714-C-T'),
    });
    const wrapper = mountWithPlugins(VariantCard, {
      props: { variantInput: '16-2138714-C-T' },
      global: { provide: { retryState: createMockRetryState() } },
    });
    await flushPromises();
    expect(wrapper.text()).toContain('Most Severe Consequence');
    expect(wrapper.text()).toContain('Select Transcript');
    expect(
      wrapper.find('button[aria-label="View in external databases"]').exists(),
    ).toBe(true);
    expect(wrapper.findAll('.v-card .v-card')).toHaveLength(0);
    wrapper.unmount();
  });

  it.each([undefined, null, NaN, '', ' ', false, -0.5, 1.5])(
    'keeps invalid or missing variant score %s unavailable',
    async (score) => {
      const data = createMockVariantResult('chr16-2138714-C-T');
      data.annotationData[0].nephro_variant_score = score;
      queryVariant.mockResolvedValueOnce({
        data,
        source: { fromCache: false },
      });
      const wrapper = mountWithPlugins(VariantCard, {
        props: { variantInput: 'chr16-2138714-C-T' },
        global: { provide: { retryState: createMockRetryState() } },
      });
      await flushPromises();
      expect(wrapper.emitted('variant-score-updated').at(-1)[0].score).toBe(
        null,
      );
      expect(wrapper.text()).toContain('Variant score is missing or invalid');
      expect(wrapper.text()).toContain('Try the assessment again');
      wrapper.unmount();
    },
  );

  it('rejects invalid compound operands even when their mean is within range', async () => {
    queryVariant
      .mockResolvedValueOnce({
        data: createMockVariantResult('chr16-2138714-C-T', -0.5),
      })
      .mockResolvedValueOnce({
        data: createMockVariantResult('chr16-2139000-A-G', 1.5),
      });
    const wrapper = mountWithPlugins(VariantCard, {
      props: {
        variantInput: 'chr16-2138714-C-T',
        variantInput2: 'chr16-2139000-A-G',
      },
      global: { provide: { retryState: createMockRetryState() } },
    });
    await flushPromises();
    expect(wrapper.vm.combinedVariantScore).toBe(null);
    expect(wrapper.emitted('variant-score-updated').at(-1)[0].score).toBe(null);
    expect(wrapper.text()).toContain('Variant score is missing or invalid');
    wrapper.unmount();
  });

  it('preserves measured zero scores for both compound variants', async () => {
    queryVariant
      .mockResolvedValueOnce({
        data: createMockVariantResult('chr16-2138714-C-T', 0),
      })
      .mockResolvedValueOnce({
        data: createMockVariantResult('chr16-2139000-A-G', 0),
      });
    const wrapper = mountWithPlugins(VariantCard, {
      props: {
        variantInput: 'chr16-2138714-C-T',
        variantInput2: 'chr16-2139000-A-G',
      },
      global: { provide: { retryState: createMockRetryState() } },
    });
    await flushPromises();
    expect(wrapper.emitted('variant-score-updated').at(-1)[0].score).toBe(0);
    expect(wrapper.text()).not.toContain('Variant score is missing or invalid');
    wrapper.unmount();
  });

  it('renders variant title and shows skeleton loader while loading', async () => {
    queryVariant.mockImplementation(() => new Promise(() => {}));

    const wrapper = mountWithPlugins(VariantCard, {
      props: { variantInput: 'chr16-2138714-C-T' },
      global: {
        provide: {
          retryState: createMockRetryState(),
        },
      },
    });

    expect(wrapper.text()).toContain('Variant Details for "chr16-2138714-C-T"');
    expect(wrapper.find('.loading-container').exists()).toBe(true);
  });

  it('successfully loads single variant and emits variant-score-updated', async () => {
    const mockData = createMockVariantResult('chr16-2138714-C-T', 0.82, 'PKD1');
    queryVariant.mockResolvedValueOnce({
      data: mockData,
      source: { fromCache: false },
    });

    const wrapper = mountWithPlugins(VariantCard, {
      props: { variantInput: 'chr16-2138714-C-T' },
      global: {
        provide: {
          retryState: createMockRetryState(),
        },
      },
    });

    await flushPromises();

    expect(wrapper.find('.loading-container').exists()).toBe(false);

    const emitted = wrapper.emitted('variant-score-updated');
    expect(emitted).toBeTruthy();
    expect(emitted[0][0]).toEqual(
      expect.objectContaining({
        score: 0.82,
        variant: 'chr16-2138714-C-T',
        prioritizedGeneSymbol: 'PKD1',
      }),
    );
  });

  it('handles compound heterozygous mode with two variants and tabs', async () => {
    const mockData1 = createMockVariantResult('chr16-2138714-C-T', 0.8, 'PKD1');
    const mockData2 = createMockVariantResult('chr16-2139000-A-G', 0.6, 'PKD1');

    queryVariant
      .mockResolvedValueOnce({ data: mockData1, source: { fromCache: false } })
      .mockResolvedValueOnce({ data: mockData2, source: { fromCache: false } });

    const wrapper = mountWithPlugins(VariantCard, {
      props: {
        variantInput: 'chr16-2138714-C-T',
        variantInput2: 'chr16-2139000-A-G',
      },
      global: {
        provide: {
          retryState: createMockRetryState(),
        },
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('Compound Heterozygous Variants');
    expect(wrapper.text()).toContain('Variant 1: chr16-2138714-C-T');
    expect(wrapper.text()).toContain('Variant 2: chr16-2139000-A-G');

    const emitted = wrapper.emitted('variant-score-updated');
    expect(emitted).toBeTruthy();
    expect(emitted[0][0]).toEqual(
      expect.objectContaining({
        isCompoundHet: true,
        score: 0.7, // (0.8 + 0.6) / 2 = 0.7
        score1: 0.8,
        score2: 0.6,
        variant1: 'chr16-2138714-C-T',
        variant2: 'chr16-2139000-A-G',
      }),
    );
  });

  it('updates second-variant evidence when its tab and transcript selection change', async () => {
    const first = createMockVariantResult('chr16-2138714-C-T', 0.8);
    const second = createMockVariantResult('chr16-2139000-A-G', 0.6);
    second.annotationData[0].most_severe_consequence = 'stop_gained';
    second.annotationData[0].gene_symbol = ['PKD1', 'PKD2'];
    second.annotationData[0].hgnc_id = ['HGNC:9008', 'HGNC:9009'];
    second.annotationData[0].transcript_consequences.push({
      transcript_id: 'ENST_SECOND',
      gene_symbol: 'PKD2',
      impact: 'HIGH',
      consequence_terms: ['stop_gained'],
      cadd_phred: 35,
    });
    queryVariant
      .mockResolvedValueOnce({ data: first })
      .mockResolvedValueOnce({ data: second });
    const wrapper = mountWithPlugins(VariantCard, {
      props: {
        variantInput: 'chr16-2138714-C-T',
        variantInput2: 'chr16-2139000-A-G',
      },
      global: { provide: { retryState: createMockRetryState() } },
    });
    await flushPromises();
    await wrapper.findAll('[role="tab"]')[1].trigger('click');
    expect(wrapper.text()).toContain('stop_gained');
    expect(wrapper.text()).toContain('PKD1, PKD2');
    wrapper
      .findComponent({ name: 'VSelect' })
      .vm.$emit('update:modelValue', 'ENST_SECOND');
    await wrapper.vm.$nextTick();
    expect(
      wrapper.emitted('variant-score-updated').at(-1)[0].secondVariantData
        .selectedTranscript.transcript_id,
    ).toBe('ENST_SECOND');
    wrapper.unmount();
  });

  it.each(['array', 'raw'])(
    'loads supported %s annotation responses with genomic-coordinate fallback',
    async (envelope) => {
      const annotation =
        createMockVariantResult('chr16-2138714-C-T').annotationData[0];
      delete annotation.variantKey;
      Object.assign(annotation, {
        seq_region_name: '16',
        start: 2138714,
        end: 2138714,
      });
      queryVariant.mockResolvedValueOnce({
        data:
          envelope === 'array'
            ? [{ annotationData: [annotation] }]
            : annotation,
      });
      const wrapper = mountWithPlugins(VariantCard, {
        props: { variantInput: 'chr16-2138714-C-T' },
        global: { provide: { retryState: createMockRetryState() } },
      });
      await flushPromises();
      expect(wrapper.text()).toContain('chr16-2138714 (GRCh38)');
      expect(wrapper.emitted('variant-score-updated').at(-1)[0].score).toBe(
        0.75,
      );
      wrapper.unmount();
    },
  );

  it('shows the exhausted-retry error and reports terminal unavailability', async () => {
    const retryState = createMockRetryState();
    retryState.retryStates.variant.attempts = 4;
    queryVariant.mockRejectedValueOnce(new Error('Unavailable'));
    const wrapper = mountWithPlugins(VariantCard, {
      props: { variantInput: 'chr16-2138714-C-T' },
      global: { provide: { retryState } },
    });
    await flushPromises();
    expect(wrapper.text()).toContain(
      'Failed to load variant data after multiple attempts',
    );
    expect(wrapper.emitted('variant-score-updated').at(-1)[0].score).toBe(null);
    wrapper.unmount();
  });

  it('displays error alert when queryVariant fails', async () => {
    queryVariant.mockRejectedValueOnce(new Error('VEP service timeout'));

    const wrapper = mountWithPlugins(VariantCard, {
      props: { variantInput: 'chr16-2138714-C-T' },
      global: {
        provide: {
          retryState: createMockRetryState(),
        },
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('VEP service timeout');
    expect(wrapper.emitted('variant-score-updated').at(-1)[0]).toEqual(
      expect.objectContaining({ score: null, error: 'VEP service timeout' }),
    );
  });

  it('displays cache indicator when data is retrieved from cache', async () => {
    const mockData = createMockVariantResult('chr16-2138714-C-T', 0.75, 'PKD1');
    queryVariant.mockResolvedValueOnce({
      data: mockData,
      source: { fromCache: true },
    });

    const wrapper = mountWithPlugins(VariantCard, {
      props: { variantInput: 'chr16-2138714-C-T' },
      global: {
        provide: {
          retryState: createMockRetryState(),
        },
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('Cached');
  });
});
