import Link from "next/link";
import { listRecipes } from "@/lib/recipeStore";
import { DeleteRecipeButton } from "@/components/DeleteRecipeButton";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const recipes = await listRecipes();

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <main className="w-full max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Recipe Library</h1>
            <p className="mt-1 text-sm text-zinc-500">Recipes you&apos;ve saved for later.</p>
          </div>
          <Link
            href="/recipes/new"
            className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            + Add recipe
          </Link>
        </div>

        {recipes.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-500">
            No saved recipes yet. Add one manually, or save one from the{" "}
            <Link href="/" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
              comparison page
            </Link>
            .
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <Link
                  href={`/recipes/${recipe.id}`}
                  className="block truncate text-sm font-semibold hover:underline"
                >
                  {recipe.title}
                </Link>
                <p className="mt-1 text-xs text-zinc-500">
                  {recipe.ingredients.length} ingredient{recipe.ingredients.length === 1 ? "" : "s"}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/recipes/${recipe.id}/edit`}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
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
