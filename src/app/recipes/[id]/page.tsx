import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipe } from "@/lib/recipeStore";
import { DeleteRecipeButton } from "@/components/DeleteRecipeButton";

export const dynamic = "force-dynamic";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <main className="w-full max-w-2xl">
        <Link
          href="/recipes"
          className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          ← Library
        </Link>

        <div className="mt-2 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">{recipe.title}</h1>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/recipes/${recipe.id}/edit`}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Edit
            </Link>
            <DeleteRecipeButton id={recipe.id} redirectTo="/recipes" />
          </div>
        </div>

        {recipe.sourceUrl && (
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block truncate text-xs text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            {recipe.sourceUrl}
          </a>
        )}

        <h2 className="mt-6 text-sm font-semibold text-zinc-500">Ingredients</h2>
        <ul className="mt-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="list-inside list-disc">
              {ing.raw}
            </li>
          ))}
        </ul>

        {recipe.instructions.length > 0 && (
          <>
            <h2 className="mt-6 text-sm font-semibold text-zinc-500">Instructions</h2>
            <ol className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="list-inside list-decimal">
                  {step}
                </li>
              ))}
            </ol>
          </>
        )}
      </main>
    </div>
  );
}
