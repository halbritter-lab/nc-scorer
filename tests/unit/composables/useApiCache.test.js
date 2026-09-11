// tests/unit/composables/useApiCache.test.js
/* global window, sessionStorage */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApp, ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { API_CACHE_KEY, useApiCache } from '@/composables/useApiCache.js';

// Mock useCacheSettings to control cacheEnabled directly
const mockCacheEnabled = ref(true);
vi.mock('@/composables/useCacheSettings', () => ({
  useCacheSettings: () => ({
    cacheEnabled: mockCacheEnabled,
  }),
}));

describe('API Cache Composable (useApiCache.js)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    window.sessionStorage.clear();
    mockCacheEnabled.value = true;
    vi.clearAllMocks();
  });

  describe('generateCacheKey', () => {
    it('uses the same key for equivalent nested options regardless of insertion order', () => {
      const { generateCacheKey } = useApiCache();
      expect(
        generateCacheKey('variant', '1-1-A-G', {
          vep: { hgvs: 1, CADD: 1 },
          assembly: 'GRCh38',
        }),
      ).toBe(
        generateCacheKey('variant', '1-1-A-G', {
          assembly: 'GRCh38',
          vep: { CADD: 1, hgvs: 1 },
        }),
      );
    });
    it('generates key without params', () => {
      const { generateCacheKey } = useApiCache();
      const key = generateCacheKey('variant', 'chr16-2138714-C-T');
      expect(key).toBe('variant-chr16-2138714-C-T');
    });

    it('generates key with serialized params', () => {
      const { generateCacheKey } = useApiCache();
      const key = generateCacheKey('variant', 'chr16-2138714-C-T', {
        assembly: 'GRCh38',
        output: 'JSON',
      });
      expect(key).toBe(
        'variant-chr16-2138714-C-T-{"assembly":"GRCh38","output":"JSON"}',
      );
    });
  });

  describe('setCachedItem and getCachedItem', () => {
    it('shares the provided cache and its reactive statistics with descendants', () => {
      const cache = useApiCache();
      const app = createApp({});
      app.provide(API_CACHE_KEY, cache);
      const childCache = app.runWithContext(() => useApiCache());
      childCache.setCachedItem('gene-PKD1', { symbol: 'PKD1' });
      expect(cache.getCachedItem('gene-PKD1').data.symbol).toBe('PKD1');
      expect(childCache.stats.value).toMatchObject({
        itemCount: 1,
        hits: 1,
        hitRate: 100,
      });
      expect(childCache).toBe(cache);
    });

    it('continues caching in memory if browser storage is unavailable', () => {
      sessionStorage.getItem.mockImplementationOnce(() => {
        throw new Error('Storage unavailable');
      });
      const cache = useApiCache();
      sessionStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Storage unavailable');
      });
      cache.setCachedItem('gene-PKD1', { symbol: 'PKD1' });
      expect(cache.getCachedItem('gene-PKD1').data.symbol).toBe('PKD1');
    });
    it('does not reuse legacy annotations produced with unverified assembly routing', () => {
      sessionStorage.setItem(
        'nc-scorer-api-cache',
        JSON.stringify({
          'variant-legacy': {
            data: { assembly: 'unknown' },
            cached: Date.now(),
            expires: null,
          },
        }),
      );
      expect(useApiCache().getCachedItem('variant-legacy')).toBeNull();
    });
    it.each(['null', '[]', '42', '"invalid"'])(
      'recovers from a valid JSON value with an invalid cache shape: %s',
      (stored) => {
        sessionStorage.setItem('nc-scorer-api-cache-v2', stored);
        const apiCache = useApiCache();
        apiCache.setCachedItem('gene-PKD1', { symbol: 'PKD1' });
        expect(apiCache.getCachedItem('gene-PKD1').data).toEqual({
          symbol: 'PKD1',
        });
        expect(apiCache.getCacheStats().itemCount).toBe(1);
      },
    );

    it('ignores corrupt and expired persisted entries', () => {
      sessionStorage.setItem(
        'nc-scorer-api-cache-v2',
        JSON.stringify({
          'gene-broken': { data: { symbol: 'wrong' } },
          'gene-expired': { data: {}, cached: 1, expires: 2 },
          'gene-valid': {
            data: { symbol: 'PKD1' },
            cached: Date.now(),
            expires: null,
          },
        }),
      );
      const apiCache = useApiCache();
      expect(apiCache.getCachedItem('gene-broken')).toBeNull();
      expect(apiCache.getCacheStats().itemCount).toBe(1);
      expect(apiCache.getCachedItem('gene-valid').data.symbol).toBe('PKD1');
    });

    it('does not treat inherited object properties as cached responses', () => {
      const apiCache = useApiCache();
      expect(apiCache.getCachedItem('constructor')).toBeNull();
      apiCache.setCachedItem('__proto__', { symbol: 'PKD1' });
      expect(apiCache.getCacheStats().itemCount).toBe(1);
      expect(apiCache.getCachedItem('__proto__').data.symbol).toBe('PKD1');
    });
    it('caches item and returns it on subsequent retrieval', () => {
      const apiCache = useApiCache();
      const testData = { gene: 'PKD1', score: 0.95 };

      const setResponse = apiCache.setCachedItem('gene-PKD1', testData, 60000);
      expect(setResponse.data).toEqual(testData);
      expect(setResponse.source.fromCache).toBe(false);

      const getResponse = apiCache.getCachedItem('gene-PKD1');
      expect(getResponse).not.toBeNull();
      expect(getResponse.data).toEqual(testData);
      expect(getResponse.source.fromCache).toBe(true);
      expect(getResponse.source.cachedAt).toBeTypeOf('number');
    });

    it('returns null and increments misses on cache miss', () => {
      const apiCache = useApiCache();
      const result = apiCache.getCachedItem('missing-key');

      expect(result).toBeNull();
      expect(apiCache.getCacheStats().misses).toBe(1);
    });

    it('expires cached items after TTL expires', () => {
      vi.useFakeTimers();
      const apiCache = useApiCache();
      const testData = { gene: 'COL4A5' };

      // Set item with TTL of 5000ms
      apiCache.setCachedItem('gene-COL4A5', testData, 5000);

      // Verify immediate hit
      expect(apiCache.getCachedItem('gene-COL4A5')).not.toBeNull();

      // Advance clock past TTL
      vi.advanceTimersByTime(6000);

      // Should now be expired and return null
      const expiredResult = apiCache.getCachedItem('gene-COL4A5');
      expect(expiredResult).toBeNull();

      vi.useRealTimers();
    });

    it('persists and synchronizes cache state to sessionStorage', () => {
      const apiCache = useApiCache();
      apiCache.setCachedItem('variant-1', { id: 'var1' }, 60000);

      const rawStorage = window.sessionStorage.getItem(
        'nc-scorer-api-cache-v2',
      );
      expect(rawStorage).toBeDefined();
      const parsed = JSON.parse(rawStorage);
      expect(parsed['variant-1'].data).toEqual({ id: 'var1' });
    });
  });

  describe('Cache Bypass Behavior', () => {
    it('bypasses cache when cacheEnabled is false', () => {
      mockCacheEnabled.value = false;
      const apiCache = useApiCache();

      // Setting item returns source fromCache: false without storing
      const setRes = apiCache.setCachedItem('key-1', { test: true });
      expect(setRes.source.fromCache).toBe(false);

      // Getting item returns null and increments bypassCount
      const getRes = apiCache.getCachedItem('key-1');
      expect(getRes).toBeNull();
      expect(apiCache.getCacheStats().bypassed).toBe(1);
    });
  });

  describe('clearCache', () => {
    it('clears specific type with prefix', () => {
      const apiCache = useApiCache();
      apiCache.setCachedItem('variant-1', { v: 1 });
      apiCache.setCachedItem('variant-2', { v: 2 });
      apiCache.setCachedItem('gene-PKD1', { g: 1 });

      apiCache.clearCache('variant');

      expect(apiCache.getCachedItem('variant-1')).toBeNull();
      expect(apiCache.getCachedItem('variant-2')).toBeNull();
      expect(apiCache.getCachedItem('gene-PKD1')).not.toBeNull();
    });

    it('clears entire cache and resets counters when type is omitted', () => {
      const apiCache = useApiCache();
      apiCache.setCachedItem('variant-1', { v: 1 });
      apiCache.setCachedItem('gene-1', { g: 1 });

      apiCache.clearCache();

      const stats = apiCache.getCacheStats();
      expect(stats.itemCount).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.bypassed).toBe(0);
    });
  });

  describe('Reactive Stats Calculation (REA-04)', () => {
    it('calculates hit rate and request counts reactively', () => {
      const apiCache = useApiCache();
      apiCache.setCachedItem('key-1', 'data-1');

      // 1 Hit
      apiCache.getCachedItem('key-1');
      // 1 Miss
      apiCache.getCachedItem('key-2');

      const stats = apiCache.getCacheStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.totalRequests).toBe(2);
      expect(stats.hitRate).toBe(50);
      expect(stats.itemCount).toBe(1);
    });
  });
});
