# AGENTS.md

NC-Scorer is a Vue application for kidney-disease variant prioritization. Preserve scientific meaning while improving behavior and presentation.

## Start here

- Check `git status --short` and the active branch. Run commands from the intended checkout/worktree; preserve unrelated user changes.
- Stack: Vue 3.5 Composition API, Vite 6, Vuetify 3, Pinia 3, Vue Router 4, Vitest 5 with Happy-DOM. `@/` resolves to `src/`.
- Use a current Node 22 or 24 patch release; CI tests both. Install with `npm ci` when dependencies are missing. Do not replace `node_modules` while a server or test run uses it.
- Read only the skill relevant to the task. Skills are plain Markdown and work without a particular agent vendor or plugin.

| Task                                                 | Read first                                                                                                        |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Bug, feature, API, scoring, tests, build, or release | [.agents/skills/nc-scorer-development/SKILL.md](.agents/skills/nc-scorer-development/SKILL.md)                    |
| Page, form, table, dialog, or responsive layout      | [DESIGN.md](DESIGN.md), then [.agents/skills/nc-scorer-layout/SKILL.md](.agents/skills/nc-scorer-layout/SKILL.md) |
| Impeccable warning or browser/performance review     | [.agents/skills/nc-scorer-design-review/SKILL.md](.agents/skills/nc-scorer-design-review/SKILL.md)                |

## Invariants

- NCS = `(GeneScore * 4) + (VariantScore * 4) + (InheritanceScore * 2)`, range `[0, 10]`. Every input must be finite and within `[0, 1]`; check `Number.isFinite()` before combining. Valid zero is distinct from missing or invalid data.
- When segregation is expected but missing (`null`/`''`), multiply **only the inheritance component** by `0.8` before its weight of 2. Preserve the inheritance-pattern exemptions in `scoringUtils.js`.
- Tiers: `[0, 3)` Low Priority; `[3, 7)` Moderate Priority; `[7, 10]` High Priority. Do not alter scientific weights, configuration, or claims for a visual fix.
- Development Ensembl requests use `/ensembl/` for GRCh38 or `/ensembl_grch37/` for GRCh37. Keep assembly in request/cache identity and use `assemblyUtils.js` for normalization. Do not invent reference coordinates or silently substitute an unsupported assembly.
- Only the current request/run may update results, errors, or loading state. Invalidate pending writes after clear, cancellation, replacement input, or unmount. Cancellation of UI writes is distinct from aborting network transport.
- Use `toValue()` for composable ref/getter inputs. Use lazy injected fallbacks: `inject('key', null) || fallback()`. Do not mutate window globals directly.
- Preserve lazy analysis/tour/form loading, SVG icon registration, and semantic theme colors. Shared layout and typography come from `DESIGN.md`, `app.css`, and `ContentContainer.vue`.

## Work and verification

Reproduce behavior bugs, write a failing regression, then implement the smallest complete fix. Test behavior and output; browser geometry is suitable for visual regressions. Aim for at least 80% coverage of touched application code and report actual metrics without hiding uncovered files.

Every modification must pass these checks before commit or PR:

```sh
npm run lint
npm run typecheck
npm run test:run
npm run build
# Or run all four in order:
npm run validate
```

Use `npm run test:coverage` for coverage. Run heavy test/build/Lighthouse jobs sequentially on shared machines. Test scripts and runtime configuration must declare their imported packages directly; optional/transitive installs can differ between CI Node versions.

Style: single quotes, 2 spaces, semicolons, trailing commas in multiline objects/arrays. Check changed text with Prettier using `--single-quote --end-of-line auto`; `CITATION.cff` needs `--parser yaml`. Run `git diff --check`. Do not reformat unrelated files.

Commit tested increments with Conventional Commits: `<type>(<scope>): <description>` (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`). Before reporting completion, inspect the current diff and actual command results; list any remaining limitation.

## Integration

A PR request alone does not authorize merging or releasing. When authorized, wait for all checks on the current PR commit, then merge normally. The existing main-branch workflow performs semantic versioning, changelog, tag, and GitHub release; avoid racing it with manual tags. Keep package/lockfile and citation metadata consistent. Preserve the worktree unless cleanup was requested.
