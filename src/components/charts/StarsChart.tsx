import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useIsDark } from "@/hooks/useIsDark";
import { CATEGORICAL, CHART_INK } from "@/lib/palette";
import { formatCompact, formatNumber } from "@/lib/format";
import type { GitHubRepo } from "@/types/github";

export function StarsChart({ repos }: { repos: GitHubRepo[] }) {
  const dark = useIsDark();
  const ink = dark ? CHART_INK.dark : CHART_INK.light;
  const fill = (dark ? CATEGORICAL.dark : CATEGORICAL.light)[0];
  const data = repos.map((r) => ({ name: r.name, stars: r.stargazers_count }));
  const height = Math.max(180, data.length * 38 + 30);

  return (
    <div>
      <div style={{ height }} role="img" aria-label={`Bar chart of stars for the top ${data.length} repositories`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }} barCategoryGap={10}>
            <CartesianGrid horizontal={false} stroke={ink.grid} />
            <XAxis type="number" tickFormatter={formatCompact} stroke={ink.muted} tick={{ fill: ink.muted, fontSize: 11 }} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              stroke={ink.muted}
              tick={{ fill: ink.text, fontSize: 12 }}
              tickFormatter={(v: string) => (v.length > 16 ? v.slice(0, 15) + "…" : v)}
            />
            <Tooltip
              cursor={{ fill: ink.grid, opacity: 0.5 }}
              content={({ active, payload }) =>
                active && payload?.[0] ? (
                  <div className="rounded-md border bg-card px-2.5 py-1.5 text-xs shadow-md">
                    <strong>{payload[0].payload.name}</strong>: {formatNumber(payload[0].value as number)} stars
                  </div>
                ) : null
              }
            />
            <Bar dataKey="stars" fill={fill} radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <details className="mt-3 text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">View as table</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="text-muted-foreground">
              <th className="py-1 font-medium">Repository</th>
              <th className="py-1 font-medium">Stars</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.name} className="border-t">
                <td className="py-1">{d.name}</td>
                <td className="py-1 tabular-nums">{formatNumber(d.stars)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
