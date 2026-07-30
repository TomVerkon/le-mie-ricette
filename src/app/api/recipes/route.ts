import { NextRequest, NextResponse } from "next/server";
import { createRecipe, listRecipes, parseRecipeInput } from "@/lib/recipeStore";

export async function GET() {
  const recipes = await listRecipes();
  return NextResponse.json({ recipes });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const input = parseRecipeInput(body);
  if ("error" in input) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  const recipe = await createRecipe(input);
  return NextResponse.json({ recipe }, { status: 201 });
}
