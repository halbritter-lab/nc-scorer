import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import { mountWithPlugins } from '../../utils/testUtils.js';
import GeneScoresTableView from '@/views/GeneScoresTableView.vue';
import { fetchAllGeneScores } from '@/api/geneApi';
import writeXlsxFile from 'write-excel-file/browser';

vi.mock('@/api/geneApi', () => ({ fetchAllGeneScores: vi.fn() }));
vi.mock('write-excel-file/browser', () => ({ default: vi.fn() }));

const genes = [
  {
    symbol: 'PKD1',
    hgncIdInt: 9008,
    ngs: 0.9,
    evidenceCount: 7,
    geneSet: 'train',
  },
  {
    symbol: 'COL4A5',
    hgncIdInt: 2207,
    ngs: 0.6,
    evidenceCount: 2,
    geneSet: 'test',
  },
  {
    symbol: 'EXAMPLE',
    hgncIdInt: null,
    ngs: null,
    evidenceCount: null,
    geneSet: 'none',
  },
  { symbol: 'LOW', hgncIdInt: 123, ngs: 0, evidenceCount: 0, geneSet: null },
];
let wrapper;
let downloads;

async function mountTable() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      {
        path: '/symbols/:symbol',
        name: 'GeneView',
        component: { template: '<div />' },
      },
    ],
  });
  await router.push('/');
  wrapper = mountWithPlugins(GeneScoresTableView, {
    global: { plugins: [router] },
  });
  await flushPromises();
  return wrapper;
}

beforeEach(() => {
  downloads = [];
  fetchAllGeneScores.mockReset().mockResolvedValue({ data: genes });
  writeXlsxFile.mockReset().mockResolvedValue(undefined);
  URL.createObjectURL.mockClear().mockReturnValue('blob:gene-download');
  URL.revokeObjectURL.mockClear();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
    function () {
      downloads.push({ filename: this.download, href: this.href });
    },
  );
  vi.stubGlobal('alert', vi.fn());
});

afterEach(() => {
  wrapper?.unmount();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('gene score table workflow', () => {
  it('loads rows and formats score, identifier, and gene-set evidence', async () => {
    await mountTable();
    expect(wrapper.text()).toContain('PKD1');
    expect(wrapper.text()).toContain('HGNC:9008');
    expect(wrapper.text()).toContain('0.90');
    expect(wrapper.text()).toContain('0.00');
    expect(wrapper.text()).toContain('N/A');
    expect(wrapper.text()).toContain('Train');
    expect(wrapper.text()).toContain('Test');
    expect(wrapper.text()).toContain('None');
    expect(
      wrapper.findAll('.text-success').some((node) => node.text() === '0.90'),
    ).toBe(true);
    expect(
      wrapper.findAll('.text-warning').some((node) => node.text() === '0.60'),
    ).toBe(true);
  });

  it('filters by symbol or numeric HGNC ID and supports clearing an empty search', async () => {
    await mountTable();
    const input = wrapper.get('input');
    await input.setValue('pkd');
    expect(wrapper.vm.filteredGenes.map((gene) => gene.symbol)).toEqual([
      'PKD1',
    ]);
    await input.setValue('2207');
    expect(wrapper.vm.filteredGenes.map((gene) => gene.symbol)).toEqual([
      'COL4A5',
    ]);
    await input.setValue('not-a-gene');
    expect(wrapper.text()).toContain('No genes found matching');
    expect(
      wrapper
        .findAll('button')
        .find((button) => button.text().includes('Download Data'))
        .attributes('disabled'),
    ).toBeDefined();
    wrapper.vm.searchQuery = null;
    await flushPromises();
    expect(wrapper.vm.filteredGenes).toHaveLength(4);
  });

  it('keeps downloads unavailable until the pending load completes', async () => {
    let resolveLoad;
    fetchAllGeneScores.mockReturnValue(
      new Promise((resolve) => {
        resolveLoad = resolve;
      }),
    );
    await mountTable();
    expect(wrapper.vm.loadingState.loading).toBe(true);
    expect(
      wrapper
        .findAll('button')
        .find((button) => button.text().includes('Download Data'))
        .attributes('disabled'),
    ).toBeDefined();
    resolveLoad({ data: genes, source: { fromCache: true } });
    await flushPromises();
    expect(wrapper.vm.loadingState.loading).toBe(false);
    expect(wrapper.text()).toContain('PKD1');
  });

  it.each([
    { response: {}, message: 'No data received' },
    { error: new Error('Connection failed'), message: 'Connection failed' },
    { error: {}, message: 'Unknown error' },
  ])(
    'shows a recoverable load error: $message',
    async ({ response, error, message }) => {
      if (error) fetchAllGeneScores.mockRejectedValueOnce(error);
      else fetchAllGeneScores.mockResolvedValueOnce(response);
      await mountTable();
      expect(wrapper.text()).toContain(
        `Failed to load gene scores: ${message}`,
      );
      await wrapper
        .findAll('button')
        .find((button) => button.text() === 'Retry')
        .trigger('click');
      await flushPromises();
      expect(wrapper.vm.loadingState.error).toBe(false);
      expect(wrapper.text()).toContain('PKD1');
    },
  );

  it('exports only the filtered rows and releases the temporary download URL', async () => {
    await mountTable();
    await wrapper.get('input').setValue('pkd');
    await wrapper.vm.downloadGeneScores();
    const blob = URL.createObjectURL.mock.calls[0][0];
    expect(await blob.text()).toBe(
      'Gene Symbol,HGNC ID,Nephro Candidate Gene Score,Evidence Count,Gene Set\nPKD1,HGNC:9008,0.90,7,Train',
    );
    expect(downloads).toEqual([
      {
        filename: expect.stringMatching(
          /^nc_scorer_gene_scores_\d{4}-\d{2}-\d{2}\.csv$/,
        ),
        href: 'blob:gene-download',
      },
    ]);
    expect(document.querySelector('a[download]')).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:gene-download');
  });

  it('passes all formatted evidence rows to Excel export', async () => {
    await mountTable();
    await wrapper.vm.downloadGeneScores('excel');
    const [sheet, options] = writeXlsxFile.mock.calls[0];
    expect(options.fileName).toMatch(/\.xlsx$/);
    expect(sheet[1].map((cell) => cell.value)).toEqual([
      'PKD1',
      'HGNC:9008',
      '0.90',
      7,
      'Train',
    ]);
    expect(sheet[3].map((cell) => cell.value)).toEqual([
      'EXAMPLE',
      'N/A',
      'N/A',
      0,
      'None',
    ]);
    expect(downloads).toEqual([]);
  });

  it('falls back to a CSV download if Excel generation fails', async () => {
    writeXlsxFile.mockRejectedValueOnce(new Error('Writer unavailable'));
    await mountTable();
    await wrapper.vm.downloadGeneScores('excel');
    expect(downloads).toHaveLength(1);
    expect(downloads[0].filename).toMatch(/\.csv$/);
    expect(await URL.createObjectURL.mock.calls[0][0].text()).toContain(
      'COL4A5,HGNC:2207,0.60,2,Test',
    );
  });

  it('does not create an export when no rows match', async () => {
    await mountTable();
    await wrapper.get('input').setValue('absent');
    await wrapper.vm.downloadGeneScores();
    expect(downloads).toEqual([]);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
