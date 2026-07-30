import { NextRequest, NextResponse } from "next/server";
import { deleteRecipe, getRecipe, parseRecipeInput, updateRecipe } from "@/lib/recipeStore";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await getRecipe(id);
  if (!recipe) return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
  return NextResponse.json({ recipe });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const input = parseRecipeInput(body);
  if ("error" in input) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  const recipe = await updateRecipe(id, input);
  if (!recipe) return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
  return NextResponse.json({ recipe });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = await deleteRecipe(id);
  if (!deleted) return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
