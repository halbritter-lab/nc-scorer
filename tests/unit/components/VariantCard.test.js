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
  const createMockVariantResult = (variantKey, score = 0.75, symbol = 'PKD1') => ({
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
      })
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
      })
    );
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
