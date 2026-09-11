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

Open **Score a variant** on the home page, enter a variant, and select its assembly and inheritance pattern. The search forms accept:

- HGVS notation: `NM_001009944.3:c.11935C>T`
- VCF-style coordinates: `1-55051215-G-GA` or `chr1:55051215:G:GA`

See [Usage](./guide/usage) for segregation evidence and compound heterozygous inputs.

### What do the scores mean?

NC-Scorer generates three main scores that contribute to the overall assessment:

1. **Gene Score** (0-1): Summarizes gene evidence for kidney disease prioritization
2. **Variant Score** (0-1): Summarizes variant annotation evidence
3. **Inheritance Score** (0-1): Combines the selected inheritance pattern and segregation evidence

The final **Nephro Candidate Score (NCS)** ranges from 0-10:

- **7 ≤ NCS ≤ 10**: High priority
- **3 ≤ NCS < 7**: Moderate priority
- **0 ≤ NCS < 3**: Low priority

The NCS is a research prioritization score, not a calibrated probability of causality.

### How are scores displayed visually?

The result page presents the numeric score, its priority tier, and the three weighted components. Color helps distinguish scores; use the values and labels to interpret the result. Both light and dark themes are available.

### How many variants can I process at once?

You can score up to 200 variants in one batch run. Requests are processed sequentially. Open **Batch** in the main menu to access this feature.

### Can I save my results?

Completed individual assessments export as **CSV** or **Excel (.xlsx)**. Batch results export as **CSV**, **TSV**, or **JSON**. See [Batch Processing](./guide/batch-processing) for the fields included in each format.

The application performs scoring in the browser and sends variant queries to external annotation services. Enabled caches store responses in browser storage.

## Technical Details

### What algorithms are used for scoring?

The application combines a stored gene score, a variant score calculated from CADD, gnomAD frequencies, and VEP consequence and impact annotations, and an inheritance score calculated from the selected pattern and segregation value. The combined formula is **Gene × 4 + Variant × 4 + Inheritance × 2**. See [Scoring System](./guide/scoring-system) for the component scales and missing-evidence rules.

### Which genome builds are supported?

NC-Scorer supports both:

- **GRCh37/hg19**
- **GRCh38/hg38** (default)

Select the assembly that matches your variant coordinates before submitting. One selected assembly applies to every variant in a batch run.

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
- Enable caching through the navigation and settings menu

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
   >
   > _Automatic variant prioritization in suspected genetic kidney disease using the Nephro Candidate Score (N-CS)._
   >
   > medRxiv 2025. DOI: [10.1101/2025.09.29.25336840](https://doi.org/10.1101/2025.09.29.25336840)

2. **Software Release:**
   > NC-Scorer: Nephro Candidate Score Web Application and Framework (v3.5.4).
   >
   > Release Tag: [v3.5.4](https://github.com/halbritter-lab/nc-scorer/releases/tag/v3.5.4).
   >
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
