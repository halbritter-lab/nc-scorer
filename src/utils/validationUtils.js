/**
 * Utility functions for form validation
 * Focuses on reusable validation rules for the application
 */

/**
 * Normalize a variant input to the standard format for submission
 * Converts different VCF formats to hyphen-separated format
 * Strips whitespace from transcript (HGVS) inputs
 * @param {string} value - The variant string to normalize
 * @returns {string} - The normalized variant string
 */
export const normalizeVariant = (value) => {
  if (!value) return value;
  
  // Clean up any leading/trailing whitespace
  let normalized = value.trim();
  
  // Check if it's a VCF format (supporting multiple delimiter styles and optional chr prefix)
  const vcfRegex = /^(chr)?(\d+|[XYM])([-:\s])(\d+)\3([ACGT]+)\3([ACGT]+)$/i;
  const vcfMatch = normalized.match(vcfRegex);
  
  if (vcfMatch) {
    // Extract components and standardize to hyphen format
    // Remove 'chr' prefix if present
    const chrom = vcfMatch[2];
    const pos = vcfMatch[4];
    const ref = vcfMatch[5];
    const alt = vcfMatch[6];
    
    // Construct standardized hyphen-separated format
    return `${chrom}-${pos}-${ref}-${alt}`;
  }
  
  // If it's a transcript-based format (HGVS), just remove all whitespace
  const hgvsRegex = /^([A-Z]+_\d+(\.\d+)?|ENST\d+)(:|\.)([cgnmpr])\./i;
  if (hgvsRegex.test(normalized)) {
    // Remove all whitespace from HGVS notation
    return normalized.replace(/\s+/g, '');
  }
  
  // If it doesn't match any known format, return as is
  return normalized;
};

/**
 * Validate a variant input in VCF or HGVS format
 * Supports multiple VCF formats: "1-55051215-G-GA", "1:55051215:G:GA", "1 55051215 G GA", "chr1-55051215-G-GA"
 * @param {string} value - The variant string to validate
 * @returns {boolean|string} - True if valid, error message string if invalid
 */
export const validateVariant = (value) => {
  if (!value) return 'Variant is required';

  // VCF format validation (Supporting multiple delimiter styles and optional chr prefix)
  // Format: [chr]1[-: ]55051215[-: ][ACGT][-: ][ACGT]+
  const vcfRegex = /^(chr)?(\d+|[XYM])([-:\s])(\d+)\3([ACGT]+)\3([ACGT]+)$/i;
  
  // HGVS format validation (basic structure check)
  // Format: NM_\d+\.\d+:c\.\d+[ACGT]>[ACGT] or similar transcript-based patterns
  const hgvsRegex = /^([A-Z]+_\d+(\.\d+)?|ENST\d+)(:|\.)(c|g|p|m|n|r)\.[^:]+$/i;
  
  if (vcfRegex.test(value) || hgvsRegex.test(value)) {
    return true;
  }
  
  return 'Please enter a valid variant in VCF format (e.g., 1-55051215-G-GA, chr1:55051215:G:GA) or HGVS format (e.g., NM_001009944.3:c.11935C>T)';
};

/**
 * Validate a segregation probability value
 * @param {string|number} value - The segregation probability to validate
 * @returns {boolean|string} - True if valid, error message string if invalid
 */
export const validateSegregation = (value) => {
  // Allow empty value (validation for required is handled separately)
  if (value === '' || value === null || value === undefined) return true;
  
  // Convert to number for validation
  const numValue = Number(value);
  
  // Check if it's a valid number
  if (isNaN(numValue)) {
    return 'Segregation must be a number';
  }
  
  // Check range (0 to 1 inclusive)
  if (numValue < 0 || numValue > 1) {
    return 'Segregation must be between 0 and 1';
  }
  
  return true;
};

/**
 * Validation rule to check if field is required
 * @param {*} value - The value to check
 * @returns {boolean|string} - True if valid, error message if invalid
 */
export const required = (value) => {
  return (value !== null && value !== undefined && value !== '') || 'This field is required';
};
