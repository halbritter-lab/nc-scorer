import { beforeEach, describe, expect, it, vi } from 'vitest';
import BatchView from '@/views/BatchView.vue';
import { queryVariant } from '@/api/variantApi.js';
import { fetchGeneDetails } from '@/api/geneApi.js';
import { downloadFile } from '@/utils/exportUtils.js';
import { mountWithPlugins } from '../../utils/testUtils.js';
import { exampleLists } from '@/config/batchViewConfig.js';
import { flushPromises } from '@vue/test-utils';

vi.mock('@/api/variantApi.js', () => ({ queryVariant: vi.fn() }));
vi.mock('@/api/geneApi.js', () => ({ fetchGeneDetails: vi.fn() }));
vi.mock('@/utils/exportUtils.js', async (importOriginal) => ({
  ...(await importOriginal()),
  downloadFile: vi.fn(),
}));

const annotation = (score = 0.5) => ({
  data: {
    annotationData: [
      {
        nephro_variant_score: score,
        transcript_consequences: [{ gene_symbol: 'PKD1', impact: 'MODERATE' }],
      },
    ],
  },
});
const mountBatch = () =>
  mountWithPlugins(BatchView, { global: { stubs: { RouterLink: true } } });

describe('batch scoring integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryVariant.mockResolvedValue(annotation());
    fetchGeneDetails.mockResolvedValue({ data: { ngs: 0.5 } });
  });

  it('submits variants in batch and cancels via AbortSignal without accepting late results', async () => {
    let finish;
    queryVariant.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const wrapper = mountBatch();
    wrapper.vm.variantsInput = '16-2090952-G-A\n12-88101183-A-G';
    const pending = wrapper.vm.processVariants();
    await flushPromises();
    expect(wrapper.text()).toContain('Annotating batch of 2 variants');
    expect(queryVariant).toHaveBeenCalledWith(
      ['16-2090952-G-A', '12-88101183-A-G'],
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    const cancel = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Cancel processing');
    expect(cancel).toBeDefined();
    await cancel.trigger('click');
    expect(wrapper.vm.isLoading).toBe(false);
    expect(queryVariant.mock.calls[0][1].signal.aborted).toBe(true);
    expect(wrapper.text()).toContain('Processing cancelled');
    finish(annotation());
    await pending;
    expect(wrapper.vm.batchResults).toHaveLength(2);
    expect(wrapper.vm.batchResults.every((row) => row.ncs === 'N/A')).toBe(
      true,
    );
    wrapper.unmount();
  });

  it('processes the nephrology preset using verified variants and its matching assembly', async () => {
    const verified = new Set([
      'NM_001009944.3:c.11935C>T',
      '16-2090952-G-A',
      'NM_033380.3:c.1871G>A',
      '12-88101183-A-G',
    ]);
    queryVariant.mockImplementation(async (input) => {
      const items = Array.isArray(input) ? input : [input];
      for (const item of items) {
        if (!verified.has(item)) {
          throw new Error('Unresolved transcript or reference allele mismatch');
        }
      }
      return {
        data: {
          annotationData: items.map((variantKey) => ({
            ...annotation().data.annotationData[0],
            variantKey,
            input: variantKey,
          })),
        },
      };
    });
    const wrapper = mountBatch();
    wrapper.vm.assembly = 'GRCh37';
    wrapper.vm.prefillTextArea(
      exampleLists.find((example) => example.name === 'Nephrology Genes')
        .variants,
    );
    await wrapper.vm.processVariants();
    expect(wrapper.vm.batchResults.length).toBeGreaterThanOrEqual(3);
    expect(
      wrapper.vm.batchResults.every(
        (row) => row.error === '' && row.ncs !== 'N/A',
      ),
    ).toBe(true);
    expect(
      queryVariant.mock.calls.every(
        ([, options]) => options.assembly === 'GRCh38',
      ),
    ).toBe(true);
    wrapper.unmount();
  });

  it('rejects gene symbols locally with visible actionable row errors', async () => {
    const wrapper = mountBatch();
    wrapper.vm.variantsInput = 'PKD1\nCOL4A5';
    await wrapper.vm.processVariants();
    await wrapper.vm.$nextTick();
    expect(queryVariant).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Gene symbols alone cannot be scored');
    expect(wrapper.vm.batchResults.every((row) => row.ncs === 'N/A')).toBe(
      true,
    );
    wrapper.unmount();
  });

  it('normalizes supported coordinate formats before querying the API', async () => {
    const wrapper = mountBatch();
    wrapper.vm.variantsInput = 'chr16:2090952:G:A';
    await wrapper.vm.processVariants();
    expect(queryVariant).toHaveBeenCalledWith(
      '16-2090952-G-A',
      expect.any(Object),
    );
    wrapper.unmount();
  });

  it('shows service error details inline and includes them in CSV exports', async () => {
    queryVariant.mockRejectedValueOnce(
      Object.assign(new Error('Request failed with status code 400'), {
        response: {
          data: { error: 'Reference allele does not match the transcript' },
          status: 400,
        },
      }),
    );
    const wrapper = mountBatch();
    wrapper.vm.variantsInput = 'NM_014251.3:c.1339C>T';
    await wrapper.vm.processVariants();
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain(
      'Reference allele does not match the transcript',
    );
    wrapper.vm.downloadResults('CSV');
    expect(downloadFile.mock.calls[0][0]).toContain(
      'Reference allele does not match the transcript',
    );
    expect(wrapper.find('header.page-header h1.page-title').exists()).toBe(
      true,
    );
    expect(wrapper.findAll('.v-card .v-card')).toHaveLength(0);
    wrapper.unmount();
  });

  it('accepts numeric API scores while applying the missing segregation penalty', async () => {
    queryVariant.mockResolvedValue(annotation('0.5'));
    fetchGeneDetails.mockResolvedValue({ data: { ngs: '0.5' } });
    const wrapper = mountBatch();
    wrapper.vm.variantsInput = 'chr16-2138714-C-T\tInherited dominant';
    await wrapper.vm.processVariants();
    expect(wrapper.vm.batchResults[0].ncs).toBe('4.640');
    wrapper.unmount();
  });

  it('shows a useful row error when no gene can be resolved', async () => {
    queryVariant.mockResolvedValue({
      data: {
        annotationData: [
          { nephro_variant_score: 0.5, transcript_consequences: [] },
        ],
      },
    });
    const wrapper = mountBatch();
    wrapper.vm.variantsInput = 'chr16-2138714-C-T';
    await wrapper.vm.processVariants();
    expect(wrapper.vm.batchResults[0].ncs).toBe('N/A');
    expect(wrapper.vm.batchResults[0].error).toContain('gene');
    wrapper.unmount();
  });

  it('prevents processing more than 200 variants and explains the limit', async () => {
    const wrapper = mountBatch();
    wrapper.vm.variantsInput = Array.from(
      { length: 201 },
      () => 'chr16-2138714-C-T',
    ).join('\n');
    expect(wrapper.vm.hasValidInput).toBe(false);
    await wrapper.vm.processVariants();
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Maximum 200 variants allowed');
    expect(wrapper.vm.isLoading).toBe(false);
    wrapper.unmount();
  });

  it('renders selected example input and exports complete JSON records', async () => {
    const wrapper = mountBatch();
    wrapper.vm.prefillTextArea(['chr16-2138714-C-T\tInherited dominant\t1']);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('textarea').element.value).toContain(
      'Inherited dominant',
    );
    expect(wrapper.vm.hasValidInput).toBe(true);
    await wrapper.vm.processVariants();
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('4.800');
    wrapper.vm.downloadResults('JSON');
    expect(JSON.parse(downloadFile.mock.calls[0][0])[0]).toEqual(
      expect.objectContaining({
        ncs: '4.800',
        inheritance: 'Inherited dominant',
        segregation: '1',
      }),
    );
    wrapper.unmount();
  });

  it.each([
    { data: [annotation().data] },
    {
      data: {
        ...annotation().data.annotationData[0],
        most_severe_consequence: 'missense_variant',
      },
    },
  ])(
    'handles supported annotation response envelopes: %s',
    async (response) => {
      queryVariant.mockResolvedValue(response);
      const wrapper = mountBatch();
      wrapper.vm.variantsInput = 'chr16-2138714-C-T';
      await wrapper.vm.processVariants();
      expect(wrapper.vm.batchResults[0].ncs).toBe('4.200');
      wrapper.unmount();
    },
  );

  it.each([{ data: null }, { data: {} }, { data: { annotationData: [] } }])(
    'shows unavailable rows for empty annotation responses: %s',
    async (response) => {
      queryVariant.mockResolvedValue(response);
      const wrapper = mountBatch();
      wrapper.vm.variantsInput = 'chr16-2138714-C-T';
      await wrapper.vm.processVariants();
      expect(wrapper.vm.batchResults[0].ncs).toBe('N/A');
      expect(wrapper.vm.batchResults[0].error).toMatch(/No .*data/);
      wrapper.unmount();
    },
  );

  it('reports invalid API scores instead of exporting a misleading assessment', async () => {
    queryVariant.mockResolvedValue(annotation(5));
    const wrapper = mountBatch();
    wrapper.vm.variantsInput = 'chr16-2138714-C-T';
    await wrapper.vm.processVariants();
    expect(wrapper.vm.batchResults[0].ncs).toBe('N/A');
    expect(wrapper.vm.batchResults[0].error).toContain('score');
    wrapper.unmount();
  });

  it.each([undefined, null, NaN, '', ' '])(
    'does not replace missing or invalid variant evidence %s with zero',
    async (score) => {
      const response = annotation();
      response.data.annotationData[0].nephro_variant_score = score;
      queryVariant.mockResolvedValue(response);
      const wrapper = mountBatch();
      wrapper.vm.variantsInput = 'chr16-2138714-C-T';
      await wrapper.vm.processVariants();
      expect(wrapper.vm.batchResults[0].ncs).toBe('N/A');
      expect(wrapper.vm.batchResults[0].error).toContain('variant score');
      wrapper.unmount();
    },
  );

  it.each([undefined, {}, { data: {} }, { data: { ngs: null } }])(
    'does not replace absent gene evidence with zero: %s',
    async (response) => {
      fetchGeneDetails.mockResolvedValue(response);
      const wrapper = mountBatch();
      wrapper.vm.variantsInput = 'chr16-2138714-C-T';
      await wrapper.vm.processVariants();
      expect(wrapper.vm.batchResults[0].ncs).toBe('N/A');
      expect(wrapper.vm.batchResults[0].error).toContain('gene score');
      wrapper.unmount();
    },
  );

  it('preserves measured zero gene and variant scores', async () => {
    queryVariant.mockResolvedValue(annotation(0));
    fetchGeneDetails.mockResolvedValue({ data: { ngs: 0 } });
    const wrapper = mountBatch();
    wrapper.vm.variantsInput = 'chr16-2138714-C-T';
    await wrapper.vm.processVariants();
    expect(wrapper.vm.batchResults[0].ncs).toBe('0.200');
    expect(wrapper.vm.batchResults[0].error).toBe('');
    wrapper.unmount();
  });

  it('reuses gene evidence within one batch for consistent scores and fewer requests', async () => {
    queryVariant.mockResolvedValueOnce({
      data: {
        annotationData: [
          {
            input: '16-2138714-C-T',
            variantKey: '16-2138714-C-T',
            nephro_variant_score: 0.5,
            transcript_consequences: [{ gene_symbol: 'PKD1' }],
          },
          {
            input: '16-2138715-C-T',
            variantKey: '16-2138715-C-T',
            nephro_variant_score: 0.5,
            transcript_consequences: [{ gene_symbol: 'PKD1' }],
          },
        ],
      },
    });
    fetchGeneDetails.mockResolvedValueOnce({ data: { ngs: 0.5 } });
    fetchGeneDetails.mockResolvedValueOnce({ data: { ngs: 0.9 } });
    const wrapper = mountBatch();
    wrapper.vm.variantsInput = 'chr16-2138714-C-T\nchr16-2138715-C-T';
    await wrapper.vm.processVariants();
    expect(fetchGeneDetails).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.batchResults.map((row) => row.ncs)).toEqual([
      '4.200',
      '4.200',
    ]);
    wrapper.unmount();
  });

  it('does not repopulate cleared results when an outstanding request completes', async () => {
    let finish;
    queryVariant.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const wrapper = mountBatch();
    wrapper.vm.variantsInput = 'chr16-2138714-C-T\nchr16-2138715-C-T';
    const pending = wrapper.vm.processVariants();
    wrapper.vm.clearResults();
    finish(annotation());
    await pending;
    expect(wrapper.vm.batchResults).toEqual([]);
    expect(wrapper.vm.progress).toBe(0);
    wrapper.unmount();
  });

  it('does not invent VCF coordinates for HGVS input', async () => {
    const wrapper = mountBatch();
    wrapper.vm.variantsInput = 'NM_004380.3:c.589G>T';
    await wrapper.vm.processVariants();
    wrapper.vm.downloadResults('VCF');
    expect(downloadFile).not.toHaveBeenCalled();
    expect(wrapper.vm.errorMsg).toContain('format');
    wrapper.unmount();
  });

  it.each(['CSV', 'TSV'])(
    'escapes text and spreadsheet formulas in %s exports',
    async (format) => {
      const wrapper = mountBatch();
      wrapper.vm.variantsInput = '=1+1';
      await wrapper.vm.processVariants();
      wrapper.vm.downloadResults(format);
      expect(downloadFile.mock.calls[0][0]).toContain("'=1+1");
      wrapper.unmount();
    },
  );

  it('correlates batch responses by variant key even when returned out of order', async () => {
    queryVariant.mockResolvedValueOnce({
      data: {
        annotationData: [
          {
            input: '12-88101183-A-G',
            variantKey: '12-88101183-A-G',
            nephro_variant_score: 0.8,
            transcript_consequences: [{ gene_symbol: 'CEP290' }],
          },
          {
            input: '16-2090952-G-A',
            variantKey: '16-2090952-G-A',
            nephro_variant_score: 0.2,
            transcript_consequences: [{ gene_symbol: 'PKD1' }],
          },
        ],
      },
    });
    fetchGeneDetails.mockImplementation(async (gene) => {
      if (gene === 'PKD1') return { data: { ngs: 0.5 } };
      if (gene === 'CEP290') return { data: { ngs: 0.7 } };
      return { data: {} };
    });
    const wrapper = mountBatch();
    wrapper.vm.variantsInput = '16-2090952-G-A\n12-88101183-A-G';
    await wrapper.vm.processVariants();
    expect(wrapper.vm.batchResults[0].variant).toBe('16-2090952-G-A');
    expect(wrapper.vm.batchResults[0].geneSymbol).toBe('PKD1');
    expect(wrapper.vm.batchResults[0].variantScore).toBe(0.2);
    expect(wrapper.vm.batchResults[1].variant).toBe('12-88101183-A-G');
    expect(wrapper.vm.batchResults[1].geneSymbol).toBe('CEP290');
    expect(wrapper.vm.batchResults[1].variantScore).toBe(0.8);
    wrapper.unmount();
  });

  it('handles duplicate variants in batch input without corrupting row data', async () => {
    queryVariant.mockResolvedValueOnce({
      data: {
        annotationData: [
          {
            input: '16-2090952-G-A',
            variantKey: '16-2090952-G-A',
            nephro_variant_score: 0.5,
            transcript_consequences: [{ gene_symbol: 'PKD1' }],
          },
        ],
      },
    });
    fetchGeneDetails.mockResolvedValue({ data: { ngs: 0.5 } });
    const wrapper = mountBatch();
    wrapper.vm.variantsInput =
      '16-2090952-G-A\tInherited dominant\n16-2090952-G-A\tDenovo';
    await wrapper.vm.processVariants();
    expect(wrapper.vm.batchResults).toHaveLength(2);
    expect(wrapper.vm.batchResults[0].variant).toBe('16-2090952-G-A');
    expect(wrapper.vm.batchResults[0].inheritance).toBe('Inherited dominant');
    expect(wrapper.vm.batchResults[0].ncs).toBe('4.640');
    expect(wrapper.vm.batchResults[1].variant).toBe('16-2090952-G-A');
    expect(wrapper.vm.batchResults[1].inheritance).toBe('Denovo');
    expect(wrapper.vm.batchResults[1].ncs).toBe('5.900');
    wrapper.unmount();
  });

  it('recovers valid variants when batch query rejects with an input-specific 400 error', async () => {
    const error400 = Object.assign(
      new Error('Reference allele mismatch for one submitted variant'),
      {
        response: {
          status: 400,
          data: {
            error: 'Reference allele mismatch for one submitted variant',
          },
        },
      },
    );
    queryVariant.mockRejectedValueOnce(error400);
    queryVariant.mockRejectedValueOnce(error400); // for first variant
    queryVariant.mockResolvedValueOnce(annotation()); // for second variant
    const wrapper = mountBatch();
    wrapper.vm.variantsInput = '16-2090952-G-A\n12-88101183-A-G';
    await wrapper.vm.processVariants();
    expect(wrapper.vm.batchResults[0].error).toContain(
      'Reference allele mismatch',
    );
    expect(wrapper.vm.batchResults[1].ncs).toBe('4.200');
    wrapper.unmount();
  });

  it('falls back to unversioned HGVS when variant recoder returns no VCF string for version', async () => {
    queryVariant.mockResolvedValueOnce({
      data: {
        annotationData: [
          {
            input: 'NM_001009944.3:c.11935C>T',
            variantKey: 'NM_001009944.3:c.11935C>T',
            error:
              'No valid VCF string found in Variant Recoder response for variant "NM_001009944.3:c.11935C>T"',
          },
          {
            input: '12-88101183-A-G',
            variantKey: '12-88101183-A-G',
            nephro_variant_score: 0.5,
            transcript_consequences: [{ gene_symbol: 'CEP290' }],
          },
        ],
      },
    });
    queryVariant.mockResolvedValueOnce({
      data: {
        annotationData: [
          {
            nephro_variant_score: 0.6,
            transcript_consequences: [{ gene_symbol: 'PKD1' }],
          },
        ],
      },
    });
    fetchGeneDetails.mockResolvedValue({ data: { ngs: 0.5 } });
    const wrapper = mountBatch();
    wrapper.vm.variantsInput = 'NM_001009944.3:c.11935C>T\n12-88101183-A-G';
    await wrapper.vm.processVariants();
    expect(queryVariant).toHaveBeenCalledWith(
      'NM_001009944:c.11935C>T',
      expect.any(Object),
    );
    expect(wrapper.vm.batchResults[0].variantScore).toBe(0.6);
    expect(wrapper.vm.batchResults[0].geneSymbol).toBe('PKD1');
    expect(wrapper.vm.batchResults[0].error).toBe('');
    wrapper.unmount();
  });

  it('displays a loading state and does not show premature N/A or unavailable counts during processing', async () => {
    let resolveBatch;
    queryVariant.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveBatch = resolve;
        }),
    );
    const wrapper = mountBatch();
    wrapper.vm.variantsInput = '16-2090952-G-A\n12-88101183-A-G';
    const pending = wrapper.vm.processVariants();
    await flushPromises();

    // While loading:
    expect(wrapper.vm.isLoading).toBe(true);
    // completedCount must be 0, not 2
    expect(wrapper.vm.completedCount).toBe(0);
    // Summary must say "Processing variants", NOT "unavailable"
    expect(wrapper.text()).toContain('Processing variants · 0 of 2 finished');
    expect(wrapper.text()).not.toContain('unavailable');
    // Progress label
    expect(wrapper.text()).toContain('0 of 2 completed');
    // In-flight rows must have pending status
    expect(wrapper.vm.batchResults.every((r) => r.status === 'pending')).toBe(
      true,
    );

    // Rendered table check
    expect(wrapper.find('.results-table').exists()).toBe(true);
    expect(wrapper.text()).toContain('Pending');

    // Complete the batch request
    resolveBatch({
      data: {
        annotationData: [
          {
            input: '16-2090952-G-A',
            variantKey: '16-2090952-G-A',
            nephro_variant_score: 0.5,
            transcript_consequences: [{ gene_symbol: 'PKD1' }],
          },
          {
            input: '12-88101183-A-G',
            variantKey: '12-88101183-A-G',
            nephro_variant_score: 0.5,
            transcript_consequences: [{ gene_symbol: 'PKD1' }],
          },
        ],
      },
    });
    await pending;
    await flushPromises();

    // After completion:
    expect(wrapper.vm.isLoading).toBe(false);
    expect(wrapper.vm.completedCount).toBe(2);
    expect(wrapper.vm.successfulCount).toBe(2);
    expect(wrapper.text()).toContain('2 scored · 0 unavailable');
    expect(wrapper.text()).toContain('Processing complete. 2 of 2 completed.');
    expect(wrapper.vm.batchResults.every((r) => r.status === 'scored')).toBe(
      true,
    );
    wrapper.unmount();
  });
});
