# Usage

## Basic Usage

After starting the application, navigate to `http://localhost:5173` in your web browser.

## Search Interface

The application provides two search modes:

### Gene Search
1. Enter a gene symbol (e.g., PKD1, COL4A5)
2. Select the gene from autocomplete suggestions
3. View all variants associated with the gene

### Variant Search
1. Enter a variant identifier in one of these formats:
   - HGVS: `NM_001009944.3:c.11798G>A`
   - Genomic: `chr16:2138253:G:A`
   - rsID: `rs121913240`
2. View detailed scoring and annotations

## Understanding Scores

The Nephro Candidate Score (NCS) evaluates variants based on:
- **CADD Score**: Combined Annotation Dependent Depletion
- **Allele Frequency**: Population frequency from gnomAD
- **Clinical Significance**: ClinVar annotations
- **Gene Constraint**: pLI and LOEUF scores
- **Inheritance Pattern**: Dominant/recessive considerations

## Export Options

Results can be exported in multiple formats:
- **CSV/TSV**: For spreadsheet applications
- **JSON**: For programmatic processing
- **VCF**: For genomic analysis pipelines

## Advanced Features

- **Batch Processing**: Process up to 200 variants at once (see [Batch Processing](./batch-processing))
- **API Caching**: Toggle caching in settings for faster repeated queries
- **Theme Toggle**: Switch between light and dark modes