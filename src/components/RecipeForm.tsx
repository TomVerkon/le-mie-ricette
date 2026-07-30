"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SavedRecipe } from "@/lib/recipeStore";

export function RecipeForm({ initial }: { initial?: SavedRecipe }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [sourceUrl, setSourceUrl] = useState(initial?.sourceUrl ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [ingredientsText, setIngredientsText] = useState(
    initial?.ingredients.map((ing) => ing.raw).join("\n") ?? ""
  );
  const [instructionsText, setInstructionsText] = useState(
    initial?.instructions.join("\n") ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const body = {
      title,
      sourceUrl: sourceUrl.trim() || null,
      image: image.trim() || null,
      ingredientLines: ingredientsText.split("\n"),
      instructions: instructionsText.split("\n"),
    };

    const url = initial ? `/api/recipes/${initial.id}` : "/api/recipes";
    const method = initial ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      setSaving(false);
      setError(data.error ?? "Something went wrong.");
      return;
    }

    router.push(`/recipes/${data.recipe.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Source URL (optional)</label>
        <input
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Image URL (optional)</label>
        <input
          type="url"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Ingredients (one per line)</label>
        <textarea
          required
          rows={8}
          value={ingredientsText}
          onChange={(e) => setIngredientsText(e.target.value)}
          placeholder={"2 cups all-purpose flour\n1 cup unsalted butter, softened\n3/4 cup granulated sugar"}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Instructions (one step per line, optional)</label>
        <textarea
          rows={6}
          value={instructionsText}
          onChange={(e) => setInstructionsText(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {saving ? "Saving…" : initial ? "Save changes" : "Add recipe"}
      </button>
    </form>
  );
}
