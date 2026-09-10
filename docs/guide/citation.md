# Citing NC-Scorer

If you use NC-Scorer or the Nephro Candidate Score (N-CS) framework in your research, please cite both the primary research publication and the software release.

## Primary Research Publication

The methodology, machine learning models (N-GS and N-VS), and clinical validation of the Nephro Candidate Score framework are described in:

> Rank N, Lukassen S, Anderegg MA, Eckardt KU, Halbritter JP, Popp B.  
> **Automatic variant prioritization in suspected genetic kidney disease using the Nephro Candidate Score (N-CS).**  
> *medRxiv* 2025.  
> DOI: [10.1101/2025.09.29.25336840](https://doi.org/10.1101/2025.09.29.25336840)

### BibTeX

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

---

## Software Archive & Versioned Tool

To cite the specific version of the **NC-Scorer web application** used for data analysis and scoring:

> Rank N, Lukassen S, Anderegg MA, Eckardt KU, Halbritter JP, Popp B.  
> **NC-Scorer: Nephro Candidate Score Web Application and Framework (v3.5.1).**  
> Zenodo / GitHub.  
> DOI: [10.5281/zenodo.745544900](https://zenodo.org/badge/latestdoi/745544900)  
> URL: [https://nc-scorer.kidney-genetics.org/](https://nc-scorer.kidney-genetics.org/)

### BibTeX

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

---

## GitHub "Cite this repository"

Machine-readable citation metadata is provided in [`CITATION.cff`](https://github.com/halbritter-lab/nc-scorer/blob/main/CITATION.cff) according to the [Citation File Format (CFF 1.2.0)](https://citation-file-format.github.io/) specification.

On the [GitHub repository page](https://github.com/halbritter-lab/nc-scorer), click the **"Cite this repository"** button in the right sidebar to:
- Copy formatted APA citation
- Export formatted BibTeX entry
- Access both the software citation and preferred preprint article citation

---

## Related Repositories

The complete N-CS computational ecosystem includes:

- **Web Tool & Frontend**: [halbritter-lab/nc-scorer](https://github.com/halbritter-lab/nc-scorer) — Vue 3 web interface and batch processing engine.
- **Machine Learning & Preprocessing**: [halbritter-lab/nephro_candidate_score](https://github.com/halbritter-lab/nephro_candidate_score) — N-GS feature extraction (R) and N-VS model training (Python).
- **Kidney Genetics Evidence**: [halbritter-lab/kidney-genetics-v1](https://github.com/halbritter-lab/kidney-genetics-v1) — Underlying curated gene-disease relationships.
