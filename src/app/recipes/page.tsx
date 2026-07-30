import Link from "next/link";
import { listRecipes } from "@/lib/recipeStore";
import { DeleteRecipeButton } from "@/components/DeleteRecipeButton";
import { FavoriteToggleButton } from "@/components/FavoriteToggleButton";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const recipes = await listRecipes();

  return (
    <div className="flex min-h-screen flex-col items-center bg-semolina px-4 py-12">
      <main className="w-full max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Recipe Library</h1>
            <p className="mt-1 text-sm text-espresso/60">Recipes you&apos;ve saved for later.</p>
          </div>
          <Link
            href="/recipes/new"
            className="shrink-0 rounded-lg bg-olive px-4 py-2 text-sm font-medium text-semolina hover:bg-olive/90"
          >
            + Add recipe
          </Link>
        </div>

        {recipes.length === 0 ? (
          <p className="mt-6 text-sm text-espresso/60">
            No saved recipes yet. Add one manually, or save one from the{" "}
            <Link href="/compare" className="underline hover:text-espresso/80">
              comparison page
            </Link>
            .
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="rounded-xl border border-taupe bg-taupe/10 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="block truncate text-sm font-semibold hover:underline"
                  >
                    {recipe.title}
                  </Link>
                  <FavoriteToggleButton id={recipe.id} initialFavorite={recipe.favorite} />
                </div>
                <p className="mt-1 text-xs text-espresso/60">
                  {recipe.ingredients.length} ingredient{recipe.ingredients.length === 1 ? "" : "s"}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/recipes/${recipe.id}/edit`}
                    className="rounded-lg border border-taupe px-3 py-1.5 text-sm hover:bg-taupe/30"
                  >
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
