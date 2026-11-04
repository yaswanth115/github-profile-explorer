import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts";
import { useIsDark } from "@/hooks/useIsDark";
import { CATEGORICAL, CHART_INK, OTHER_COLOR } from "@/lib/palette";
import type { LanguageStat } from "@/lib/stats";

const MAX_SLICES = 6;

/** Folds everything beyond the palette size into one "Other" slice. */
function fold(stats: LanguageStat[]): LanguageStat[] {
  if (stats.length <= MAX_SLICES + 1) return stats;
  const head = stats.slice(0, MAX_SLICES);
  const rest = stats.slice(MAX_SLICES);
  const count = rest.reduce((n, s) => n + s.count, 0);
  const percent = rest.reduce((n, s) => n + s.percent, 0);
  return [...head, { name: "Other", count, percent }];
}

export function LanguageDonut({ stats }: { stats: LanguageStat[] }) {
  const dark = useIsDark();
  const ink = dark ? CHART_INK.dark : CHART_INK.light;
  const palette = dark ? CATEGORICAL.dark : CATEGORICAL.light;
  const other = dark ? OTHER_COLOR.dark : OTHER_COLOR.light;
  const data = useMemo(() => fold(stats), [stats]);
  const [active, setActive] = useState<number | null>(null);
  const colorFor = (i: number, name: string) => (name === "Other" ? other : palette[i % palette.length]);
  const focus = active !== null ? data[active] : null;

  return (
    <div>
      <div className="grid items-center gap-4 sm:grid-cols-[220px_1fr]">
        <div className="relative mx-auto h-[220px] w-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="name"
                innerRadius={66}
                outerRadius={100}
                paddingAngle={2}
                stroke={ink.surface}
                strokeWidth={2}
                activeIndex={active ?? undefined}
                activeShape={(props: object) => <Sector {...(props as React.ComponentProps<typeof Sector>)} outerRadius={(props as { outerRadius: number }).outerRadius + 5} />}
                onMouseEnter={(_, i) => setActive(i)}
                onMouseLeave={() => setActive(null)}
                isAnimationActive={false}
              >
                {data.map((d, i) => (
                  <Cell key={d.name} fill={colorFor(i, d.name)} />
                ))}
              </Pie>
              <Tooltip
                content={({ active: a, payload }) =>
                  a && payload?.[0] ? (
                    <div className="rounded-md border bg-card px-2.5 py-1.5 text-xs shadow-md">
                      <strong>{payload[0].name}</strong>: {payload[0].value} repos
                    </div>
                  ) : null
                }
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            {focus ? (
              <>
                <span className="max-w-[100px] truncate text-sm font-semibold">{focus.name}</span>
                <span className="text-xl font-semibold tabular-nums">{focus.percent.toFixed(1)}%</span>
                <span className="text-xs text-muted-foreground">{focus.count} repos</span>
              </>
            ) : (
              <>
                <span className="text-2xl font-semibold tabular-nums">{stats.reduce((n, s) => n + s.count, 0)}</span>
                <span className="text-xs text-muted-foreground">repos with a language</span>
              </>
            )}
          </div>
        </div>

        <ul className="space-y-1.5" aria-label="Language legend">
          {data.map((d, i) => (
            <li
              key={d.name}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              className="flex items-center justify-between gap-3 rounded-md px-2 py-1 text-sm transition-colors hover:bg-accent"
            >
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true" className="h-3 w-3 rounded-sm" style={{ backgroundColor: colorFor(i, d.name) }} />
                {d.name}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {d.count} repo{d.count === 1 ? "" : "s"} · {d.percent.toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </div>

      <details className="mt-4 text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">View as table</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="text-muted-foreground">
              <th className="py-1 font-medium">Language</th>
              <th className="py-1 font-medium">Repos</th>
              <th className="py-1 font-medium">Share</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.name} className="border-t">
                <td className="py-1">{d.name}</td>
                <td className="py-1 tabular-nums">{d.count}</td>
                <td className="py-1 tabular-nums">{d.percent.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
