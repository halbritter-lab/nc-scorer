// src/api/variantApi.js
// Import variant-linker with proper compatibility for Vite
import variantLinker from 'variant-linker';

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
    throw new Error(
      'analyzeVariant is not a function. Check the variant-linker module exports.'
    );
  }

  // Parse the scoring configuration using the provided scoring config JSON files.
  const scoringConfig = variantLinker.scoring.parseScoringConfig(variableAssignmentConfig, formulaConfig);

  return await variantLinker.analyzeVariant({
    variant: variantInput,
    recoderOptions,
    vepOptions,
    scoringConfig, // Pass the parsed scoring configuration
    cache,
    output,
    filter,
  });
}
