# NC-Scorer

[![Version](https://img.shields.io/github/v/release/halbritter-lab/nc-scorer?label=version)](https://github.com/halbritter-lab/nc-scorer/releases/latest)
[![DOI](https://zenodo.org/badge/745544900.svg)](https://zenodo.org/badge/latestdoi/745544900)
[![Preprint: medRxiv](https://img.shields.io/badge/medRxiv-10.1101%2F2025.09.29.25336840-0072b2.svg)](https://doi.org/10.1101/2025.09.29.25336840)
[![GitHub Pages](https://github.com/halbritter-lab/nc-scorer/actions/workflows/gh-pages.yml/badge.svg)](https://github.com/halbritter-lab/nc-scorer/actions/workflows/gh-pages.yml)
[![Semantic Release](https://github.com/halbritter-lab/nc-scorer/actions/workflows/semantic-release.yml/badge.svg)](https://github.com/halbritter-lab/nc-scorer/actions/workflows/semantic-release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**NC-Scorer** (Nephro Candidate Scorer) is an open-source, web-based platform for standardized, automated prioritization of candidate genetic variants and novel disease gene discovery in patients with suspected inherited kidney disease (IKD) and chronic kidney disease of unknown etiology (CKDu).

---

## 🚀 Live Application & Documentation

- **Web Application:** [https://nc-scorer.kidney-genetics.org/](https://nc-scorer.kidney-genetics.org/)
- **Documentation:** [https://nc-scorer.kidney-genetics.org/docs/](https://nc-scorer.kidney-genetics.org/docs/)
  - [Getting Started & Quick Start](https://nc-scorer.kidney-genetics.org/docs/guide/)
  - [Scoring System & Methodology](https://nc-scorer.kidney-genetics.org/docs/guide/ncs-score)
  - [Batch Processing Guide](https://nc-scorer.kidney-genetics.org/docs/guide/batch-processing)
  - [API Reference](https://nc-scorer.kidney-genetics.org/docs/api/)
  - [Citation & Reproducibility Guide](https://nc-scorer.kidney-genetics.org/docs/guide/citation)

---

## 🧬 Scoring Framework: Nephro Candidate Score (NCS)

NC-Scorer integrates three complementary evidence layers into a single interpretable metric on a $[0, 10]$ scale:

$$\text{NCS} = (N\text{-GS} \times 4) + (N\text{-VS} \times 4) + (\text{IS} \times 2)$$

| Component | Range | Description | Method |
| :--- | :---: | :--- | :--- |
| **Nephro Gene Score ($N\text{-GS}$)** | $[0, 1]$ | Prior probability that the gene is implicated in kidney disease | XGBoost classifier trained on functional genomics features |
| **Nephro Variant Score ($N\text{-VS}$)** | $[0, 1]$ | Pathogenicity likelihood of the specific variant | Regularized Logistic Regression trained on variant features |
| **Inheritance Score ($\text{IS}$)** | $[0, 1]$ | Compatibility of variant zygosity with the expected disease inheritance model | Rule-based scoring heuristic (with 20% penalty for missing segregation) |

### Score Interpretation Tiers

- **High Priority ($[7.0, 10.0]$):** Strong candidate requiring high-priority clinical and functional review.
- **Moderate Priority ($[3.0, 7.0)$):** Moderate evidence; warrants investigation in secondary analysis or combined cohorts.
- **Low Priority ($[0.0, 3.0)$):** Limited evidence under current disease and variant annotations.

---

## ✨ Key Features

- **Multi-Format Input:** Accepts standard HGVS notation (e.g. `NM_001009944.3:c.11798G>A`), genomic coordinates (`chr16:2138253:G:A`), and dbSNP rsIDs (`rs121913240`).
- **Dual Genome Build Support:** Fully supports both **GRCh37 (hg19)** and **GRCh38 (hg38)** via dedicated backend Ensembl proxy endpoints.
- **Batch Processing:** Evaluate up to 200 variants simultaneously with interactive sorting, filtering, and real-time computation.
- **Flexible Export:** Download complete scoring results in **JSON**, **CSV**, **TSV**, or annotated **VCF** format.
- **Client-Side Privacy:** Variant queries and score evaluations run directly in the user's browser without storing patient data on remote servers.

---

## 📚 Citation

If you use NC-Scorer or the Nephro Candidate Score framework in academic work, please cite both our primary research publication and the software archive:

### 1. Primary Research Publication

> Rank N, Lukassen S, Anderegg MA, Eckardt KU, Halbritter JP, Popp B.  
> **Automatic variant prioritization in suspected genetic kidney disease using the Nephro Candidate Score (N-CS).**  
> *medRxiv* 2025.  
> DOI: [10.1101/2025.09.29.25336840](https://doi.org/10.1101/2025.09.29.25336840)

```bibtex
@article{rank2025nephro,
  author    = {Rank, Nina and Lukassen, S{\"o}ren and Anderegg, Manuel A. and Eckardt, Kai-Uwe and Halbritter, Jan P. and Popp, Bernt},
  title     = {Automatic variant prioritization in suspected genetic kidney disease using the Nephro Candidate Score (N-CS)},
  journal   = {medRxiv},
  year      = {2025},
  doi       = {10.1101/2025.09.29.25336840},
  url       = {https://doi.org/10.1101/2025.09.29.25336840},
  publisher = {Cold Spring Harbor Laboratory Press}
}
```

### 2. Software Archive (v3.5.1)

> Rank N, Lukassen S, Anderegg MA, Eckardt KU, Halbritter JP, Popp B.  
> **NC-Scorer: Automated Variant Prioritization in Suspected Genetic Kidney Disease (v3.5.1).**  
> Zenodo / GitHub.  
> DOI: [10.5281/zenodo.745544900](https://zenodo.org/badge/latestdoi/745544900)  
> URL: [https://nc-scorer.kidney-genetics.org/](https://nc-scorer.kidney-genetics.org/)

```bibtex
@software{nc_scorer_v3_5_1,
  author    = {Rank, Nina and Lukassen, S{\"o}ren and Anderegg, Manuel A. and Eckardt, Kai-Uwe and Halbritter, Jan P. and Popp, Bernt},
  title     = {NC-Scorer: Automated Variant Prioritization in Suspected Genetic Kidney Disease},
  version   = {v3.5.1},
  year      = {2026},
  doi       = {10.5281/zenodo.745544900},
  url       = {https://nc-scorer.kidney-genetics.org/},
  publisher = {Zenodo},
  license   = {MIT}
}
```

Machine-readable citation metadata is provided via [`CITATION.cff`](CITATION.cff) and [`.zenodo.json`](.zenodo.json). You can also click GitHub's **"Cite this repository"** button in the sidebar to export citations directly.

---

## 🔗 Related Repositories

- [halbritter-lab/nephro_candidate_score](https://github.com/halbritter-lab/nephro_candidate_score) — N-GS feature preprocessing and N-VS machine learning model training pipelines.
- [halbritter-lab/kidney-genetics-v1](https://github.com/halbritter-lab/kidney-genetics-v1) — Curated evidence base for genetic kidney diseases.

---

## 🛠️ Development & Quality Assurance

### Setup

```bash
# Clone the repository
git clone https://github.com/halbritter-lab/nc-scorer.git
cd nc-scorer

# Install dependencies
npm install

# Start development server
npm run dev
```

### Verification Commands

Every modification must pass all checks before committing or submitting a pull request:

```bash
npm run lint         # ESLint check (0 errors)
npm run typecheck    # Static typecheck via vue-tsc --noEmit (0 errors)
npm run test:run     # Vitest unit and component test suites
npm run build        # Production application and documentation build
npm run validate     # Convenience runner for all 4 checks in sequence
```

---

## 🤝 Contributing

Contributions are welcome! Please see the [Contributing Guide](https://nc-scorer.kidney-genetics.org/docs/guide/contributing) for guidelines on code style, testing, and conventional commit messages.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).