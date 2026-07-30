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
  const [favorite, setFavorite] = useState(initial?.favorite ?? false);
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
      favorite,
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
        <div className="rounded-lg border border-conserva/30 bg-conserva/10 p-3 text-sm text-conserva">
          {error}
        </div>
      )}

      <div>
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
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-taupe bg-semolina px-3 py-2 text-sm outline-none focus:border-olive"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Source URL (optional)</label>
        <input
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          className="w-full rounded-lg border border-taupe bg-semolina px-3 py-2 text-sm outline-none focus:border-olive"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Image URL (optional)</label>
        <input
          type="url"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          className="w-full rounded-lg border border-taupe bg-semolina px-3 py-2 text-sm outline-none focus:border-olive"
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
          className="w-full rounded-lg border border-taupe bg-semolina px-3 py-2 text-sm outline-none focus:border-olive"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Instructions (one step per line, optional)</label>
        <textarea
          rows={6}
          value={instructionsText}
          onChange={(e) => setInstructionsText(e.target.value)}
          className="w-full rounded-lg border border-taupe bg-semolina px-3 py-2 text-sm outline-none focus:border-olive"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-olive px-4 py-2.5 text-sm font-medium text-semolina hover:bg-olive/90 disabled:opacity-50"
      >
        {saving ? "Saving…" : initial ? "Save changes" : "Add recipe"}
      </button>
    </form>
  );
}
