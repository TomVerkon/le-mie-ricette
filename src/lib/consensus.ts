import { groupIngredients, normalizeIngredientName } from "./ingredientMatch";
import { toBaseUnit, UnitType } from "./units";
import type { ParsedRecipe } from "./extractRecipe";

export interface ConsensusEntry {
  recipeIndex: number;
  raw: string;
  ratio: number | null;
  deviationPct: number | null;
}

export interface ConsensusRow {
  label: string;
  unitType: UnitType | null;
  medianRatio: number | null;
  entries: ConsensusEntry[];
  outlierRecipeIndex: number | null;
  isBase: boolean;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function computeConsensus(recipes: ParsedRecipe[]): ConsensusRow[] {
  const groups = groupIngredients(recipes);
  if (groups.length === 0) return [];

  const flourGroup = groups.find((g) => g.key.includes("flour"));
  const baseGroup = flourGroup ?? groups[0];

  // Determine each recipe's base-ingredient value (in its natural base unit: ml or g).
  const recipeBase = new Map<number, { type: UnitType; value: number }>();
  for (const entry of baseGroup.entries) {
    if (entry.quantity == null) continue;
    const converted = toBaseUnit(entry.quantity, entry.unit);
    if (converted && (converted.type === "volume" || converted.type === "weight")) {
      recipeBase.set(entry.recipeIndex, converted);
    }
  }

  const rows: ConsensusRow[] = groups.map((group) => {
    const isBase = group.key === baseGroup.key;
    const entries: ConsensusEntry[] = group.entries.map((entry) => {
      let ratio: number | null = null;
      const base = recipeBase.get(entry.recipeIndex);
      if (base && entry.quantity != null) {
        const converted = toBaseUnit(entry.quantity, entry.unit);
        if (converted && converted.type === base.type) {
          ratio = converted.value / base.value;
        }
      }
      return { recipeIndex: entry.recipeIndex, raw: entry.raw, ratio, deviationPct: null };
    });

    const validRatios = entries.map((e) => e.ratio).filter((r): r is number => r != null);
    const med = median(validRatios);

    let outlierRecipeIndex: number | null = null;
    let maxDeviation = -Infinity;
    for (const e of entries) {
      if (e.ratio != null && med != null && med !== 0) {
        e.deviationPct = ((e.ratio - med) / med) * 100;
        if (Math.abs(e.deviationPct) > maxDeviation) {
          maxDeviation = Math.abs(e.deviationPct);
          outlierRecipeIndex = e.recipeIndex;
        }
      }
    }
    if (validRatios.length < 2) outlierRecipeIndex = null;

    const unitType = validRatios.length > 0 ? (recipeBase.values().next().value?.type ?? null) : null;

    return {
      label: group.label,
      unitType,
      medianRatio: med,
      entries,
      outlierRecipeIndex,
      isBase,
    };
  });

  // Base ingredient row first, then by how many recipes include the ingredient.
  return rows.sort((a, b) => {
    if (a.isBase) return -1;
    if (b.isBase) return 1;
    return b.entries.length - a.entries.length;
  });
}

export { normalizeIngredientName };
