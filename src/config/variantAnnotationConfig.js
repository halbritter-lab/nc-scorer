// src/config/variantAnnotationConfig.js

export const variantAnnotationConfigVersion = '0.1.0';

export const variantAnnotationConfig = {
  transcript_id: {
    label: 'Transcript ID',
    format: 'text',
    description: 'Transcript Identifier',
    visibility: false,
  },
  gene_id: {
    label: 'Gene ID',
    format: 'text',
    description: 'Ensembl Gene Identifier',
    visibility: false,
  },
  hgnc_id: {
    label: 'HGNC ID',
    format: 'text',
    description: 'HGNC Identifier',
    visibility: false,
  },
  gene_symbol: {
    label: 'Gene Symbol',
    format: 'text',
    description: 'Official gene symbol',
    visibility: true,
    style: 'chip',
    font: 'italic',
  },
  impact: {
    label: 'Impact',
    format: 'text',
    description: 'Predicted impact of the variant',
    visibility: true,
  },
  source: {
    label: 'Source',
    format: 'text',
    description: 'Data source',
    visibility: false,
  },
  biotype: {
    label: 'Biotype',
    format: 'text',
    description: 'Transcript biotype',
    visibility: false,
  },
  given_ref: {
    label: 'Given Reference',
    format: 'text',
    description: 'Reference allele provided',
    visibility: false,
  },
  gene_symbol_source: {
    label: 'Gene Symbol Source',
    format: 'text',
    description: 'Source for gene symbol',
    visibility: false,
  },
  variant_allele: {
    label: 'Variant Allele',
    format: 'text',
    description: 'Alternate allele',
    visibility: false,
  },
  cadd_phred: {
    label: 'CADD Phred Score',
    format: 'number',
    description: 'CADD phred score',
    round: 2,
    visibility: true,
    style: 'chip',
    font: 'bold',
  },
  consequence_terms: {
    label: 'Consequence Terms',
    format: 'array',
    description: 'Sequence ontology terms for the variant',
    visibility: true,
  },
  cadd_raw: {
    label: 'CADD Raw Score',
    format: 'number',
    description: 'CADD raw score',
    round: 2, // Standardized to 2 decimal places
    visibility: false,
  },
  hgvsc: {
    label: 'HGVSc',
    format: 'text',
    description: 'cDNA change',
    visibility: true,
  },
  mane_select: {
    label: 'MANE Select',
    format: 'text',
    description: 'MANE Select transcript',
    visibility: true,
  },
  used_ref: {
    label: 'Used Reference',
    format: 'text',
    description: 'The reference allele used',
    visibility: false,
  },
};
