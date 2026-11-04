import { AlertCircle, BookMarked, Eye, GitFork, Info, Star, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/States";
import { StatCard } from "@/components/StatCard";
import { formatCompact, timeAgo } from "@/lib/format";
import { aggregateTotals, languageDistribution, recentlyUpdated, topByStars } from "@/lib/stats";
import type { GitHubRepo } from "@/types/github";

export function OverviewSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading statistics">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px]" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

function RepoList({ repos, onOpen, meta }: { repos: GitHubRepo[]; onOpen: (r: GitHubRepo) => void; meta: (r: GitHubRepo) => string }) {
  if (!repos.length) return <p className="text-sm text-muted-foreground">No repositories to show.</p>;
  return (
    <ul className="divide-y">
      {repos.map((r) => (
        <li key={r.id}>
          <button type="button" onClick={() => onOpen(r)} className="flex w-full items-center justify-between gap-3 py-2.5 text-left text-sm transition-colors hover:text-primary">
            <span className="truncate font-medium">{r.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{meta(r)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function OverviewView({ repos, publicRepoCount, onOpenRepo }: { repos: GitHubRepo[]; publicRepoCount: number; onOpenRepo: (r: GitHubRepo) => void }) {
  const totals = aggregateTotals(repos);
  const top = topByStars(repos, 5);
  const recent = recentlyUpdated(repos, 5);
  const langs = languageDistribution(repos).slice(0, 6);
  const best = top[0];

  return (
    <div className="space-y-6">
      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total stars" value={totals.stars} icon={<Star className="h-5 w-5" />} />
        <StatCard label="Total forks" value={totals.forks} icon={<GitFork className="h-5 w-5" />} />
        <StatCard label="Total watchers" value={totals.watchers} icon={<Eye className="h-5 w-5" />} />
        <StatCard label="Open issues" value={totals.openIssues} icon={<AlertCircle className="h-5 w-5" />} />
        <StatCard label="Public repositories" value={publicRepoCount} icon={<BookMarked className="h-5 w-5" />} hint={repos.length !== publicRepoCount ? `${repos.length} loaded` : undefined} />
        <StatCard label="Total contributions" value="Unavailable" icon={<Info className="h-5 w-5" />} hint="Not exposed by the public REST API" />
      </section>

      {repos.length === 0 ? (
        <EmptyState title="No public repositories" message="This user has no public repositories, so there are no statistics to show yet." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {best && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" aria-hidden="true" /> Most-starred repository
                </CardTitle>
              </CardHeader>
              <CardContent>
                <button type="button" onClick={() => onOpenRepo(best)} className="text-left">
                  <p className="text-lg font-semibold text-primary hover:underline">{best.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{best.description || "No description provided."}</p>
                  <p className="mt-3 text-sm">
                    <strong className="tabular-nums">{formatCompact(best.stargazers_count)}</strong> stars ·{" "}
                    <strong className="tabular-nums">{formatCompact(best.forks_count)}</strong> forks
                  </p>
                </button>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Most-used languages</CardTitle>
              <CardDescription>By primary language of each repository</CardDescription>
            </CardHeader>
            <CardContent>
              {langs.length ? (
                <ul className="space-y-2.5">
                  {langs.map((l) => (
                    <li key={l.name} className="text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{l.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {l.count} repo{l.count === 1 ? "" : "s"} · {l.percent.toFixed(0)}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" role="presentation">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${l.percent}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No language data available.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Top repositories</CardTitle>
              <CardDescription>Ranked by stars</CardDescription>
            </CardHeader>
            <CardContent>
              <RepoList repos={top} onOpen={onOpenRepo} meta={(r) => `★ ${formatCompact(r.stargazers_count)}`} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recently updated</CardTitle>
              <CardDescription>Latest pushes</CardDescription>
            </CardHeader>
            <CardContent>
              <RepoList repos={recent} onOpen={onOpenRepo} meta={(r) => timeAgo(r.pushed_at || r.updated_at)} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
