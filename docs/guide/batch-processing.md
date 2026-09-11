# Batch Processing

Use **Batch** in the application navigation to score up to **200 variants** in one run. Each line is processed as a separate assessment.

## Accessing Batch Mode

Click **Batch** in the main navigation menu or open the application's `/batch` page.

## Input Format

Enter one variant per line. Optional inheritance and segregation values follow the variant, separated by **tab characters**:

```text
1-55051215-G-GA	Inherited dominant	0.05
NM_001009944.3:c.11935C>T	Inherited dominant
NM_033380.3:c.1871G>A	Denovo
```

Paste the lines without a header or comment lines. Blank lines are ignored. A variant alone is also accepted: omitted inheritance becomes **Unknown**, and omitted segregation is treated as missing.

### Supported Variant Formats

- **HGVS**: `NM_001009944.3:c.11935C>T`
- **VCF-style identifier**: `1-55051215-G-GA`

### Inheritance Patterns

- Denovo
- Inherited dominant
- Homozygous recessive
- X-linked dominant
- X-linked recessive
- Unknown

Use these exact labels. For a compound heterozygous assessment with two variants, use **Score a variant** on the home page; the batch format has no second-variant column.

Segregation values must be between **0 and 1**. When a pattern expects segregation evidence and the value is missing, the inheritance component receives a **20% reduction**. See [Usage](./usage#segregation-evidence) for how the value is interpreted.

## Processing

1. Paste your lines, or select one of the example-list buttons.
2. Choose **GRCh38 / hg38** or **GRCh37 / hg19**. One assembly applies to the whole run, so separate lists that use different assemblies.
3. Select **Process Variants**.
4. Review the **Batch Results** table as rows appear. Requests run sequentially, and progress depends on external API response times.
5. Check any error icons and unavailable (`N/A`) scores, then open **Download** to save the results.

**Filter Results** helps find rows in the table. Downloads contain all result rows collected so far, including rows outside the current filter or page. Wait until processing finishes to export the full run. **Clear Results** discards the displayed results and stops further rows from being added to that run.

## Limits

- Maximum 200 variants per batch
- Processing time depends on API response times
- Progress indicator shows current status

## Export Formats

| Format | Contents                                                                           |
| ------ | ---------------------------------------------------------------------------------- |
| CSV    | Variant, gene symbol, NCS, gene score, variant score, and inheritance score        |
| TSV    | The same six columns, separated by tabs                                            |
| JSON   | All row fields, including input inheritance, segregation, and any processing error |

CSV and TSV are summary exports. Use JSON when you need to retain the supplied inheritance information and error messages. Batch downloads do not contain the full annotation response.

The JSON download is an array of row objects. This illustrative row shows the structure and score scales; it is not an annotation result for a real variant:

```json
[
  {
    "variant": "example-variant",
    "inheritance": "Unknown",
    "segregation": null,
    "variantScore": 0.5,
    "geneSymbol": "EXAMPLE",
    "geneScore": 0.5,
    "inheritanceScore": 0.1,
    "ncs": "4.200",
    "error": ""
  }
]
```

The combined NCS uses the same formula and interpretation tiers as an individual assessment. See [Scoring System](./scoring-system).
