import { ObjectId, WithId } from "mongodb";
import { getDb } from "./mongodb";
import { parseIngredientLine, ParsedIngredient } from "./parseIngredient";

const COLLECTION = "recipes";

interface RecipeDoc {
  sourceUrl: string | null;
  title: string;
  image: string | null;
  ingredients: ParsedIngredient[];
  instructions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SavedRecipe {
  id: string;
  sourceUrl: string | null;
  title: string;
  image: string | null;
  ingredients: ParsedIngredient[];
  instructions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RecipeInput {
  title: string;
  sourceUrl?: string | null;
  image?: string | null;
  ingredientLines: string[];
  instructions?: string[];
}

export function parseRecipeInput(body: unknown): RecipeInput | { error: string } {
  const b = body as Record<string, unknown> | null;
  const title = b?.title;
  const ingredientLines = b?.ingredientLines;

  if (typeof title !== "string" || !title.trim()) {
    return { error: "Title is required." };
  }
  if (!Array.isArray(ingredientLines) || !ingredientLines.some((l) => typeof l === "string" && l.trim())) {
    return { error: "At least one ingredient is required." };
  }

  return {
    title,
    sourceUrl: typeof b?.sourceUrl === "string" ? b.sourceUrl : null,
    image: typeof b?.image === "string" ? b.image : null,
    ingredientLines: ingredientLines.filter((l): l is string => typeof l === "string"),
    instructions: Array.isArray(b?.instructions)
      ? b.instructions.filter((l: unknown): l is string => typeof l === "string")
      : [],
  };
}

function toSavedRecipe(doc: WithId<RecipeDoc>): SavedRecipe {
  return {
    id: doc._id.toString(),
    sourceUrl: doc.sourceUrl,
    title: doc.title,
    image: doc.image,
    ingredients: doc.ingredients,
    instructions: doc.instructions,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function buildRecipeFields(input: RecipeInput) {
  return {
    title: input.title.trim(),
    sourceUrl: input.sourceUrl?.trim() || null,
    image: input.image?.trim() || null,
    ingredients: input.ingredientLines
      .map((l) => l.trim())
      .filter(Boolean)
      .map(parseIngredientLine),
    instructions: (input.instructions ?? []).map((s) => s.trim()).filter(Boolean),
  };
}

export async function listRecipes(): Promise<SavedRecipe[]> {
  const db = await getDb();
  const docs = await db
    .collection<RecipeDoc>(COLLECTION)
    .find()
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(toSavedRecipe);
}

export async function getRecipe(id: string): Promise<SavedRecipe | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const doc = await db.collection<RecipeDoc>(COLLECTION).findOne({ _id: new ObjectId(id) });
  return doc ? toSavedRecipe(doc) : null;
}

export async function createRecipe(input: RecipeInput): Promise<SavedRecipe> {
  const db = await getDb();
  const now = new Date();
  const doc: RecipeDoc = { ...buildRecipeFields(input), createdAt: now, updatedAt: now };
  const result = await db.collection<RecipeDoc>(COLLECTION).insertOne(doc);
  return toSavedRecipe({ _id: result.insertedId, ...doc });
}

export async function updateRecipe(id: string, input: RecipeInput): Promise<SavedRecipe | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const result = await db.collection<RecipeDoc>(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...buildRecipeFields(input), updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return result ? toSavedRecipe(result) : null;
}

export async function deleteRecipe(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const db = await getDb();
  const result = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
