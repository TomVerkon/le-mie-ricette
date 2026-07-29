import { NextRequest, NextResponse } from "next/server";
import { fetchAndExtractRecipe, ParsedRecipe } from "@/lib/extractRecipe";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const urls: unknown = body?.urls;

  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: "Provide at least one recipe URL." }, { status: 400 });
  }

  const cleanUrls = urls
    .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
    .map((u) => u.trim())
    .slice(0, 8);

  const settled = await Promise.allSettled(cleanUrls.map((url) => fetchAndExtractRecipe(url)));

  const recipes: ParsedRecipe[] = [];
  const errors: { sourceUrl: string; error: string }[] = [];

  settled.forEach((result, i) => {
    if (result.status === "fulfilled") {
      recipes.push(result.value);
    } else {
      errors.push({
        sourceUrl: cleanUrls[i],
        error: result.reason instanceof Error ? result.reason.message : "Unknown error",
      });
    }
  });

  return NextResponse.json({ recipes, errors });
}
