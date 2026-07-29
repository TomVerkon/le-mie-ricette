const QUALIFIERS = [
  "unsalted", "salted", "all-purpose", "all purpose", "purpose",
  "granulated", "packed", "light", "dark", "brown", "fine", "finely",
  "coarse", "coarsely", "chopped", "melted", "softened", "room",
  "temperature", "large", "medium", "small", "fresh", "ground",
  "whole", "unbleached", "sifted", "extra", "virgin", "kosher", "sea",
  "table", "plain", "cold", "warm", "beaten", "sliced", "diced",
  "minced", "crushed", "grated", "shredded", "peeled", "ripe", "raw",
];

function singularize(word: string): string {
  if (word.endsWith("ies") && word.length > 3) return word.slice(0, -3) + "y";
  if (word.endsWith("es") && word.length > 3) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) return word.slice(0, -1);
  return word;
}

/** Normalizes an ingredient name for cross-recipe matching, e.g. "2 large eggs, beaten" -> "egg". */
export function normalizeIngredientName(name: string): string {
  const words = name
    .toLowerCase()
    .replace(/[^a-z\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !QUALIFIERS.includes(w));

  const singularized = words.map(singularize);
  return singularized.join(" ").trim();
}

export interface IngredientGroup {
  key: string;
  label: string;
  entries: {
    recipeIndex: number;
    quantity: number | null;
    unit: string;
    raw: string;
  }[];
}

export function groupIngredients(
  recipes: { ingredients: { raw: string; quantity: number | null; unit: string; name: string }[] }[]
): IngredientGroup[] {
  const groups = new Map<string, IngredientGroup>();

  recipes.forEach((recipe, recipeIndex) => {
    for (const ing of recipe.ingredients) {
      const key = normalizeIngredientName(ing.name);
      if (!key) continue;
      if (!groups.has(key)) {
        groups.set(key, { key, label: key, entries: [] });
      }
      groups.get(key)!.entries.push({
        recipeIndex,
        quantity: ing.quantity,
        unit: ing.unit,
        raw: ing.raw,
      });
    }
  });

  return Array.from(groups.values()).sort((a, b) => b.entries.length - a.entries.length);
}
