import type { GitHubEvent, GitHubRepo } from "@/types/github";

export interface RepoTotals {
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  repos: number;
}

export function aggregateTotals(repos: GitHubRepo[]): RepoTotals {
  return repos.reduce<RepoTotals>(
    (acc, r) => ({
      stars: acc.stars + r.stargazers_count,
      forks: acc.forks + r.forks_count,
      watchers: acc.watchers + r.watchers_count,
      openIssues: acc.openIssues + r.open_issues_count,
      repos: acc.repos + 1,
    }),
    { stars: 0, forks: 0, watchers: 0, openIssues: 0, repos: 0 },
  );
}

export function topByStars(repos: GitHubRepo[], n = 5): GitHubRepo[] {
  return [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count || a.name.localeCompare(b.name)).slice(0, n);
}

export function recentlyUpdated(repos: GitHubRepo[], n = 5): GitHubRepo[] {
  return [...repos]
    .sort((a, b) => Date.parse(b.pushed_at || b.updated_at) - Date.parse(a.pushed_at || a.updated_at))
    .slice(0, n);
}

export interface LanguageStat {
  name: string;
  count: number;
  percent: number;
}

/** Counts repositories by their primary language (repos without a language are skipped). */
export function languageDistribution(repos: GitHubRepo[]): LanguageStat[] {
  const counts = new Map<string, number>();
  for (const r of repos) {
    if (r.language) counts.set(r.language, (counts.get(r.language) || 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count, percent: total ? (count / total) * 100 : 0 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export type RepoSort = "stars" | "updated" | "name";

export function filterAndSortRepos(
  repos: GitHubRepo[],
  opts: { query: string; language: string; sort: RepoSort },
): GitHubRepo[] {
  const q = opts.query.trim().toLowerCase();
  const out = repos.filter((r) => {
    if (opts.language && r.language !== opts.language) return false;
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      (r.description || "").toLowerCase().includes(q) ||
      (r.topics || []).some((t) => t.toLowerCase().includes(q))
    );
  });
  switch (opts.sort) {
    case "stars":
      return out.sort((a, b) => b.stargazers_count - a.stargazers_count || a.name.localeCompare(b.name));
    case "name":
      return out.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    default:
      return out.sort(
        (a, b) => Date.parse(b.pushed_at || b.updated_at) - Date.parse(a.pushed_at || a.updated_at),
      );
  }
}

/* ---------- contribution heatmap (from public events only) ---------- */

export interface HeatmapCell {
  date: string; // YYYY-MM-DD (UTC)
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Number of "contribution-like" items an event represents. */
function eventWeight(e: GitHubEvent): number {
  switch (e.type) {
    case "PushEvent":
      return Math.max(1, e.payload.size ?? e.payload.commits?.length ?? 1);
    case "CreateEvent":
      return e.payload.ref_type === "tag" ? 0 : 1;
    case "PullRequestEvent":
    case "IssuesEvent":
    case "ReleaseEvent":
    case "PullRequestReviewEvent":
      return 1;
    default:
      return 0;
  }
}

/**
 * Builds a weeks x 7 grid ending at `end` (default today, UTC). Weeks start on Sunday.
 * Only events returned by the public events API are counted (at most ~300 recent events,
 * and never older than 90 days), so this is NOT a full contribution history.
 */
export function buildHeatmap(events: GitHubEvent[], weeks = 20, end: Date = new Date()): HeatmapCell[][] {
  const counts = new Map<string, number>();
  for (const e of events) {
    const w = eventWeight(e);
    if (!w) continue;
    const day = e.created_at.slice(0, 10);
    counts.set(day, (counts.get(day) || 0) + w);
  }

  const today = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - (weeks * 7 - 1));
  // align start to a Sunday
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());

  const max = Math.max(0, ...counts.values());
  const grid: HeatmapCell[][] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const week: HeatmapCell[] = [];
    for (let i = 0; i < 7; i++) {
      const date = isoDay(cursor);
      const count = cursor > today ? 0 : counts.get(date) || 0;
      week.push({ date, count, level: levelFor(count, max) });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    grid.push(week);
  }
  return grid;
}

function levelFor(count: number, max: number): HeatmapCell["level"] {
  if (count <= 0 || max <= 0) return 0;
  const ratio = count / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}
