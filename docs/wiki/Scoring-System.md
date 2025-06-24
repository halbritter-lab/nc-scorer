# NC-Scorer Scoring System

This document provides a comprehensive explanation of the Nephro Candidate Score (NCS) calculation system, including all component scores, formulas, and the sophisticated penalty mechanism for missing data.

## Overview

The Nephro Candidate Score (NCS) is a composite score ranging from 0 to 10 that evaluates the likelihood that a genetic variant is causative for a nephrology condition. It combines three component scores:

- **Gene Score** (0-1): Nephrology relevance of the gene
- **Variant Score** (0-1): Pathogenicity assessment of the variant
- **Inheritance Score** (0-1): Evidence strength based on inheritance pattern and segregation

**Final NCS Formula:**
```
NCS = (Gene Score × 4) + (Variant Score × 4) + (Inheritance Score × 2)
```

Maximum possible score: **10** (when all component scores are 1.0)

## Score Interpretation

| NCS Range | Interpretation | Description |
|-----------|---------------|-------------|
| 7.0 - 10.0 | **High Priority** | Strong evidence for causality; high confidence |
| 3.0 - 6.9 | **Moderate Priority** | Moderate evidence; requires additional investigation |
| 0.0 - 2.9 | **Low Priority** | Limited evidence; lower likelihood of causality |

## Component Scores

### 1. Gene Score (0-1)

The Gene Score reflects the relevance of the gene to nephrology conditions based on:
- Known kidney disease associations
- Gene function in renal development/physiology
- Literature evidence
- Clinical databases (OMIM, ClinVar, etc.)

**Data Source:** Pre-computed nephrology gene scores from curated databases and literature analysis.

### 2. Variant Score (0-1)

The Variant Score assesses the pathogenicity of the specific variant using:
- **VEP (Variant Effect Predictor)** annotations
- **CADD scores** for deleteriousness prediction
- **Population frequency** data
- **Functional impact** predictions
- **Clinical significance** from databases

**Calculation:** Uses a weighted algorithm combining multiple pathogenicity predictors, with higher scores indicating greater likelihood of pathogenicity.

### 3. Inheritance Score (0-1)

The Inheritance Score is the most complex component, incorporating both the inheritance pattern and segregation evidence. This score includes a sophisticated penalty system for missing data.

#### Base Inheritance Pattern Scores

| Pattern | Base Score | Description |
|---------|------------|-------------|
| Denovo | 0.95 | Highest confidence for sporadic cases |
| Homozygous recessive | 0.8 | High confidence for confirmed biallelic inheritance |
| Compound heterozygous (confirmed) | 0.8 | High confidence for confirmed compound heterozygous |
| X-linked recessive | 0.7 | Strong evidence for X-linked inheritance |
| X-linked dominant | 0.5 | Moderate evidence, requires additional support |
| Inherited dominant | 0.4 | Lower base score, relies heavily on segregation evidence |
| Compound heterozygous (suspected) | 0.4 | Lower due to phase uncertainty |
| Unknown | 0.1 | Minimal baseline score |

#### Segregation Evidence Enhancement

For inheritance patterns where segregation is relevant, the base score is enhanced using segregation probability (p-value):

**Mathematical Formula:**
```
Enhanced Score = Base Score + (1 - Base Score) × Enhancement Factor

Enhancement Factor = min(1, -ln(p) / -ln(γ))

Where:
- p = segregation probability (0-1)
- γ = threshold p-value for maximal evidence (0.001)
- ln = natural logarithm
```

**Key Principles:**
- Lower p-values (stronger segregation evidence) increase the score more
- p-values ≤ 0.001 provide maximum enhancement
- p-value = 1.0 provides no enhancement (score = base score)

#### Missing Segregation Penalty System

**When Penalty Applies:**
The penalty system only applies when segregation data is **expected but missing**:

**Patterns Requiring Segregation:**
- Inherited dominant
- Homozygous recessive  
- Compound heterozygous (confirmed)
- X-linked dominant
- X-linked recessive

**Patterns NOT Requiring Segregation:**
- Denovo (segregation not applicable)
- Unknown (insufficient information)
- Compound heterozygous (suspected) (phase uncertainty)

**Penalty Mechanism:**
- **Penalty Factor:** 0.8 (20% reduction)
- **Application:** `Final Score = Calculated Score × 0.8`
- **Trigger:** Segregation field is empty/null for patterns that expect it

**Examples:**

1. **With Segregation Data:**
   ```
   Pattern: Inherited dominant
   Segregation: 0.05
   Base Score: 0.4
   Enhancement: Significant (strong p-value)
   Final Score: ~0.9 (no penalty)
   ```

2. **Missing Segregation (Penalized):**
   ```
   Pattern: Inherited dominant  
   Segregation: [empty]
   Base Score: 0.4
   Enhancement: None (p=1.0 used)
   Before Penalty: 0.4
   Final Score: 0.4 × 0.8 = 0.32 (20% penalty applied)
   ```

3. **Missing Segregation (No Penalty):**
   ```
   Pattern: Denovo
   Segregation: [empty]
   Base Score: 0.95
   Final Score: 0.95 (no penalty - segregation not expected)
   ```

## Practical Examples

### Example 1: Strong Pathogenic Variant

**Input:**
- Gene: PKD1 (polycystic kidney disease gene)
- Variant: Nonsense mutation
- Inheritance: Inherited dominant
- Segregation: p = 0.01

**Calculation:**
- Gene Score: 0.9 (high nephrology relevance)
- Variant Score: 0.95 (nonsense mutation, high pathogenicity)
- Inheritance Score: 0.4 + (0.6 × enhancement) ≈ 0.85
- **NCS: (0.9 × 4) + (0.95 × 4) + (0.85 × 2) = 9.1**

**Interpretation:** High priority - strong evidence for causality

### Example 2: Variant with Missing Segregation

**Input:**
- Gene: NPHS1 (nephrin gene)
- Variant: Missense variant of uncertain significance
- Inheritance: Inherited dominant
- Segregation: [not provided]

**Calculation:**
- Gene Score: 0.8 (known nephrology gene)
- Variant Score: 0.3 (uncertain significance)
- Inheritance Score: 0.4 × 0.8 = 0.32 (penalty applied)
- **NCS: (0.8 × 4) + (0.3 × 4) + (0.32 × 2) = 5.04**

**Interpretation:** Moderate priority, but note the penalty for missing segregation data

### Example 3: De Novo Variant

**Input:**
- Gene: WT1 (Wilms tumor gene)
- Variant: Frameshift mutation
- Inheritance: Denovo
- Segregation: [not applicable]

**Calculation:**
- Gene Score: 0.85 (nephrology relevance)
- Variant Score: 0.9 (frameshift, high pathogenicity)
- Inheritance Score: 0.95 (no penalty - segregation not expected for de novo)
- **NCS: (0.85 × 4) + (0.9 × 4) + (0.95 × 2) = 8.9**

**Interpretation:** High priority - strong de novo evidence

## User Interface Indicators

### Penalty Notifications

When a penalty is applied, the system provides clear feedback:

1. **InheritanceCard Alert:**
   ```
   ℹ️ Score penalized due to missing segregation data for this inheritance pattern.
   ```

2. **Batch Processing Hint:**
   ```
   Note: Omitting segregation data for inheritance patterns that expect it 
   may result in a penalty (20% score reduction).
   ```

### Score Visualization

Scores are displayed using color-coded chips:
- **NCS Scores:** Red (high), Orange (moderate), Grey (low)
- **Component Scores:** Theme colors (indigo for gene, purple for variant, teal for inheritance)

## Implementation Details

### Configuration

All scoring parameters are configurable in `/src/config/inheritanceConfig.js`:

```javascript
// Base scores for inheritance patterns
export const baseScores = {
  'Denovo': 0.95,
  'Inherited dominant': 0.4,
  // ... other patterns
};

// Segregation enhancement parameters
export const scoringParameters = {
  gamma: 0.001,    // Threshold p-value
  epsilon: 1e-10   // Numerical stability floor
};

// Patterns that don't use segregation
export const noSegregationPatterns = [
  'Denovo', 'Unknown', 'Compound heterozygous (suspected)'
];

// Missing data penalty
export const missingSegregationPenalty = 0.8; // 20% reduction
```

### Data Handling

**Input Formats:**
- **Single Variant:** Via search interface with form validation
- **Batch Processing:** Tab-separated format: `Variant [TAB] Inheritance [TAB] Segregation`

**Missing Data Detection:**
- `null` values indicate intentionally missing data (triggers penalty)
- Empty strings are treated as `null`
- Explicit `1.0` values are treated as "no segregation evidence" (no penalty)

## Best Practices

### For Users

1. **Always Provide Segregation Data** when available for:
   - Inherited dominant patterns
   - Recessive inheritance patterns
   - X-linked patterns

2. **Use Appropriate Inheritance Patterns:**
   - Choose "Denovo" for confirmed de novo variants
   - Use "Unknown" when inheritance pattern is unclear

3. **Interpret Scores in Context:**
   - Consider all three component scores
   - Pay attention to penalty notifications
   - Use clinical judgment alongside computational scores

### For Researchers

1. **Document Missing Data:** Note when segregation data is unavailable vs. not applicable
2. **Consider Batch Processing:** For large-scale analyses with consistent methodology
3. **Export Results:** Use CSV/Excel export for further analysis and record-keeping

## Technical References

**Algorithms:**
- VEP: [Ensembl Variant Effect Predictor](https://ensembl.org/vep)
- CADD: [Combined Annotation Dependent Depletion](https://cadd.gs.washington.edu/)

**Databases:**
- Gene scores derived from OMIM, ClinVar, HPO, and nephrology literature
- Population frequencies from gnomAD
- Functional predictions from multiple algorithms

**Mathematical Foundation:**
- Logarithmic transformation for segregation enhancement
- Multiplicative penalty system for missing data
- Weighted linear combination for final NCS

---

*This scoring system is designed to provide quantitative support for clinical decision-making in nephrology genetics. Scores should always be interpreted by qualified medical professionals in the context of complete clinical information.*