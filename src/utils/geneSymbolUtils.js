/**
 * Utility functions for working with gene symbols from variant annotations
 */

/**
 * Prioritizes gene symbols from variant annotation data based on:
 * 1. MANE Select transcript status
 * 2. Impact severity (HIGH > MODERATE > LOW > MODIFIER)
 * 3. First gene in the list as fallback
 *
 * @param {Object} variantAnnotation - The variant annotation object from VEP/variant-linker
 * @returns {String} - The prioritized single gene symbol
 */
export function prioritizeGeneSymbol(variantAnnotation) {
  if (!variantAnnotation || !variantAnnotation.transcript_consequences) {
    return '';
  }

  const impactPriority = {
    HIGH: 4,
    MODERATE: 3,
    LOW: 2,
    MODIFIER: 1,
  };

  // First try to find MANE Select transcripts
  const maneSelectTranscripts = variantAnnotation.transcript_consequences.filter(
    (tc) => tc.mane && tc.mane.includes('MANE_Select')
  );

  // If we have MANE Select transcripts, prioritize by impact
  if (maneSelectTranscripts.length > 0) {
    maneSelectTranscripts.sort((a, b) => {
      return (impactPriority[b.impact] || 0) - (impactPriority[a.impact] || 0);
    });
    return maneSelectTranscripts[0].gene_symbol || '';
  }

  // If no MANE Select, prioritize all transcripts by impact
  const sortedTranscripts = [...variantAnnotation.transcript_consequences].sort((a, b) => {
    return (impactPriority[b.impact] || 0) - (impactPriority[a.impact] || 0);
  });

  // Return the gene symbol with highest impact or first one as fallback
  return sortedTranscripts.length > 0 ? sortedTranscripts[0].gene_symbol || '' : '';
}

/**
 * Extracts a prioritized gene symbol from a variant annotation string or object
 *
 * @param {String|Object} annotation - The variant annotation data
 * @returns {String} - The prioritized single gene symbol
 */
export function getPrioritizedGeneSymbol(annotation) {
  if (!annotation) {
    return '';
  }

  // If it's a string, try to parse it
  if (typeof annotation === 'string') {
    try {
      const parsedAnnotation = JSON.parse(annotation);
      if (Array.isArray(parsedAnnotation) && parsedAnnotation.length > 0) {
        return prioritizeGeneSymbol(parsedAnnotation[0]);
      }
      return prioritizeGeneSymbol(parsedAnnotation);
    } catch {
      // If it's a comma-separated string of gene symbols, take the first one
      if (annotation.includes(',')) {
        return annotation.split(',')[0].trim();
      }
      return annotation.trim();
    }
  }

  // If it's an array, process the first item
  if (Array.isArray(annotation) && annotation.length > 0) {
    return prioritizeGeneSymbol(annotation[0]);
  }

  // If it's already an object
  return prioritizeGeneSymbol(annotation);
}
