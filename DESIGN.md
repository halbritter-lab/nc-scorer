---
name: NC-Scorer
description: A calm scientific workspace for inspecting variant-prioritization evidence.
colors:
  dark-background: '#101b1a'
  dark-surface: '#192725'
  dark-primary: '#a0ddd0'
  dark-primary-strong: '#6daf9f'
  dark-text: '#e2efeb'
  dark-secondary-text: '#afc5bf'
  light-background: '#f5f8f7'
  light-surface: '#ffffff'
  light-primary: '#006b5e'
  light-primary-strong: '#005247'
  light-text: '#193b36'
  light-secondary-text: '#526963'
  secondary: '#00695C'
typography:
  page-title-desktop:
    fontFamily: "'Source Sans 3', 'Segoe UI', sans-serif"
    fontSize: '36px'
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: '-0.02em'
  page-title-mobile:
    fontFamily: "'Source Sans 3', 'Segoe UI', sans-serif"
    fontSize: '28px'
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: '-0.02em'
  section-title:
    fontFamily: "'Source Sans 3', 'Segoe UI', sans-serif"
    fontSize: '20px'
    fontWeight: 650
    lineHeight: 1.4
  explanatory-copy:
    fontFamily: "'Source Sans 3', 'Segoe UI', sans-serif"
    fontSize: '16px'
    fontWeight: 400
    lineHeight: 1.6
  supporting-copy:
    fontFamily: "'Source Sans 3', 'Segoe UI', sans-serif"
    fontSize: '0.95rem'
  evidence-emphasis:
    fontFamily: "'Source Sans 3', 'Segoe UI', sans-serif"
    fontSize: '1.125rem'
rounded:
  inset: '8px'
  workspace: '12px'
  dialog: '16px'
spacing:
  compact: '8px'
  related: '12px'
  mobile-gutter: '16px'
  field-gap: '20px'
  gutter: '24px'
  panel-inset: '28px'
  section: '32px'
components:
  workspace-dark:
    backgroundColor: '{colors.dark-surface}'
    textColor: '{colors.dark-text}'
    rounded: '{rounded.workspace}'
    padding: '{spacing.panel-inset}'
  workspace-light:
    backgroundColor: '{colors.light-surface}'
    textColor: '{colors.light-text}'
    rounded: '{rounded.workspace}'
    padding: '{spacing.panel-inset}'
---

# Design System: NC-Scorer

## Overview

**Creative North Star: A readable evidence workbench.** The interface helps researchers inspect inputs, trace scoring evidence, and compare results. Its character is quiet, precise, and approachable: restrained teal accents, readable numbers, flat workspaces, and a stable page structure.

This definition records the implemented system and verified modernization patterns. It supports task-oriented application screens and explanatory reading pages; it does not introduce a marketing identity or new scientific claims. Source authority is [the theme](src/main.js), [shared styles](src/assets/css/app.css), and the linked components below. Keep this definition synchronized when those decisions change.

**Key characteristics:** legible evidence, consistent page origins, clear action priority, visible request state, and responsive comparison tables.

The document uses the portable [DESIGN.md format](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md). Frontmatter records observed tokens; the sections explain their application.

## Colors

### Primary

The dark theme uses a pale sea-green action accent; the light theme uses a deep teal accent. Apply the active Vuetify theme's semantic `primary` role to links, active controls, and the principal action. The stronger variants support interaction states. Resolve foreground/background pairs together when changing theme.

### Secondary

The shared deep-green secondary token is an accent, not a substitute for readable secondary copy. Small metadata uses the theme's `on-surface-variant` foreground.

### Neutral

Dark workspaces sit on a green-black canvas; light workspaces use white surfaces on a pale gray-green canvas. Main text uses `on-surface`. Borders and dividers remain subtle and structural.

**The evidence rule.** Scores remain readable without color. Use numeric values and named interpretation tiers; reserve status color for a supporting signal. Keep missing data visibly distinct from a valid zero. Test contrast in both themes, including helper text, chips, disabled explanations, and tables.

## Typography

Use the self-hosted Source Sans 3 family throughout application content and teleported overlays. The page-title tokens describe the desktop/mobile endpoints; the implementation scales fluidly between them. Reuse the shared page-title style rather than assigning route-specific heading sizes.

Supporting copy covers recurring notes, source context, and secondary links. Evidence emphasis is reused for component headings and the score equation. Their weight and line height follow the containing component rather than introducing another global override.

Keep body explanations at a comfortable reading size and around 72 characters per line. Use tabular numerals for comparable scores and rows. Long identifiers wrap without hiding their distinguishing suffix. Prefer sentence case for new labels and buttons; some established labels still use title case. Compact captions are subordinate metadata; essential instructions and scientific caveats remain readable body copy.

## Layout

[ContentContainer](src/components/ContentContainer.vue) provides a centered maximum width of 1200px, with desktop padding of 32px vertically and 24px horizontally. At widths of 600px or less, it uses 24px and 16px. The navigation bar changes to its compact presentation below 800px; these are separate layout decisions.

The shared page header reserves a minimum 112px on desktop and 200px on narrow screens, followed by a 24px gap. Those measurements keep titles and the first work area aligned between home, scoring, batch, and the gene directory. A longer title can grow naturally. Measure both outgoing and incoming routes before changing shared geometry.

Forms use a two-column grid where space permits and one column on narrow screens, with clear groups and persistent error/help space. Related information is grouped by alignment, spacing, and dividers. One outlined workspace can contain several sections without another card around each section.

The workspace component tokens record the desktop search-panel inset. On narrow screens its padding becomes 20px vertically and 16px horizontally; do not carry the desktop inset unchanged onto mobile.

**The stable workspace rule.** Lazy forms retain the outgoing panel's measured height while loading. The reservation can grow for taller content and is released when width changes. Keep imports lazy; verify a delayed first download, cached switches, return navigation, and resize. Do not animate width, height, padding, or positional layout changes.

## Elevation & Depth

Workspaces and tables are flat with restrained borders. Dialogs and navigation overlays use Vuetify's overlay elevation and scrim to communicate modality. Do not add floating shadows to ordinary sections simply to separate them. Focus outlines and selected states express interaction independently of elevation.

## Shapes

The shape language is gently rounded: workspace/table boundaries, larger modal corners, and smaller inset details use the frontmatter radius roles. Keep framework button and field shapes unless a shared component establishes an override. Clip only content that belongs inside a boundary; keyboard focus, menus, long text, and mobile scrolling must remain usable.

## Components

| Pattern                       | Design and behavior                                                                                                                                 | Reference                                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Page header                   | One title, concise explanation, optional secondary action; common origin and reserved height                                                        | [SearchPage](src/views/SearchPage.vue)                                                             |
| Primary and secondary actions | One obvious next action per task; exports can be the primary action in browse/results contexts; readable busy/disabled state                        | [ScoringSearch](src/components/ScoringSearch.vue)                                                  |
| Inputs                        | Visible labels, format examples, inline actionable errors, finite/range validation; distinguish missing from zero                                   | [VariantSearch](src/components/VariantSearch.vue)                                                  |
| Evidence table                | One filtering path feeds rows and exports; reset pagination when filtering; numeric alignment                                                       | [GeneScoresTableView](src/views/GeneScoresTableView.vue)                                           |
| Mobile comparison table       | Preserve meaningful columns in a horizontally scrollable region with a visible hint; avoid whole-page overflow                                      | [GeneScoresTableView](src/views/GeneScoresTableView.vue)                                           |
| Asynchronous batch            | Identify active variant and request stage; show completed count, row errors, and cancellation that preserves completed rows                         | [BatchView](src/views/BatchView.vue)                                                               |
| Dialogs                       | Clear title, scrollable body, reachable actions, contained keyboard focus and focus return; required first acknowledgment differs from later review | [DisclaimerDialog](src/components/DisclaimerDialog.vue), [LogViewer](src/components/LogViewer.vue) |
| Navigation                    | SVG icons with accessible names; Docs opens separately and announces that behavior; internal routes remain ordinary navigation                      | [AppBar](src/components/AppBar.vue)                                                                |

## Do's and Don'ts

- **Do** compare desktop/mobile and light/dark screenshots with real long identifiers, errors, empty results, and populated tables.
- **Do** reproduce a reported interaction before fixing it, and retain a test that fails for the original defect.
- **Do** wait for settled UI and naturally removed ripples before scanning, while separately checking intentional loading states.
- **Do** use restrained transform/opacity motion and preserve reduced-motion behavior.
- **Don't** remove DOM nodes, hide warnings, or add blanket detector ignores to manufacture a clean audit.
- **Don't** show indefinite loading after a terminal failure or imply that request cancellation aborted transport when it only invalidated stale results.
- **Don't** change scoring weights, interpretation bands, or scientific meaning as part of visual refinement.

For task procedures and validation commands, see the repository skills linked from [AGENTS.md](AGENTS.md), plus the [research](docs/research/modernization-evidence.md) and [validation evidence](docs/research/modernization-validation.md).
