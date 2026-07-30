# Status (2026-07-30)

All setup work from the previous handoff is complete.

## Done
- Recipe library (MongoDB-backed CRUD) fully implemented and tested end-to-end
  against a live Atlas cluster: `src/lib/mongodb.ts`, `src/lib/recipeStore.ts`,
  `src/app/api/recipes/route.ts`, `src/app/api/recipes/[id]/route.ts`,
  `src/app/recipes/*` pages, `RecipeForm`, `DeleteRecipeButton`, "Save" button
  on `RecipeCard`. `CLAUDE.md` documents this architecture.
- `.env.local` has a working `MONGODB_URI` for the live Atlas cluster
  (cluster `Cluster0`, db user `tverkon_db_user`). Gitignored (`.env*` pattern).
- Atlas Network Access has `0.0.0.0/0` confirmed and saved (required for
  Vercel's serverless functions, which have no fixed IP).
- Project renamed `recipe-consensus` → `le-mie-ricette` everywhere: local
  folder, `package.json`, site metadata, homepage title.
- Pushed to GitHub: `https://github.com/TomVerkon/le-mie-ricette` (branch
  `master`, remote `origin`).
- Vercel project created via GitHub import, live at
  `https://le-mie-ricette.vercel.app`. `MONGODB_URI` set as an env var
  (Preview + Production). Local folder linked via `vercel link`
  (`.vercel/` dir, gitignored) for CLI access to logs/env.
- Verified live: `/recipes` loads and reaches MongoDB (empty-state renders
  correctly on a fresh DB).

## Reminders
- Don't re-paste the Mongo password anywhere further than `.env.local` /
  Vercel's env var UI.
- Vercel env vars only apply to deployments built *after* they're added —
  if you add/change an env var, trigger a redeploy (dashboard → Deployments
  → "..." → Redeploy) for it to take effect.
- This Next.js version has non-standard conventions (see `AGENTS.md` +
  the "Notes on this Next.js version" section in `CLAUDE.md`) — check
  `node_modules/next/dist/docs/` before assuming standard Next.js behavior.
