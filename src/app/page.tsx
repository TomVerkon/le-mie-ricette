"use client";

import { useState } from "react";
import { RecipeCard } from "@/components/RecipeCard";
import { ConsensusTable } from "@/components/ConsensusTable";
import { computeConsensus, ConsensusRow } from "@/lib/consensus";
import type { ParsedRecipe } from "@/lib/extractRecipe";

interface ParseError {
  sourceUrl: string;
  error: string;
}

export default function Home() {
  const [urls, setUrls] = useState<string[]>(["", "", ""]);
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<ParsedRecipe[]>([]);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [rows, setRows] = useState<ConsensusRow[]>([]);

  function updateUrl(i: number, value: string) {
    setUrls((prev) => prev.map((u, idx) => (idx === i ? value : u)));
  }

  function addUrlField() {
    setUrls((prev) => [...prev, ""]);
  }

  function removeUrlField(i: number) {
    setUrls((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanUrls = urls.map((u) => u.trim()).filter(Boolean);
    if (cleanUrls.length === 0) return;

    setLoading(true);
    setRecipes([]);
    setErrors([]);
    setRows([]);

    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: cleanUrls }),
      });
      const data = await res.json();
      const fetchedRecipes: ParsedRecipe[] = data.recipes ?? [];
      setRecipes(fetchedRecipes);
      setErrors(data.errors ?? []);
      if (fetchedRecipes.length >= 2) {
        setRows(computeConsensus(fetchedRecipes));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <main className="w-full max-w-4xl">
        <h1 className="text-2xl font-semibold tracking-tight">Recipe Consensus</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Paste a few recipes for the same dish. See the consensus ratios and which one is the outlier.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-2">
          {urls.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="url"
                required
                placeholder="https://example.com/chocolate-chip-cookies"
                value={url}
                onChange={(e) => updateUrl(i, e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
              />
              {urls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeUrlField(i)}
                  className="shrink-0 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={addUrlField}
              className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              + add another URL
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {loading ? "Fetching recipes…" : "Compare recipes"}
          </button>
        </form>

        {errors.length > 0 && (
          <div className="mt-6 space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
            {errors.map((err, i) => (
              <div key={i}>
                <span className="font-medium">{err.sourceUrl}</span>: {err.error}
              </div>
            ))}
          </div>
        )}

        {recipes.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe, i) => (
              <RecipeCard key={i} recipe={recipe} index={i} />
            ))}
          </div>
        )}

        {rows.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">Consensus</h2>
            <ConsensusTable rows={rows} recipes={recipes} />
            <p className="mt-2 text-xs text-zinc-400">
              Ratios are relative to the base ingredient, converted within the same measurement
              system (volume or weight). Highlighted cells are the biggest outlier for that
              ingredient.
            </p>
          </div>
        )}

        {recipes.length === 1 && errors.length === 0 && (
          <p className="mt-6 text-sm text-zinc-500">
            Add at least one more recipe to see a consensus comparison.
          </p>
        )}
      </main>
    </div>
  );
}
