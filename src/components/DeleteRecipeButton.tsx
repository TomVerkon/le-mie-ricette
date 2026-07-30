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
      className="rounded-lg border border-conserva/40 px-3 py-1.5 text-sm text-conserva hover:bg-conserva/10 disabled:opacity-50"
    >
      {deleting ? "Deleting…" : "Delete"}
    </button>
  );
}
