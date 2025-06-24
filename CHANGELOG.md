# [2.1.0](https://github.com/halbritter-lab/nc-scorer/compare/v2.0.0...v2.1.0) (2025-06-24)


### Features

* **api:** add genome assembly selection for GRCh37/GRCh38 support ([b2cb565](https://github.com/halbritter-lab/nc-scorer/commit/b2cb5655447d4ac88855da5af60cdc5e4c23ddb2))

# [2.0.0](https://github.com/halbritter-lab/nc-scorer/compare/v1.5.0...v2.0.0) (2025-06-23)


### Features

* **batch:** add interactive results table for batch variant processing ([3f1577e](https://github.com/halbritter-lab/nc-scorer/commit/3f1577eb87d9dfc071f7349bc0fcaeb18c7f2574))


### BREAKING CHANGES

* **batch:** Batch processing now displays results in a table instead of immediate download. Users must click download button after processing to export results.

# [1.5.0](https://github.com/halbritter-lab/nc-scorer/compare/v1.4.4...v1.5.0) (2025-06-22)


### Features

* **batch:** add example variant lists with prefill buttons ([c90f3b2](https://github.com/halbritter-lab/nc-scorer/commit/c90f3b2c3dac3488093da0c381bbf7971d9f3cc1)), closes [#61](https://github.com/halbritter-lab/nc-scorer/issues/61)

## [1.4.4](https://github.com/halbritter-lab/nc-scorer/compare/v1.4.3...v1.4.4) (2025-06-22)


### Bug Fixes

* remove conditional rendering that hid disclaimer button for new users ([1fc5fa0](https://github.com/halbritter-lab/nc-scorer/commit/1fc5fa0c11cd61a2924b9f966986cef27e73fe4a))

## [1.4.3](https://github.com/halbritter-lab/nc-scorer/compare/v1.4.2...v1.4.3) (2025-06-04)


### Bug Fixes

* add default values in configuration ([1aa8bfc](https://github.com/halbritter-lab/nc-scorer/commit/1aa8bfcfb703ce2a49ce20169803085eb5246252))

## [1.4.2](https://github.com/halbritter-lab/nc-scorer/compare/v1.4.1...v1.4.2) (2025-04-22)


### Bug Fixes

* resolve Vue warnings and linting issues ([ca69070](https://github.com/halbritter-lab/nc-scorer/commit/ca690705621333e85669b03fd7c2c384a661e684))

## [1.4.1](https://github.com/halbritter-lab/nc-scorer/compare/v1.4.0...v1.4.1) (2025-04-22)


### Bug Fixes

* resolve Vue inject warning and improve documentation ([8bc0495](https://github.com/halbritter-lab/nc-scorer/commit/8bc0495881976ffe004dfd71da46bee3ff263f0c))

# [1.4.0](https://github.com/halbritter-lab/nc-scorer/compare/v1.3.0...v1.4.0) (2025-04-22)


### Features

* **api:** implement batch variant processing mode ([b836d35](https://github.com/halbritter-lab/nc-scorer/commit/b836d350887c296dbe41205c234de9b10e923a8a)), closes [#30](https://github.com/halbritter-lab/nc-scorer/issues/30)

# [1.3.0](https://github.com/halbritter-lab/nc-scorer/compare/v1.2.2...v1.3.0) (2025-04-22)


### Features

* **logging:** implement app-wide logging service with UI viewer ([97cf1d7](https://github.com/halbritter-lab/nc-scorer/commit/97cf1d7753524ee5feaa0e88431681dd335608c7)), closes [#60](https://github.com/halbritter-lab/nc-scorer/issues/60)

## [1.2.2](https://github.com/halbritter-lab/nc-scorer/compare/v1.2.1...v1.2.2) (2025-04-22)


### Bug Fixes

* **variant-card:** display genomic position and link to genome browser ([0acc10c](https://github.com/halbritter-lab/nc-scorer/commit/0acc10c201f74b00629036141ad4201956b9eb1b)), closes [#58](https://github.com/halbritter-lab/nc-scorer/issues/58)

## [1.2.1](https://github.com/halbritter-lab/nc-scorer/compare/v1.2.0...v1.2.1) (2025-04-22)


### Bug Fixes

* **content:** add About and Methodology pages ([4c26e2b](https://github.com/halbritter-lab/nc-scorer/commit/4c26e2b8e10ea8741fb0b9ea722447648ef183fd))

# [1.2.0](https://github.com/halbritter-lab/nc-scorer/compare/v1.1.1...v1.2.0) (2025-04-22)


### Features

* **scoring:** differentiate X-linked inheritance into dominant/recessive ([c910c95](https://github.com/halbritter-lab/nc-scorer/commit/c910c95a645600c4873f2bf2d05fc2eb9975bcf8)), closes [#55](https://github.com/halbritter-lab/nc-scorer/issues/55)

## [1.1.1](https://github.com/halbritter-lab/nc-scorer/compare/v1.1.0...v1.1.1) (2025-04-22)


### Bug Fixes

* **ci:** ensure pages deploy builds correct version after release ([ddbfb97](https://github.com/halbritter-lab/nc-scorer/commit/ddbfb97914d51b5cc83cd117fa4368c48abd8968)), closes [#56](https://github.com/halbritter-lab/nc-scorer/issues/56)

# [1.1.0](https://github.com/halbritter-lab/nc-scorer/compare/v1.0.5...v1.1.0) (2025-04-22)


### Features

* **deps:** upgrade variant-linker to v2.0.0 and adapt scoring ([b7352ba](https://github.com/halbritter-lab/nc-scorer/commit/b7352ba7d1c7fed9d0360c31696b11937e191533))

## [1.0.5](https://github.com/halbritter-lab/nc-scorer/compare/v1.0.4...v1.0.5) (2025-04-22)


### Bug Fixes

* **footer:** improve disclaimer display for clarity and style ([233d019](https://github.com/halbritter-lab/nc-scorer/commit/233d0192143127f5bc7c95d01969b0457f5b6327))

## [1.0.4](https://github.com/halbritter-lab/nc-scorer/compare/v1.0.3...v1.0.4) (2025-04-22)


### Bug Fixes

* remove unused parseVariantString import in VariantCard ([6b319ca](https://github.com/halbritter-lab/nc-scorer/commit/6b319ca072e30458bee9422f61ee51c6b7e2c145))

## [1.0.3](https://github.com/halbritter-lab/nc-scorer/compare/v1.0.2...v1.0.3) (2025-04-22)


### Bug Fixes

* remove unused isAcknowledged variable in FooterBar ([cade7e4](https://github.com/halbritter-lab/nc-scorer/commit/cade7e490811e3728a97ec94378ba45a878fc089))

## [1.0.2](https://github.com/halbritter-lab/nc-scorer/compare/v1.0.1...v1.0.2) (2025-04-22)


### Bug Fixes

* remove unused ref import in CollaborationLinks ([c1df484](https://github.com/halbritter-lab/nc-scorer/commit/c1df4849819f72bc94f11188144e3a66171dd5bd))

## [1.0.1](https://github.com/halbritter-lab/nc-scorer/compare/v1.0.0...v1.0.1) (2025-04-22)


### Bug Fixes

* remove unused isAcknowledged variable in App.vue ([9518563](https://github.com/halbritter-lab/nc-scorer/commit/9518563126867bdedd3a67627cd3e29d0b349183))
* **update node.js version and fix package sync:** update Node.js version and fix package sync ([aad9f30](https://github.com/halbritter-lab/nc-scorer/commit/aad9f30d2599da268c36462e9896784583cfae9f))
* **variant-card:** resolve TypeError in transcript select item rendering ([fb97448](https://github.com/halbritter-lab/nc-scorer/commit/fb97448ebc785cbe68d58876be9b64844e4e9202))

# 1.0.0 (2025-04-13)


### Bug Fixes

* **a11y:** improve form labeling and touch target accessibility ([d9bf24f](https://github.com/halbritter-lab/nc-scorer/commit/d9bf24f5ea28d5e8701cf6f9ec9296b27ea15352)), closes [#37](https://github.com/halbritter-lab/nc-scorer/issues/37)
* **api:** refine API retry logic for targeted error handling ([17cff67](https://github.com/halbritter-lab/nc-scorer/commit/17cff6720a0ad2d44d43a1ce07fa5959a9a531f7)), closes [#28](https://github.com/halbritter-lab/nc-scorer/issues/28)
* app name in app bar ([c245e2d](https://github.com/halbritter-lab/nc-scorer/commit/c245e2d12d9f56e68fb2b48e29f6a7caeeba564b))
* change name to NCScorer ([5b6bd69](https://github.com/halbritter-lab/nc-scorer/commit/5b6bd69922a7ed9cb153260b4e786ed175dc0e06))
* **components:** improve gene symbol selection logic for complex variants ([130f886](https://github.com/halbritter-lab/nc-scorer/commit/130f8865f1d904f2fbcad7a4929c7a0a66f21e3f)), closes [#26](https://github.com/halbritter-lab/nc-scorer/issues/26)
* define public path in vue config ([14c0e1d](https://github.com/halbritter-lab/nc-scorer/commit/14c0e1dc491b9640db8893955fcb9ca309a43497))
* **deps:** resolve eslint dependency conflicts for CI build ([504ced9](https://github.com/halbritter-lab/nc-scorer/commit/504ced997665f24a2f43b896a770e021c7ab0e78))
* **deps:** resolve eslint plugin dependency conflicts ([e544e7c](https://github.com/halbritter-lab/nc-scorer/commit/e544e7cda153ca44deec35cefb47f27212d48c7a))
* downgrade variant-linker to version 0.13.6 in package-lock.json ([9de48b1](https://github.com/halbritter-lab/nc-scorer/commit/9de48b150c4b4ffd8eba8af6c08efe58a6b92cc7))
* **fix bug in actions:** fix bug in actions ([28510cc](https://github.com/halbritter-lab/nc-scorer/commit/28510cc0bfb14aff5b1a34b748b0d09d9f22ab37))
* make paths relative ([9a640c5](https://github.com/halbritter-lab/nc-scorer/commit/9a640c5596dc137648e60b743d58758a2a4329c8))
* path to json files ([1e51f5b](https://github.com/halbritter-lab/nc-scorer/commit/1e51f5b107a314fdcc46a79e9d200ee8c4f0b50d))
* remove absolute path ([d3fe3e9](https://github.com/halbritter-lab/nc-scorer/commit/d3fe3e9fa83950d2b8d1abfcd0ead20798c9bad7))
* **ui:** resolve logo display issues and improve AppBar layout ([fe1cf60](https://github.com/halbritter-lab/nc-scorer/commit/fe1cf6019d7b8498896d623051ad61801321cfc5)), closes [#22](https://github.com/halbritter-lab/nc-scorer/issues/22) [#20](https://github.com/halbritter-lab/nc-scorer/issues/20)
* update fetch URLs to use raw GitHub links for symbols data ([5b37b7d](https://github.com/halbritter-lab/nc-scorer/commit/5b37b7d825fd973361b669d15ab8d08e9f050e7b))
* upgrade variant-linker to version 0.14.0 in package.json and package-lock.json ([7ce7f20](https://github.com/halbritter-lab/nc-scorer/commit/7ce7f208b0a704d5e70cffc7a2389eec549102d2))


### Features

* adapt search width ([95a85e0](https://github.com/halbritter-lab/nc-scorer/commit/95a85e01734747b332592dbbc8da34022aed883f))
* add CombinedScoreCard component and integrate it into ScoringView for displaying combined scores ([4422a22](https://github.com/halbritter-lab/nc-scorer/commit/4422a2212eb3ae7eee401044c55cb48422c0c116))
* add component and config structure for navbars ([e4865bb](https://github.com/halbritter-lab/nc-scorer/commit/e4865bb4e8b09bc3b5097f5ec44c4c3f4e4ff997)), closes [#2](https://github.com/halbritter-lab/nc-scorer/issues/2) [#3](https://github.com/halbritter-lab/nc-scorer/issues/3)
* add files for genes ([6f895d8](https://github.com/halbritter-lab/nc-scorer/commit/6f895d8bec5f6f77cadd381cc09c386dabe89d80))
* add GitHub API integration for fetching last commit and theme toggle functionality ([55bac74](https://github.com/halbritter-lab/nc-scorer/commit/55bac74d8a6ad3731497eeec380300f2790f69f6))
* add logo ([b12ee21](https://github.com/halbritter-lab/nc-scorer/commit/b12ee2173b1499ca5d948870637c5e2f32d0c915)), closes [#12](https://github.com/halbritter-lab/nc-scorer/issues/12)
* add new key value pairs ([558f9a9](https://github.com/halbritter-lab/nc-scorer/commit/558f9a9e2644b46b1ec9055e8a102ab4bf2d16cc))
* add retry mechanism and ESLint + Prettier configuration ([b65d36a](https://github.com/halbritter-lab/nc-scorer/commit/b65d36ad15291691bea8bf915f29fc5b5065be63)), closes [#21](https://github.com/halbritter-lab/nc-scorer/issues/21)
* add ScoringView component to integrate VariantCard and GeneCard for enhanced variant scoring display ([e0fccca](https://github.com/halbritter-lab/nc-scorer/commit/e0fcccafaf4121c83c213b8d2f763e4d33f0e3fe))
* add symbol index ([e86e528](https://github.com/halbritter-lab/nc-scorer/commit/e86e528e34d264b2f8e8246f1a89a04973155332))
* add tooltips ([81bc141](https://github.com/halbritter-lab/nc-scorer/commit/81bc1410f4349af381589e3d096ac2b95d47db28))
* add validation for segregation probability input in ScoringSearch and clean up VariantCard comments ([d11de04](https://github.com/halbritter-lab/nc-scorer/commit/d11de040ac270251cf60bf574bf9148664f9625e))
* add variant score and frequency configuration files with initial settings ([d149a2b](https://github.com/halbritter-lab/nc-scorer/commit/d149a2b80378614df27d3f5f9160ee155fdb5b19))
* add variant search functionality and variant details view ([6c4bfae](https://github.com/halbritter-lab/nc-scorer/commit/6c4bfaef38931ef610f01189fcad705fb70e0cfa))
* add workflow ([a2bcbb3](https://github.com/halbritter-lab/nc-scorer/commit/a2bcbb342d583eef4861090710a3a36e1c8eef61))
* **api:** implement client-side caching for variant API requests ([495a470](https://github.com/halbritter-lab/nc-scorer/commit/495a470b64f6357b0b0c05ecde5602de2e1a0f94)), closes [#27](https://github.com/halbritter-lab/nc-scorer/issues/27)
* **build:** migrate from Vue CLI to Vite ([2d4e910](https://github.com/halbritter-lab/nc-scorer/commit/2d4e9103e62a1727bdaa988a2ad8d1bba6ca7c0e))
* change navbar color ([415f5f3](https://github.com/halbritter-lab/nc-scorer/commit/415f5f31862af148c2f158a698398887ce4c8e70))
* **disclaimer:** implement mandatory disclaimer and user acknowledgement ([037034e](https://github.com/halbritter-lab/nc-scorer/commit/037034ee99e223859b7be267a034226c9b3a3bbb)), closes [#46](https://github.com/halbritter-lab/nc-scorer/issues/46)
* Enhance GeneInfo aesthetics with color coding and layout adjustments ([a8d12fb](https://github.com/halbritter-lab/nc-scorer/commit/a8d12fb281eb4d790b9f3f467cc858731afbf529)), closes [#13](https://github.com/halbritter-lab/nc-scorer/issues/13)
* enhance InheritanceCard to display inheritance score and improve layout ([65d6dfd](https://github.com/halbritter-lab/nc-scorer/commit/65d6dfd88975a65899b361da9d81dfc97fa0a811))
* enhance queryVariant function with detailed options and error handling ([8344366](https://github.com/halbritter-lab/nc-scorer/commit/83443661588af860c2ed60626e5c3dc63b4efc4a))
* enhance ScoringView and add ScoringSearch component with optional parameters for variant analysis ([e742f8a](https://github.com/halbritter-lab/nc-scorer/commit/e742f8ab605e1cc08bc9cdd5522c813ce02df4ce))
* enhance ScoringView to include Inheritance Parameters card and improve layout for GeneCard and VariantCard ([c8679d3](https://github.com/halbritter-lab/nc-scorer/commit/c8679d3034a0d430dad296c808803359b8211dea))
* enhance variant search component and integrate it into gene search view ([ef909bf](https://github.com/halbritter-lab/nc-scorer/commit/ef909bf4881ac40233270cfe5de4fbceeef75b57))
* enhance VariantView layout with improved styling and tooltip support for annotations ([8669c83](https://github.com/halbritter-lab/nc-scorer/commit/8669c83c9f3bbf5371698d8afed9d1d6d91b5863))
* enhance VariantView to support array formatting for transcript display ([2cef080](https://github.com/halbritter-lab/nc-scorer/commit/2cef08063aea301e0e347fad3f154aa83b2c09c6))
* **error-handling:** enhance API retry failure messaging ([224d391](https://github.com/halbritter-lab/nc-scorer/commit/224d391794b1e6905904522392238caadecaf667)), closes [#42](https://github.com/halbritter-lab/nc-scorer/issues/42)
* **export:** add data download functionality to ScoringView ([d8b9ca5](https://github.com/halbritter-lab/nc-scorer/commit/d8b9ca53013995a2f15359fdafaffbd57e07be22)), closes [#9](https://github.com/halbritter-lab/nc-scorer/issues/9)
* **faq:** redesign FAQ page with modern UI and expanded content ([0a4f5cd](https://github.com/halbritter-lab/nc-scorer/commit/0a4f5cd9345d6e60700036caf871f73b16a81bd7))
* **footer:** create a separate component with external configuration ([ac42d86](https://github.com/halbritter-lab/nc-scorer/commit/ac42d86dec7d44c8d903e9a3b5e8c393c20f6260))
* implement gene API module for fetching symbols and gene details, update theme configuration ([765adc8](https://github.com/halbritter-lab/nc-scorer/commit/765adc82bcec9a45c3c36fe4d99938f62f152425))
* implement interactive user guide tour with Shepherd.js ([2a143d4](https://github.com/halbritter-lab/nc-scorer/commit/2a143d4ec315a07dd5a140efccd37d7478aa6d37)), closes [#32](https://github.com/halbritter-lab/nc-scorer/issues/32)
* **implement semantic versioning:** implement semantic versioning ([aa4acdc](https://github.com/halbritter-lab/nc-scorer/commit/aa4acdc03e255ba619906052eb792ff67af9918e)), closes [#29](https://github.com/halbritter-lab/nc-scorer/issues/29)
* implement transcript annotation display with configurable options ([c4b9f44](https://github.com/halbritter-lab/nc-scorer/commit/c4b9f44f297ddab37d5ec6627f98fc1809321f1e))
* improve download options and UI consistency ([64c7f8e](https://github.com/halbritter-lab/nc-scorer/commit/64c7f8ec7f6d0eb1fd49d8db32f88d384a415394))
* integrate InheritanceCard into ScoringView for improved inheritance parameter display ([c213bbd](https://github.com/halbritter-lab/nc-scorer/commit/c213bbdf8d6a2a8a891867e6935cd6c909448b9d))
* **layout:** normalize content width and refine layout ([9020489](https://github.com/halbritter-lab/nc-scorer/commit/902048991d88aab143812bfe733c6c8db393a324)), closes [#25](https://github.com/halbritter-lab/nc-scorer/issues/25)
* refactor CombinedScoreCard to compute and display combined score with updated layout and tooltip ([79a8cee](https://github.com/halbritter-lab/nc-scorer/commit/79a8ceed5626f40f406526577176a560fc5fb9a5))
* refactor CombinedScoreCard to InheritanceCard with detailed inheritance parameters and scoring logic ([a790275](https://github.com/halbritter-lab/nc-scorer/commit/a7902754998ab006c0466a488bd9a505158884e0))
* refactor gene search functionality into separate components and update routing ([36d4699](https://github.com/halbritter-lab/nc-scorer/commit/36d469953f24cb5fbe2ce4a66cea32991afa13cb))
* refactor GeneCard and VariantCard to expose filteredGeneData, scoreSummary, and annotationSummary for parent component access ([7aa87db](https://github.com/halbritter-lab/nc-scorer/commit/7aa87db19e5e5a994f57a99e73fe2c4c7c59872a))
* refactor GeneView to use GeneCard component and implement loading/error states in GeneCard ([751ac79](https://github.com/halbritter-lab/nc-scorer/commit/751ac79315cacfcdaf784bb4c3fbc9e9ec1da3ee))
* refactor VariantCard to use v-table for score and frequency sections, enhancing layout and readability ([341f782](https://github.com/halbritter-lab/nc-scorer/commit/341f782a43a5edf4e7902806f573f73f4a42a8d3))
* remove console log for variant result in VariantView ([9b641c1](https://github.com/halbritter-lab/nc-scorer/commit/9b641c151d9bc547d5db40e6b6dc16e4a4e44b98))
* remove redundant title from Transcript Consequences section in VariantView ([e47ceaa](https://github.com/halbritter-lab/nc-scorer/commit/e47ceaafec753d5832fc2c1cd458eb6b219c4657))
* **scoring-search:** add new coding variant examples for kidney disease ([723a266](https://github.com/halbritter-lab/nc-scorer/commit/723a26658dc2b9577492737e1c97c3efecf956a0)), closes [#18](https://github.com/halbritter-lab/nc-scorer/issues/18)
* **scoring:** enhance score visualization with consistent highlighting and marker ([0e6211b](https://github.com/halbritter-lab/nc-scorer/commit/0e6211bea09c244e010e092c2168331fabb83890)), closes [#33](https://github.com/halbritter-lab/nc-scorer/issues/33) [#34](https://github.com/halbritter-lab/nc-scorer/issues/34)
* **search:** add input validation and format normalization ([6296d55](https://github.com/halbritter-lab/nc-scorer/commit/6296d55b7a074638ac1783395446fc9b7a8ac18e)), closes [#50](https://github.com/halbritter-lab/nc-scorer/issues/50)
* **search:** enhance example links with compound heterozygous case ([3d64855](https://github.com/halbritter-lab/nc-scorer/commit/3d64855fcaa5a400e971779e449f2148fdb76072))
* **search:** enhance gene search autocomplete with HGNC ID support ([770c48a](https://github.com/halbritter-lab/nc-scorer/commit/770c48a32a05b719413df625654be56e98e6865f)), closes [#10](https://github.com/halbritter-lab/nc-scorer/issues/10)
* **search:** Implement autocomplete and routing for gene search ([52c0cd6](https://github.com/halbritter-lab/nc-scorer/commit/52c0cd6f8eec0c40321d487a1af5e2878bce2d72))
* **SearchPage:** add introductory welcome message ([4ab5dbd](https://github.com/halbritter-lab/nc-scorer/commit/4ab5dbda355da2de9704efd3412428f9dcf7beca))
* **seo:** implement SEO, accessibility & sitemap improvements ([c503733](https://github.com/halbritter-lab/nc-scorer/commit/c5037339b27b2de1846e85093183a6545dc67b92)), closes [#35](https://github.com/halbritter-lab/nc-scorer/issues/35) [#36](https://github.com/halbritter-lab/nc-scorer/issues/36) [#38](https://github.com/halbritter-lab/nc-scorer/issues/38)
* **tour:** persist guided tour completion state ([8e6e743](https://github.com/halbritter-lab/nc-scorer/commit/8e6e74323cd4630644d06ef298ad97ab523f5aee)), closes [#53](https://github.com/halbritter-lab/nc-scorer/issues/53)
* **ui:** add "Edit Search" functionality to ScoringView ([58e7e11](https://github.com/halbritter-lab/nc-scorer/commit/58e7e11e45227406a56e5ab6350b19bed2b8d39a)), closes [#49](https://github.com/halbritter-lab/nc-scorer/issues/49)
* **ui:** add researcher collaboration platforms ([c04c341](https://github.com/halbritter-lab/nc-scorer/commit/c04c3412343128ebae87fbe912b7c297e0501888)), closes [#45](https://github.com/halbritter-lab/nc-scorer/issues/45)
* **ui:** add tooltips to AppBar and FooterBar icons ([b630c83](https://github.com/halbritter-lab/nc-scorer/commit/b630c83cd6a00e06e36bbb7f14e71e4329c6b5ad)), closes [#31](https://github.com/halbritter-lab/nc-scorer/issues/31)
* **ui:** add tooltips to improve navigation and accessibility ([a684fb1](https://github.com/halbritter-lab/nc-scorer/commit/a684fb13cc3e0bece7be4cd1a3ef9fe5cb31651f)), closes [#31](https://github.com/halbritter-lab/nc-scorer/issues/31)
* **ui:** enhance API retry visual feedback ([c1129c3](https://github.com/halbritter-lab/nc-scorer/commit/c1129c34f9ca644268b9917b1fc53381e5ff37ad))
* **ui:** enhance loading states with skeleton loaders ([3eda300](https://github.com/halbritter-lab/nc-scorer/commit/3eda300cc38b798b417f1e89e614092fbabbb478)), closes [#47](https://github.com/halbritter-lab/nc-scorer/issues/47)
* **ui:** enhance search input UI for consistency and focus ([4346718](https://github.com/halbritter-lab/nc-scorer/commit/43467184765688c3cc994574f4b490678812ef28)), closes [#52](https://github.com/halbritter-lab/nc-scorer/issues/52)
* **ui:** implement searchable Gene Score Table View with download ([4cfcff9](https://github.com/halbritter-lab/nc-scorer/commit/4cfcff90e4496115dc00708a72b50f0be4edf5d5)), closes [#47](https://github.com/halbritter-lab/nc-scorer/issues/47)
* **ui:** provide visual feedback for cache usage ([af2a9af](https://github.com/halbritter-lab/nc-scorer/commit/af2a9af71eb1f45aa9d5265d94c7cfb332b3b056)), closes [#51](https://github.com/halbritter-lab/nc-scorer/issues/51)
* update inheritance scores and add compound het support ([44d6d3a](https://github.com/halbritter-lab/nc-scorer/commit/44d6d3a1641961793ffff7d54ed873ee294fb1d7)), closes [#24](https://github.com/halbritter-lab/nc-scorer/issues/24) [#23](https://github.com/halbritter-lab/nc-scorer/issues/23) [#23](https://github.com/halbritter-lab/nc-scorer/issues/23) [#24](https://github.com/halbritter-lab/nc-scorer/issues/24)
* update InheritanceCard to display inheritance score first and improve tooltip descriptions ([735fd4e](https://github.com/halbritter-lab/nc-scorer/commit/735fd4e03d3280fe9eb294d5352f90f4b87c6b0d))
* update variant annotation configuration to hide visibility for specific fields ([c010b09](https://github.com/halbritter-lab/nc-scorer/commit/c010b09332807766167b30e71947b87d281d019c))
* update variant-linker to version 0.15.0 and integrate scoring configuration from JSON files ([a18bce9](https://github.com/halbritter-lab/nc-scorer/commit/a18bce9a008a9127d686e2c59c18a86d96bbda78))
* update vuetify to version 3.7.11 and refactor SearchPage to use tabs for variant and gene search ([f3a79c5](https://github.com/halbritter-lab/nc-scorer/commit/f3a79c50de031e01e903373aa107b5a6ed5a8b53))
* **variant-card:** add external database links and declutter UI ([908ca8c](https://github.com/halbritter-lab/nc-scorer/commit/908ca8c4043ee9dd4f12d2e90f9005663c6f55af)), closes [#48](https://github.com/halbritter-lab/nc-scorer/issues/48)
* **variant-card:** enhance transcript dropdown with MANE status indication ([2eac19e](https://github.com/halbritter-lab/nc-scorer/commit/2eac19e3d614f12038b92834c3a69120f670e8b3)), closes [#41](https://github.com/halbritter-lab/nc-scorer/issues/41)
* **variant:** implement compound heterozygous data display and scoring ([e67335c](https://github.com/halbritter-lab/nc-scorer/commit/e67335ce4bb43b26dd512c72963e2585c6d2f2eb)), closes [#43](https://github.com/halbritter-lab/nc-scorer/issues/43)


### BREAKING CHANGES

* **build:** The development server command has changed from 'npm run serve' to 'npm run dev'

# Changelog

All notable changes to this project will be documented in this file. This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - Current

### Added
- Initial setup with core scoring functionality
- Variant scoring interface
- Gene database integration
- Multiple variant input formats
- Inheritance parameter modeling
- Basic user interface with Vuetify 3
- Download options for gene scores

*Note: This changelog will be automatically updated by semantic-release based on commit messages going forward.*
