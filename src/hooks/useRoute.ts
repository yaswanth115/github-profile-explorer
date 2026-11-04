import { useCallback, useEffect, useState } from "react";
import { isValidUsername } from "@/lib/github";

export type View = "overview" | "repositories" | "activity" | "analytics" | "explore";
export const VIEWS: View[] = ["overview", "repositories", "activity", "analytics", "explore"];

function readRoute(): { user: string | null; view: View } {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("user")?.trim() || "";
  const hash = window.location.hash.replace("#", "") as View;
  return {
    user: raw || null,
    view: VIEWS.includes(hash) ? hash : raw ? "overview" : "explore",
  };
}

/** Keeps `?user=` and `#view` in sync with state so profile URLs are shareable. */
export function useRoute() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener("popstate", onChange);
    window.addEventListener("hashchange", onChange);
    return () => {
      window.removeEventListener("popstate", onChange);
      window.removeEventListener("hashchange", onChange);
    };
  }, []);

  const navigate = useCallback((user: string | null, view: View) => {
    const url = new URL(window.location.href);
    if (user) url.searchParams.set("user", user);
    else url.searchParams.delete("user");
    url.hash = view === "overview" ? "" : view;
    window.history.pushState({}, "", url);
    setRoute({ user, view });
  }, []);

  const validUser = route.user && isValidUsername(route.user) ? route.user : null;
  return { user: route.user, validUser, view: route.view, navigate };
}
