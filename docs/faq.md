# Frequently Asked Questions

## General Information

### What is NC-Scorer?
NC-Scorer (Nephro Candidate Scorer) is a web-based application designed to help researchers evaluate genetic variants for their potential involvement in kidney disease. It uses a specialized scoring algorithm that combines multiple lines of evidence to prioritize variants and genes for further investigation.

### Who developed NC-Scorer?
NC-Scorer was developed by the [Halbritter Lab](https://mrc.charite.de/forschung/ag_halbritter_nephrogenetik). The project is actively maintained and open to community contributions.

### Is NC-Scorer free to use?
Yes, NC-Scorer is completely free and open-source. You can use it for academic and research purposes without any cost. The source code is available on [GitHub](https://github.com/halbritter-lab/nc-scorer) under an MIT license.

## Using NC-Scorer

### How do I input a variant for scoring?
You can enter variants in standard HGVS notation (e.g., NM_033380.3:c.1871G>A) in the search box on the home page. The application supports:
- HGVS notation: `NM_001009944.3:c.11798G>A`
- Genomic coordinates: `chr16:2138253:G:A`
- rsID: `rs121913240`

### What do the scores mean?
NC-Scorer generates three main scores that contribute to the overall assessment:

1. **Gene Score** (0-1): Evaluates how likely a gene is involved in kidney disease
2. **Variant Score** (0-1): Assesses the potential pathogenicity of a specific variant
3. **Inheritance Score** (0-1): Evaluates the inheritance pattern compatibility with the disease model

The final **Nephro Candidate Score (NCS)** ranges from 0-10:
- **7.0-10.0**: High priority (strong evidence for causality)
- **3.0-6.9**: Moderate priority (requires additional investigation)
- **0.0-2.9**: Low priority (limited evidence)

### How are scores displayed visually?
The three key sub-scores are visually highlighted throughout the application:
- Each key score has a subtle background color and left border in the primary theme color
- Score chips have a slight elevation effect for a 3D appearance
- Higher scores are displayed in colors ranging from yellow (low) to green (high)
- Critical scores below certain thresholds may be highlighted in orange or red
- The most important scores are displayed with bold text and special visual treatment

### How many variants can I process at once?
Using the batch processing feature, you can analyze up to 200 variants simultaneously. Navigate to the "Batch" section in the main menu to access this feature.

### Can I save my results?
Yes, you can download your results in various formats:
- **JSON**: For programmatic processing
- **CSV/TSV**: For spreadsheet applications
- **VCF**: For genomic analysis pipelines

All processing happens in your browser for privacy protection - no data is stored on our servers.

## Technical Details

### What algorithms are used for scoring?
NC-Scorer uses a combination of machine learning models trained on known kidney disease genes and variants, along with rule-based scoring derived from expert knowledge. The scoring system incorporates:
- Functional studies data
- Expression data
- Conservation scores
- Population databases (gnomAD)
- Clinical annotations (ClinVar)

### Which genome builds are supported?
NC-Scorer supports both:
- **GRCh37/hg19**
- **GRCh38/hg38** (default)

The application automatically detects the build from your input or allows you to specify it manually.

### What technologies does NC-Scorer use?
NC-Scorer is built with modern web technologies:
- **Frontend**: Vue.js 3 with Composition API
- **UI Framework**: Vuetify 3 (Material Design)
- **Build Tool**: Vite
- **State Management**: Pinia
- **Processing**: Browser-based with API calls to specialized bioinformatics services

### Is the source code available?
Yes, NC-Scorer is open-source. Visit our [GitHub repository](https://github.com/halbritter-lab/nc-scorer) to:
- View the source code
- Report issues
- Submit pull requests
- Read contribution guidelines

## Troubleshooting

### My variant isn't recognized
Ensure your variant is in the correct format:
- Use standard HGVS notation (e.g., NM_033380.3:c.1871G>A)
- For genomic coordinates, specify the correct genome build
- Check that transcript IDs are valid and current

### The application seems slow
NC-Scorer performs complex calculations and queries multiple databases:
- First-time queries may take several seconds
- Subsequent analyses are faster due to caching
- Enable caching via the cache toggle button in the navigation bar

### Why is my variant search timing out?
This can happen when:
- External APIs are temporarily unavailable
- Network connectivity issues
- Very rare or complex variants requiring extended processing

Try again after a few moments, or check your network connection.

### How do I view application logs?
Click the log icon in the footer to open the log viewer. This displays:
- API requests and responses
- Processing events
- Errors and warnings
- Performance metrics

## Research & Citations

### How should I cite NC-Scorer?
If you use NC-Scorer in your research, please cite both our preprint publication and the software release:

1. **Preprint Publication:**
   > Rank N, Lukassen S, Anderegg MA, Eckardt KU, Halbritter JP, Popp B.  
   > *Automatic variant prioritization in suspected genetic kidney disease using the Nephro Candidate Score (N-CS).*  
   > medRxiv 2025. DOI: [10.1101/2025.09.29.25336840](https://doi.org/10.1101/2025.09.29.25336840)

2. **Software Archive:**
   > NC-Scorer: Nephro Candidate Score Web Application and Framework (v3.5.1).  
   > DOI: [10.5281/zenodo.745544900](https://zenodo.org/badge/latestdoi/745544900).  
   > URL: [https://nc-scorer.kidney-genetics.org/](https://nc-scorer.kidney-genetics.org/)

See our dedicated [Citation Guide](./guide/citation) and [`CITATION.cff`](https://github.com/halbritter-lab/nc-scorer/blob/main/CITATION.cff) for BibTeX snippets and GitHub citation export.

### Are there related publications?
The methodology behind NC-Scorer is based on the Nephro Candidate Score framework described in our medRxiv preprint ([doi:10.1101/2025.09.29.25336840](https://doi.org/10.1101/2025.09.29.25336840)). Additional methodological and machine learning training details are available in the companion [nephro_candidate_score](https://github.com/halbritter-lab/nephro_candidate_score) repository.

## Getting Help

### Where can I report bugs or request features?
Please use our [GitHub issue tracker](https://github.com/halbritter-lab/nc-scorer/issues) to:
- Report bugs
- Suggest new features
- Ask technical questions

Before submitting, check if the issue has already been reported.

### How can I contribute?
We welcome contributions! See our [Contributing Guide](./guide/contributing) or the [CONTRIBUTING.md](https://github.com/halbritter-lab/nc-scorer/blob/main/CONTRIBUTING.md) file for:
- Code contribution guidelines
- Development setup instructions
- Pull request process

### Where can I learn more?
- [Getting Started Guide](./guide/)
- [API Reference](./api/)
- [Architecture Overview](./guide/architecture)
- [Scoring System Details](./guide/scoring-system)