// config/geneDetailsConfig.js

// Define the version of the gene details configuration
export const geneDetailsConfigVersion = '0.1.0';

// Define the gene details configuration
export const geneDetailsConfig = {
  hgnc_id_int: {
    label: "HGNC ID",
    format: "number",
    description: "The unique identifier for the gene from the HGNC database.",
    visibility: false
  },
  NGS: {
    label: "Nephro Candidate Gene Score",
    format: "number",
    description: "Score indicating the likelihood that the gene is linked to kidney disease.",
    colorThresholds: {
      low: 0.2,
      medium: 0.5,
      high: 0.8
    },
    round: 2,
    visibility: true,
    style: "chip",
    font: "bold"
  },
  symbol: {
    label: "Symbol",
    format: "text",
    description: "The official gene symbol.",
    visibility: true,
    style: "chip",
    font: "italic"
  },
  gene_set: {
    label: "Geneset",
    format: "text",
    description: "The geneset to which this gene belongs to (e.g. training, testing or none).",
    colorThresholds: {
      low: "train",
      medium: "test",
      high: "none"
    },
    visibility: true,
    style: "chip"
  },
  evidence_count: {
    label: "Evidence Count",
    format: "number",
    description: "The number of evidence items associated with this gene.",
    colorThresholds: {
      low: 2,
      high: 4
    },
    round: 0,
    visibility: true,
    style: "chip",
    font: "bold"
  },
  meta: {
    label: "Meta",
    format: "object",
    description: "Meta information about the object, including the date and algorithm.",
    visibility: false
  },
};
