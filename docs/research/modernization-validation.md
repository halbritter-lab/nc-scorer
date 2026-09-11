# Modernization validation

Validated September 11, 2026 on worktree branch `feat/modernization-audit`, including the gene-directory and lazy search-tab follow-ups to checkpoint `ba78ffa6`.

## Automated verification

- `npm run validate`: lint, type checking, unit/component tests, and application plus VitePress production builds passed.
- Final integrated and coverage runs: **454 tests passed in 39 files**. The bootstrap integration suite has a 20-second allowance for real plugin loading under coverage; no test assertions were removed.
- Prettier check passed for all changed supported text files. Additional ESLint checks passed for the browser audit scripts and build adapters.
- Every one of the 38 changed application/build-helper JavaScript or Vue files has at least 80% line coverage. CSS, JSON scoring configuration, and documentation are verified through browser, configuration, and build tests.

| Metric     | Full instrumented application |
| ---------- | ----------------------------: |
| lines      |                        85.96% |
| statements |                        85.18% |
| branches   |                        81.93% |
| functions  |                        78.20% |

The function coverage target remains unmet overall and in several existing large components. The figures include uncovered application modules; no new coverage exclusions were added to hide them.

## Browser workflows and design

- All 13 Playwright workflow checks passed: first visit; theme/mobile navigation; form validation; gene lookup; gene filtering/export; GRCh38 variant lookup; GRCh37 scoring with missing segregation; batch processing/export/clear; About; Methodology; missing-route fallback; documentation; and tour dismissal. No console or page errors were recorded.
- Five affected workflows were rechecked after the final navigation changes, with no browser errors. Desktop and mobile Docs links open the working documentation in a new tab, preserving the scoring page and announcing the new-tab behavior to assistive technology.
- Home and scoring headings match font size, weight, line height, horizontal origin, vertical origin, and first-panel position at 1440px and 390px widths, including return navigation.
- Cold-load tab tests deliberately held each lazy form download in fresh desktop and mobile browser contexts. Before the fix, the panel collapsed from 591px to 56px on desktop and from 859px to 40px on mobile. It now keeps its height through loading, resolution, return, and cached switches. Resizing releases the reservation, and neither lazy form is requested at startup. Focused SearchPage coverage exceeds 95% across all metrics.
- The redesigned gene directory passed eight settled desktop/mobile/theme/filter scans with zero findings, page errors, or overflow. Tests verify pagination reset, exact prefixed HGNC lookup, and matching visible/exported rows. Headings and toolbar positions align with home; a mobile hint explains horizontal table scrolling. Its 13 focused tests exceed 85% coverage across all metrics.
- Disclaimer and logs passed desktop/mobile acknowledgment, reopen, Escape, focus-return, search, clear, and JSON-download checks. Eight settled dialog/theme/viewport Impeccable scans reported zero findings.
- Batch passed eight settled loading, input, result, theme, and viewport scans with zero Impeccable findings. A mixed invalid/valid submission preserved the valid result and exposed a useful error for the invalid row.
- The source scan (`impeccable detect --no-config --json src`) returned no findings. Loaded scoring views passed both themes. Explicit layout-transition scans passed home, scoring, and batch loading/result states.
- Another 24 route/theme/filter checks covered About, Methodology, gene lists, gene details, and variant details with no page errors or horizontal overflow. Six checks retained a scrolled application-background padding warning; inspection showed the full-page shell rather than a card losing its inset. A skeleton shimmer can also be identified as a marquee during loading. These detector limitations are recorded rather than suppressed with ignore rules.

## Live batch evidence

The original Nephrology Genes preset produced five Ensembl errors, including reference-allele mismatches and unresolved transcript versions. Replacement examples were verified against the live GRCh38 endpoints and then through the actual batch UI.

| Variant                   | Gene   |   NCS |
| ------------------------- | ------ | ----: |
| NM_001009944.3:c.11935C>T | PKD1   | 8.123 |
| NM_033380.3:c.1871G>A     | COL4A5 | 6.881 |
| 12-88101183-A-G           | CEP290 | 4.061 |

CSV, TSV, and JSON downloads were checked against the actual results and score weights. These examples demonstrate working input formats; their scores are prioritization outputs.

External latency remains significant: one PKD1 recoder response arrived about 180 seconds after page load, and the three-row run completed at about 240 seconds. A later coordinate request received two HTTP 503 responses before succeeding. The interface now identifies the active annotation/gene-evidence stage, shows completed counts, and offers cancellation. Cancellation invalidates pending UI writes and preserves completed results; it does not abort an upstream dependency request already in flight.

## Production measurements

Lighthouse 12 mobile emulation ran three times against the production preview at checkpoint `ba78ffa6` on a shared Windows development machine. These are local laboratory measurements, not field Core Web Vitals or a guarantee for other hardware/networks. The final follow-up build contains 1,491,492 bytes of generated application assets, still 72.4% below the baseline.

| Measure                              |     Earlier baseline |                  Final checkpoint |
| ------------------------------------ | -------------------: | --------------------------------: |
| Generated application assets         |      5,404,055 bytes |   1,489,577 bytes (72.4% smaller) |
| Lighthouse performance               | 52 (one earlier run) |             73 median; 79, 73, 70 |
| Accessibility / best practices / SEO |      100 / 100 / 100 | 100 / 100 / 100 in all three runs |
| First Contentful Paint               |   approximately 4.7s |                      2.46s median |
| Largest Contentful Paint             |   approximately 6.1s |                      3.51s median |
| Total Blocking Time                  |  approximately 570ms |                      588ms median |
| Cumulative Layout Shift              |                    0 |               0 in all three runs |
| Transferred bytes                    | approximately 846KiB |                     404,062 bytes |

The broad icon-font payload was replaced with explicit SVG icons, and variant analysis plus the guided tour load on demand. The performance score is improved but is below 90; startup scripting remains a measured bottleneck.

## Dependency and review limits

`npm audit --omit=dev --json` reports zero production vulnerabilities. The complete dependency graph still reports **39 development-tool advisories: 19 high, 19 moderate, and 1 low**. Major release-tooling and Lighthouse upgrades were not included.

Independent review found and fixed empty-annotation crashes, inconsistent assembly normalization, and the omitted optional route-assembly default. Regression tests cover each failure. Medical model weights and interpretation bands remain unchanged. The research evidence and design rationale are in [modernization-evidence.md](./modernization-evidence.md).

## Reproducing browser checks

Start the development server with `npm run dev`. Browser scripts use a locally installed Chrome through Playwright. The Impeccable checks accept the path to its `detect-antipatterns-browser.js` detector.

```sh
node scripts/audit-browser.mjs http://localhost:5173 .impeccable/browser
node scripts/check-navigation-layout.mjs http://localhost:5173
node scripts/check-tab-layout.mjs http://localhost:5173
node scripts/check-motion.mjs http://localhost:5173
node scripts/check-batch.mjs http://localhost:5173 /path/to/detect-antipatterns-browser.js
node scripts/check-dialog-design.mjs http://localhost:5173 /path/to/detect-antipatterns-browser.js
node scripts/audit-design.mjs http://localhost:5173 /path/to/detect-antipatterns-browser.js
npm run build
npm run preview
node scripts/audit-lighthouse.mjs http://localhost:4173/ 3
```

Runtime evidence is kept under ignored `.impeccable/` directories; generated screenshots, HAR files, coverage reports, and dependency audit payloads are not source files.
