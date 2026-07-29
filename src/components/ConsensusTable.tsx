import type { ConsensusRow } from "@/lib/consensus";
import type { ParsedRecipe } from "@/lib/extractRecipe";

function formatRatio(ratio: number | null): string {
  if (ratio == null) return "—";
  return ratio.toFixed(2) + "x";
}

function deviationLabel(pct: number | null): string {
  if (pct == null) return "";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}%`;
}

export function ConsensusTable({
  rows,
  recipes,
}: {
  rows: ConsensusRow[];
  recipes: ParsedRecipe[];
}) {
  if (rows.length === 0) return null;

  const baseLabel = rows.find((r) => r.isBase)?.label ?? rows[0].label;

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr className="bg-zinc-50 dark:bg-zinc-900">
            <th className="sticky left-0 z-10 whitespace-nowrap bg-zinc-50 px-3 py-2 text-left font-medium dark:bg-zinc-900">
              Ingredient
            </th>
            {recipes.map((r, i) => (
              <th key={i} className="whitespace-nowrap px-3 py-2 text-left font-medium" title={r.title}>
                Recipe {i + 1}
              </th>
            ))}
            <th className="whitespace-nowrap px-3 py-2 text-left font-medium">
              Median ratio to {baseLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-zinc-200 dark:border-zinc-800">
              <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-2 font-medium capitalize dark:bg-zinc-950">
                {row.label}
                {row.isBase && (
                  <span className="ml-1 rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-normal text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    base
                  </span>
                )}
              </td>
              {recipes.map((_, i) => {
                const entry = row.entries.find((e) => e.recipeIndex === i);
                const isOutlier = row.outlierRecipeIndex === i;
                return (
                  <td
                    key={i}
                    className={`px-3 py-2 align-top ${
                      isOutlier
                        ? "bg-amber-50 dark:bg-amber-950/40"
                        : ""
                    }`}
                  >
                    {entry ? (
                      <div>
                        <div className="text-zinc-700 dark:text-zinc-300">{entry.raw}</div>
                        {!row.isBase && entry.ratio != null && (
                          <div
                            className={`mt-0.5 text-xs ${
                              isOutlier
                                ? "font-semibold text-amber-700 dark:text-amber-400"
                                : "text-zinc-400"
                            }`}
                          >
                            {formatRatio(entry.ratio)}{" "}
                            {entry.deviationPct != null && `(${deviationLabel(entry.deviationPct)})`}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-300 dark:text-zinc-700">not used</span>
                    )}
                  </td>
                );
              })}
              <td className="px-3 py-2 text-zinc-500">
                {row.isBase ? "1.00x (reference)" : formatRatio(row.medianRatio)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
