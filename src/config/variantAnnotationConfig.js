// src/config/variantAnnotationConfig.js

export const variantAnnotationConfigVersion = '0.1.1';

// External database URL patterns
export const externalDbUrls = {
  ensemblGene: 'https://ensembl.org/Homo_sapiens/Gene/Summary?g=%s',
  ensemblTranscript: 'https://ensembl.org/Homo_sapiens/Transcript/Summary?t=%s',
  ensemblVariant: 'https://ensembl.org/Homo_sapiens/Location/View?r=%s', // Expects format: chr:start-end
  hgnc: 'https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/%s',
  gnomad: 'https://gnomad.broadinstitute.org/variant/%s', // Expects format: chr-pos-ref-alt
  ucscGenome: 'https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg38&position=%s' // Expects format: chr:start-end
};

export const variantAnnotationConfig = {
  transcript_id: {
    label: 'Transcript ID',
    format: 'text',
    description: 'Transcript Identifier',
    visibility: true,
    linkPattern: externalDbUrls.ensemblTranscript,
  },
  gene_id: {
    label: 'Gene ID',
    format: 'text',
    description: 'Ensembl Gene Identifier',
    visibility: false,
    linkPattern: externalDbUrls.ensemblGene,
  },
  hgnc_id: {
    label: 'HGNC ID',
    format: 'text',
    description: 'HGNC Identifier',
    visibility: true,
    linkPattern: externalDbUrls.hgnc,
  },
  gene_symbol: {
    label: 'Gene Symbol',
    format: 'text',
    description: 'Official gene symbol',
    visibility: false, // Changed to false to remove redundancy in transcript details
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
    visibility: false, // Keep hidden to reduce clutter
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
    visibility: false, // Keep hidden as cadd_phred is more meaningful
  },
  hgvsc: {
    label: 'HGVSc',
    format: 'text',
    description: 'cDNA change',
    visibility: true,
  },
  hgvsp: {
    label: 'HGVSp',
    format: 'text',
    description: 'Protein change',
    visibility: true,
    style: 'chip',
    font: 'bold',
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
    visibility: false, // Keep hidden to reduce clutter
  },
};
