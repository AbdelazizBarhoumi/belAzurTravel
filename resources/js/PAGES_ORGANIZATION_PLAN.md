# Pages Folder Organization Plan

This document defines a concrete plan to organize `resources/js/pages` for the Laravel + React + TypeScript frontend.

Goals

- Group by role/feature so each route's page and its closely-related code are co-located.
- Keep pages thin: perform fetches via hooks, compose `components/` and `ui/` primitives.
- Minimize import churn and make refactors incremental and reversible.

Principles

- Pages are route-level entry points. Each should be responsible for:
    - invoking data hooks (which live in `hooks/` or co-located)
    - composing presentational components from `components/`, `sections/`, and `ui/`
    - handling page-specific side-effects (analytics, page title)
- Co-locate page-specific small components, hooks and tests with the page when they are not shared.
- Prefer feature folders for complex domains: e.g. `pages/destinations/Index.tsx`, `pages/destinations/[id].tsx`, and `pages/destinations/hooks/useDestination.ts`.
- Keep reusable components in `components/` and primitives in `ui/`.

Recommended structure examples

- Simple page
    - `pages/Contact.tsx`
    - `pages/Contact.test.tsx` (or `__tests__` next to file)

- Feature folder (recommended for domains)
    - `pages/destinations/`
        - `index.tsx` (route-level page)
        - `[id].tsx` (dynamic page if using file-based routing)
        - `hooks/useDestinations.ts` (co-located hook for this feature)
        - `components/DestinationCard.tsx` (small, page-private component)
        - `Destination.test.tsx`

Refactor plan (step-by-step)

1. Audit
    - List all files under `resources/js/pages` and map to routes in `resources/views` or router config.
    - Note pages that already co-locate hooks/components.
2. Decide folder strategy per page
    - For simple pages (<200 LOC, no private components/hooks): keep as single file in `pages/`.
    - For pages with multiple private components or hooks: create a feature folder under `pages/feature-name/` and move related files there.
3. Prepare move checklist
    - For each planned move, record: source path, target path, owner/author, and a short reason.
    - Keep moves small: 1-3 files per commit where possible.
4. Move & update imports
    - Move files (git mv or create new + delete) according to checklist.
    - Update imports: prefer relative paths inside feature folder; update absolute aliases (`@/components`) if needed.
    - Add or update `index.ts` barrel in feature folder only if it simplifies imports.
5. Validate
    - Run TypeScript check: `pnpm tsc --noEmit`
    - Run ESLint autofix: `pnpm lint --fix`
    - Run tests: `pnpm test` or `npx vitest` for frontend tests
6. Repeat until all pages organized
7. Open a PR with granular commits and CI enabled (run tests/build in CI)

Safety & rollback

- Keep moves small and commit each feature folder as its own commit.
- If CI fails, revert the failing commits and fix locally.

Commands

```bash
# typecheck
pnpm tsc --noEmit
# lint fix
pnpm lint --fix
# run frontend tests
pnpm test
# or run Vitest for specific tests
npx vitest run resources/js/test --run
```

Checklist for each moved page

- [ ] Page file present and exported
- [ ] Page tests moved and pass
- [ ] Page-private hooks moved and referenced
- [ ] All imports updated (run migration script or manual grep)
- [ ] No ESLint or type errors

Next actions I can take now

- Run an automated audit of `resources/js/pages` to list files and suggested feature groupings.
- Produce a per-file migration list (CSV/MD) you can review before I move any files.

Tell me if you want me to run the audit now; I will not move files without your approval.
