"use client";

import { useState } from "react";
import type { ParsedRecipe } from "@/lib/extractRecipe";

export function RecipeCard({ recipe, index }: { recipe: ParsedRecipe; index: number }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: recipe.title,
          sourceUrl: recipe.sourceUrl,
          image: recipe.image,
          ingredientLines: recipe.ingredients.map((ing) => ing.raw),
          instructions: recipe.instructions,
        }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-taupe bg-taupe/10 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-olive text-xs font-semibold text-semolina">
            {index + 1}
          </span>
          <h3 className="truncate text-sm font-semibold">{recipe.title}</h3>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || saved}
          className="shrink-0 rounded-lg border border-taupe px-2 py-1 text-xs text-espresso/70 hover:bg-taupe/30 disabled:opacity-50"
        >
          {saved ? "Saved" : saving ? "Saving…" : "Save"}
        </button>
      </div>
      <a
        href={recipe.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-3 block truncate text-xs text-espresso/60 underline hover:text-espresso/80"
      >
        {recipe.sourceUrl}
      </a>
      <ul className="space-y-1 text-sm text-espresso/90">
        {recipe.ingredients.map((ing, i) => (
          <li key={i} className="list-inside list-disc">
            {ing.raw}
          </li>
        ))}
      </ul>
    </div>
  );
}
