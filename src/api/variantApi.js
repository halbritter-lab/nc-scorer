// src/api/variantApi.js
// Import variant-linker with proper compatibility for Vite
import variantLinker from 'variant-linker';
import { retryWithBackoff } from '@/utils/retry.js';

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
import variableAssignmentConfig from '@/config/scoring/nephro_variant_score_gnomadg_missing/variable_assignment_config.json';
import formulaConfig from '@/config/scoring/nephro_variant_score_gnomadg_missing/formula_config.json';

/**
 * Query variant-linker to analyze a genetic variant.
 *
 * @param {string} variantInput - The variant to analyze (in VCF or HGVS format).
 * @param {Object} [options={}] - Optional parameters to control analysis.
 * @param {Object} [options.recoderOptions={ vcf_string: '1' }] - Options for Variant Recoder.
 * @param {Object} [options.vepOptions={ CADD: '1', hgvs: '1', merged: '1', mane: '1' }] - Options for VEP annotation.
 * @param {boolean} [options.cache=false] - Whether to enable caching of API responses.
 * @param {string} [options.output='JSON'] - Desired output format ('JSON', 'CSV', etc.).
 * @param {string} [options.filter=''] - Filtering criteria as a string.
 * @returns {Promise<Object>} The result of the variant analysis.
 * @throws {Error} If analyzeVariant is not a function on the variant-linker module.
 */
export async function queryVariant(variantInput, options = {}) {
  const {
    recoderOptions = { vcf_string: '1' },
    vepOptions = { CADD: '1', hgvs: '1', merged: '1', mane: '1' },
    cache = false,
    output = 'JSON',
    filter = '',
  } = options;

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
      return await variantLinker.analyzeVariant({
        variant: variantInput,
        recoderOptions,
        vepOptions,
        scoringConfig, // Pass the parsed scoring configuration
        cache,
        output,
        filter,
      });
    },
    {
      maxRetries: 3,
      initialDelay: 500,
      maxDelay: 5000,
      shouldRetry: (error) => {
        // Variant-specific handling
        if (error.response) {
          // Don't retry badly formatted variant IDs (likely 400 errors)
          if (error.response.status === 400) {
            console.debug(`Bad variant format for '${variantInput}' (400)`);
            return false;
          }
          
          // Don't retry if the variant doesn't exist in the database
          if (error.response.status === 404) {
            console.debug(`Variant '${variantInput}' not found (404)`);
            return false;
          }
          
          // Explicitly retry rate limiting and gateway timeouts
          if (error.response.status === 429 || error.response.status === 504) {
            console.debug(`Retrying rate limit/timeout for variant ${variantInput}`);
            return true;
          }
          
          // Retry server errors
          if (error.response.status >= 500 && error.response.status < 600) {
            console.debug(`Retrying server error (${error.response.status}) for variant ${variantInput}`);
            return true;
          }
          
          // Don't retry other client errors (4xx)
          if (error.response.status >= 400 && error.response.status < 500) {
            console.debug(`Not retrying client error (${error.response.status}) for variant ${variantInput}`);
            return false;
          }
        }
        
        // Handle network errors
        const isNetworkError = !error.response && (
          error.message.includes('network') ||
          error.message.includes('timeout') ||
          error.message.includes('Failed to fetch') ||
          error.code === 'ECONNABORTED' ||
          error.code === 'ECONNREFUSED' ||
          error.code === 'ECONNRESET' ||
          error.message.includes('Network Error') ||
          error instanceof TypeError
        );
        
        if (isNetworkError) {
          console.debug(`Retrying network error for variant ${variantInput}: ${error.message}`);
          return true;
        }
        
        // Default to not retrying for any other cases
        return false;
      },
      onRetry: (error, attempt) => {
        console.warn(
          `Retry attempt ${attempt} for variant ${variantInput} after error: ${error.message}`
        );
      },
      onSuccess: (attempts) => {
        if (attempts > 0) {
          console.info(`Successfully analyzed variant ${variantInput} after ${attempts} retries`);
        }
      },
    }
  );
}
