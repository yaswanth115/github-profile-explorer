import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { useIsDark } from "@/hooks/useIsDark";
import { HEAT } from "@/lib/palette";
import { buildHeatmap } from "@/lib/stats";
import { formatDate } from "@/lib/format";
import type { GitHubEvent } from "@/types/github";

const CELL = 12;
const GAP = 3;
const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];
const WEEKS = 20;

export function Heatmap({ events }: { events: GitHubEvent[] }) {
  const dark = useIsDark();
  const colors = dark ? HEAT.dark : HEAT.light;
  const grid = useMemo(() => buildHeatmap(events, WEEKS), [events]);
  const [hover, setHover] = useState<{ date: string; count: number } | null>(null);
  const total = useMemo(() => grid.flat().reduce((n, c) => n + c.count, 0), [grid]);

  const monthLabels = grid.map((week, i) => {
    const m = new Date(week[0].date + "T00:00:00Z").toLocaleString("en", { month: "short", timeZone: "UTC" });
    const prev = i > 0 ? new Date(grid[i - 1][0].date + "T00:00:00Z").toLocaleString("en", { month: "short", timeZone: "UTC" }) : "";
    return m !== prev ? m : "";
  });

  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex gap-2">
          <div className="flex flex-col pt-[18px] text-[10px] text-muted-foreground" aria-hidden="true" style={{ gap: GAP }}>
            {DAYS.map((d, i) => (
              <div key={i} style={{ height: CELL }} className="leading-[12px]">
                {d}
              </div>
            ))}
          </div>
          <div>
            <div className="flex text-[10px] text-muted-foreground" style={{ gap: GAP, height: 18 }} aria-hidden="true">
              {monthLabels.map((m, i) => (
                <div key={i} style={{ width: CELL }} className="overflow-visible whitespace-nowrap">
                  {m}
                </div>
              ))}
            </div>
            <div className="flex" style={{ gap: GAP }} role="img" aria-label={`Public activity heatmap for the last ${WEEKS} weeks, ${total} contribution-like events in total`}>
              {grid.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                  {week.map((cell) => (
                    <div
                      key={cell.date}
                      onMouseEnter={() => setHover({ date: cell.date, count: cell.count })}
                      onMouseLeave={() => setHover(null)}
                      title={`${cell.count} event${cell.count === 1 ? "" : "s"} on ${formatDate(cell.date)}`}
                      style={{ width: CELL, height: CELL, backgroundColor: colors[cell.level], borderRadius: 2 }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p role="status" aria-live="polite" className="min-h-[1rem]">
          {hover ? `${hover.count} event${hover.count === 1 ? "" : "s"} on ${formatDate(hover.date)}` : `${total} events in the last ${WEEKS} weeks`}
        </p>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          Less
          {colors.map((c, i) => (
            <span key={i} style={{ width: CELL, height: CELL, backgroundColor: c, borderRadius: 2 }} />
          ))}
          More
        </div>
      </div>

      <p className="mt-3 flex gap-2 rounded-md bg-muted p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          This heatmap is built only from GitHub&apos;s public events feed, which covers at most the latest 300 events from the past 90 days. It excludes private
          repository work and older history, so it is not a complete picture of this user&apos;s contributions.
        </span>
      </p>
    </div>
  );
}
