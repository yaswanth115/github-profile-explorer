import { useMemo } from "react";
import { Activity, GitBranch, GitCommitHorizontal, GitPullRequest, CircleDot, Rocket, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/States";
import { toEventViews, type EventView } from "@/lib/events";
import { timeAgo } from "@/lib/format";
import type { GitHubEvent } from "@/types/github";

const ICONS: Record<EventView["type"], React.ReactNode> = {
  push: <GitCommitHorizontal className="h-4 w-4" />,
  pull_request: <GitPullRequest className="h-4 w-4" />,
  issue: <CircleDot className="h-4 w-4" />,
  star: <Star className="h-4 w-4" />,
  release: <Rocket className="h-4 w-4" />,
  branch: <GitBranch className="h-4 w-4" />,
  other: <Activity className="h-4 w-4" />,
};

export function ActivitySkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading activity">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16" />
      ))}
    </div>
  );
}

interface Props {
  events: GitHubEvent[] | undefined;
  error: unknown;
  onRetry: () => void;
}

export function ActivityView({ events, error, onRetry }: Props) {
  const views = useMemo(() => toEventViews(events ?? []), [events]);

  if (error != null) return <ErrorState error={error} onRetry={onRetry} />;
  if (views.length === 0) {
    return (
      <EmptyState
        icon={<Activity className="h-8 w-8" />}
        title="No recent public activity"
        message="GitHub only shares public events from the last 90 days. This user may have been inactive, or their activity may be private."
      />
    );
  }

  return (
    <Card>
      <ol className="divide-y">
        {views.slice(0, 50).map((v) => (
          <li key={v.id} className="flex gap-3 p-4">
            <div className="mt-0.5 rounded-full bg-accent p-2 text-accent-foreground" aria-hidden="true">
              {ICONS[v.type]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-semibold">{v.label}</span> in{" "}
                <a href={`https://github.com/${v.repo}`} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                  {v.repo}
                </a>
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {v.url ? (
                  <a href={v.url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline">
                    {v.description}
                  </a>
                ) : (
                  v.description
                )}
              </p>
              {v.commits.length > 0 && (
                <ul className="mt-1.5 space-y-0.5 border-l-2 pl-3 text-xs text-muted-foreground">
                  {v.commits.map((c, i) => (
                    <li key={i} className="truncate">
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <time dateTime={v.createdAt} title={new Date(v.createdAt).toLocaleString()} className="shrink-0 text-xs text-muted-foreground">
              {timeAgo(v.createdAt)}
            </time>
          </li>
        ))}
      </ol>
    </Card>
  );
}
