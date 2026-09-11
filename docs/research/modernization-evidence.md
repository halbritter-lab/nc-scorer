# NC-Scorer modernization evidence

NC-Scorer benefits most from modernization that protects assessment identity, makes missing evidence explicit, and reduces the work required to reach a result. A cleaner interface supports these goals when it keeps the variant, genome assembly, inheritance assumptions, score breakdown, and export actions understandable together. Visual consistency cannot compensate for stale requests or a numerically plausible score derived from invalid inputs.

This report evaluates the repository against official Vue, Vue Router, Vite, and Vitest guidance; W3C accessibility guidance; the CSV format specification; OWASP community security guidance; and the maintained VCF specification. The engineering recommendations are specific to the Vue 3.5, Vue Router 4, Vite 6, Vuetify, Pinia, and Vitest application. They do not establish clinical validity for the scoring method. Source pages were checked on September 11, 2026. Living documentation may change, so version-specific Vite 6 documentation is used for build recommendations.

## Findings and decisions

The most consequential reproduced failures concern evidence integrity. The combined scoring utility accepted finite values outside its permitted range; a view considered valid zero scores perpetually incomplete; route reuse retained assessment inputs; and an old gene score could survive a change in the prioritized gene. Batch clearing did not prevent outstanding requests from repopulating results. The original VCF export fabricated genomic coordinates, while delimited exports could break field boundaries or create spreadsheet formulas.

The appropriate response is to define a small number of contracts and enforce them at their boundaries. Scores must be validated before an assessment becomes available. Asynchronous work must remain associated with the input that started it. Export serializers must own escaping consistently. The UI should represent missing, invalid, pending, and measured-zero values separately.

| Area                 | Repository finding                                             | Recommended contract                                                 | Evidence                      |
| -------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------- |
| Assessment identity  | Setup-time route snapshots survived route reuse                | Read current inputs reactively and reset dependent evidence together | [1], [2]                      |
| Asynchronous updates | Cleared batches could accept late results                      | Every completion belongs to an active request or batch generation    | [1]                           |
| Composable inputs    | Refs and getters require consistent normalization              | Resolve flexible inputs inside the tracked effect                    | [3]                           |
| Score boundaries     | Finite values outside `[0, 1]` reached combined calculations   | Validate type, finiteness, range, and readiness separately           | Repository scoring invariants |
| Export format        | Quotes and line breaks were not escaped consistently           | Use one serializer for headers and data                              | [7]                           |
| Spreadsheet security | Untrusted text could become a formula                          | Neutralize formula text and preserve structured alternatives         | [8]                           |
| Variant format       | VCF output invented position and alleles                       | Export VCF only from verified, assembly-specific variant records     | [12]                          |
| Accessibility        | Interactive research flows depend on more than visual styling  | Verify target size, contrast, and status announcements               | [9], [10], [11]               |
| Performance          | Repeated work and initial dependencies need separate treatment | Measure load, interaction, and API work independently                | [4], [5]                      |
| Verification         | Happy-path tests did not expose lifecycle failures             | Use controlled request ordering and edge-value fixtures              | [6]                           |

## Reactive assessment identity

Vue Router reuses a component instance when navigation changes parameters for the same route component. Mount-time initialization therefore does not reliably run again. Its documentation recommends responding to parameter changes through reactive observation or route update handling. Vue's watcher documentation separately identifies stale asynchronous completion as a problem requiring invalidation and cleanup. These are complementary responsibilities: reactive route inputs select the current assessment, and request ownership determines which result may update it. [1], [2]

For this repository, an assessment is identified by the first variant, optional second variant, inheritance pattern, segregation value, and assembly. Changing any of these inputs should invalidate the associated gene, variant, and inheritance evidence before the new total becomes downloadable. A route key is useful for replacing child components whose internal state belongs to the previous assessment. The state reset in the parent remains necessary because child remounting alone does not clear the parent's old values.

Optional positional route segments were also a poor fit for independently optional scoring settings. Omitting segregation or the second variant while supplying assembly makes the URL difficult to interpret safely. Named query parameters make the intended mapping explicit. Legacy parameterized links can remain readable while newly generated URLs use named settings. The query alias for the second variant should be normalized consistently across the search form, assessment page, examples, and Edit Search action.

A regression scenario should navigate from one completed assessment to another using the same mounted view. The second view must show the new input and must not expose the first result as complete. Another scenario should change the prioritized gene while the old gene request is pending, then resolve the requests in reverse order. An old response must neither supply the new gene score nor re-enable export.

## Request cleanup and batch ownership

Vue documents watcher cleanup with `AbortController`, as well as the third-argument cleanup callback. The Vue 3.5 `onWatcherCleanup` API must be registered synchronously; placing registration after an `await` does not meet that API's contract. Watchers created synchronously in component setup are stopped at unmount, but an already-started asynchronous operation still needs an ownership or cancellation strategy. [1]

Batch processing has a related lifecycle that is larger than an individual component watcher. A run begins from a snapshot of its input and assembly. Clear Results, starting a replacement run, or leaving the page ends its right to publish. A generation number checked after each asynchronous boundary prevents results from an obsolete run from entering the table. It also prevents an old run's finalizer from changing the loading state of a newer run.

The current batch fix uses generation checks and an assembly snapshot. This prevents stale UI writes, but it does not physically abort an upstream request already in flight. That distinction matters when evaluating performance: correctness is restored even where a dependency does not offer a compatible abort signal. Future transport cancellation should be added only after confirming support across variant-linker, Ensembl calls, retry logic, and shared requests.

Repeated variants in the same gene should use one gene-evidence snapshot during a run. Keeping successful gene responses in a run-local map avoids a request per row and prevents the same batch from mixing changing gene evidence. This cache has a deliberately narrow lifetime; a new run may fetch updated evidence. It should not be extended into an indefinite cache without explicit expiry and source-version semantics.

## Composable boundaries and ownership

Vue's composable guidance accepts ordinary values, refs, and getters, and illustrates `toValue()` within a `watchEffect` so dependency accesses are tracked. Normalizing outside the tracked effect can turn a reactive input into a one-time snapshot. Cleanup for DOM listeners and other side effects belongs to the composable that creates them. [3]

For NC-Scorer, composables that fetch by variant, assembly, or gene should receive getters when the caller's value may change. They should resolve the getter at the point where the reactive effect runs. This makes the dependency contract explicit and reduces the temptation to reach into route state or global variables from utility functions.

Injected retry state deserves the same ownership discipline. Constructing fallback state eagerly can start watchers or allocate resources even when a parent already supplied the dependency. The repository invariant `inject('key', null) || fallback()` is a useful local rule because it makes construction conditional. That expression is an application convention; it is not a substitute for cleaning up resources inside the fallback itself.

Assembly must also be part of cache identity. A coordinate or response valid for GRCh37 cannot be assumed to identify the same genomic record in GRCh38. The safest cache key describes the normalized variant, assembly, and any request option that changes the returned evidence. Cache reuse is then an optimization of a correct identity model.

## Score semantics and numerical integrity

The repository defines NCS as `4 × gene + 4 × variant + 2 × inheritance`, producing a value from zero to ten when every component lies in `[0, 1]`. A finite-number check alone does not establish this range. For example, a gene score of `1.1` with the other two components at one produces `10.4`. A negative input can produce a plausible-looking total while violating the model just as seriously.

The scoring boundary should distinguish parsing from validation. Numeric API strings can be normalized deliberately, then checked with `Number.isFinite()` and range comparisons. The assessment view should reject invalid data as unavailable rather than use its mathematical fallback as evidence that an assessment is complete. A fallback total of zero prevents numerical propagation; it does not mean that missing or corrupt evidence was measured as zero.

The same validation must occur before combining variants. Two invalid component values, such as `-0.5` and `1.5`, can average to a plausible `0.5`; checking only the result misses the defect. Single and compound variant cards, gene cards, and batch processing now share a parser that keeps absent, blank, nonnumeric, nonfinite, and out-of-range scores unavailable while preserving measured zero. Completed requests report unavailable evidence explicitly so the assessment view can replace its loading skeleton with a useful explanation.

The local variant-linker integration also exposed a configuration-type mismatch. Its legacy mapping syntax converts default values to numbers, so a configured `LOW` impact default became numeric zero and missing consequence data also became a scalar. The logistic expression expected arrays and failed before annotation reached the interface. Typed array defaults and scalar normalization resolve that mismatch without changing regression coefficients. An annotation without consequence evidence now returns an unavailable score instead of constructing one entirely from imputed inputs; the configured `LOW` default remains usable when a consequence is present but impact is missing. Regression coverage exercises the installed upstream scorer as well as the formula directly.

Missing segregation and zero segregation have opposite meanings in this implementation. Missing data receives the configured 20% inheritance penalty where segregation evidence is expected. A provided probability of zero supplies maximal segregation evidence after the configured logarithmic floor. Truthiness checks therefore cannot decide whether segregation exists. Whitespace-only input should follow the missing-data path rather than JavaScript's `Number(' ') === 0` conversion.

The same distinction applies to output fields. A zero CADD value or zero observed population frequency must remain in the export. Checking a value with `if (value)` silently discards this evidence. Use explicit null or undefined checks for optional numeric fields, and preserve finite zero values throughout the view and serializers.

The interpretation bands remain `[0, 3)` Low Priority, `[3, 7)` Moderate Priority, and `[7, 10]` High Priority. These are repository scoring definitions, not thresholds derived from the engineering sources in this report. Any change to the weights, segregation penalty, or interpretation bands should receive separate scientific review and versioned documentation.

## Delimited exports and spreadsheet security

RFC 4180 describes enclosing fields containing commas, quotes, or line breaks in double quotes, and escaping an embedded quote by doubling it. The rule applies equally to header fields and data fields. It describes CSV records with CRLF line endings; the application's existing LF-delimited output should be described as its interoperability choice rather than asserted to be a complete RFC-conformance implementation. [7]

NC-Scorer previously had multiple export paths that joined values directly. This is especially fragile for gene descriptions, multi-value annotations, user-supplied identifiers, and error text. A shared serializer should handle null values, delimiter-aware quoting, embedded quotes, and line breaks. Passing a tab delimiter gives the batch TSV path the same field-boundary protections, although TSV import behavior should still be tested in the intended downstream applications.

Correct quoting does not prevent spreadsheet formulas. OWASP identifies leading formula characters, whitespace/control-character tricks, and field-boundary manipulation as separate risks. Its current community guidance also warns that spreadsheet save/reopen behavior can undo common protections, and that no universal sanitization strategy works for every spreadsheet and downstream consumer. [8]

The application should treat potentially executable exported text as text and retain real numeric values as numbers. Prefixing risky strings is a compatibility tradeoff: machine consumers may observe the prefix. JSON retains original structured values and is therefore a useful alternative for pipelines. Excel exports should continue to use explicitly typed string cells rather than formula objects for user or annotation text. Spreadsheet protection claims should be limited to the formats and applications actually tested.

A useful export regression set includes commas, quotes, CR and LF characters, empty fields, numeric zero, negative numeric values, formula prefixes, whitespace before formula prefixes, Unicode variants where relevant, and multirow data. Assertions should compare the serialized payload, not only confirm that a download function was called.

## VCF requires verified genomic records

The maintained VCF specification defines a structured variant record with a contig, position, reference allele, alternate allele, and associated metadata. Its reference allele field is required, and allele representation for insertions and deletions includes rules for padding and position. A transcript HGVS identifier cannot be converted into a valid VCF record by splitting at a colon and assigning position one. [12]

The original batch exporter used precisely that kind of placeholder construction. It could present a transcript accession as a chromosome, emit position `1`, and fill the alleles with missing values while labeling the row as passing. Such a file is more problematic than an unsupported export because it resembles a valid analysis artifact.

The current modernization removes this unsupported VCF output. Restoring it should require verified, assembly-specific genomic alleles from a defined normalization source. It should preserve contig identity, use valid reference and alternate alleles, encode INFO values safely, and include appropriate metadata. Tests should parse exported fixtures with an independent VCF parser, including single-nucleotide substitutions, insertions, deletions, unresolved variants, and assembly changes.

VCF 4.5 is used here to check the maintained format's core record semantics. The removed exporter advertised VCF 4.2; adopting a newer specification is not required to fix its fabricated records. A future implementation should declare and validate against one explicit supported VCF version.

## Accessibility and interface clarity

W3C's WCAG 2.2 guidance specifies a 24-by-24 CSS-pixel minimum pointer target criterion with defined exceptions. Larger controls can be a sensible product choice, but a universal 44-pixel claim should not be mislabeled as this particular minimum criterion. The rendered target, spacing, shape, and adjacent controls matter; a component prop alone does not demonstrate conformance. [9]

For the search and scoring interface, primary actions should have a predictable order and descriptive labels. Examples should fill a form without unexpectedly submitting it. A genome-assembly selector belongs close enough to the variant input that its effect is visible. The assessment page should repeat the selected assembly and preserve it when returning to edit the search.

The W3C contrast guidance requires at least 4.5:1 for normal text and 3:1 for qualifying large text, with exceptions. It also cautions against rounding a failing measured ratio up to the threshold. Low-emphasis labels and explanatory text therefore deserve measurement in both light and dark themes, not just a visual check on a designer's screen. [10]

Status messages need programmatic exposure without requiring the user to move focus. W3C's guidance includes `role=status` for results or application-state updates and suitable live-region techniques for progress. Repeating every row-level batch message would be noisy; announcing progress at useful intervals and announcing completion or failure is a better application-level choice. [11]

For score communication, retain the numeric value, interpretation label, and weighted breakdown together. Color can reinforce the three tiers, but it should not carry the meaning alone. Missing segregation should be explained in plain language near the inheritance score. Invalid input should produce a readable error and keep the total unavailable rather than strand the user behind a skeleton with no explanation.

The interface should be checked using keyboard navigation, visible focus, a narrow viewport, browser zoom, and at least one screen reader. Automated component tests help verify labels and state transitions, but they do not establish the experience of focus movement or spoken announcements by themselves.

## Forms, error recovery, and research workflow

GOV.UK's text-input pattern associates each control with a persistent label and links hints and errors through descriptive attributes. Its error-summary pattern places a summary before the form, moves focus to it after failed validation, links errors to the corresponding fields, and keeps summary wording consistent with the inline messages. Those are implementation practices for the GOV.UK design system. They provide useful design evidence for NC-Scorer, but its exact mandated heading and page structure are not universal accessibility requirements. [13], [14]

For the variant form, the label should identify the data being requested; the hint should explain the supported notation and show a short example. A placeholder can supplement those elements but should not be the only explanation because it disappears during entry. The genome assembly should remain visible as part of the form's context, and examples should populate that setting as well as the identifier.

Validation should help someone recover from the specific problem. A blank required variant needs a request to enter a variant. An invalid segregation probability needs its allowed interval. A compound heterozygous assessment missing its second variant needs that missing input identified explicitly. A network error should preserve entered values and offer a retry; telling the person to correct a syntactically valid identifier would assign the failure to the wrong cause.

Form submission is a useful boundary for complete validation and focus management. Aggressive error messages while a person is still typing can interrupt valid intermediate states. Any earlier validation should be restrained and should not replace a clear submit-time result. This timing recommendation is an application design judgment to verify with representative users, not a requirement extracted from the format or accessibility standards.

Jakob Nielsen's heuristics emphasize visible system state, familiar terminology, consistency, error prevention, recognition, user control, and actionable error messages. The author describes them as broad heuristics rather than precise rules. They are valuable for inspecting the research workflow, but they do not establish that a particular layout is optimal or replace usability sessions. [15]

Applied to NC-Scorer, recognition means showing the assessed variant, assembly, and inheritance assumptions together rather than requiring recall from the search page. User control means Edit Search preserves the current values. Visible state means a pending gene response is distinguishable from an unavailable gene score. Consistency means the same action label and visual treatment should identify an export wherever it appears.

## Product design direction and its limits

Impeccable's Operate guidance describes task-focused interfaces with familiar controls, restrained use of color, consistent state treatments, compact typography, and structural responsive changes. It favors meaningful motion and consistent affordances over decoration. This is the project's authored design approach, not a W3C standard, a Vuetify requirement, or a controlled study proving that any named style improves scientific work. [19]

NC-Scorer fits that task-oriented category because people enter identifiers, inspect evidence, compare scores, and export results. A suitable direction is a clear page heading, a compact input region, a prominent result with its assumptions, and evidence arranged in predictable sections. Dense transcript and gene tables can remain dense where comparison benefits from proximity. Introductory prose should have a narrower reading measure than a table.

The design should use hierarchy to separate primary actions from supporting information. Search or Assess is the dominant action in the form; examples, assembly guidance, and documentation support it. On a completed result, the score and interpretation have priority, with export and edit available nearby. Decorative panels or repeated headings that push the working controls below the first screen should justify their space through user value.

Typography and color should be defined as a system rather than independently per component. The application can use one readable sans-serif family, stable type sizes, consistent table numerals, and a small set of semantic colors. These are recommended defaults for this product, not universal aesthetic rules. The deciding evidence should be whether people can scan and act correctly across the search, detail, and batch views.

Responsiveness should preserve task structure. On a narrow screen, controls can stack and evidence cards can become a single column. Tables may need deliberate horizontal scrolling or a reduced visible column set, with the complete data still available. Shrinking all typography until a desktop layout fits would reduce readability while preserving the wrong structure.

## Vuetify integration, theme, and icons

Vuetify's version 3.8.1 accessibility documentation describes built-in keyboard interactions and semantic elements, and explains that activator-slot props carry accessibility attributes for menus and dialogs. Its examples bind those props onto the activator control. Omitting that binding during a custom design can remove the relationship between a button and its popup even when the control still responds to a mouse. [16]

Keep native Vuetify controls for form fields, menus, tabs, and dialogs unless a concrete user requirement needs a different interaction. Customize presentation through supported props and shared styles. When replacing a default control with a custom wrapper, verify the rendered accessible name, keyboard behavior, expanded state, disabled state, and focus return. Component-library support reduces implementation burden; it does not certify the composed page.

Vuetify 3.8.1 provides light and dark themes, a theme composable, theme providers, and generated CSS variables for custom colors. These mechanisms allow shared semantic tokens for backgrounds, surfaces, text, and status colors. They are preferable to scattering fixed foreground/background pairs across individual views, because theme changes can otherwise leave isolated unreadable sections. [17]

For NC-Scorer, define the score-tier colors and their foregrounds centrally, then use the same mapping in the combined card, interpretation guide, and batch rows. Keep action color separate from the meaning of a high score. A red high-priority score is domain presentation; a red field error is interaction state. Clear text labels help prevent those meanings from being confused.

Vuetify's icon documentation supports both font and SVG approaches and recommends the SVG path for production optimization, importing only the required application icons. Its built-in aliases cover icons used inside Vuetify components, while application-specific icons still need to be supplied. Therefore removing an icon font requires an inventory of both explicit icons and library defaults. [18]

An SVG migration can reduce a broad icon-font payload, but an incomplete alias map can erase menu arrows, close buttons, validation markers, or loading controls. Inspect forms, menus, pagination, search, dialogs, and dark mode after such a change. Measure the resulting production asset weight; do not assume that adding an SVG package alone reduced the total. The version-pinned documentation used here avoids silently adopting behavior from a later Vuetify major version.

## Performance and build strategy

Vue distinguishes initial page-load performance from update performance, recommends measuring actual production output, and supports lazy loading through dynamic imports. Its guidance favors reducing unnecessary dependencies and stabilizing frequently passed props. It also recommends route-level lazy loading. These are useful mechanisms, but their value depends on the application's actual loading and interaction profile. [4]

NC-Scorer already has route-level dynamic imports and a dynamically imported Excel writer. Preserve those boundaries. Loading an export library before someone requests an export adds work to every assessment, while lazy loading limits that cost to the relevant action. Likewise, the batch page should not determine the startup weight of a user who only opens a gene result.

Vite 6 supports production asset generation and chunk configuration, and documents failures caused by stale clients requesting chunks removed by a new deployment. Its build guidance notes the importance of serving HTML with suitable caching behavior so clients can discover new assets. Build tuning therefore includes deployment behavior, not only the size of generated files. [5]

Manual chunk groups should follow observed dependency structure. A single oversized vendor group can undermine route-level loading, while splitting every dependency can create additional request and execution overhead. Retain changes only when production output and browser measurements show a useful effect. Do not infer runtime speed from shorter source files, fewer visible controls, or a successful build.

Measure at least cold startup, repeat navigation, search submission, first useful result, table filtering, and export initiation. For batch work, count variant and gene requests as well as elapsed time. A repeat-gene fixture demonstrates a concrete improvement from per-run evidence reuse; a stopwatch alone cannot explain whether speed changed because of caching, network variation, or removed rendering work.

## Navigation geometry, motion, and dialogs

Visual jumps during navigation are not necessarily captured by a page-load CLS score. Home and assessment headings previously used different sizes, weights, and offsets. A shared page-header layout now gives both titles the same typography and document coordinates at desktop and mobile widths. A browser regression also checks the first content panel and the return navigation, so matching only the heading font cannot conceal a remaining position change.

Google's web.dev animation guidance recommends avoiding properties that trigger layout or paint where practical, and using transforms and opacity for suitable motion. NC-Scorer removes explicit layout transitions from framework CSS while retaining dimensions and safe transitions. A PostCSS adapter preserves comma-separated timing functions and unrelated properties; runtime scans cover loading and completed views. This is a rendering decision, not evidence that network annotation became faster. [20]

The WAI modal-dialog pattern specifies a contained tab sequence, appropriate dialog labeling, focus movement on open, and focus return on close. The logs and disclaimer review use Vuetify dialogs and named controls, with browser checks for Escape and focus restoration. The initial required acknowledgment remains persistent as an existing product requirement; subsequent disclaimer review is dismissible. That exception should not be represented as full adherence to every APG keyboard recommendation. [21]

## Verification and release evidence

Vitest provides function and module mocks, partial module mocking, and controlled timer behavior. Its documentation stresses restoring or clearing mock state between tests and explains that module mocks are hoisted. It also notes that mocking an exported function does not necessarily replace internal references to that function within the same module. These details matter when tests are intended to observe real serialization or caching behavior. [6]

The regression strategy should keep pure scoring and serializers real while controlling external responses. Controlled promises can reproduce a route change or clear action before an earlier request resolves. Numeric fixtures should cover zero, one, values outside the permitted interval, `NaN`, infinity, numeric strings at API boundaries, missing segregation, and maximal segregation evidence.

Integration evidence should include a completed zero-valued assessment, a changed gene with old evidence pending, a replaced batch, exports containing special characters, and round-trip editing of both legacy and query-based scoring URLs. These cases exercise contracts that happy-path screenshots cannot reveal.

The repository's required release checks are lint, static type checking, unit/component tests, and the combined application/documentation production build. A successful targeted test run is useful during development but does not replace the complete integration run. Final pass counts and build metrics belong to the final integrated revision and should be recorded from its actual command output.

## Prioritized recommendations and limits

First, preserve the numerical and lifecycle fixes as explicit regression contracts. An apparently minor refactor from a null check to a truthiness check can reintroduce zero-value failures. A change to route handling can reintroduce stale assessments even while a new navigation still displays the correct title. These deserve small, behavior-focused tests.

Second, consolidate evidence identity across views and services. The variant, assembly, source version, and gene identity should remain available alongside scores. A future unified assessment object may reduce event-handler duplication, but a larger refactor should follow stable contracts and fixtures rather than precede them.

Third, measure the redesigned interface in the browser. Source-level improvements need confirmation through actual rendered layouts, interaction behavior, and accessible names. Any claim of accessibility conformance, faster startup, or fewer requests should identify the measured scenario and its limitations.

Fourth, maintain export compatibility deliberately. CSV is widely readable but interpreter-sensitive. JSON is a better fidelity-preserving interchange path. VCF requires a real normalization pipeline. Choosing a supported format is a product decision, while silently inventing required data is a correctness defect.

This report establishes engineering evidence and recommendations. It does not report clinical validation, production traffic measurements, comprehensive browser compatibility, or a full accessibility conformance audit. The framework documentation, interoperability specifications, and OWASP guidance resolve the main implementation questions, but downstream spreadsheet behavior and external API availability still require application-specific verification.

## Sources

1. Vue.js documentation contributors. [Watchers](https://vuejs.org/guide/essentials/watchers.html). Living documentation; Vue 3.5 cleanup constraints and watcher behavior. Accessed September 11, 2026.
2. Vue Router documentation contributors. [Dynamic Route Matching with Params](https://router.vuejs.org/guide/essentials/dynamic-matching.html). Living documentation; component reuse and parameter updates. Accessed September 11, 2026.
3. Vue.js documentation contributors. [Composables](https://vuejs.org/guide/reusability/composables.html). Living documentation; flexible inputs, `toValue`, and cleanup. Accessed September 11, 2026.
4. Vue.js documentation contributors. [Performance](https://vuejs.org/guide/best-practices/performance.html). Living documentation; measurement, code splitting, and update costs. Accessed September 11, 2026.
5. Vite documentation contributors. [Building for Production, Vite 6](https://v6.vite.dev/guide/build). Archived major-version documentation; asset generation and deployment considerations. Accessed September 11, 2026.
6. Vitest documentation contributors. [Mocking](https://vitest.dev/guide/mocking.html). Living documentation; mocks, isolation, and module behavior. Accessed September 11, 2026.
7. Y. Shafranovich, RFC Editor. [RFC 4180: Common Format and MIME Type for Comma-Separated Values Files](https://www.rfc-editor.org/rfc/rfc4180). October 2005. Informational specification; field quoting and escaping.
8. Timo Goosen, Albinowax, and OWASP community contributors. [CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection). Living community guidance, read through its [official source text](https://raw.githubusercontent.com/OWASP/www-community/master/pages/attacks/CSV_Injection.md). Accessed September 11, 2026.
9. W3C Web Accessibility Initiative. [Understanding SC 2.5.8: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). WCAG 2.2 explanatory guidance. Accessed September 11, 2026.
10. W3C Web Accessibility Initiative. [Understanding SC 1.4.3: Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). WCAG 2.2 explanatory guidance. Accessed September 11, 2026.
11. W3C Web Accessibility Initiative. [Understanding SC 4.1.3: Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html). WCAG 2.2 explanatory guidance. Accessed September 11, 2026.
12. SAM/BAM/CRAM/VCF specification maintainers. [Variant Call Format specification, version 4.5](https://samtools.github.io/hts-specs/VCFv4.5.pdf). Maintained specification; record fields and allele representation, particularly section 1.6. Accessed September 11, 2026.
13. GOV.UK Design System contributors. [Text input](https://design-system.service.gov.uk/components/text-input/). Living component guidance; labels, hints, and associated error messages. Accessed September 11, 2026.
14. GOV.UK Design System contributors. [Error summary](https://design-system.service.gov.uk/components/error-summary/). Living component guidance; summary focus and field-level recovery. Accessed September 11, 2026.
15. Jakob Nielsen, Nielsen Norman Group. [10 Usability Heuristics for User Interface Design](https://www.nngroup.com/articles/ten-usability-heuristics/). Published April 24, 1994; reviewed January 30, 2024. Primary authored heuristic guidance, not a conformance standard.
16. Vuetify contributors. [Accessibility, version 3.8.1 source](https://raw.githubusercontent.com/vuetifyjs/vuetify/v3.8.1/packages/docs/src/pages/en/features/accessibility.md). Version-pinned official documentation; activators and keyboard behavior. Accessed September 11, 2026.
17. Vuetify contributors. [Theme, version 3.8.1 source](https://raw.githubusercontent.com/vuetifyjs/vuetify/v3.8.1/packages/docs/src/pages/en/features/theme.md). Version-pinned official documentation; theme configuration and variables. Accessed September 11, 2026.
18. Vuetify contributors. [Icon Fonts, version 3.8.1 source](https://raw.githubusercontent.com/vuetifyjs/vuetify/v3.8.1/packages/docs/src/pages/en/features/icon-fonts.md). Version-pinned official documentation; SVG configuration and aliases. Accessed September 11, 2026.
19. Paul Bakaus and Impeccable contributors. [Operate mode depth](https://github.com/pbakaus/impeccable/blob/main/skill/reference/operate.md), read through its [official source text](https://raw.githubusercontent.com/pbakaus/impeccable/main/skill/reference/operate.md). Living design guidance. Accessed September 11, 2026.

20. Kayce Basques and Rachel Andrew. [How to create high-performance CSS animations](https://web.dev/articles/animations-guide). Google web.dev guidance; rendering costs and transform/opacity animation. Accessed September 11, 2026.
21. W3C Web Accessibility Initiative. [Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). ARIA Authoring Practices Guide; dialog labeling, keyboard containment, and focus return. Accessed September 11, 2026.

[1]: https://vuejs.org/guide/essentials/watchers.html
[2]: https://router.vuejs.org/guide/essentials/dynamic-matching.html
[3]: https://vuejs.org/guide/reusability/composables.html
[4]: https://vuejs.org/guide/best-practices/performance.html
[5]: https://v6.vite.dev/guide/build
[6]: https://vitest.dev/guide/mocking.html
[7]: https://www.rfc-editor.org/rfc/rfc4180
[8]: https://raw.githubusercontent.com/OWASP/www-community/master/pages/attacks/CSV_Injection.md
[9]: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
[10]: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
[11]: https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
[12]: https://samtools.github.io/hts-specs/VCFv4.5.pdf
[13]: https://design-system.service.gov.uk/components/text-input/
[14]: https://design-system.service.gov.uk/components/error-summary/
[15]: https://www.nngroup.com/articles/ten-usability-heuristics/
[16]: https://raw.githubusercontent.com/vuetifyjs/vuetify/v3.8.1/packages/docs/src/pages/en/features/accessibility.md
[17]: https://raw.githubusercontent.com/vuetifyjs/vuetify/v3.8.1/packages/docs/src/pages/en/features/theme.md
[18]: https://raw.githubusercontent.com/vuetifyjs/vuetify/v3.8.1/packages/docs/src/pages/en/features/icon-fonts.md
[19]: https://raw.githubusercontent.com/pbakaus/impeccable/main/skill/reference/operate.md
[20]: https://web.dev/articles/animations-guide
[21]: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
