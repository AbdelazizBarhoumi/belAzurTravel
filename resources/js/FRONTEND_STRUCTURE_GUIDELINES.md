# Frontend Structure Guidelines

These rules apply to the React + TypeScript frontend in this repository (resources/js). Use them when creating, refactoring, or moving files.

## Top-level principles

- Group by role/concern, not by implementation detail. Example roles: `pages/`, `components/`, `hooks/`, `api/`, `store/`, `types/`, `utils/`, `layout/`, `sections/`, `ui/`, `assets/`.
- Co-locate things that change together (page + page-specific components + hooks in same folder or a nearby feature folder).
- Keep UI primitives separate from composed/app components: `ui/` for low-level controls, `sections/` or `layout/` for composed pieces.
- Use small files and single responsibility; give clear names (PascalCase for React components, camelCase for hooks/functions).
- Avoid role/permission folder names (like `admin/`) for generic components — prefer semantic folders (`layout/`, `dialogs/`, `forms/`); only keep `pages/admin/*` for admin routes.

## Concrete recommended structure (resources/js)

- api/ ← typed API helpers (axios instances, endpoints)
- app.tsx / main entry
- pages/ ← route-level pages (fetch + compose)
- components/ ← reusable composed components
- layout/ ← layout-level components (shells, nav, footers)
- sections/ ← larger composed sections (hero, pricing, footer)
- ui/ ← primitives (buttons, inputs, icons)
- cards/, lists/, nav/, dialogs/, forms/, media/ (as needed)
- hooks/ ← `useX` custom hooks (data fetching, form logic)
- store/ ← Zustand stores (auth, notifications)
- types/ ← shared TypeScript interfaces
- lib/ or utils/ ← pure helpers, formatters
- contexts/ ← React contexts (Language, Auth)
- services/ ← client-side wrappers for external services (optional)
- assets/ or media/ ← images, icons, svgs
- tests/ ← integration/unit test helpers (or co-locate tests next to files)

## Naming & file rules

- Components: `MyComponent.tsx` with named exports preferred.
- Hooks: `useSomething.ts`.
- Types: `something.types.ts` or `types/index.ts`.
- Barrel files: add `index.ts` where useful to re-export stable APIs, but don't overuse for frequently-changing modules.
- Paths: keep `tsconfig.paths` / Vite alias (`@/...`) in sync with folder moves.

## Refactor checklist when moving folders/files

1. Search for imports (grep for `@/...` or project-relative imports) and update to new paths.
2. Add barrel exports if you want shorter imports.
3. Run TypeScript typecheck and ESLint.
4. Run tests/build.
5. Fix any type or import breakages iteratively.

Commands to run locally after a move:

```bash
# typecheck
pnpm tsc --noEmit
# lint fix
pnpm lint --fix
# run tests
pnpm test
# or full frontend build
pnpm build
```

## Special notes for Laravel + frontend integration

- Keep Laravel blade/SSR entry points in `resources/views` and front-end routes under `pages/`.
- Don’t commit `.env`; keep backend secrets in env and frontend public config in `config/` or environment-safe places.
- If moving many files, consider a single PR per large refactor and run CI to catch regressions.

## When to consolidate duplicates

- If two files do the same job but one is strictly more generic (primitive), keep the primitive in `ui/` and refactor the other to compose it, then remove the duplicate.
- If both are different (one minimal, one feature-rich), keep both and rename to clarify intent (e.g., `ui/Breadcrumb` vs `nav/PageBreadcrumb`).

---

Keep this file updated when patterns change. Place a copy or a short pointer at the top of each major folder (for example, `resources/js/ui/README.md`) to keep the rules discoverable.