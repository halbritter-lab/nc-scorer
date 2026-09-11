# Usage

Open the [NC-Scorer application](https://nc-scorer.kidney-genetics.org/), or use the local address printed by `npm run dev`. The home page has three search tabs: **Score a variant**, **Variant details**, and **Find a gene**.

## Score a variant

1. Enter a variant in VCF-style notation, such as `1-55051215-G-GA`, or HGVS notation, such as `NM_001009944.3:c.11935C>T`.
2. Choose the genome assembly: **GRCh38 / hg38** or **GRCh37 / hg19**. It must match your variant coordinates.
3. Select the inheritance pattern. For compound heterozygous analysis, enter the required second variant.
4. If a segregation field appears, enter a value from **0 to 1**, or leave it blank when unknown.
5. Select **Calculate score**, then review the gene, variant, and inheritance evidence alongside the combined score.

The example links open assessments with their listed inheritance and assembly settings. Use **Edit Search** on the result page to return to the form with your current inputs.

### Segregation evidence

The calculation treats the segregation value as a p-value: smaller values increase the inheritance score. Zero is a valid supplied value. Leaving the field blank applies a **0.8 multiplier to the inheritance score** when that inheritance pattern expects segregation evidence. This is a 20% reduction of the inheritance component, not of the combined NCS.

The form hides segregation for **Denovo**, **Unknown**, and **Compound heterozygous (suspected)**; these patterns do not receive a missing-segregation penalty.

## Variant details

Use **Variant details** to enter a VCF-style or HGVS identifier and choose its assembly. Select **Look up variant** to inspect variant annotations, population frequencies, scores, and transcript details. This view does not collect the inheritance evidence needed for a combined NCS.

## Find a gene

Use **Find a gene** to enter a symbol such as `PKD1` or `COL4A5`, or an HGNC identifier such as `HGNC:9008` or `9008`. Choose an autocomplete suggestion or select **Look up gene**. The result shows gene evidence and its gene score. The **Genes** navigation item opens the gene-score table.

## Understanding the result

Each component is on a **0–1** scale. The combined score is on a **0–10** scale:

```text
NCS = (Gene Score × 4) + (Variant Score × 4) + (Inheritance Score × 2)
```

The gene component uses the stored gene score. The variant component uses CADD, gnomAD population frequencies, and VEP consequence and impact annotations. The inheritance component uses the selected pattern and segregation evidence.

| Combined NCS | Priority |
| ------------ | -------- |
| 0 ≤ NCS < 3  | Low      |
| 3 ≤ NCS < 7  | Moderate |
| 7 ≤ NCS ≤ 10 | High     |

These tiers support research prioritization. A completed score requires all three component scores; an unavailable or failed response should be reviewed before proceeding. See [Scoring System](./scoring-system) for the calculation details.

## Export and batch work

When a combined assessment is complete, its **Download** menu provides **CSV** and **Excel (.xlsx)** exports with the score breakdown and available supporting details.

For lists of up to 200 variants, open **Batch**. Batch results have separate **CSV**, **TSV**, and **JSON** download options. See [Batch Processing](./batch-processing) for input formatting and export contents.

## Display and settings

Use the sun or moon button to change theme. The navigation and settings menu includes the API cache toggle, a guided tour, and a citation-copy action. Caching can speed up repeated lookups; disable it when you need fresh API responses.
