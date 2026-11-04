import { Activity, BarChart3, BookMarked, Compass, LayoutDashboard, UserSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import type { View } from "@/hooks/useRoute";

const ITEMS: { view: View; label: string; icon: React.ReactNode; needsUser: boolean }[] = [
  { view: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" />, needsUser: true },
  { view: "repositories", label: "Repositories", icon: <BookMarked className="h-4 w-4" />, needsUser: true },
  { view: "activity", label: "Activity", icon: <Activity className="h-4 w-4" />, needsUser: true },
  { view: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" />, needsUser: true },
  { view: "explore", label: "Explore", icon: <Compass className="h-4 w-4" />, needsUser: false },
];

interface Props {
  view: View;
  hasUser: boolean;
  onNavigate: (view: View) => void;
}

export function Sidebar({ view, hasUser, onNavigate }: Props) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-card md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="rounded-md bg-primary p-1.5 text-primary-foreground" aria-hidden="true">
            <UserSearch className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold leading-tight">
            Profile
            <br />
            Explorer
          </span>
        </div>
        <nav aria-label="Primary" className="flex-1 space-y-1 px-3">
          {ITEMS.map((item) => {
            const disabled = item.needsUser && !hasUser;
            return (
              <button
                key={item.view}
                type="button"
                disabled={disabled}
                aria-current={view === item.view ? "page" : undefined}
                onClick={() => onNavigate(item.view)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  view === item.view ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  disabled && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-muted-foreground",
                )}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>
        <p className="px-5 py-4 text-xs text-muted-foreground">Live data from the GitHub public API.</p>
      </aside>

      {/* Mobile bottom navigation */}
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t bg-card px-1 py-1 md:hidden">
        {ITEMS.map((item) => {
          const disabled = item.needsUser && !hasUser;
          return (
            <button
              key={item.view}
              type="button"
              disabled={disabled}
              aria-current={view === item.view ? "page" : undefined}
              onClick={() => onNavigate(item.view)}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-md py-1.5 text-[11px] font-medium",
                view === item.view ? "text-primary" : "text-muted-foreground",
                disabled && "opacity-40",
              )}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
