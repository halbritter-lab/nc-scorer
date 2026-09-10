# CLAUDE.md

Operational guidance for Claude Code working on `nc-scorer`.

## Quick Commands
- `npm run dev` - Start Vite development server with Ensembl API proxies
- `npm run validate` - Run all verification checks (`lint` + `typecheck` + `test:run` + `build`)
- `npm run test` - Run Vitest in watch mode
- `npm run test:run` - Execute complete Vitest suite once
- `npm run test:coverage` - Generate v8 coverage report
- `npm run typecheck` - Run `vue-tsc --noEmit`
- `npm run lint` - Run ESLint checks (`npm run lint:fix` to auto-fix)
- `npm run build` - Build production app (`build:app`) and docs (`build:docs`)
- `npm run commit` - Create conventional commit with Commitizen

## Key Architectural Invariants
- **Vue 3.5 Composition API**: Use `<script setup>` or standard composition API. Do not mutate `window` globals directly.
- **Ensembl API Proxies**: Development server proxies `/ensembl/` and `/ensembl_grch37/` to Ensembl REST. Keep proxies active to prevent CORS issues.
- **Vuetify Auto-Import**: Component auto-import is handled by `vite-plugin-vuetify` in build and registered in `tests/utils/testUtils.js` for testing.
- **Nephro Candidate Score (NCS)**: Formula is `(Gene × 4) + (Variant × 4) + (Inheritance × 2)` on range `[0, 10]`. Apply $0.8\times$ missing segregation penalty when segregation is expected but omitted.
- **API Caching**: Use `useApiCache()` backed by sessionStorage and respecting user preferences.

## Commit Format
Enforce Conventional Commits (`type(scope): description`):
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.
- Do not mention Claude as author in commits.