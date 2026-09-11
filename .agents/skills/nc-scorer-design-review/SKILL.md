---
name: nc-scorer-design-review
description: Use when auditing NC-Scorer with Impeccable or Playwright, investigating contrast, clipping, motion or layout warnings, or verifying a visual change across themes, responsive widths and loading states.
---

# NC-Scorer design review reference

Use [DESIGN.md](../../../DESIGN.md) for intended presentation and the rendered interface for observed behavior. A detector result is evidence to investigate; it does not replace workflow, keyboard, or scientific-content checks.

## Select the relevant evidence

| Question                                             | Reusable check                                                                                                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Does navigation move the heading or first work area? | [check-navigation-layout.mjs](../../../scripts/check-navigation-layout.mjs)                                                                       |
| Does a first lazy-tab download collapse the panel?   | [check-tab-layout.mjs](../../../scripts/check-tab-layout.mjs)                                                                                     |
| Are layout properties actually animated?             | [check-motion.mjs](../../../scripts/check-motion.mjs), [Vuetify motion adapter](../../../scripts/vuetify-motion.js)                               |
| Do modal actions, focus and overflow work?           | [check-dialog-design.mjs](../../../scripts/check-dialog-design.mjs), [dialog behavior tests](../../../tests/unit/components/ModalDialogs.test.js) |
| Does real batch processing/export succeed?           | [check-batch.mjs](../../../scripts/check-batch.mjs)                                                                                               |
| Do the affected routes work together?                | [audit-browser.mjs](../../../scripts/audit-browser.mjs)                                                                                           |
| Did startup performance change?                      | [audit-lighthouse.mjs](../../../scripts/audit-lighthouse.mjs), production preview                                                                 |

For route and scrolled-state detector scans, adapt [audit-design.mjs](../../../scripts/audit-design.mjs), including its scoring-specific route and readiness selector.

Read a script's arguments and selectors before using it. Extend its scenario when reviewing a new route or component. Locate the installed Impeccable launcher and inspect its help; CLI generations expose different commands. The existing design scripts take a browser detector path explicitly. Keep runtime evidence under ignored `.impeccable/` paths; commit reusable checks and durable conclusions.

## Capture a bounded state matrix

Inspect desktop and mobile in both themes, plus the states affected by the change: initial/held loading, populated, empty, invalid, terminal error, or open dialog. Add both sides of changed breakpoints, long identifiers, and keyboard navigation when relevant. A reading page also needs a scrolled capture. Wait for fonts and the intended content; after a click, wait for natural ripple removal rather than deleting its nodes. Scan loading states separately from settled results.

Record each finding in this form:

| Field        | Evidence                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| Reproduction | Route, viewport, theme, scroll position, interaction and content state                                 |
| Observation  | Raw rule/selector, screenshot, computed style or measured bounds                                       |
| Cause        | Application CSS, framework integration, real content/focus clipping, or demonstrated detector artifact |
| Resolution   | User-visible fix and regression, or a specific explanation supported by comparison evidence            |
| Confirmation | Matching after-state, relevant workflow assertion and remaining limitations                            |

## Resolve the common traps

For width/padding animation, inspect both loaded CSS and computed transitions. The framework adapter changes explicit layout transitions while preserving dimensions and safe motion; a blanket removal of component styling is not equivalent.

For scrolled-shell padding or clipped ripples, compare the reported bounds with the real content inset and settled state. Fix persistent clipped content or focus. Record a verified transient/framework artifact without changing the DOM or adding blanket ignores to obtain zero findings.

For apparent hangs, inspect requests and visible stages. Distinguish external latency/retries from lost state or a terminal error left loading. Use controlled requests for deterministic regressions and a separate live check when validating example/API compatibility.

Finish with relevant regression evidence and the verification commands in [AGENTS.md](../../../AGENTS.md). Report raw and settled findings distinctly, actual coverage metrics, and remaining limitations. Run performance measurements against a production build, outside concurrent heavy tests; a lab score is not field performance. Recheck after a material fix, then stop when the scoped checks pass.
