export interface ParsedIngredient {
  raw: string;
  quantity: number | null;
  unit: string;
  name: string;
}

const UNICODE_FRACTIONS: Record<string, number> = {
  "¼": 0.25,
  "½": 0.5,
  "¾": 0.75,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

const KNOWN_UNITS = [
  "teaspoons", "teaspoon", "tsp",
  "tablespoons", "tablespoon", "tbsp",
  "cups", "cup",
  "fluid ounces", "fluid ounce", "fl oz",
  "pints", "pint",
  "quarts", "quart",
  "milliliters", "milliliter", "ml",
  "liters", "liter", "l",
  "grams", "gram", "g",
  "kilograms", "kilogram", "kg",
  "ounces", "ounce", "oz",
  "pounds", "pound", "lbs", "lb",
  "cloves", "clove",
  "cans", "can",
  "pinches", "pinch",
  "sticks", "stick",
  "large", "medium", "small",
];

function replaceUnicodeFractions(s: string): string {
  let out = s;
  for (const [glyph, value] of Object.entries(UNICODE_FRACTIONS)) {
    out = out.split(glyph).join(` ${value} `);
  }
  return out;
}

/** Parses a leading numeric quantity like "1 1/2", "2", "0.5", "1-2", "1 to 2". Returns [quantity, restOfString]. */
function extractLeadingQuantity(s: string): [number | null, string] {
  const trimmed = s.trim();
  // range: "1-2" or "1 to 2" -> average
  const rangeMatch = trimmed.match(
    /^(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(.*)$/i
  );
  if (rangeMatch) {
    const a = parseFloat(rangeMatch[1]);
    const b = parseFloat(rangeMatch[2]);
    return [(a + b) / 2, rangeMatch[3]];
  }
  // mixed number: "1 1/2"
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)\s*(.*)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const num = parseInt(mixedMatch[2], 10);
    const den = parseInt(mixedMatch[3], 10);
    return [whole + num / den, mixedMatch[4]];
  }
  // simple fraction: "1/2"
  const fracMatch = trimmed.match(/^(\d+)\/(\d+)\s*(.*)$/);
  if (fracMatch) {
    const num = parseInt(fracMatch[1], 10);
    const den = parseInt(fracMatch[2], 10);
    return [num / den, fracMatch[3]];
  }
  // decimal or integer
  const numMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (numMatch) {
    return [parseFloat(numMatch[1]), numMatch[2]];
  }
  return [null, trimmed];
}

function extractLeadingUnit(s: string): [string, string] {
  const trimmed = s.trim();
  for (const unit of KNOWN_UNITS) {
    const re = new RegExp(`^${unit}\\.?\\s+`, "i");
    if (re.test(trimmed)) {
      return [unit.toLowerCase(), trimmed.replace(re, "")];
    }
  }
  return ["", trimmed];
}

export function parseIngredientLine(raw: string): ParsedIngredient {
  const cleaned = replaceUnicodeFractions(raw).replace(/\s+/g, " ").trim();
  const [quantity, afterQty] = extractLeadingQuantity(cleaned);
  const [unit, afterUnit] = extractLeadingUnit(afterQty);
  const name = afterUnit
    .replace(/\(.*?\)/g, "")
    .replace(/,.*$/, "")
    .trim();
  return { raw, quantity, unit, name };
}
