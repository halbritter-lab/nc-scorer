// src/api/variantApi.js
import { toValue } from 'vue';
import { retryWithBackoff } from '@/utils/retry.js';
import { useNotifications } from '@/composables/useNotifications';
import { coordinateCache } from '@/services/coordinateCache.js';
import { fetchGeneDetails } from '@/api/geneApi.js';
import {
  normalizeAssembly,
  UNSUPPORTED_ASSEMBLY_MESSAGE,
} from '@/utils/assemblyUtils.js';

// NOTE: Base URL is now set dynamically in each queryVariant call
// This allows for genome assembly selection (GRCh37 vs GRCh38)
import variableAssignmentConfig from '@/config/scoring/nephro_variant_score/variable_assignment_config.json';
import formulaConfig from '@/config/scoring/nephro_variant_score/formula_config.json';

let variantLinkerModule;

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
 * @param {string} [options.assembly='GRCh38'] - Genome assembly to use ('GRCh37' or 'GRCh38').
 * @param {Object} [options.apiCache=null] - Optional API cache instance from useApiCache composable.
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
    assembly = 'GRCh38', // Default to GRCh38
    signal = null, // Optional AbortSignal for network cancellation
    onRetry = null, // Add callback for retry events
    onSuccess = null, // Add callback for success after retries
    retryState,
    apiCache = null, // Optional API cache instance
  } = options;

  assembly = normalizeAssembly(assembly);
  if (!assembly) throw new Error(UNSUPPORTED_ASSEMBLY_MESSAGE);

  // Initialize notifications system (with fallback for non-component context)
  let notifyRetry, notifySuccess;
  try {
    const notifications = useNotifications();
    notifyRetry = notifications.notifyRetry;
    notifySuccess = notifications.notifySuccess;
  } catch (error) {
    // If we're not in a component context, use console logging instead
    console.debug(
      'variantApi: Running outside component context, notifications disabled',
      error.message,
    );
    notifyRetry = (text, attempt, errorMsg) =>
      console.debug(`Retry ${attempt} for ${text}: ${errorMsg}`);
    notifySuccess = (message) => console.debug(`Success: ${message}`);
  }

  // **Dynamic URL Configuration based on assembly selection**
  const isLocalOrDev =
    import.meta.env.DEV ||
    (typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'));
  let baseUrl;

  if (isLocalOrDev) {
    baseUrl = assembly === 'GRCh37' ? '/ensembl_grch37' : '/ensembl';
  } else {
    baseUrl =
      assembly === 'GRCh37'
        ? 'https://grch37.rest.ensembl.org'
        : 'https://rest.ensembl.org';
  }

  // The Vite adapter consumes this internal option before serializing the query.
  // Keep routing local to each analysis, including overlapping assembly requests.
  const requestRecoderOptions = {
    ...recoderOptions,
    __ncEnsemblBaseUrl: baseUrl,
  };
  const requestVepOptions = { ...vepOptions, __ncEnsemblBaseUrl: baseUrl };

  // Determine if this is a batch request
  const isBatchRequest = Array.isArray(variantInput);

  // For batch requests, disable cache for simplicity
  if (isBatchRequest || toValue(apiCache?.cacheEnabled) === false) {
    skipCache = true;
  }

  // Normalize variant ID to use as cache key (only for single variant requests)
  const normalizedInput = isBatchRequest ? null : variantInput.trim();

  // Check coordinate cache for accelerated HGVS-to-VCF translation
  let queryInput = normalizedInput;
  let isAccelerated = false;
  if (!skipCache && !isBatchRequest && normalizedInput) {
    const cachedVcf = coordinateCache.getVcf(normalizedInput, assembly);
    if (cachedVcf) {
      queryInput = cachedVcf;
      isAccelerated = true;
    }
  }

  // Create cache parameters object with options that affect the response
  const cacheParams = {
    recoderOptions,
    vepOptions,
    output,
    filter,
    assembly, // Include assembly in cache key to avoid cross-contamination
  };

  // Initialize cache key and cached result (only for single variant requests)
  let cacheKey = null;
  let cachedResult = null;

  // Only attempt to use cache if not explicitly skipping and not a batch request
  // Check cache first if we have a valid apiCache instance
  if (!skipCache && !isBatchRequest && apiCache) {
    // Generate cache key and check for cached result
    cacheKey = apiCache.generateCacheKey(
      'variant',
      normalizedInput,
      cacheParams,
    );
    cachedResult = apiCache.getCachedItem(cacheKey);

    if (cachedResult) {
      return cachedResult; // Returns {data, source} object
    }
  }

  // Prefetch only on an annotation cache miss and when caching is enabled.
  if (!skipCache && isAccelerated && apiCache) {
    const prefetchGene = coordinateCache.getGeneSymbol(
      normalizedInput,
      assembly,
    );
    if (prefetchGene)
      fetchGeneDetails(prefetchGene, { apiCache }).catch(() => {});
  }

  // Load the analysis engine only when an uncached variant is analyzed.
  variantLinkerModule ||= import('variant-linker').catch((error) => {
    variantLinkerModule = null;
    throw error;
  });
  const { default: variantLinker } = await variantLinkerModule;
  if (typeof variantLinker.analyzeVariant !== 'function') {
    throw new Error(
      'analyzeVariant is not a function. Check the variant-linker module exports.',
    );
  }

  // Parse the scoring configuration using the provided scoring config JSON files.
  const scoringConfig = variantLinker.scoring.parseScoringConfig(
    variableAssignmentConfig,
    formulaConfig,
  );

  const combinedRequestOptions = {
    ...options.requestOptions,
    baseUrl,
    assembly,
    ...(signal ? { signal } : {}),
  };

  return retryWithBackoff(
    async () => {
      // Return the result of the variant analysis
      let result;
      if (isBatchRequest) {
        // For batch requests, use the variants parameter
        result = await variantLinker.analyzeVariant({
          variants: variantInput, // Pass the array of variants
          recoderOptions: requestRecoderOptions,
          vepOptions: requestVepOptions,
          requestOptions: combinedRequestOptions,
          scoringConfig,
          cache: false,
          output,
          filter,
        });
      } else {
        // For single variant requests
        result = await variantLinker.analyzeVariant({
          variant: queryInput,
          recoderOptions: requestRecoderOptions,
          vepOptions: requestVepOptions,
          requestOptions: combinedRequestOptions,
          scoringConfig,
          cache: false,
          output,
          filter,
        });
      }

      // Store successful result in cache and get response with source info (only for single variants)
      if (result && !isBatchRequest) {
        // If accelerated from HGVS to VCF, attach original notation metadata
        if (isAccelerated) {
          if (Array.isArray(result)) {
            result.forEach((item) => {
              item.originalInput = normalizedInput;
              item.vcfString = queryInput;
            });
          } else if (typeof result === 'object') {
            result.originalInput = normalizedInput;
            result.vcfString = queryInput;
          }
        }

        // Extract resolved genomic coordinates and gene symbol to warm coordinate cache
        const topItem = Array.isArray(result) ? result[0] : result;
        const anno = topItem?.annotationData?.[0];
        const vcfKey =
          topItem?.variantKey ||
          anno?.variantKey ||
          (isAccelerated ? queryInput : null);
        let rawGene =
          anno?.gene_symbol ||
          topItem?.geneSymbol ||
          topItem?.gene_symbol ||
          null;
        if (Array.isArray(rawGene)) {
          rawGene = rawGene[0];
        }
        const geneSymbol = typeof rawGene === 'string' ? rawGene.trim() : null;

        const resolvedKeys = new Set(
          (Array.isArray(result) ? result : [result])
            .flatMap((item) => item?.annotationData || [])
            .map((annotation) => annotation?.variantKey)
            .filter(Boolean),
        );
        const hasSingleResolution =
          (!Array.isArray(result) || result.length === 1) &&
          resolvedKeys.size <= 1;
        if (
          !skipCache &&
          toValue(apiCache?.cacheEnabled) !== false &&
          vcfKey &&
          hasSingleResolution
        ) {
          coordinateCache.set(normalizedInput, vcfKey, geneSymbol, assembly);
          if (normalizedInput !== queryInput) {
            coordinateCache.set(queryInput, vcfKey, geneSymbol, assembly);
          }
        }

        if (!skipCache && apiCache) {
          if (cacheKey) {
            apiCache.setCachedItem(cacheKey, result, cacheTTL);
          }
          return {
            data: result,
            source: { fromCache: false, accelerated: isAccelerated },
          };
        }
      }

      // If skipCache is true or it's a batch request, return result with source info
      return {
        data: result,
        source: { fromCache: false, accelerated: isAccelerated },
      };
    },
    {
      retryState,
      maxRetries: options.maxRetries ?? 3,
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
        const notificationText = isBatchRequest
          ? 'batch variant request'
          : normalizedInput;
        notifyRetry(notificationText, attempt, error.message);

        // Call the user-provided onRetry callback if supplied
        if (onRetry) onRetry(error, attempt);
      },
      onSuccess: (attempts) => {
        if (attempts > 0) {
          const notificationText = isBatchRequest
            ? 'batch variant request'
            : normalizedInput;
          notifySuccess(
            `Successfully analyzed ${notificationText} after ${attempts} retries`,
          );
        }

        // Call the user-provided onSuccess callback if supplied
        if (onSuccess) onSuccess(attempts);
      },
    },
  );
}
