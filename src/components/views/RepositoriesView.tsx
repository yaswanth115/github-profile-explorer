import { useId, useMemo, useState } from "react";
import { Search, SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/States";
import { RepoCard } from "@/components/RepoCard";
import { filterAndSortRepos, languageDistribution, type RepoSort } from "@/lib/stats";
import type { GitHubRepo } from "@/types/github";

export function RepositoriesSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading repositories">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-40" />
      ))}
    </div>
  );
}

const SORTS: { value: RepoSort; label: string }[] = [
  { value: "stars", label: "Stars" },
  { value: "updated", label: "Recently updated" },
  { value: "name", label: "Name (A–Z)" },
];

const selectClass = "h-9 rounded-md border border-input bg-card px-3 text-sm shadow-sm";

export function RepositoriesView({ repos, onOpenRepo }: { repos: GitHubRepo[]; onOpenRepo: (r: GitHubRepo) => void }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<RepoSort>("updated");
  const [language, setLanguage] = useState("");
  const ids = { q: useId(), sort: useId(), lang: useId() };

  const languages = useMemo(() => languageDistribution(repos).map((l) => l.name).sort((a, b) => a.localeCompare(b)), [repos]);
  const visible = useMemo(() => filterAndSortRepos(repos, { query, language, sort }), [repos, query, language, sort]);

  if (repos.length === 0) {
    return <EmptyState title="No public repositories" message="This user has not published any repositories yet." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <label htmlFor={ids.q} className="sr-only">
            Search repositories
          </label>
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input id={ids.q} type="search" placeholder="Search by name, description or topic" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-3">
          <div>
            <label htmlFor={ids.sort} className="mb-1 block text-xs text-muted-foreground">
              Sort by
            </label>
            <select id={ids.sort} value={sort} onChange={(e) => setSort(e.target.value as RepoSort)} className={selectClass}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={ids.lang} className="mb-1 block text-xs text-muted-foreground">
              Language
            </label>
            <select id={ids.lang} value={language} onChange={(e) => setLanguage(e.target.value)} className={selectClass}>
              <option value="">All languages</option>
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
        Showing {visible.length} of {repos.length} repositories
      </p>

      {visible.length === 0 ? (
        <EmptyState icon={<SearchX className="h-8 w-8" />} title="No matching repositories" message="Try a different keyword or clear the language filter." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((r) => (
            <li key={r.id}>
              <RepoCard repo={r} onOpen={onOpenRepo} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
