/* global console */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import axios from 'axios';
import variantLinker from 'variant-linker';
import { queryVariant } from '@/api/variantApi.js';
import { coordinateCache } from '@/services/coordinateCache.js';
import { useApiCache } from '@/composables/useApiCache.js';
import { useSettingsStore } from '@/stores/settingsStore.js';
import { useNotifications } from '@/composables/useNotifications.js';

vi.mock('variant-linker', () => ({
  default: {
    analyzeVariant: vi.fn(),
    scoring: { parseScoringConfig: () => ({}) },
  },
}));
vi.mock('axios', () => ({ default: { get: vi.fn() } }));
vi.mock('@/composables/useNotifications', () => ({
  useNotifications: vi.fn(),
}));

beforeEach(() => {
  setActivePinia(createPinia());
  coordinateCache.memoryCache.clear();
  axios.get.mockReset();
  useNotifications.mockReturnValue({
    notifyRetry: vi.fn(),
    notifySuccess: vi.fn(),
  });
  variantLinker.analyzeVariant.mockReset();
  variantLinker.analyzeVariant.mockResolvedValue([
    { annotationData: [{ variantKey: '1-100-A-G' }] },
  ]);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('queryVariant', () => {
  it('canonicalizes assembly before reusing coordinates and annotation cache entries', async () => {
    const apiCache = useApiCache();
    coordinateCache.set('NM_TEST:c.1A>G', '1-100-A-G', null, 'GRCh37');
    await queryVariant('NM_TEST:c.1A>G', { apiCache, assembly: ' grch37 ' });
    expect(variantLinker.analyzeVariant).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: '1-100-A-G',
        vepOptions: expect.objectContaining({
          __ncEnsemblBaseUrl: '/ensembl_grch37',
        }),
      }),
    );
    const cached = await queryVariant('NM_TEST:c.1A>G', {
      apiCache,
      assembly: 'GRCh37',
    });
    expect(cached.source.fromCache).toBe(true);
    expect(variantLinker.analyzeVariant).toHaveBeenCalledTimes(1);
  });

  it.each(['GRCh36', '', null, 37, ['GRCh37']])(
    'rejects unsupported assembly %j before reading caches or sending a request',
    async (assembly) => {
      const apiCache = { getCachedItem: vi.fn(), generateCacheKey: vi.fn() };
      await expect(
        queryVariant('1-100-A-G', { assembly, apiCache }),
      ).rejects.toThrow('Unsupported genome assembly');
      expect(apiCache.getCachedItem).not.toHaveBeenCalled();
      expect(variantLinker.analyzeVariant).not.toHaveBeenCalled();
    },
  );

  it('reuses only the exact annotation request from cache', async () => {
    const apiCache = useApiCache();
    const first = await queryVariant('1-100-A-G', { apiCache });
    const second = await queryVariant('1-100-A-G', { apiCache });
    expect(second.source.fromCache).toBe(true);
    expect(second.data).toEqual(first.data);
    expect(variantLinker.analyzeVariant).toHaveBeenCalledTimes(1);
    await queryVariant('1-100-A-G', { apiCache, filter: '{"impact":"HIGH"}' });
    expect(variantLinker.analyzeVariant).toHaveBeenCalledTimes(2);
  });

  it('passes batch and output options without writing single-variant caches', async () => {
    const apiCache = useApiCache();
    variantLinker.analyzeVariant.mockResolvedValueOnce(
      'variant,score\n1-100-A-G,0.5',
    );
    const result = await queryVariant(['1-100-A-G', '2-200-C-T'], {
      apiCache,
      output: 'CSV',
      filter: 'test',
    });
    expect(result.data).toBe('variant,score\n1-100-A-G,0.5');
    expect(variantLinker.analyzeVariant).toHaveBeenCalledWith(
      expect.objectContaining({
        variants: ['1-100-A-G', '2-200-C-T'],
        output: 'CSV',
        filter: 'test',
        cache: false,
      }),
    );
    expect(apiCache.stats.value.itemCount).toBe(0);
  });

  it.each(['GRCh37', 'GRCh38'])(
    'uses the public %s endpoint outside development',
    async (assembly) => {
      vi.stubEnv('DEV', false);
      vi.stubGlobal('window', undefined);
      await queryVariant('1-100-A-G', { assembly });
      const expected =
        assembly === 'GRCh37'
          ? 'https://grch37.rest.ensembl.org'
          : 'https://rest.ensembl.org';
      expect(
        variantLinker.analyzeVariant.mock.calls[0][0].vepOptions
          .__ncEnsemblBaseUrl,
      ).toBe(expected);
    },
  );

  it('attaches the original HGVS notation to an accelerated object result', async () => {
    coordinateCache.set('NM_TEST:c.1A>G', '1-100-A-G', 'TEST');
    variantLinker.analyzeVariant.mockResolvedValueOnce({
      annotationData: [{ variantKey: '1-100-A-G', gene_symbol: ['TEST'] }],
    });
    const result = await queryVariant('NM_TEST:c.1A>G');
    expect(result.data.originalInput).toBe('NM_TEST:c.1A>G');
    expect(result.data.vcfString).toBe('1-100-A-G');
    expect(result.source.accelerated).toBe(true);
    expect(coordinateCache.getGeneSymbol('NM_TEST:c.1A>G')).toBe('TEST');
  });

  it('prefetches a known gene only for an annotation cache miss', async () => {
    const apiCache = useApiCache();
    coordinateCache.set('NM_TEST:c.1A>G', '1-100-A-G', 'TEST');
    axios.get.mockResolvedValueOnce({ data: { symbol: 'TEST' } });
    await queryVariant('NM_TEST:c.1A>G', { apiCache });
    await queryVariant('NM_TEST:c.1A>G', { apiCache });
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(variantLinker.analyzeVariant).toHaveBeenCalledTimes(1);
    expect(
      apiCache.getCachedItem(apiCache.generateCacheKey('gene', 'TEST')).data
        .symbol,
    ).toBe('TEST');
  });

  it('returns annotations even if speculative gene fetching fails', async () => {
    const apiCache = useApiCache();
    coordinateCache.set('NM_TEST:c.1A>G', '1-100-A-G', 'TEST');
    axios.get.mockRejectedValueOnce(
      Object.assign(new Error('Not found'), { response: { status: 404 } }),
    );
    const result = await queryVariant('NM_TEST:c.1A>G', { apiCache });
    expect(result.data[0].annotationData[0].variantKey).toBe('1-100-A-G');
  });

  it.each([true, false])(
    'recovers from a transient analysis error with caller feedback=%s',
    async (callbacks) => {
      vi.useFakeTimers();
      const error = Object.assign(new Error('Service unavailable'), {
        response: { status: 503 },
      });
      variantLinker.analyzeVariant
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({ annotationData: [] });
      const onRetry = vi.fn();
      const onSuccess = vi.fn();
      const options = callbacks ? { onRetry, onSuccess } : {};
      await Promise.all([
        expect(queryVariant('1-100-A-G', options)).resolves.toMatchObject({
          data: { annotationData: [] },
        }),
        vi.runAllTimersAsync(),
      ]);
      expect(variantLinker.analyzeVariant).toHaveBeenCalledTimes(2);
      if (callbacks) {
        expect(onRetry).toHaveBeenCalledWith(error, 1);
        expect(onSuccess).toHaveBeenCalledWith(1);
      }
    },
  );

  it('can retry a batch analysis outside a notification context', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    useNotifications.mockImplementationOnce(() => {
      throw new Error('No store');
    });
    variantLinker.analyzeVariant
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce([]);
    await Promise.all([
      expect(queryVariant(['1-100-A-G'])).resolves.toMatchObject({ data: [] }),
      vi.runAllTimersAsync(),
    ]);
    expect(variantLinker.analyzeVariant).toHaveBeenCalledTimes(2);
  });
  it('updates the caller retry state when an analysis request fails', async () => {
    const error = Object.assign(new Error('Invalid variant'), {
      response: { status: 400 },
    });
    variantLinker.analyzeVariant.mockRejectedValueOnce(error);
    const retryState = { attempts: 0, lastError: null };
    await expect(queryVariant('1-100-A-G', { retryState })).rejects.toBe(error);
    expect(retryState.attempts).toBe(1);
    expect(retryState.lastError).toBe(error);
  });
  it('passes the selected assembly URL to both recoder and annotation requests', async () => {
    await Promise.all([
      queryVariant('1-100-A-G', { assembly: 'GRCh37' }),
      queryVariant('1-100-A-G', { assembly: 'GRCh38' }),
    ]);
    const [legacy, current] = variantLinker.analyzeVariant.mock.calls.map(
      ([params]) => params,
    );
    expect(legacy.recoderOptions.__ncEnsemblBaseUrl).toBe('/ensembl_grch37');
    expect(legacy.vepOptions.__ncEnsemblBaseUrl).toBe('/ensembl_grch37');
    expect(current.recoderOptions.__ncEnsemblBaseUrl).toBe('/ensembl');
    expect(current.vepOptions.__ncEnsemblBaseUrl).toBe('/ensembl');
  });

  it.each(['request', 'preference'])(
    'does not reuse or persist coordinate shortcuts when caching is bypassed by %s',
    async (bypass) => {
      const apiCache = useApiCache();
      if (bypass === 'preference') useSettingsStore().setCacheEnabled(false);
      coordinateCache.set('NM_TEST:c.1A>G', '1-100-A-G');
      await queryVariant('NM_TEST:c.1A>G', {
        apiCache,
        skipCache: bypass === 'request',
      });
      expect(variantLinker.analyzeVariant.mock.calls[0][0].variant).toBe(
        'NM_TEST:c.1A>G',
      );
      expect(coordinateCache.getVcf('1-100-A-G')).toBeNull();
    },
  );

  it('does not alias annotation metadata across different input notations', async () => {
    const apiCache = useApiCache();
    coordinateCache.set('NM_TEST:c.1A>G', '1-100-A-G');
    await queryVariant('NM_TEST:c.1A>G', { apiCache });
    variantLinker.analyzeVariant.mockResolvedValueOnce([
      { originalInput: '1-100-A-G' },
    ]);
    const result = await queryVariant('1-100-A-G', { apiCache });
    expect(result.data[0].originalInput).toBe('1-100-A-G');
  });

  it('does not collapse multiple resolved variants into one cached coordinate', async () => {
    variantLinker.analyzeVariant.mockResolvedValueOnce([
      { annotationData: [{ variantKey: '1-100-A-G' }] },
      { annotationData: [{ variantKey: '2-200-A-G' }] },
    ]);
    await queryVariant('NM_TEST:c.1A>G');
    expect(coordinateCache.getVcf('NM_TEST:c.1A>G')).toBeNull();
  });
});
