# Batch Processing

NC-Scorer includes a powerful batch processing feature to analyze multiple variants simultaneously.

## Accessing Batch Mode

Click the "Batch" item in the main navigation menu or navigate to `/batch`.

## Input Format

Enter variants one per line with optional inheritance and segregation data:

```
# Basic format (variant only)
NM_001009944.3:c.11798G>A

# With inheritance pattern
NM_001009944.3:c.11798G>A	Inherited dominant

# With inheritance and segregation
NM_001009944.3:c.11798G>A	Inherited dominant	0.05
```

### Supported Variant Formats

- **HGVS**: `NM_001009944.3:c.11798G>A`
- **Genomic**: `chr16:2138253:G:A`
- **rsID**: `rs121913240`

### Inheritance Patterns

- Denovo
- Inherited dominant
- Homozygous recessive
- Compound heterozygous (confirmed/suspected)
- X-linked dominant/recessive
- Unknown

## Processing

1. Enter variants in the text area
2. Or click "Fill with Examples" for sample data
3. Select output format (CSV, TSV, JSON, VCF)
4. Click "Process & Download"

## Limits

- Maximum 200 variants per batch
- Processing time depends on API response times
- Progress indicator shows current status

## Export Formats

### CSV/TSV
Spreadsheet-compatible format with all scores and annotations.

### JSON
Structured data format for programmatic processing:
```json
{
  "variant": "NM_001009944.3:c.11798G>A",
  "gene": "PKD1",
  "scores": {
    "ncs": 8.5,
    "gene": 0.9,
    "variant": 0.85,
    "inheritance": 0.8
  }
}
```

### VCF
Standard variant call format for genomic pipelines.

## Tips

- Pre-validate variant formats to avoid errors
- Include segregation data for inherited patterns to avoid penalties
- Use consistent inheritance terminology
- Export results immediately after processing