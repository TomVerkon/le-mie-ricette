Implemented — see CLAUDE.md for the resulting architecture.
Ready for review
Select text to add comments on the plan
Favorites, favorites landing page, and food-pantry color palette
Context
Two changes to le-mie-ricette:

Favorites: add a favorite boolean to recipe records, a star toggle in the library (list, detail, and the create/edit form), and make the homepage (/) show only favorited recipes instead of the URL-comparison tool. The comparison tool moves to /compare so it isn't lost — it's just no longer the front door. The consensus-comparison feature itself is untouched; this is a navigation/landing-page change, not a comparison redesign.
Color palette: replace the default Tailwind zinc/red/amber styling across the whole app with a 6-color "Italian pantry" palette (semolina/espresso/olive/conserva/saffron/taupe), implemented as Tailwind v4 native CSS variables — confirmed via Tailwind's own docs that v4 is "not designed to be used with" Sass/Less/Stylus and replaces that role itself, so no preprocessor is added.
Both were scoped and confirmed with the user directly, including: landing page replaces / (comparison moves to /compare), star toggle appears in the form and as a quick-toggle on list/detail pages, CSS variables (no Sass), and the palette is applied everywhere (not just defined and left unused).

Palette
Named tokens, defined once in globals.css, exposed as Tailwind utilities via @theme inline:

Token	Light	Dark	Role
semolina	#F7F1E3	#1C140D	page background
espresso	#2E2019	#F3EADC	body text
olive	#5F7238	#8AA65C	primary actions/links
conserva	#A6321B	#E2694A	destructive actions + "outlier" highlight in the consensus table
saffron	#D9A441	#E6BC6B	reserved exclusively for the favorite star's filled state — never reused elsewhere, so it stays meaningful
taupe	#D9CFB9	#4A4234	borders, dividers, muted card backgrounds
semolina/espresso flip value under @media (prefers-color-scheme: dark) (same relationship --background/--foreground already have). olive/conserva/saffron are brightened (not inverted) for dark mode since they keep the same semantic role in both modes. taupe is darkened, since its job is a subtle border against the page background.

Because Tailwind v4 auto-generates /opacity modifiers for any --color-* token via color-mix(), most components can drop their paired dark: classes entirely and just use e.g. bg-olive text-semolina or text-espresso/60 — the variable itself already resolves correctly per color scheme. This is a real mechanism change from today's code (which pairs every class with an explicit dark: variant); the resulting light/dark look is equivalent, just expressed with fewer classes.

Part 1 — favorite field + API
src/lib/recipeStore.ts
Add favorite: boolean to RecipeDoc and SavedRecipe; add optional favorite?: boolean to RecipeInput.
parseRecipeInput: add favorite: typeof b?.favorite === "boolean" ? b.favorite : false, to the returned object.
buildRecipeFields: add favorite: input.favorite ?? false,.
toSavedRecipe: read as favorite: doc.favorite ?? false, — defensive default, since documents already saved in the live Atlas collection predate this field and won't have it. No migration script.
Add setFavorite(id, favorite), modeled on updateRecipe's findOneAndUpdate but a minimal $set (no full-input validation, since a bare toggle shouldn't require title/ingredients):
export async function setFavorite(id: string, favorite: boolean): Promise<SavedRecipe | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const result = await db.collection<RecipeDoc>(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { favorite, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return result ? toSavedRecipe(result) : null;
}
Add listFavoriteRecipes() (dedicated query rather than fetching everything and filtering in JS, matching the one-function-per-query-shape style already used by listRecipes/getRecipe):
export async function listFavoriteRecipes(): Promise<SavedRecipe[]> {
  const db = await getDb();
  const docs = await db
    .collection<RecipeDoc>(COLLECTION)
    .find({ favorite: true })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(toSavedRecipe);
}
(Legacy docs without favorite simply won't match { favorite: true } — correct behavior.)
src/app/api/recipes/[id]/route.ts
Add a PATCH handler after PUT, matching this file's existing await params shape exactly (this repo's Next.js build makes route params a Promise unconditionally — see AGENTS.md):

import { deleteRecipe, getRecipe, parseRecipeInput, setFavorite, updateRecipe } from "@/lib/recipeStore";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const b = body as Record<string, unknown> | null;
  if (typeof b?.favorite !== "boolean") {
    return NextResponse.json({ error: "favorite (boolean) is required." }, { status: 400 });
  }
  const recipe = await setFavorite(id, b.favorite);
  if (!recipe) return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
  return NextResponse.json({ recipe });
}
PUT (full edit) still goes through parseRecipeInput/updateRecipe unchanged — PATCH is only for the standalone star toggle.

Part 2 — Star toggle UI
New src/components/FavoriteToggleButton.tsx
Modeled on DeleteRecipeButton.tsx's self-contained fetch pattern, but optimistic (a favorite toggle isn't destructive, so instant feedback is correct here unlike delete):

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FavoriteToggleButton({
  id,
  initialFavorite,
}: {
  id: string;
  initialFavorite: boolean;
}) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(initialFavorite);
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    const next = !favorite;
    setFavorite(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/recipes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: next }),
      });
      if (!res.ok) {
        setFavorite(!next);
      } else {
        router.refresh();
      }
    } catch {
      setFavorite(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={saving}
      aria-pressed={favorite}
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
      className={`shrink-0 rounded-lg border border-taupe px-2 py-1.5 text-lg leading-none hover:bg-taupe/30 disabled:opacity-50 ${
        favorite ? "text-saffron" : "text-espresso/40 hover:text-espresso/70"
      }`}
    >
      {favorite ? "★" : "☆"}
    </button>
  );
}
router.refresh() on success matters most on the new favorites landing page: un-favoriting there re-runs the server component's listFavoriteRecipes() and the card drops out immediately. Uses raw ★/☆ glyphs, matching the codebase's existing lightweight-symbol convention (✕, ←) rather than adding an icon library.

src/components/RecipeForm.tsx
This one stays local state only (no network call — it submits with the rest of the form), so it does not reuse FavoriteToggleButton:

Add const [favorite, setFavorite] = useState(initial?.favorite ?? false);
Add favorite to the submitted body object.
Add a toggle button next to the Title label:
<div className="mb-1 flex items-center justify-between">
  <label className="block text-sm font-medium">Title</label>
  <button
    type="button"
    onClick={() => setFavorite((f) => !f)}
    aria-pressed={favorite}
    aria-label={favorite ? "Remove from favorites" : "Mark as favorite"}
    className={`rounded-lg border border-taupe px-2 py-1 text-sm leading-none hover:bg-taupe/30 ${
      favorite ? "text-saffron" : "text-espresso/40 hover:text-espresso/70"
    }`}
  >
    {favorite ? "★ Favorite" : "☆ Favorite"}
  </button>
</div>
src/app/recipes/page.tsx (library list)
Import and render FavoriteToggleButton per card (top-right, next to the title), passing recipe.favorite.
Fix the empty-state link, which currently calls / "the comparison page" — point it at /compare instead, since / is becoming the favorites landing page.
src/app/recipes/[id]/page.tsx (detail view)
Add FavoriteToggleButton next to the <h1> title in the header row, alongside the existing Edit/Delete actions.

Part 3 — Favorites landing page + /compare relocation
src/app/compare/page.tsx (new)
Pure relocation of the current src/app/page.tsx content — confirmed zero code changes needed (all imports are @/-aliased, the /api/parse fetch is an absolute path, nothing depends on file location, and grep confirms nothing else in the repo imports page.tsx as a module). Do the move first with no edits, then apply the palette-class swap to it as part of Part 4 below — same as every other page.

src/app/page.tsx (replaced — favorites landing)
New server component, same shape as src/app/recipes/page.tsx, using listFavoriteRecipes():

import Link from "next/link";
import { listFavoriteRecipes } from "@/lib/recipeStore";
import { DeleteRecipeButton } from "@/components/DeleteRecipeButton";
import { FavoriteToggleButton } from "@/components/FavoriteToggleButton";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const recipes = await listFavoriteRecipes();

  return (
    <div className="flex min-h-screen flex-col items-center bg-semolina px-4 py-12">
      <main className="w-full max-w-4xl">
        <h1 className="text-2xl font-semibold tracking-tight">Favorites</h1>
        <p className="mt-1 text-sm text-espresso/60">Your starred recipes, all in one place.</p>

        {recipes.length === 0 ? (
          <p className="mt-6 text-sm text-espresso/60">
            No favorites yet. Star a recipe from{" "}
            <Link href="/recipes" className="underline hover:text-espresso/80">
              your library
            </Link>{" "}
            to see it here.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="rounded-xl border border-taupe bg-taupe/10 p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/recipes/${recipe.id}`} className="block truncate text-sm font-semibold hover:underline">
                    {recipe.title}
                  </Link>
                  <FavoriteToggleButton id={recipe.id} initialFavorite={recipe.favorite} />
                </div>
                <p className="mt-1 text-xs text-espresso/60">
                  {recipe.ingredients.length} ingredient{recipe.ingredients.length === 1 ? "" : "s"}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link href={`/recipes/${recipe.id}/edit`} className="rounded-lg border border-taupe px-3 py-1.5 text-sm hover:bg-taupe/30">
                    Edit
                  </Link>
                  <DeleteRecipeButton id={recipe.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
export const dynamic = "force-dynamic" is required here exactly as on recipes/page.tsx — confirmed next.config.ts has no cacheComponents flag, so the classic route-segment-config model applies.

src/app/layout.tsx
Nav: add a /compare link, keep /recipes "Library" link, repoint the existing / link's label from "Compare" to "Favorites".
metadata.description: currently describes the comparison tool — update to describe the favorites landing page, e.g. "Your favorite recipes, all in one place."
Part 4 — Palette application
Apply the new tokens across every existing page/component, replacing zinc/red/amber utility classes 1:1 in place — no structural/layout changes, this is a recolor pass only.

globals.css:

@import "tailwindcss";

:root {
  --semolina: #F7F1E3;
  --espresso: #2E2019;
  --olive: #5F7238;
  --conserva: #A6321B;
  --saffron: #D9A441;
  --taupe: #D9CFB9;

  --background: var(--semolina);
  --foreground: var(--espresso);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-semolina: var(--semolina);
  --color-espresso: var(--espresso);
  --color-olive: var(--olive);
  --color-conserva: var(--conserva);
  --color-saffron: var(--saffron);
  --color-taupe: var(--taupe);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --semolina: #1C140D;
    --espresso: #F3EADC;
    --olive: #8AA65C;
    --conserva: #E2694A;
    --saffron: #E6BC6B;
    --taupe: #4A4234;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
Class-mapping table (apply consistently everywhere the left-hand pattern appears):

Purpose	Before	After
Page shell background	bg-zinc-50 ... dark:bg-black	bg-semolina
Muted text	text-zinc-500 / text-zinc-400	text-espresso/60 / text-espresso/50
Card container	border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950	border-taupe bg-taupe/10
Secondary button	border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900	border-taupe hover:bg-taupe/30
Primary button	bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300	bg-olive text-semolina hover:bg-olive/90
Form inputs	border-zinc-300 bg-white focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950	border-taupe bg-semolina focus:border-olive
Error banner	border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400	border-conserva/30 bg-conserva/10 text-conserva
Destructive button (DeleteRecipeButton)	border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40	border-conserva/40 text-conserva hover:bg-conserva/10
Body list text	text-zinc-700 dark:text-zinc-300	text-espresso/90
Nav bar	border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950	border-taupe bg-semolina
Component-specific:

RecipeCard.tsx: index badge circle → bg-olive text-semolina; "Save" button → border-taupe text-espresso/70 hover:bg-taupe/30.
ConsensusTable.tsx: table/row borders → border-taupe; header row + sticky column background must stay opaque (bg-semolina, not taupe/10) since it needs to occlude content scrolling underneath the sticky header/column; "base" badge → bg-taupe/40 text-espresso/70; the outlier highlight currently uses an off-palette amber-* — replace with bg-conserva/10 / font-semibold text-conserva, reusing conserva's "needs attention" role rather than introducing a 7th color (and specifically not reusing saffron, which stays exclusive to the favorite star).
Full file list touched by the palette pass: globals.css, layout.tsx, page.tsx (new), compare/page.tsx, recipes/page.tsx, recipes/[id]/page.tsx, recipes/new/page.tsx, recipes/[id]/edit/page.tsx, RecipeForm.tsx, DeleteRecipeButton.tsx, RecipeCard.tsx, ConsensusTable.tsx, FavoriteToggleButton.tsx (new — built with the new tokens from the start, no migration needed).

Verification
npm run lint and npm run build from the project root — both must pass clean (build touches the force-dynamic library/favorites pages only at request time, so no MONGODB_URI needed for this step, per CLAUDE.md).
npm run dev, then manually in the browser:
/recipes: create a new recipe with the favorite star toggled on in the form → confirm it saves favorited (star shows filled on the list card).
Toggle a card's star off/on directly from /recipes (quick-toggle, no form) → confirm it persists after a page refresh.
/: confirm it shows only favorited recipes, with the star-toggle working there too (un-favoriting removes the card without a manual refresh, via router.refresh()).
/compare: confirm the URL-comparison tool still works exactly as before (paste 2+ recipe URLs, see consensus table, outlier highlighted in conserva).
Check an existing pre-migration recipe (saved before this change) still loads on /recipes//recipes/[id] and defaults to un-favorited rather than erroring.
Toggle OS/browser dark mode and confirm all pages (including /compare's consensus table) remain legible in both themes.
Visually spot-check saffron (favorite star) contrast against semolina/taupe backgrounds in both light and dark mode — flagged in the design as a lower-contrast pairing worth a manual look since it's a warm-on-warm combination.