# Application Usage

NC-Scorer is designed to calculate the Nephro Candidate Score (NCS) for genetic variants to help prioritize them in Chronic Kidney Disease research. The application allows searching for genes and variants and calculating scores based on different criteria.

## Main Pages and Workflow

Here's a breakdown of the main pages and the typical user flow:

### 1. Search Page (`/`)

*   **Overview:** This is the primary landing page, featuring three tabs for different search types: "Scoring Search," "Variant Search," and "Gene Search."
*   **Workflow:**
    *   **Get NCS Score:** Use the **Scoring Search** tab. Enter a variant identifier (e.g., `chr1-12345-A-G`) and optionally specify inheritance patterns and segregation details. Submitting this search will navigate you to the `Scoring View`.
    *   **Look up Variant Details:** Use the **Variant Search** tab. Enter a variant identifier to view its details without the full scoring context. This will navigate you to the `Variant View`.
    *   **Look up Gene Details:** Use the **Gene Search** tab. Enter a gene symbol to view its associated information. This will navigate you to the `Gene View`.

### 2. Scoring View (`/scoring/:variantInput/:inheritance?/:segregation?`)

*   **Overview:** This is the core page displaying the NCS score breakdown. It receives the variant identifier and optional inheritance/segregation parameters from the URL.
*   **Functionality:** It uses several components to fetch data and display scores:
    *   `VariantCard`: Fetches and displays details for the input variant, calculates a variant-specific score, and determines the associated gene symbol.
    *   `GeneCard`: Uses the gene symbol from `VariantCard` to fetch gene-specific data and calculate a gene score (`ngs`).
    *   `InheritanceCard`: Calculates an inheritance-based score using the URL parameters.
    *   `CombinedScoreCard`: Shows the individual gene, variant, and inheritance scores and calculates/displays the final combined NCS score.
*   **Workflow:** Users typically arrive here from the "Scoring Search." The page automatically fetches necessary data, calculates component scores, and presents the detailed breakdown and final score.

### 3. Variant View (`/variant/:variantInput`)

*   **Overview:** Displays detailed information about a specific variant (fetched from an API), but without the full NCS scoring context found in `ScoringView`.

### 4. Gene View (`/symbols/:symbol`)

*   **Overview:** Displays detailed information about a specific gene (fetched from an API).

### 5. Other Pages

*   **FAQ (`/faq`):** Contains frequently asked questions.
*   **Page Not Found (`/:catchAll(.*)`):** Standard 404 page for invalid URLs.

**Note:** The accuracy of the displayed information and scores depends on the underlying data fetched from the application's configured API endpoints.
