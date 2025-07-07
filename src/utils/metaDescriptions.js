// Automated meta description generation utilities

export function generateGeneDescription(gene) {
  if (!gene) return '';
  
  const parts = [];
  
  // Basic gene info
  parts.push(`${gene.symbol} gene analysis`);
  
  // Add full name if available
  if (gene.name) {
    parts.push(`(${truncate(gene.name, 50)})`);
  }
  
  // Add inheritance pattern
  if (gene.inheritance) {
    parts.push(`with ${gene.inheritance} inheritance`);
  }
  
  // Add associated conditions
  if (gene.phenotypes && gene.phenotypes.length > 0) {
    const conditions = gene.phenotypes.slice(0, 2).join(', ');
    parts.push(`associated with ${truncate(conditions, 60)}`);
  }
  
  // Add scoring context
  parts.push('- View Nephro Candidate Scores and variant analysis');
  
  return cleanDescription(parts.join(' '));
}

export function generateVariantDescription(variant) {
  if (!variant) return '';
  
  const parts = [];
  
  // Variant identifier
  const variantId = variant.id || variant.rsid || variant.hgvs || 'variant';
  parts.push(`Analysis of ${variantId}`);
  
  // Gene context
  if (variant.gene) {
    parts.push(`in ${variant.gene} gene`);
  }
  
  // Consequence
  if (variant.consequence) {
    parts.push(`(${variant.consequence})`);
  }
  
  // Clinical significance
  if (variant.clinicalSignificance) {
    parts.push(`- ${variant.clinicalSignificance}`);
  }
  
  // Population frequency
  if (variant.frequency) {
    const freq = typeof variant.frequency === 'number' 
      ? `${(variant.frequency * 100).toFixed(4)}%` 
      : variant.frequency;
    parts.push(`with population frequency ${freq}`);
  }
  
  // Score mention
  if (variant.score) {
    parts.push(`- NCS: ${variant.score}`);
  }
  
  return cleanDescription(parts.join(' '));
}

export function generateBatchDescription(variants) {
  if (!variants || variants.length === 0) {
    return 'Upload and process multiple genetic variants simultaneously. Support for VCF, CSV, and TSV formats with automated Nephro Candidate Score calculation.';
  }
  
  const uniqueGenes = [...new Set(variants.map(v => v.gene).filter(Boolean))];
  const geneText = uniqueGenes.length > 0 
    ? `across ${uniqueGenes.length} genes including ${uniqueGenes.slice(0, 3).join(', ')}` 
    : '';
  
  return cleanDescription(
    `Analyzing ${variants.length} genetic variants ${geneText}. Export results with comprehensive scoring and clinical annotations.`
  );
}

export function generateSearchDescription(searchTerm, results) {
  if (!searchTerm) {
    return 'Search for genes and genetic variants associated with kidney disease. Get instant Nephro Candidate Scores and clinical annotations.';
  }
  
  if (!results || results.length === 0) {
    return `No results found for "${truncate(searchTerm, 50)}". Try searching with gene symbols, variant IDs, or clinical terms.`;
  }
  
  const resultTypes = {
    genes: results.filter(r => r.type === 'gene').length,
    variants: results.filter(r => r.type === 'variant').length
  };
  
  const parts = [`Found ${results.length} results for "${truncate(searchTerm, 30)}"`];
  
  if (resultTypes.genes > 0) {
    parts.push(`${resultTypes.genes} genes`);
  }
  
  if (resultTypes.variants > 0) {
    parts.push(`${resultTypes.variants} variants`);
  }
  
  parts.push('- Click to view detailed analysis and scores');
  
  return cleanDescription(parts.join(' '));
}

export function generateMethodologyDescription(section) {
  const descriptions = {
    overview: 'Learn about the Nephro Candidate Score (NCS) algorithm for automated genetic variant assessment in chronic kidney disease.',
    scoring: 'Detailed explanation of the NCS scoring methodology including gene-level scores, variant impact assessment, and inheritance patterns.',
    interpretation: 'Guidelines for interpreting Nephro Candidate Scores in clinical context with examples and validation data.',
    limitations: 'Understanding the limitations and appropriate use cases for NC-Scorer in genetic variant prioritization.',
    references: 'Scientific publications and references supporting the Nephro Candidate Score methodology.'
  };
  
  return descriptions[section] || descriptions.overview;
}

// Helper functions
function truncate(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function cleanDescription(text) {
  // Remove extra spaces, ensure proper punctuation
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;])/g, '$1')
    .replace(/([.,;])\s*([.,;])/g, '$1')
    .trim()
    .substring(0, 160);
}

// Generate descriptions for common pages
export const pageDescriptions = {
  home: 'Free online tool for automated assessment of genetic variants in kidney disease using the Nephro Candidate Score (NCS) algorithm. Analyze genes and variants instantly.',
  genes: 'Browse kidney disease-associated genes with inheritance patterns, phenotypes, and variant counts. Access comprehensive genetic data for CKD research.',
  batch: 'Process up to 200 genetic variants simultaneously. Upload VCF, CSV, or TSV files for bulk analysis with automated scoring and export options.',
  about: 'NC-Scorer is developed by the Halbritter Lab at Leipzig University for automated genetic variant assessment in chronic kidney disease research.',
  methodology: 'Scientific methodology behind the Nephro Candidate Score (NCS) for variant prioritization in kidney disease genetics.',
  search: 'Search our comprehensive database of kidney disease genes and variants. Find genetic information with instant scoring and clinical annotations.',
  privacy: 'Privacy policy for NC-Scorer. Learn how we handle genetic data, ensure user privacy, and maintain data security.',
  terms: 'Terms of service for using NC-Scorer. Understand the conditions for accessing our genetic variant analysis tools.',
  notFound: 'Page not found. Return to NC-Scorer home to search for kidney disease genes and variants.'
};

// Generate fallback descriptions based on route
export function getFallbackDescription(route) {
  if (!route) return pageDescriptions.home;
  
  const routeName = route.name || route.path?.split('/')[1] || 'home';
  return pageDescriptions[routeName] || pageDescriptions.home;
}