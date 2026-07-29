import type { ParsedRecipe } from "@/lib/extractRecipe";

export function RecipeCard({ recipe, index }: { recipe: ParsedRecipe; index: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
          {index + 1}
        </span>
        <h3 className="truncate text-sm font-semibold">{recipe.title}</h3>
      </div>
      <a
        href={recipe.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-3 block truncate text-xs text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        {recipe.sourceUrl}
      </a>
      <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
        {recipe.ingredients.map((ing, i) => (
          <li key={i} className="list-inside list-disc">
            {ing.raw}
          </li>
        ))}
      </ul>
    </div>
  );
}
