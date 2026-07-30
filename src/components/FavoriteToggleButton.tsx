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
