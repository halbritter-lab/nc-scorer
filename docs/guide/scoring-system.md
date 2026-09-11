# Scoring System

The Nephro Candidate Score (NCS) is a composite score (0–10) for prioritizing candidate variants in kidney disease research. It combines gene, variant, and inheritance evidence; it is not a calibrated probability of causality.

## Score Components

### 1. Gene Score (0-1)

- Reflects nephrology relevance of the gene
- Based on known kidney disease associations
- Weight: 4x in final calculation

### 2. Variant Score (0-1)

- Summarizes variant evidence for prioritization
- Uses VEP consequence and impact annotations, CADD scores, and gnomAD population frequencies
- Weight: 4x in final calculation

### 3. Inheritance Score (0-1)

- Incorporates inheritance pattern and segregation evidence
- Includes penalty system for missing data
- Weight: 2x in final calculation

## Final Calculation

```
NCS = (Gene Score × 4) + (Variant Score × 4) + (Inheritance Score × 2)
```

## Score Interpretation

| NCS Range    | Priority | Description                 |
| ------------ | -------- | --------------------------- |
| 7 ≤ NCS ≤ 10 | High     | Highest prioritization tier |
| 3 ≤ NCS < 7  | Moderate | Middle prioritization tier  |
| 0 ≤ NCS < 3  | Low      | Lowest prioritization tier  |

## Inheritance Patterns

### Base Scores

| Pattern                           | Base Score |
| --------------------------------- | ---------- |
| Denovo                            | 0.95       |
| Homozygous recessive              | 0.8        |
| Compound heterozygous (confirmed) | 0.8        |
| X-linked recessive                | 0.7        |
| X-linked dominant                 | 0.5        |
| Inherited dominant                | 0.4        |
| Compound heterozygous (suspected) | 0.4        |
| Unknown                           | 0.1        |

### Segregation Enhancement

For patterns with segregation data:

- Strong segregation evidence (p ≤ 0.001) provides maximum enhancement
- Enhancement factor calculated using logarithmic transformation
- Missing segregation data multiplies the inheritance component by 0.8 for applicable patterns; it does not reduce the entire NCS by 20%

Zero is valid segregation input. The **Denovo**, **Unknown**, and **Compound heterozygous (suspected)** patterns do not receive a missing-segregation penalty.

## Best Practices

1. **Always provide segregation data** when available for inherited patterns
2. **Use "Denovo"** for confirmed de novo variants (no segregation needed)
3. **Interpret scores in context** with clinical judgment

For detailed mathematical formulas and examples, see the [comprehensive scoring documentation](https://github.com/halbritter-lab/nc-scorer/wiki/Scoring-System).
