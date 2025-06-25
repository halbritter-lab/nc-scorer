// src/api/geneApi.js
import axios from 'axios';
import { logService } from '@/services/logService';
import geneApiConfig from '@/config/geneApiConfig.json';
import { retryWithBackoff } from '@/utils/retry.js';

/**
 * Fetch the index of gene symbols.
 * @returns {Promise<Array>} The symbols index.
 */
export async function fetchSymbolsIndex() {
  return retryWithBackoff(async () => {
    const response = await axios.get(geneApiConfig.symbolsIndexUrl);
    return response.data;
  });
}

/**
 * Fetch the index of HGNC IDs.
 * @returns {Promise<Array>} The HGNC ID index.
 */
export async function fetchHgncIndex() {
  return retryWithBackoff(async () => {
    const response = await axios.get(geneApiConfig.hgncIndexUrl);
    return response.data;
  });
}

/**
 * Fetch both symbol and HGNC indices for gene search.
 * This function retrieves both indices in parallel and returns them together.
 * @param {Object} [options={}] - Options for fetching indices.
 * @param {boolean} [options.skipCache=false] - If true, bypasses cache.
 * @param {Object} [options.apiCache=null] - Optional API cache instance from useApiCache composable.
 * @returns {Promise<Object>} Object containing both symbol and HGNC indices.
 */
export async function fetchGeneSearchIndices(options = {}) {
  const { skipCache = false, apiCache = null } = options;
  
  // Create cache variables
  let cacheKey = null;
  let cachedResult = null;
  
  // Only attempt to use cache if not explicitly skipping and we have an apiCache instance
  if (!skipCache && apiCache) {
    // Create cache key
    cacheKey = apiCache.generateCacheKey('gene-search-indices');
    
    cachedResult = apiCache.getCachedItem(cacheKey);
    if (cachedResult) {
      return cachedResult.data;
    }
  }
  
  try {
    // Fetch both indices in parallel
    const [symbolsIndex, hgncIndex] = await Promise.all([
      fetchSymbolsIndex(),
      fetchHgncIndex()
    ]);
    
    // Create a mapping from HGNC ID to symbol
    const hgncToSymbolMap = {};
    hgncIndex.forEach((hgncItem, index) => {
      // Assuming the indices are aligned (same order)
      if (index < symbolsIndex.length) {
        const symbol = symbolsIndex[index];
        hgncToSymbolMap[hgncItem] = symbol;
      }
    });
    
    // Create the combined list for autocomplete
    const combinedItems = symbolsIndex.map((symbol, index) => {
      const hgncId = index < hgncIndex.length ? hgncIndex[index] : null;
      return {
        symbol,
        hgncId,
        display: hgncId ? `${symbol} (HGNC:${hgncId})` : symbol
      };
    });
    
    const result = {
      symbolsIndex,
      hgncIndex,
      hgncToSymbolMap,
      combinedItems
    };
    
    // Cache the result
    if (!skipCache && cacheKey && apiCache) {
      apiCache.setCachedItem(cacheKey, result, 24 * 60 * 60 * 1000); // 24 hours
    }
    
    return result;
  } catch (error) {
    logService.error('Error fetching gene search indices:', error);
    throw error;
  }
}

/**
 * Fetch detailed gene data for a given symbol.
 * @param {string} symbol - The gene symbol.
 * @param {Object} [options={}] - Options for fetching gene details.
 * @param {Object} [options.retryState] - State for tracking retries.
 * @param {Function} [options.onRetry] - Callback on retry.
 * @param {Function} [options.onSuccess] - Callback on success.
 * @param {boolean} [options.skipCache=false] - If true, bypasses cache.
 * @param {number} [options.cacheTTL] - Cache time to live in ms.
 * @returns {Promise<Object>} The gene data with source information.
 */
/**
 * Fetch all gene scores from the summary JSON file.
 * @param {Object} [options={}] - Options for fetching gene scores.
 * @param {Object} [options.retryState] - State for tracking retries.
 * @param {Function} [options.onRetry] - Callback on retry.
 * @param {Function} [options.onSuccess] - Callback on success.
 * @param {boolean} [options.skipCache=false] - If true, bypasses cache.
 * @param {number} [options.cacheTTL] - Cache time to live in ms.
 * @param {Object} [options.apiCache=null] - Optional API cache instance from useApiCache composable.
 * @returns {Promise<Object>} The gene scores data with source information.
 */
export async function fetchAllGeneScores(options = {}) {
  const { 
    retryState, 
    onRetry, 
    onSuccess, 
    skipCache = false,
    cacheTTL = 12 * 60 * 60 * 1000, // 12 hours default
    apiCache = null
  } = options;
  
  // Cache variables at the top function scope
  let cacheKey = null;
  
  // Only attempt to use cache if not skipping and we have an apiCache instance
  if (!skipCache && apiCache) {
    // Create cache key for all gene scores
    cacheKey = apiCache.generateCacheKey('gene-scores-all', 'summary');
    
    // Check cache first
    const cachedResult = apiCache.getCachedItem(cacheKey);
    if (cachedResult) {
      return cachedResult; // Returns {data, source} object
    }
  }
  
  return retryWithBackoff(
    async () => {
      // Fetch the gene info summary file
      const response = await axios.get(geneApiConfig.geneInfoSummaryUrl);
      const result = response.data;
      
      // Store successful result in cache and get response with source info
      if (result && !skipCache && cacheKey && apiCache) {
        return apiCache.setCachedItem(cacheKey, result, cacheTTL); // Returns {data, source} object
      }
      
      // If skipCache is true, still return with source info
      return { 
        data: result, 
        source: { fromCache: false } 
      };
    },
    {
      maxRetries: 3,
      initialDelay: 500,
      maxDelay: 5000,
      onRetry: (error, attempt) => {
        logService.warn(`Retry attempt ${attempt} for gene scores summary after error: ${error.message}`);
        if (onRetry) onRetry(error, attempt);
      },
      onSuccess: (attempts) => {
        if (attempts > 0) {
          logService.info(`Successfully fetched gene scores summary after ${attempts} retries`);
        }
        if (onSuccess) onSuccess(attempts);
      },
      retryState, // Pass through retry state if provided
    }
  );
}

/**
 * Fetch detailed gene data for a given symbol.
 * @param {string} symbol - The gene symbol.
 * @param {Object} [options={}] - Options for fetching gene details.
 * @param {Object} [options.retryState] - State for tracking retries.
 * @param {Function} [options.onRetry] - Callback on retry.
 * @param {Function} [options.onSuccess] - Callback on success.
 * @param {boolean} [options.skipCache=false] - If true, bypasses cache.
 * @param {number} [options.cacheTTL] - Cache time to live in ms.
 * @param {Object} [options.apiCache=null] - Optional API cache instance from useApiCache composable.
 * @returns {Promise<Object>} The gene data with source information.
 */
export async function fetchGeneDetails(symbol, options = {}) {
  const { 
    retryState, 
    onRetry, 
    onSuccess, 
    skipCache = false,
    cacheTTL = 30 * 60 * 1000, // 30 minutes default
    apiCache = null
  } = options;
  
  // Cache variables at the top function scope
  let cacheKey = null;
  
  // Only attempt to use cache if not skipping and we have an apiCache instance
  if (!skipCache && apiCache) {
    // Normalize symbol and create cache key
    const normalizedSymbol = symbol.trim().toUpperCase();
    cacheKey = apiCache.generateCacheKey('gene', normalizedSymbol);
    
    // Check cache first
    const cachedResult = apiCache.getCachedItem(cacheKey);
    if (cachedResult) {
      return cachedResult; // Returns {data, source} object
    }
  }
  
  return retryWithBackoff(
    async () => {  
      // Construct the URL using the base URL from config and the symbol.
      const url = `${geneApiConfig.geneDetailsBaseUrl}${symbol}.json`;
      const response = await axios.get(url);
      const result = response.data;
      
      // Store successful result in cache and get response with source info
      if (result && !skipCache && cacheKey && apiCache) {
        return apiCache.setCachedItem(cacheKey, result, cacheTTL); // Returns {data, source} object
      }
      
      // If skipCache is true, still return with source info
      return { 
        data: result, 
        source: { fromCache: false } 
      };
    },
    {
      maxRetries: 3,
      initialDelay: 500,
      maxDelay: 5000,
      // Use our refined shouldRetry logic from the utility
      // This will automatically handle network errors and specific HTTP status codes
      shouldRetry: (error) => {
        // Don't retry 404 errors for genes - likely the gene symbol doesn't exist
        if (error.response && error.response.status === 404) {
          logService.debug(`Gene symbol '${symbol}' not found (404)`);
          return false;
        }
        // Default retry logic will handle other error types
        return undefined; // Use the default logic from retry.js
      },
      onRetry: (error, attempt) => {
        logService.warn(`Retry attempt ${attempt} for gene ${symbol} after error: ${error.message}`);
        if (onRetry) onRetry(error, attempt);
      },
      onSuccess: (attempts) => {
        if (attempts > 0) {
          logService.info(`Successfully fetched gene ${symbol} after ${attempts} retries`);
        }
        if (onSuccess) onSuccess(attempts);
      },
      retryState, // Pass through retry state if provided
    }
  );
}
