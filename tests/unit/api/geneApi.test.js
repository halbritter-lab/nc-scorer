import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { createPinia, setActivePinia } from 'pinia';
import {
  fetchGeneDetails,
  fetchGeneSearchIndices,
  fetchAllGeneScores,
} from '@/api/geneApi.js';
import geneApiConfig from '@/config/geneApiConfig.json';
import { useApiCache } from '@/composables/useApiCache.js';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));

beforeEach(() => {
  axios.get.mockReset();
  setActivePinia(createPinia());
});
afterEach(() => vi.useRealTimers());

describe('gene search indices', () => {
  it('combines symbol and HGNC indices and reuses the cached result', async () => {
    axios.get.mockImplementation(async (url) => ({
      data:
        url === geneApiConfig.symbolsIndexUrl
          ? ['PKD1', 'COL4A5']
          : ['9008', '2207'],
    }));
    const apiCache = useApiCache();
    const result = await fetchGeneSearchIndices({ apiCache });
    expect(result.hgncToSymbolMap).toEqual({ 9008: 'PKD1', 2207: 'COL4A5' });
    expect(result.combinedItems).toEqual([
      { symbol: 'PKD1', hgncId: '9008', display: 'PKD1 (HGNC:9008)' },
      { symbol: 'COL4A5', hgncId: '2207', display: 'COL4A5 (HGNC:2207)' },
    ]);
    expect(await fetchGeneSearchIndices({ apiCache })).toEqual(result);
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it.each([
    [
      ['PKD1', 'COL4A5'],
      ['9008'],
      { symbol: 'COL4A5', hgncId: null, display: 'COL4A5' },
    ],
    [
      ['PKD1'],
      ['9008', '2207'],
      { symbol: 'PKD1', hgncId: '9008', display: 'PKD1 (HGNC:9008)' },
    ],
  ])(
    'handles unequal index lengths without inventing gene associations',
    async (symbols, ids, last) => {
      axios.get.mockImplementation(async (url) => ({
        data: url === geneApiConfig.symbolsIndexUrl ? symbols : ids,
      }));
      const result = await fetchGeneSearchIndices();
      expect(result.combinedItems.at(-1)).toEqual(last);
      expect(result.hgncToSymbolMap['2207']).toBeUndefined();
    },
  );

  it('bypasses saved indices on an explicit refresh', async () => {
    const apiCache = useApiCache();
    axios.get.mockImplementation(async (url) => ({
      data: url === geneApiConfig.symbolsIndexUrl ? ['PKD1'] : ['9008'],
    }));
    await fetchGeneSearchIndices({ apiCache });
    await fetchGeneSearchIndices({ apiCache, skipCache: true });
    expect(axios.get).toHaveBeenCalledTimes(4);
  });

  it('surfaces unavailable indices without caching a partial search list', async () => {
    const error = Object.assign(new Error('Not found'), {
      response: { status: 404 },
    });
    axios.get.mockRejectedValue(error);
    const apiCache = useApiCache();
    await expect(fetchGeneSearchIndices({ apiCache })).rejects.toBe(error);
    expect(apiCache.stats.value.itemCount).toBe(0);
  });
});

describe.each([
  [
    'gene details',
    (options) => fetchGeneDetails('PKD1', options),
    { symbol: 'PKD1', gene_score: 0.8 },
  ],
  [
    'gene score summary',
    (options) => fetchAllGeneScores(options),
    [{ symbol: 'PKD1', gene_score: 0.8 }],
  ],
])('%s response lifecycle', (_name, request, data) => {
  it('preserves source information on a cache hit and supports explicit refresh', async () => {
    const apiCache = useApiCache();
    axios.get.mockResolvedValue({ data });
    expect((await request({ apiCache })).source.fromCache).toBe(false);
    const cached = await request({ apiCache });
    expect(cached.data).toEqual(data);
    expect(cached.source.fromCache).toBe(true);
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(
      (await request({ apiCache, skipCache: true })).source.fromCache,
    ).toBe(false);
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it.each([true, false])(
    'recovers a transient failure with optional feedback enabled=%s',
    async (callbacks) => {
      vi.useFakeTimers();
      const error = Object.assign(new Error('Service unavailable'), {
        response: { status: 503 },
      });
      axios.get.mockRejectedValueOnce(error).mockResolvedValueOnce({ data });
      const onRetry = vi.fn();
      const onSuccess = vi.fn();
      const options = callbacks ? { onRetry, onSuccess } : {};
      await Promise.all([
        expect(request(options)).resolves.toMatchObject({
          data,
          source: { fromCache: false },
        }),
        vi.runAllTimersAsync(),
      ]);
      expect(axios.get).toHaveBeenCalledTimes(2);
      if (callbacks) {
        expect(onRetry).toHaveBeenCalledWith(error, 1);
        expect(onSuccess).toHaveBeenCalledWith(1);
      }
    },
  );

  it('does not retain an absent payload', async () => {
    axios.get.mockResolvedValue({ data: null });
    const apiCache = useApiCache();
    expect((await request({ apiCache })).data).toBeNull();
    expect(apiCache.stats.value.itemCount).toBe(0);
  });
});

describe('fetchGeneDetails', () => {
  it('does not retry a missing symbol and permits a later fresh request', async () => {
    const error = Object.assign(new Error('Not found'), {
      response: { status: 404 },
    });
    axios.get
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ data: { symbol: 'PKD1' } });
    await expect(fetchGeneDetails('PKD1')).rejects.toBe(error);
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect((await fetchGeneDetails('PKD1')).data.symbol).toBe('PKD1');
    expect(axios.get).toHaveBeenCalledTimes(2);
  });
  it('normalizes the requested symbol even without an API cache', async () => {
    axios.get.mockResolvedValueOnce({ data: { symbol: 'PKD1' } });
    await fetchGeneDetails(' pkd1 ');
    expect(axios.get).toHaveBeenCalledWith(
      `${geneApiConfig.geneDetailsBaseUrl}PKD1.json`,
    );
  });

  it('encodes the symbol as one URL segment', async () => {
    axios.get.mockResolvedValueOnce({ data: {} });
    await fetchGeneDetails('../other?x=y#fragment');
    expect(axios.get).toHaveBeenCalledWith(
      `${geneApiConfig.geneDetailsBaseUrl}..%2FOTHER%3FX%3DY%23FRAGMENT.json`,
    );
  });

  it('shares overlapping identical gene requests but starts a fresh request after completion', async () => {
    let resolve;
    axios.get.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    axios.get.mockResolvedValue({ data: { symbol: 'PKD1' } });
    const first = fetchGeneDetails('PKD1');
    const second = fetchGeneDetails('pkd1');
    expect(axios.get).toHaveBeenCalledTimes(1);
    resolve({ data: { symbol: 'PKD1' } });
    expect((await first).data.symbol).toBe('PKD1');
    expect((await second).data.symbol).toBe('PKD1');
    await fetchGeneDetails('PKD1');
    expect(axios.get).toHaveBeenCalledTimes(2);
  });
});
