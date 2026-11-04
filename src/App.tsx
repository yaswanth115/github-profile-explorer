import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { Gauge, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorState } from "@/components/States";
import { ProfileHeader, ProfileHeaderSkeleton } from "@/components/ProfileHeader";
import { SearchBar } from "@/components/SearchBar";
import { Sidebar } from "@/components/Sidebar";
import { ActivitySkeleton, ActivityView } from "@/components/views/ActivityView";
import { AnalyticsSkeleton } from "@/components/views/AnalyticsSkeleton";
import { ExploreView } from "@/components/views/ExploreView";
import { OverviewSkeleton, OverviewView } from "@/components/views/OverviewView";
import { RepositoriesSkeleton, RepositoriesView } from "@/components/views/RepositoriesView";
import { useAsync } from "@/hooks/useAsync";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useRoute, type View } from "@/hooks/useRoute";
import { useTheme } from "@/hooks/useTheme";
import { ApiError, getUser, getUserEvents, getUserRepos } from "@/lib/github";
import { addToHistory, clearHistory, loadHistory } from "@/lib/history";
import type { GitHubRepo } from "@/types/github";

// Heavy dependencies (Recharts, Markdown) load on demand to keep the first paint small.
const AnalyticsView = lazy(() => import("@/components/views/AnalyticsView").then((m) => ({ default: m.AnalyticsView })));
const RepoDrawer = lazy(() => import("@/components/RepoDrawer").then((m) => ({ default: m.RepoDrawer })));

export default function App() {
  const { user, validUser, view, navigate } = useRoute();
  const { theme, toggle } = useTheme();
  const rate = useRateLimit();
  const [history, setHistory] = useState<string[]>(loadHistory);
  const [openRepo, setOpenRepo] = useState<GitHubRepo | null>(null);

  const profile = useAsync(validUser, (s) => getUser(validUser!, s));
  const repos = useAsync(validUser, (s) => getUserRepos(validUser!, s));
  const events = useAsync(validUser, (s) => getUserEvents(validUser!, s));

  // Record successful lookups only, using GitHub's canonical capitalisation.
  useEffect(() => {
    if (profile.data) setHistory(addToHistory(profile.data.login));
  }, [profile.data]);

  useEffect(() => {
    document.title = profile.data ? `${profile.data.name || profile.data.login} · GitHub Profile Explorer` : "GitHub Profile Explorer";
  }, [profile.data]);

  useEffect(() => setOpenRepo(null), [validUser]);

  const search = useCallback((name: string) => navigate(name, "overview"), [navigate]);
  const go = useCallback((v: View) => navigate(v === "explore" ? null : validUser, v), [navigate, validUser]);
  const closeDrawer = useCallback(() => setOpenRepo(null), []);

  const showingUser = view !== "explore" && user !== null;
  const invalidName = user !== null && validUser === null;

  const body = () => {
    if (!showingUser) {
      return (
        <ExploreView
          history={history}
          onSelect={search}
          onClearHistory={() => setHistory(clearHistory())}
        />
      );
    }
    if (invalidName) return <ErrorState error={new ApiError("not_found", "Invalid username")} />;
    if (profile.error != null) return <ErrorState error={profile.error} onRetry={profile.reload} />;

    const reposReady = repos.data !== undefined;
    return (
      <div className="space-y-6">
        {profile.loading || !profile.data ? <ProfileHeaderSkeleton /> : <ProfileHeader user={profile.data} />}

        {view === "overview" &&
          (repos.error != null ? (
            <ErrorState error={repos.error} onRetry={repos.reload} />
          ) : !reposReady || !profile.data ? (
            <OverviewSkeleton />
          ) : (
            <OverviewView repos={repos.data!} publicRepoCount={profile.data.public_repos} onOpenRepo={setOpenRepo} />
          ))}

        {view === "repositories" &&
          (repos.error != null ? (
            <ErrorState error={repos.error} onRetry={repos.reload} />
          ) : !reposReady ? (
            <RepositoriesSkeleton />
          ) : (
            <RepositoriesView key={validUser} repos={repos.data!} onOpenRepo={setOpenRepo} />
          ))}

        {view === "activity" &&
          (events.loading ? <ActivitySkeleton /> : <ActivityView events={events.data} error={events.error} onRetry={events.reload} />)}

        {view === "analytics" &&
          (repos.error != null ? (
            <ErrorState error={repos.error} onRetry={repos.reload} />
          ) : !reposReady ? (
            <AnalyticsSkeleton />
          ) : (
            <Suspense fallback={<AnalyticsSkeleton />}>
              <AnalyticsView repos={repos.data!} events={events.data} eventsLoading={events.loading} eventsError={events.error} onRetryEvents={events.reload} />
            </Suspense>
          ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar view={view} hasUser={user !== null} onNavigate={go} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-start gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur md:px-8">
          <SearchBar value={user} onSearch={search} />
          <div className="ml-auto flex items-center gap-2">
            {rate && (
              <span
                className="hidden items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5 text-xs text-muted-foreground sm:inline-flex"
                title={`GitHub API requests remaining. Resets at ${new Date(rate.reset * 1000).toLocaleTimeString()}.`}
              >
                <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
                <span className={rate.remaining < 10 ? "font-semibold text-destructive" : ""}>
                  {rate.remaining}/{rate.limit}
                </span>
                <span className="sr-only">API requests remaining</span>
              </span>
            )}
            <Button variant="outline" size="icon" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </header>
        <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10">
          <div className="mx-auto max-w-6xl">
            <ErrorBoundary resetKey={`${user}:${view}`}>{body()}</ErrorBoundary>
          </div>
        </main>
      </div>
      {openRepo && (
        <Suspense fallback={null}>
          <RepoDrawer repo={openRepo} onClose={closeDrawer} />
        </Suspense>
      )}
    </div>
  );
}
