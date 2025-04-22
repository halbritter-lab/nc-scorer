// src/api/variantApi.js
// Import variant-linker with proper compatibility for Vite
import variantLinker from 'variant-linker';
import { retryWithBackoff } from '@/utils/retry.js';
import { useApiCache } from '@/composables/useApiCache';
import { useNotifications } from '@/composables/useNotifications';

// Ensure module is available globally for proper initialization
window.variantLinker = variantLinker;

// Configure variant-linker to use our proxy only in development mode
if (variantLinker.config && typeof variantLinker.config.setBaseUrl === 'function') {
  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV;

  if (isDevelopment) {
    // In development: use the proxy to avoid CORS issues
    variantLinker.config.setBaseUrl('ensembl');
  } else {
    // In production: use the default Ensembl API directly
    // This will work on GitHub Pages if they allow CORS from github.io domains
    variantLinker.config.setBaseUrl('https://rest.ensembl.org');
  }
}
import variableAssignmentConfig from '@/config/scoring/nephro_variant_score/variable_assignment_config.json';
import formulaConfig from '@/config/scoring/nephro_variant_score/formula_config.json';

/**
 * Query variant-linker to analyze a genetic variant.
 * Implements client-side caching to improve performance and reduce API load.
 *
 * @param {string|string[]} variantInput - The variant to analyze (in VCF or HGVS format).
 *                                        Can be a single string or an array of variants.
 * @param {Object} [options={}] - Optional parameters to control analysis.
 * @param {Object} [options.recoderOptions={ vcf_string: '1' }] - Options for Variant Recoder.
 * @param {Object} [options.vepOptions={ CADD: '1', hgvs: '1', merged: '1', mane: '1' }] - Options for VEP annotation.
 * @param {boolean} [options.skipCache=false] - If true, always bypasses client-side cache.
 * @param {number} [options.cacheTTL=1800000] - Cache time to live in ms (default 30min).
 * @param {string} [options.output='JSON'] - Desired output format ('JSON', 'CSV', 'TSV', 'VCF').
 * @param {string} [options.filter=''] - Filtering criteria as a string.
 * @returns {Promise<Object|string>} The result of the variant analysis. Returns object/array for JSON or string for other formats.
 * @throws {Error} If analyzeVariant is not a function on the variant-linker module.
 */
export async function queryVariant(variantInput, options = {}) {
  let {
    recoderOptions = { vcf_string: '1' },
    vepOptions = { CADD: '1', hgvs: '1', merged: '1', mane: '1' },
    skipCache = false, // New option to explicitly skip cache if needed
    cacheTTL = 30 * 60 * 1000, // 30 minutes in milliseconds
    output = 'JSON',
    filter = '',
    onRetry = null, // Add callback for retry events
    onSuccess = null, // Add callback for success after retries
  } = options;

  // Initialize the API cache and notifications system
  const apiCache = useApiCache();
  const { notifyRetry, notifySuccess } = useNotifications();

  // Determine if this is a batch request
  const isBatchRequest = Array.isArray(variantInput);

  // For batch requests, disable cache for simplicity
  if (isBatchRequest) {
    skipCache = true;
  }
  
  // Normalize variant ID to use as cache key (only for single variant requests)
  const normalizedInput = isBatchRequest ? null : variantInput.trim();

  // Create cache parameters object with options that affect the response
  const cacheParams = {
    recoderOptions,
    vepOptions,
    output,
    filter,
  };

  // Generate a unique cache key for this request
  const cacheKey = apiCache.generateCacheKey('variant', normalizedInput, cacheParams);
  
  // Check cache first if not explicitly skipping
  if (!skipCache) {
    const cachedResult = apiCache.getCachedItem(cacheKey);
    if (cachedResult) {
      return cachedResult; // Returns {data, source} object
    }
  }

  if (typeof variantLinker.analyzeVariant !== 'function') {
    throw new Error('analyzeVariant is not a function. Check the variant-linker module exports.');
  }

  // Parse the scoring configuration using the provided scoring config JSON files.
  const scoringConfig = variantLinker.scoring.parseScoringConfig(
    variableAssignmentConfig,
    formulaConfig
  );

  return retryWithBackoff(
    async () => {
      // Return the result of the variant analysis
      // Return the result of the variant analysis
      let result;
      if (isBatchRequest) {
        // For batch requests, use the variants parameter
        result = await variantLinker.analyzeVariant({
          variants: variantInput, // Pass the array of variants
          recoderOptions,
          vepOptions,
          scoringConfig,
          cache: false,
          output,
          filter,
        });
      } else {
        // For single variant requests
        result = await variantLinker.analyzeVariant({
          variant: normalizedInput,
          recoderOptions,
          vepOptions,
          scoringConfig,
          cache: false,
          output,
          filter,
        });
      }
      
      // Store successful result in cache and get response with source info (only for single variants)
      if (result && !skipCache && !isBatchRequest) {
        return apiCache.setCachedItem(cacheKey, result, cacheTTL); // Returns {data, source} object
      }

      // If skipCache is true or it's a batch request, return result with source info
      // For batch requests with non-JSON output formats, result may be a string
      return { 
        data: result, 
        source: { fromCache: false } 
      };
    },
    {
      maxRetries: 3,
      initialDelay: 500,
      maxDelay: 5000,
      // Custom error configuration for variant-specific behavior
      errorConfig: {
        // Define non-retryable 4xx status codes specifically for variant API
        nonRetryableStatusCodes: [400, 401, 403, 404, 405, 422],
        // Define retryable status codes, particularly for rate-limiting
        retryableStatusCodes: [429, 500, 501, 502, 503, 504],
      },
      onRetry: (error, attempt) => {
        // Only show a snackbar notification about the retry
        const notificationText = isBatchRequest ? 'batch variant request' : normalizedInput;
        notifyRetry(notificationText, attempt, error.message);

        // Call the user-provided onRetry callback if supplied
        if (onRetry) onRetry(error, attempt);
      },
      onSuccess: (result, attempts) => {
        if (attempts > 0) {
          const notificationText = isBatchRequest ? 'batch variant request' : normalizedInput;
          notifySuccess(
            `Successfully analyzed ${notificationText} after ${attempts} retries`
          );
        }

        // Call the user-provided onSuccess callback if supplied
        if (onSuccess) onSuccess(attempts);
      },
    }
  );
}
