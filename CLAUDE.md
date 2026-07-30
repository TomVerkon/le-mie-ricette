# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — eslint

No test suite exists in this repo.

Requires a `MONGODB_URI` env var (MongoDB Atlas) in `.env.local` for anything that touches the recipe library — see `src/lib/mongodb.ts`. Not needed for the URL-compare flow (`/`, `/api/parse`) or `npm run lint`/`npm run build` (the library pages are `force-dynamic`, so they aren't touched at build time).

## Architecture

Next.js App Router app with two independent features sharing one set of parsing/consensus utilities:

### 1. URL-based comparison (no persistence)
1. `src/app/page.tsx` (client) — form collects recipe URLs, POSTs them to `/api/parse`, then renders `RecipeCard`s and the consensus table.
2. `src/app/api/parse/route.ts` — server route; for each URL calls `fetchAndExtractRecipe`, settling all requests independently (`Promise.allSettled`) so one bad URL doesn't fail the batch. Caps input at 8 URLs.
3. `src/lib/extractRecipe.ts` — fetches the page and pulls a `schema.org/Recipe` node out of its `application/ld+json` blocks (handles `@graph`-wrapped JSON-LD too). There is **no HTML-scraping fallback** — pages without valid Recipe JSON-LD throw, and the error is surfaced per-URL in the UI. Fetch has a 15s timeout.
4. Each `RecipeCard` has its own "Save" button that POSTs the parsed recipe into the library (feature 2) via `/api/recipes`.

### 2. Recipe library (MongoDB-backed CRUD)
- `src/lib/mongodb.ts` — connects via the official `mongodb` driver (no ORM), caching the client on `global` in dev to survive hot reload.
- `src/lib/recipeStore.ts` — CRUD functions (`listRecipes`, `getRecipe`, `createRecipe`, `updateRecipe`, `deleteRecipe`) plus `parseRecipeInput`, the shared request-body validator used by both `/api/recipes` and `/api/recipes/[id]`. Manual/imported recipes are both stored the same way: callers pass raw ingredient lines (`ingredientLines: string[]`), which get run through `parseIngredientLine` server-side — there's no separate "parsed" input path.
- `src/app/recipes/*` — server-component pages for the library: list (`/recipes`), create (`/recipes/new`), view (`/recipes/[id]`), edit (`/recipes/[id]/edit`). All are marked `export const dynamic = "force-dynamic"` since they read live DB state and must not be statically prerendered at build time.
- `src/components/RecipeForm.tsx` — shared client form for both create and edit (edit is detected by an `initial` prop being present).

### Shared ingredient/consensus pipeline (used by both features)
- `src/lib/parseIngredient.ts` — turns each raw ingredient line into `{ quantity, unit, name }`, handling unicode fractions, mixed numbers ("1 1/2"), and ranges ("1-2", averaged).
- `src/lib/ingredientMatch.ts` — normalizes ingredient names (strips qualifiers like "unsalted"/"chopped", singularizes) so the same ingredient matches across recipes, then groups entries by that normalized key.
- `src/lib/units.ts` — classifies/converts units to a common base (ml for volume, g for weight); units outside its known tables are `"unknown"` and excluded from ratio math.
- `src/lib/consensus.ts` — picks a base ingredient (prefers a group whose key includes "flour", else the most common ingredient), converts every other ingredient's quantity to a ratio against that recipe's base amount, and flags whichever recipe deviates furthest from the median ratio as the outlier for that row. Only used by the URL-comparison flow currently — the library has no comparison UI yet.

Path alias: `@/*` → `src/*`.

## Notes on this Next.js version

This project is on a Next.js build with breaking API/convention changes from what most training data assumes (see `AGENTS.md`) — route handler `params` is a `Promise`, and there's a newer "Cache Components" model (`cacheComponents: true` in `next.config.ts`, not enabled here) that changes how `dynamic`/`force-dynamic` work. This repo does **not** have Cache Components enabled, so the classic route-segment-config (`export const dynamic = "force-dynamic"`) still applies as documented in `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`.
