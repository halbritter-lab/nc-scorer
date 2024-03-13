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
  NCS: {
    label: "Nephro Candidate Score",
    format: "number",
    description: "Score based on the likelihood that the gene is linked to kidney disease.",
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
  geneset: {
    label: "Geneset",
    format: "text",
    description: "The geneset to which this gene belongs.",
    colorThresholds: {
      low: "train",
      medium: "test",
      high: "None"
    },
    visibility: true,
    style: "chip"
  }
};
