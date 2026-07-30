"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteRecipeButton({ id, redirectTo }: { id: string; redirectTo?: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this recipe?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
    >
      {deleting ? "Deleting…" : "Delete"}
    </button>
  );
}
