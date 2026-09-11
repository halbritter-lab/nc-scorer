# AGENTS.md

Autonomous Agent Guidelines for `halbritter-lab/nc-scorer`.

## Architecture & System Invariants

- **Stack**: Vue 3.5 (Composition API), Vite 6, Vuetify 3 (Material Design), Pinia 3, Vue Router 4, Vitest 5 (Happy-DOM).
- **Path Aliases**: `@/` maps to `src/`.
- **Ensembl API Proxies**: Always route Ensembl requests through `/ensembl/` (GRCh38) or `/ensembl_grch37/` (GRCh37) in development to avoid CORS violations.
- **Nephro Candidate Score (NCS) Invariants**:
  - Combined Score: `(GeneScore * 4) + (VariantScore * 4) + (InheritanceScore * 2)` on scale `[0, 10]`.
  - All input sub-scores must strictly reside within `[0, 1]`. Guard with `Number.isFinite()`.
  - Missing segregation penalty: $0.8\times$ (20% penalty) when segregation is expected but missing (`null`/`''`).
  - Score interpretation tiers: `[0, 3)` Low Priority, `[3, 7)` Moderate Priority, `[7, 10]` High Priority.
- **Reactivity & DOM Hygiene**:
  - Never mutate window globals directly.
  - Use `toValue()` for composable parameters that may be refs or getter functions.
  - Use lazy evaluation for injected state fallbacks (`inject('key', null) || fallback()`).

## Conventions

- **Code Style**: Single quotes (`'`), 2 spaces, semicolons, trailing commas in multi-line objects/arrays.
- **Commit Format**: Conventional Commits (`<type>(<scope>): <description>`). Enforced via commitlint and husky hooks. Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.

## Verification Commands

Every modification must pass all checks before PR or commit:

```bash
npm run lint         # ESLint check (0 errors)
npm run typecheck    # Static typecheck via vue-tsc --noEmit (0 errors)
npm run test:run     # Vitest unit and component test suites
npm run build        # Production application and documentation build
npm run validate     # Convenience runner for all 4 checks in sequence
```

## Design guidance

For interface work, use [DESIGN.md](DESIGN.md) as the shared visual definition. Its tokens and component references record the implemented system; update it when an intentional shared design decision changes.

Repository skills are discoverable under `.agents/skills/`:

- [nc-scorer-layout](.agents/skills/nc-scorer-layout/SKILL.md): page structure, forms, tables, dialogs, responsive layout, and interaction regressions.
- [nc-scorer-design-review](.agents/skills/nc-scorer-design-review/SKILL.md): Impeccable finding triage, Playwright state coverage, and performance evidence.
