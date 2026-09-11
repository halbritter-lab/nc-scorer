/**
 * Composable for client-side API response caching
 * Uses sessionStorage to persist during browser session
 */
import { inject, reactive, computed, hasInjectionContext } from 'vue';
import { logService } from '@/services/logService';
import { useCacheSettings } from '@/composables/useCacheSettings';

// Symbol for providing/injecting cache instance throughout the app
export const API_CACHE_KEY = Symbol('apiCache');

export function useApiCache() {
  // Try to get existing cache from the current Vue instance
  const existingCache = hasInjectionContext()
    ? inject(API_CACHE_KEY, null)
    : null;
  if (existingCache) return existingCache;

  // Create fallback dependencies only when no cache was provided.
  const { cacheEnabled } = useCacheSettings();

  // Cache storage configuration
  // Discard legacy annotations produced before assembly routing was isolated.
  const STORAGE_KEY = 'nc-scorer-api-cache-v2';
  const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

  // Cache state - use reactive for reactivity across components
  const cacheState = reactive({
    cache: loadFromStorage(),
    hits: 0,
    misses: 0,
    bypassCount: 0,
  });

  /**
   * Generate a cache key from endpoint and parameters
   * @param {string} type - Cache type (e.g., 'variant', 'gene')
   * @param {string} key - Main identifier (e.g., variant id, gene symbol)
   * @param {Object} [params={}] - Additional parameters that affect the response
   * @returns {string} The cache key
   */
  function generateCacheKey(type, key, params = {}) {
    const sortOptions = (value) => {
      if (Array.isArray(value)) return value.map(sortOptions);
      if (value && typeof value === 'object') {
        return Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((name) => [name, sortOptions(value[name])]),
        );
      }
      return value;
    };
    const paramsString = Object.keys(params).length
      ? `-${JSON.stringify(sortOptions(params))}`
      : '';

    return `${type}-${key}${paramsString}`;
  }

  /**
   * Get an item from cache if it exists and is valid
   * @param {string} cacheKey - The cache key
   * @returns {Object|null} The cached data with source info or null if not found/expired
   */
  function getCachedItem(cacheKey) {
    // Don't use cache if disabled by user preference
    if (!cacheEnabled.value) {
      cacheState.bypassCount++;
      return null;
    }

    const item = cacheState.cache[cacheKey];

    // No cached item found
    if (!item) {
      cacheState.misses++;
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (item.expires !== null && now >= item.expires) {
      // Remove expired item
      delete cacheState.cache[cacheKey];
      saveToStorage();
      cacheState.misses++;
      return null;
    }

    // Valid cache hit
    cacheState.hits++;
    // Return the data with source information
    return {
      data: item.data,
      source: {
        fromCache: true,
        cachedAt: item.cached,
      },
    };
  }

  /**
   * Set an item in the cache
   * @param {string} cacheKey - The cache key
   * @param {*} data - The data to cache
   * @param {number} [ttl=DEFAULT_TTL] - Time to live in milliseconds
   * @returns {Object} The data with source info (fresh from API)
   */
  function setCachedItem(cacheKey, data, ttl = DEFAULT_TTL) {
    // Don't cache if disabled by user preference
    if (!cacheEnabled.value) return { data, source: { fromCache: false } };

    // Calculate expiration time
    const expires = ttl > 0 ? Date.now() + ttl : null;
    const cachedAt = Date.now();

    // Store in cache
    cacheState.cache[cacheKey] = {
      data,
      expires,
      cached: cachedAt,
    };

    // Persist to sessionStorage
    saveToStorage();

    // Return the data with source information
    return {
      data,
      source: {
        fromCache: false,
        cachedAt,
      },
    };
  }

  /**
   * Clear the entire cache or items matching a specific type
   * @param {string} [type] - Optional cache type to clear
   */
  function clearCache(type) {
    if (type) {
      // Clear only items of specific type
      const prefix = `${type}-`;
      Object.keys(cacheState.cache).forEach((key) => {
        if (key.startsWith(prefix)) {
          delete cacheState.cache[key];
        }
      });
    } else {
      // Clear entire cache
      Object.keys(cacheState.cache).forEach((key) => {
        delete cacheState.cache[key];
      });
      cacheState.hits = 0;
      cacheState.misses = 0;
      cacheState.bypassCount = 0;
    }

    saveToStorage();
  }

  /**
   * Save cache to sessionStorage
   */
  function saveToStorage() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cacheState.cache));
    } catch (e) {
      logService.warn('Failed to save API cache to sessionStorage', e);
    }
  }

  /**
   * Load cache from sessionStorage
   * @returns {Object} The loaded cache or an empty object
   */
  function loadFromStorage() {
    const cache = Object.create(null);
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const [key, item] of Object.entries(parsed)) {
          if (
            item &&
            typeof item === 'object' &&
            Object.hasOwn(item, 'data') &&
            Number.isFinite(item.cached) &&
            (item.expires === null ||
              (Number.isFinite(item.expires) && item.expires > Date.now()))
          ) {
            cache[key] = item;
          }
        }
      }
    } catch (e) {
      logService.warn('Failed to load API cache from sessionStorage', e);
    }
    return cache;
  }

  /**
   * Get cache stats
   * @returns {Object} Cache statistics
   */
  function getCacheStats() {
    const totalRequests =
      cacheState.hits + cacheState.misses + cacheState.bypassCount;
    return {
      hits: cacheState.hits,
      misses: cacheState.misses,
      bypassed: cacheState.bypassCount,
      totalRequests,
      hitRate: totalRequests > 0 ? (cacheState.hits / totalRequests) * 100 : 0,
      itemCount: Object.keys(cacheState.cache).length,
    };
  }

  return {
    cacheEnabled,
    getCachedItem,
    setCachedItem,
    clearCache,
    generateCacheKey,
    getCacheStats,
    stats: computed(() => getCacheStats()),
  };
}
