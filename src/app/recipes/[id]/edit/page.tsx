import { notFound } from "next/navigation";
import { getRecipe } from "@/lib/recipeStore";
import { RecipeForm } from "@/components/RecipeForm";

export const dynamic = "force-dynamic";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  return (
    <div className="flex min-h-screen flex-col items-center bg-semolina px-4 py-12">
      <main className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Recipe</h1>
        <div className="mt-6">
          <RecipeForm initial={recipe} />
        </div>
      </main>
    </div>
  );
}
