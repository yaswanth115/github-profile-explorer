import { AlertCircle, CircleDot, GitFork, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCompact, timeAgo } from "@/lib/format";
import type { GitHubRepo } from "@/types/github";

export function RepoCard({ repo, onOpen }: { repo: GitHubRepo; onOpen: (repo: GitHubRepo) => void }) {
  const topics = repo.topics ?? [];
  return (
    <button
      type="button"
      onClick={() => onOpen(repo)}
      className="group flex h-full w-full flex-col gap-3 rounded-lg border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
      aria-label={`Open details for ${repo.name}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="break-all text-sm font-semibold text-primary group-hover:underline">{repo.name}</h3>
        <div className="flex shrink-0 gap-1">
          {repo.fork && <Badge className="bg-secondary text-secondary-foreground">Fork</Badge>}
          {repo.archived && <Badge className="bg-secondary text-secondary-foreground">Archived</Badge>}
        </div>
      </div>
      <p className="line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">{repo.description || "No description provided."}</p>
      {topics.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Topics">
          {topics.slice(0, 4).map((t) => (
            <li key={t}>
              <Badge>{t}</Badge>
            </li>
          ))}
          {topics.length > 4 && <li className="text-xs text-muted-foreground">+{topics.length - 4}</li>}
        </ul>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
        {repo.language && (
          <span className="inline-flex items-center gap-1">
            <CircleDot className="h-3 w-3 text-primary" aria-hidden="true" />
            {repo.language}
          </span>
        )}
        <span className="inline-flex items-center gap-1" title="Stars">
          <Star className="h-3 w-3" aria-hidden="true" />
          <span className="sr-only">Stars:</span>
          {formatCompact(repo.stargazers_count)}
        </span>
        <span className="inline-flex items-center gap-1" title="Forks">
          <GitFork className="h-3 w-3" aria-hidden="true" />
          <span className="sr-only">Forks:</span>
          {formatCompact(repo.forks_count)}
        </span>
        <span className="inline-flex items-center gap-1" title="Open issues">
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          <span className="sr-only">Open issues:</span>
          {formatCompact(repo.open_issues_count)}
        </span>
        <span className="ml-auto">Updated {timeAgo(repo.pushed_at || repo.updated_at)}</span>
      </div>
    </button>
  );
}
