export type UnitType = "volume" | "weight" | "count" | "unknown";

const VOLUME_TO_ML: Record<string, number> = {
  tsp: 4.92892,
  teaspoon: 4.92892,
  teaspoons: 4.92892,
  tbsp: 14.7868,
  tablespoon: 14.7868,
  tablespoons: 14.7868,
  cup: 236.588,
  cups: 236.588,
  "fl oz": 29.5735,
  "fluid ounce": 29.5735,
  "fluid ounces": 29.5735,
  pint: 473.176,
  pints: 473.176,
  quart: 946.353,
  quarts: 946.353,
  ml: 1,
  milliliter: 1,
  milliliters: 1,
  l: 1000,
  liter: 1000,
  liters: 1000,
};

const WEIGHT_TO_G: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,
  oz: 28.3495,
  ounce: 28.3495,
  ounces: 28.3495,
  lb: 453.592,
  lbs: 453.592,
  pound: 453.592,
  pounds: 453.592,
};

export function classifyUnit(unit: string): UnitType {
  const u = unit.trim().toLowerCase();
  if (!u) return "count";
  if (u in VOLUME_TO_ML) return "volume";
  if (u in WEIGHT_TO_G) return "weight";
  return "unknown";
}

/** Converts a quantity+unit into a base unit (ml for volume, g for weight). Returns null if unit isn't convertible. */
export function toBaseUnit(
  quantity: number,
  unit: string
): { type: UnitType; value: number } | null {
  const u = unit.trim().toLowerCase();
  if (!u) return { type: "count", value: quantity };
  if (u in VOLUME_TO_ML) return { type: "volume", value: quantity * VOLUME_TO_ML[u] };
  if (u in WEIGHT_TO_G) return { type: "weight", value: quantity * WEIGHT_TO_G[u] };
  return null;
}
