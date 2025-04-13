// config/geneDetailsConfig.js

// Import external DB URLs from variant config to ensure consistency
import { externalDbUrls } from './variantAnnotationConfig';

// Define the version of the gene details configuration
export const geneDetailsConfigVersion = '0.1.1';

// Define the gene details configuration
export const geneDetailsConfig = {
  hgncIdInt: {
    label: 'HGNC ID',
    format: 'number',
    description: 'The unique identifier for the gene from the HGNC database.',
    visibility: false, // Hidden per request to declutter the interface
    linkPattern: externalDbUrls.hgnc,
  },
  ngs: {
    label: 'Nephro Candidate Gene Score',
    format: 'number',
    description: 'Score indicating the likelihood that the gene is linked to kidney disease.',
    colorThresholds: {
      low: 0.2,
      medium: 0.5,
      high: 0.8,
    },
    round: 2,
    visibility: true,
    style: 'chip',
    font: 'bold',
    isKeyScore: true, // Mark as a key score for visual highlighting
    scoreType: 'gene', // Identify as gene score for consistent coloring
  },
  symbol: {
    label: 'Symbol',
    format: 'text',
    description: 'The official gene symbol.',
    visibility: true,
    style: 'chip',
    font: 'italic',
    linkPattern: externalDbUrls.ensemblGene, // Uses ensembl gene ID which will be replaced with proper HGNC DB link in the component
  },
  geneSet: {
    label: 'Geneset',
    format: 'text',
    description: 'The geneset to which this gene belongs to (e.g. training, testing or none).',
    colorThresholds: {
      low: 'train',
      medium: 'test',
      high: 'none',
    },
    visibility: true,
    style: 'chip',
  },
  evidenceCount: {
    label: 'Evidence Count',
    format: 'number',
    description: 'The number of evidence items associated with this gene.',
    colorThresholds: {
      low: 2,
      high: 4,
    },
    round: 0,
    visibility: true,
    style: 'chip',
    font: 'bold',
  },
  meta: {
    label: 'Meta',
    format: 'object',
    description: 'Meta information about the object, including the date and algorithm.',
    visibility: false,
  },
};
