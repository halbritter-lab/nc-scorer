---
name: nc-scorer-layout
description: Use when adding or refining NC-Scorer pages, search forms, evidence tables, dialogs, or responsive layouts, especially when headings shift, lazy tabs collapse, or card nesting and spacing become inconsistent.
---

# NC-Scorer layout reference

Read [DESIGN.md](../../../DESIGN.md) for the current visual definition and [AGENTS.md](../../../AGENTS.md) for repository invariants. Apply the existing scientific workspace identity to the requested surface. A visual refinement preserves scientific meaning and the user's task scope.

## Choose the reference that fits the task

| Task                             | Existing implementation                                                                                              | Contract to preserve                                                                                                                               |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page or reading layout           | [ContentContainer](../../../src/components/ContentContainer.vue), [shared styles](../../../src/assets/css/app.css)   | Common page-title origin, header reserve, content width, mobile gutters, readable prose measure                                                    |
| Search or lazy tab               | [SearchPage](../../../src/views/SearchPage.vue), [ScoringSearch](../../../src/components/ScoringSearch.vue)          | Lazy imports, outgoing height captured before hiding, maximum reservation per width, resize reset and observer cleanup                             |
| Filterable evidence table        | [GeneScoresTableView](../../../src/views/GeneScoresTableView.vue)                                                    | One filtered dataset for table and export, first-page reset, meaningful columns and a mobile scroll hint                                           |
| Sequential batch operation       | [BatchView](../../../src/views/BatchView.vue)                                                                        | Active variant/stage, completed count, useful row errors, cancellation preserving completed results                                                |
| Acknowledgment or utility dialog | [DisclaimerDialog](../../../src/components/DisclaimerDialog.vue), [LogViewer](../../../src/components/LogViewer.vue) | Reachable actions, contained focus, focus return, scrollable body; required first acknowledgment and later review have distinct dismissal behavior |

## Extend the common page structure

```vue
<ContentContainer>
  <header class="page-header">
    <div>
      <h1 class="page-title">Evidence search</h1>
      <p>Find the evidence needed for this assessment.</p>
    </div>
  </header>
  <!-- The task's form, reading sections, or comparison table. -->
</ContentContainer>
```

Use a section heading and spacing when the content only needs grouping; introduce a surface boundary when it represents a workspace. Read tokens from shared sources before adding local overrides. Semantic theme foregrounds handle both themes; numeric labels carry score meaning independently of status color. Keep zero, unavailable, and invalid states distinct.

For replacement searches, keep submission available and let only the latest request update results, errors, and loading completion. Guard success, catch, and finally with request identity; invalidate on unmount. Reuse that ownership principle from existing async components, not the batch-specific rule that blocks another run or its progress/count UI.

## Verify the interaction that changed

Reproduce a bug before changing implementation, then retain a meaningful regression. A browser geometry or interaction assertion can cover a visual defect without a unit test that mirrors CSS. Check the relevant behavior: a held first module download, a filter entered from a later page, a downloaded file's rows, keyboard focus after closing, or a failed request that must leave loading state.

Use [check-tab-layout.mjs](../../../scripts/check-tab-layout.mjs), [check-navigation-layout.mjs](../../../scripts/check-navigation-layout.mjs), or [check-dialog-design.mjs](../../../scripts/check-dialog-design.mjs) when that scenario applies. Their current viewports are examples; include both sides of a changed breakpoint and realistic long content. Shared geometry changes require checking other consumers. Follow the repository verification commands and report measured coverage rather than implying every metric exceeds 80%.

These browser scripts contain specific routes and selectors. Extend the applicable scenario for a new surface; an unchanged script does not validate the new page.

Common mistakes are eager-loading a form to hide its collapse, animating layout properties, filtering a table twice, confusing table scrolling with page overflow, and turning essential explanations into faint captions. Resolve the underlying behavior instead of reproducing those shortcuts.
