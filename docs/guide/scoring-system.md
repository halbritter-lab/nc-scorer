# Scoring System

The Nephro Candidate Score (NCS) is a composite score (0-10) that evaluates the likelihood that a genetic variant is causative for a nephrology condition.

## Score Components

### 1. Gene Score (0-1)
- Reflects nephrology relevance of the gene
- Based on known kidney disease associations
- Weight: 4x in final calculation

### 2. Variant Score (0-1)
- Assesses pathogenicity of the specific variant
- Uses VEP annotations, CADD scores, population frequency
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

| NCS Range | Priority | Description |
|-----------|----------|-------------|
| 7.0 - 10.0 | High | Strong evidence for causality |
| 3.0 - 6.9 | Moderate | Requires additional investigation |
| 0.0 - 2.9 | Low | Limited evidence |

## Inheritance Patterns

### Base Scores

| Pattern | Base Score |
|---------|------------|
| Denovo | 0.95 |
| Homozygous recessive | 0.8 |
| Compound heterozygous (confirmed) | 0.8 |
| X-linked recessive | 0.7 |
| X-linked dominant | 0.5 |
| Inherited dominant | 0.4 |
| Compound heterozygous (suspected) | 0.4 |
| Unknown | 0.1 |

### Segregation Enhancement

For patterns with segregation data:
- Strong segregation evidence (p ≤ 0.001) provides maximum enhancement
- Enhancement factor calculated using logarithmic transformation
- Missing segregation data triggers 20% penalty for applicable patterns

## Best Practices

1. **Always provide segregation data** when available for inherited patterns
2. **Use "Denovo"** for confirmed de novo variants (no segregation needed)
3. **Interpret scores in context** with clinical judgment

For detailed mathematical formulas and examples, see the [comprehensive scoring documentation](https://github.com/halbritter-lab/nc-scorer/wiki/Scoring-System).