// src/utils/linkUtils.js

/**
 * Utilities for generating external links to databases and resources
 */

/**
 * Generate an external link using a pattern and replacing %s with the value
 * @param {string|number} value - The value to replace %s with in the pattern
 * @param {string} pattern - URL pattern with %s as placeholder
 * @returns {string} - The generated URL
 */
export function generateExternalLink(value, pattern) {
  if (!value || !pattern) return '';
  
  // For HGNC IDs, ensure proper formatting (HGNC:nnnnn)
  if (pattern.includes('genenames.org') && !String(value).startsWith('HGNC:')) {
    // Handle both numeric IDs and IDs that might already have the prefix
    value = String(value).replace(/^HGNC:?/, '');
    value = `HGNC:${value}`;
  }
  
  // Replace the placeholder with the actual value
  return pattern.replace('%s', encodeURIComponent(value));
}

/**
 * Extract coordinates from variant string in VCF-like format (chr-pos-ref-alt)
 * @param {string} variantString - Variant in format like "1-123456-A-G"
 * @returns {Object} - Object with chromosome, position, reference, and alternate alleles
 */
export function parseVariantString(variantString) {
  if (!variantString) return null;
  
  const parts = variantString.split('-');
  if (parts.length < 4) return null;
  
  return {
    chromosome: parts[0],
    position: parts[1],
    reference: parts[2],
    alternate: parts[3],
    // Add useful combinations for different resources
    ensemblRegion: `${parts[0]}:${parts[1]}-${parts[1]}`,
    ucscRegion: `chr${parts[0]}:${parts[1]}-${parts[1]}`,
    gnomadFormat: `${parts[0]}-${parts[1]}-${parts[2]}-${parts[3]}`
  };
}

/**
 * Generate links to external resources for a variant
 * @param {string} variantString - Variant in format like "1-123456-A-G"
 * @returns {Object} - Object with links to different resources
 */
export function generateVariantLinks(variantString, linkPatterns) {
  const parsed = parseVariantString(variantString);
  if (!parsed) return {};
  
  return {
    ensembl: linkPatterns.ensemblVariant.replace('%s', parsed.ensemblRegion),
    ucsc: linkPatterns.ucscGenome.replace('%s', parsed.ucscRegion),
    gnomad: linkPatterns.gnomad.replace('%s', parsed.gnomadFormat)
  };
}
