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
