---
name: nc-scorer-development
description: Use when fixing NC-Scorer behavior, adding application functionality, changing API/cache/scoring code, diagnosing test or build failures, or preparing an authorized PR and release.
---

# NC-Scorer development reference

Read [AGENTS.md](../../../AGENTS.md) for invariants and verification gates. Follow one data path from input to output before editing; avoid reading the whole repository.

## Find the owner

| Concern                                 | Entry points                                                                                                                                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Route parameters and result lifecycle   | [router](../../../src/router/index.js), [ScoringView](../../../src/views/ScoringView.vue), [VariantView](../../../src/views/VariantView.vue)                                                                             |
| Score calculation and inheritance       | [scoringUtils](../../../src/utils/scoringUtils.js), [inheritanceConfig](../../../src/config/inheritanceConfig.js), [variant scoring configuration](../../../src/config/scoring/nephro_variant_score/formula_config.json) |
| Variant/gene requests                   | [variantApi](../../../src/api/variantApi.js), [geneApi](../../../src/api/geneApi.js), [retry](../../../src/utils/retry.js)                                                                                               |
| Assembly, request reuse and persistence | [assemblyUtils](../../../src/utils/assemblyUtils.js), [useApiCache](../../../src/composables/useApiCache.js), [coordinateCache](../../../src/services/coordinateCache.js)                                                |
| Batch and exports                       | [BatchView](../../../src/views/BatchView.vue), [batch presets](../../../src/config/batchViewConfig.js), [exportUtils](../../../src/utils/exportUtils.js)                                                                 |
| Settings and boot                       | [settingsStore](../../../src/stores/settingsStore.js), [main](../../../src/main.js), [App](../../../src/App.vue)                                                                                                         |
| Documentation and bundling              | [Vite config](../../../vite.config.js), [docs middleware](../../../scripts/docs-dev-server.js), [VitePress config](../../../docs/.vitepress/config.js), [browser adapter](../../../scripts/variant-linker-browser.js)    |

## Reproduce, fix, prove

For dependency or CI failures, start with [package.json](../../../package.json), [package-lock.json](../../../package-lock.json), and [ci.yml](../../../.github/workflows/ci.yml).

1. Record the input, assembly, route query, observed result, and expected result. For async bugs, distinguish pending requests from failed requests left loading. Capture console/network evidence without treating a slow live endpoint as a deterministic test fixture.
2. Locate the nearest test under `tests/unit/`, `tests/build/`, or `tests/config/`. Use [testUtils](../../../tests/utils/testUtils.js) for Vue mounting and [setup](../../../tests/setup.js) for shared browser mocks. Run the relevant file with `npx vitest run path/to/test.test.js`; confirm the regression fails for the intended reason.
3. Change the owning layer. Route queries may be arrays or empty optional values; normalize at the boundary. Preserve assembly-specific identity. Validate operands before averaging/weighting. A latest-request guard must protect success, catch, and finally so an old request cannot erase a newer loading/error state.
4. Run the focused test again, then the AGENTS.md gates and coverage. For UI changes, use the relevant layout/design-review skill and test the actual affected route, not only a similar existing page.

## Cases that expose regressions

Use `parseUnitScore()` in `scoringUtils.js` for measured scores: it accepts numeric input in `[0, 1]`, preserves zero, and returns `null` for missing/invalid evidence. The older `validateScore()` helper clamps/defaults values; copying that behavior into evidence parsing loses the distinction.

| Change          | Include relevant cases                                                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scoring/input   | zero, missing, non-finite, out-of-range, inherited/de novo, optional or array query values                                                           |
| Requests/cache  | same identifier across both assemblies; duplicate concurrent request; failure/retry; stale A resolves after newer B; clear/unmount before completion |
| Table/export    | later-page filtering; visible and downloaded rows agree; zero retained; delimiters/quotes/formula-like cells escaped; object URL cleanup             |
| Browser/storage | empty annotations; denied/corrupt storage; first lazy load; terminal failure; focus return                                                           |

Use deferred promises and fake timers for ordering/retry tests. Clear mocks, timers, mounted wrappers, globals, and stores between tests. Confirm a timeout's cause before changing its limit. For direct dependency imports, verify a clean install rather than relying on a locally present optional package.

## PR and release handoff

The release Git plugin lists `CITATION.cff` as a commit asset but does not rewrite its version. Automatic publication does not synchronize citation prose or README metadata; prepare and test those changes deliberately.

Report behavior changed, test evidence, and material limits. Check Actions on the latest pushed commit, not a superseded run. Inspect [.releaserc.json](../../../.releaserc.json) and the [release workflow](../../../.github/workflows/semantic-release.yml) before an authorized release. Conventional `fix` changes normally produce a patch, backward-compatible `feat` changes a minor, and intentional breaking changes require explicit compatibility handling. Synchronize `package.json`, `package-lock.json`, `CITATION.cff`, `README.md`, and `docs/guide/citation.md` when preparing version metadata; verify the resulting tag/release instead of assuming merge completed publication.
