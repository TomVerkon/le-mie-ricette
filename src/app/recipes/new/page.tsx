import { RecipeForm } from "@/components/RecipeForm";

export default function NewRecipePage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-semolina px-4 py-12">
      <main className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Add Recipe</h1>
        <div className="mt-6">
          <RecipeForm />
        </div>
      </main>
    </div>
  );
}
