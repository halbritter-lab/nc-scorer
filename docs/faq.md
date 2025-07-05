# FAQ

## General Questions

### What is NC-Scorer?
NC-Scorer (Nephro Candidate Scorer) is a tool for assessing genetic variants in kidney disease patients using the Nephro Candidate Score (NCS).

### How are scores calculated?
The NCS combines three weighted components:
- Gene Score (4x): Nephrology relevance
- Variant Score (4x): Pathogenicity
- Inheritance Score (2x): Inheritance pattern evidence

### What do the scores mean?
- **7.0-10.0**: High priority (strong evidence)
- **3.0-6.9**: Moderate priority (needs investigation)
- **0.0-2.9**: Low priority (limited evidence)

## Usage Questions

### What variant formats are supported?
- HGVS: `NM_001009944.3:c.11798G>A`
- Genomic: `chr16:2138253:G:A`
- rsID: `rs121913240`

### How many variants can I process at once?
Up to 200 variants in batch mode.

### Why is my variant search slow?
First queries to external APIs take longer. Subsequent queries use cached data for faster results.

## Technical Questions

### How do I view logs?
Click the log icon in the footer to open the log viewer.

### Where is my data stored?
- Search history: Browser localStorage
- API cache: Browser sessionStorage
- Logs: In-memory (cleared on refresh)

### Is my data private?
Variant queries go to public genomic databases. No personal information is transmitted, but use caution with rare variants.

## Getting Help

### How do I report issues?
Submit issues on [GitHub](https://github.com/halbritter-lab/nc-scorer/issues).

### Can I contribute?
Yes! See our [Contributing Guide](./guide/contributing) or the [CONTRIBUTING.md](https://github.com/halbritter-lab/nc-scorer/blob/main/CONTRIBUTING.md) file.

### Where can I learn more?
- [User Guide](./guide/)
- [API Reference](./api/)
- [GitHub Repository](https://github.com/halbritter-lab/nc-scorer)