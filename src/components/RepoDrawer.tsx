import { AlertCircle, CircleDot, ExternalLink, Eye, GitBranch, GitFork, Scale, Star } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Markdown } from "@/components/Markdown";
import { EmptyState, ErrorState } from "@/components/States";
import { useAsync } from "@/hooks/useAsync";
import { getRepo, getRepoCommits, getRepoLanguages, getRepoReadme } from "@/lib/github";
import { formatDate, formatNumber, timeAgo } from "@/lib/format";
import type { GitHubRepo } from "@/types/github";

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span aria-hidden="true">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold">{value}</dd>
    </div>
  );
}

function DrawerBody({ summary }: { summary: GitHubRepo }) {
  const owner = summary.owner.login;
  const name = summary.name;
  const key = `${owner}/${name}`;

  // The list endpoint already has most fields; the detail call refreshes them and is cached.
  const detail = useAsync(key, (s) => getRepo(owner, name, s));
  const languages = useAsync(key, (s) => getRepoLanguages(owner, name, s));
  const readme = useAsync(key, (s) => getRepoReadme(owner, name, s));
  const commits = useAsync(key, (s) => getRepoCommits(owner, name, s));

  const repo = detail.data ?? summary;
  const langEntries = Object.entries(languages.data ?? {}).sort((a, b) => b[1] - a[1]);
  const langTotal = langEntries.reduce((n, [, bytes]) => n + bytes, 0);
  const topics = repo.topics ?? [];

  return (
    <div className="space-y-6">
      <section aria-label="Repository information" className="space-y-3">
        <p className="text-sm text-muted-foreground">{repo.description || "No description provided."}</p>
        <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 break-all text-sm text-primary hover:underline">
          {repo.html_url}
          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </a>
        {detail.error != null && <p className="text-xs text-muted-foreground">Showing cached list data; the latest details could not be loaded.</p>}
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Fact icon={<Star className="h-3.5 w-3.5" />} label="Stars" value={formatNumber(repo.stargazers_count)} />
          <Fact icon={<GitFork className="h-3.5 w-3.5" />} label="Forks" value={formatNumber(repo.forks_count)} />
          <Fact icon={<Eye className="h-3.5 w-3.5" />} label="Watchers" value={formatNumber(repo.watchers_count)} />
          <Fact icon={<AlertCircle className="h-3.5 w-3.5" />} label="Open issues" value={formatNumber(repo.open_issues_count)} />
          <Fact icon={<GitBranch className="h-3.5 w-3.5" />} label="Default branch" value={repo.default_branch} />
          <Fact
            icon={<Scale className="h-3.5 w-3.5" />}
            label="License"
            value={repo.license ? repo.license.spdx_id && repo.license.spdx_id !== "NOASSERTION" ? repo.license.spdx_id : repo.license.name : "None specified"}
          />
        </dl>
        <p className="text-xs text-muted-foreground">
          Created {formatDate(repo.created_at)} · Last pushed {timeAgo(repo.pushed_at || repo.updated_at)}
        </p>
      </section>

      <section aria-label="Topics">
        <h3 className="mb-2 text-sm font-semibold">Topics</h3>
        {topics.length ? (
          <ul className="flex flex-wrap gap-1.5">
            {topics.map((t) => (
              <li key={t}>
                <Badge>{t}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No topics.</p>
        )}
      </section>

      <section aria-label="Languages">
        <h3 className="mb-2 text-sm font-semibold">Languages</h3>
        {languages.loading ? (
          <Skeleton className="h-8" />
        ) : languages.error != null ? (
          <p className="text-sm text-muted-foreground">Language breakdown is unavailable.</p>
        ) : langEntries.length ? (
          <>
            <div className="flex h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label="Language breakdown bar">
              {langEntries.map(([lang, bytes], i) => (
                <div key={lang} title={lang} style={{ width: `${(bytes / langTotal) * 100}%`, opacity: 1 - Math.min(i, 6) * 0.12 }} className="bg-primary" />
              ))}
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {langEntries.map(([lang, bytes]) => (
                <li key={lang} className="inline-flex items-center gap-1">
                  <CircleDot className="h-3 w-3 text-primary" aria-hidden="true" />
                  <span className="font-medium">{lang}</span>
                  <span className="text-muted-foreground">{((bytes / langTotal) * 100).toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No language data.</p>
        )}
      </section>

      <section aria-label="Recent commits">
        <h3 className="mb-2 text-sm font-semibold">Recent commits</h3>
        {commits.loading ? (
          <Skeleton className="h-16" />
        ) : commits.error != null || !commits.data?.length ? (
          <p className="text-sm text-muted-foreground">Commit history is unavailable for this repository.</p>
        ) : (
          <ul className="divide-y rounded-md border bg-card">
            {commits.data.map((c) => (
              <li key={c.sha} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <a href={c.html_url} target="_blank" rel="noopener noreferrer" className="truncate hover:text-primary hover:underline">
                  {c.commit.message.split("\n")[0]}
                </a>
                <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(c.commit.author?.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="README">
        <h3 className="mb-2 text-sm font-semibold">README</h3>
        {readme.loading ? (
          <div className="space-y-2" aria-busy="true">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : readme.error != null ? (
          <ErrorState error={readme.error} onRetry={readme.reload} />
        ) : readme.data ? (
          <div className="rounded-md border bg-card p-4">
            <Markdown>{readme.data}</Markdown>
          </div>
        ) : (
          <EmptyState title="No README" message="This repository does not have a README file." />
        )}
      </section>
    </div>
  );
}

export function RepoDrawer({ repo, onClose }: { repo: GitHubRepo | null; onClose: () => void }) {
  return (
    <Drawer open={repo !== null} onClose={onClose} title={repo?.name ?? "Repository"}>
      {repo && <DrawerBody key={repo.id} summary={repo} />}
    </Drawer>
  );
}
