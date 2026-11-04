import { History, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SUGGESTED_PROFILES } from "@/lib/history";

interface Props {
  history: string[];
  onSelect: (username: string) => void;
  onClearHistory: () => void;
}

export function ExploreView({ history, onSelect, onClearHistory }: Props) {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold">Explore GitHub profiles</h2>
        <p className="mt-1 text-sm text-muted-foreground">Search for any username above, or start with one of these notable profiles.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" /> Suggested profiles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {SUGGESTED_PROFILES.map((p) => (
              <li key={p.login}>
                <button
                  type="button"
                  onClick={() => onSelect(p.login)}
                  className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
                >
                  <img src={`https://github.com/${p.login}.png?size=80`} alt="" width={40} height={40} loading="lazy" className="h-10 w-10 rounded-full bg-muted" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">@{p.login}</span>
                    <span className="block truncate text-xs text-muted-foreground">{p.blurb}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" aria-hidden="true" /> Recently searched
            </CardTitle>
            <CardDescription>Stored only in this browser</CardDescription>
          </div>
          {history.length > 0 && (
            <Button variant="outline" size="sm" onClick={onClearHistory}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Clear history
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No searches yet. Profiles you look up will appear here.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {history.map((u) => (
                <li key={u}>
                  <Button variant="secondary" size="sm" onClick={() => onSelect(u)}>
                    @{u}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
