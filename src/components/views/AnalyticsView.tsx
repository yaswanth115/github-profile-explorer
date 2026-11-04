import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/States";
import { Heatmap } from "@/components/charts/Heatmap";
import { LanguageDonut } from "@/components/charts/LanguageDonut";
import { StarsChart } from "@/components/charts/StarsChart";
import { languageDistribution, topByStars } from "@/lib/stats";
import type { GitHubEvent, GitHubRepo } from "@/types/github";

interface Props {
  repos: GitHubRepo[];
  events: GitHubEvent[] | undefined;
  eventsLoading: boolean;
  eventsError: unknown;
  onRetryEvents: () => void;
}

export function AnalyticsView({ repos, events, eventsLoading, eventsError, onRetryEvents }: Props) {
  const languages = languageDistribution(repos);
  const top = topByStars(repos, 8).filter((r) => r.stargazers_count > 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Contribution heatmap</CardTitle>
          <CardDescription>Public activity over the last 20 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <Skeleton className="h-32" />
          ) : eventsError != null ? (
            <ErrorState error={eventsError} onRetry={onRetryEvents} />
          ) : (
            <Heatmap events={events ?? []} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Programming languages</CardTitle>
            <CardDescription>Repositories by primary language</CardDescription>
          </CardHeader>
          <CardContent>
            {languages.length ? <LanguageDonut stats={languages} /> : <EmptyState title="No language data" message="None of the repositories report a primary language." />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top repositories by stars</CardTitle>
            <CardDescription>Up to eight most-starred repositories</CardDescription>
          </CardHeader>
          <CardContent>{top.length ? <StarsChart repos={top} /> : <EmptyState title="No stars yet" message="None of the repositories have been starred." />}</CardContent>
        </Card>
      </div>
    </div>
  );
}
