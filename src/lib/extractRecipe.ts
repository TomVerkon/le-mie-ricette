import { parseIngredientLine, ParsedIngredient } from "./parseIngredient";

export interface ParsedRecipe {
  sourceUrl: string;
  title: string;
  image: string | null;
  ingredients: ParsedIngredient[];
  instructions: string[];
}

export interface ExtractError {
  sourceUrl: string;
  error: string;
}

const JSON_LD_RE = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

function flattenGraph(node: unknown): Record<string, unknown>[] {
  if (Array.isArray(node)) return node.flatMap(flattenGraph);
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (Array.isArray(obj["@graph"])) return flattenGraph(obj["@graph"]);
    return [obj];
  }
  return [];
}

function isRecipeNode(node: Record<string, unknown>): boolean {
  const type = node["@type"];
  if (typeof type === "string") return type.toLowerCase() === "recipe";
  if (Array.isArray(type)) return type.some((t) => typeof t === "string" && t.toLowerCase() === "recipe");
  return false;
}

function extractImage(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return extractImage(value[0]);
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.url === "string") return obj.url;
  }
  return null;
}

function extractInstructions(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") {
    return value
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(value)) {
    return value.flatMap((item): string[] => {
      if (typeof item === "string") return [item];
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        if (Array.isArray(obj.itemListElement)) return extractInstructions(obj.itemListElement);
        if (typeof obj.text === "string") return [obj.text];
        if (typeof obj.name === "string") return [obj.name];
      }
      return [];
    });
  }
  return [];
}

function findRecipeJsonLd(html: string): Record<string, unknown> | null {
  const matches = html.matchAll(JSON_LD_RE);
  for (const match of matches) {
    const raw = match[1].trim();
    try {
      const parsed = JSON.parse(raw);
      const nodes = flattenGraph(parsed);
      const recipe = nodes.find(isRecipeNode);
      if (recipe) return recipe;
    } catch {
      // Some sites emit malformed/truncated JSON-LD; skip and keep looking.
      continue;
    }
  }
  return null;
}

export async function fetchAndExtractRecipe(url: string): Promise<ParsedRecipe> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let html: string;
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html",
      },
    });
    if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
    html = await res.text();
  } finally {
    clearTimeout(timeout);
  }

  const recipeNode = findRecipeJsonLd(html);
  if (!recipeNode) {
    throw new Error("No structured recipe data (schema.org/Recipe) found on this page.");
  }

  const name = typeof recipeNode.name === "string" ? recipeNode.name : url;
  const image = extractImage(recipeNode.image);
  const ingredientLines = Array.isArray(recipeNode.recipeIngredient)
    ? (recipeNode.recipeIngredient as unknown[]).filter((s): s is string => typeof s === "string")
    : [];
  const instructions = extractInstructions(recipeNode.recipeInstructions);

  if (ingredientLines.length === 0) {
    throw new Error("Recipe data found but no ingredients were listed.");
  }

  return {
    sourceUrl: url,
    title: name,
    image,
    ingredients: ingredientLines.map(parseIngredientLine),
    instructions,
  };
}
