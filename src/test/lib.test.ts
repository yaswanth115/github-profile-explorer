import { describe, expect, it } from "vitest";
import { aggregateTotals, buildHeatmap, filterAndSortRepos, languageDistribution, recentlyUpdated, topByStars } from "@/lib/stats";
import { formatDate, safeUrl, timeAgo } from "@/lib/format";
import { toEventView, toEventViews } from "@/lib/events";
import { addToHistory, clearHistory, loadHistory } from "@/lib/history";
import { isValidUsername } from "@/lib/github";
import { EVENTS, REPOS } from "./fixtures";

describe("stats", () => {
  it("aggregates totals", () => {
    expect(aggregateTotals(REPOS)).toEqual({ stars: 260, forks: 26, watchers: 260, openIssues: 9, repos: 3 });
  });

  it("finds top and recent repos", () => {
    expect(topByStars(REPOS, 1)[0].name).toBe("gamma");
    expect(recentlyUpdated(REPOS, 1)[0].name).toBe("Beta");
  });

  it("computes language distribution", () => {
    const d = languageDistribution(REPOS);
    expect(d[0]).toMatchObject({ name: "TypeScript", count: 2 });
    expect(d[0].percent).toBeCloseTo(66.67, 1);
    expect(d.reduce((n, l) => n + l.percent, 0)).toBeCloseTo(100);
  });

  it("filters by keyword (name, description, topic) and language", () => {
    expect(filterAndSortRepos(REPOS, { query: "react", language: "", sort: "stars" }).map((r) => r.name)).toEqual(["alpha"]);
    expect(filterAndSortRepos(REPOS, { query: "tools", language: "", sort: "stars" }).map((r) => r.name)).toEqual(["gamma"]);
    expect(filterAndSortRepos(REPOS, { query: "", language: "Python", sort: "stars" }).map((r) => r.name)).toEqual(["Beta"]);
    expect(filterAndSortRepos(REPOS, { query: "zzz", language: "", sort: "stars" })).toEqual([]);
  });

  it("sorts by stars, name (case-insensitive) and recency", () => {
    const names = (sort: "stars" | "name" | "updated") => filterAndSortRepos(REPOS, { query: "", language: "", sort }).map((r) => r.name);
    expect(names("stars")).toEqual(["gamma", "alpha", "Beta"]);
    expect(names("name")).toEqual(["alpha", "Beta", "gamma"]);
    expect(names("updated")).toEqual(["Beta", "alpha", "gamma"]);
  });

  it("does not mutate the input when sorting", () => {
    const copy = [...REPOS];
    filterAndSortRepos(REPOS, { query: "", language: "", sort: "name" });
    expect(REPOS).toEqual(copy);
  });
});

describe("heatmap", () => {
  const end = new Date("2026-06-03T12:00:00Z");

  it("builds Sunday-aligned weeks of 7 days ending today", () => {
    const grid = buildHeatmap(EVENTS, 8, end);
    expect(grid.every((w) => w.length === 7)).toBe(true);
    expect(new Date(grid[0][0].date + "T00:00:00Z").getUTCDay()).toBe(0);
  });

  it("counts push commits and ignores unsupported events", () => {
    const flat = buildHeatmap(EVENTS, 8, end).flat();
    const byDate = Object.fromEntries(flat.map((c) => [c.date, c.count]));
    expect(byDate["2026-06-01"]).toBe(2); // push of 2 commits; star ignored
    expect(byDate["2026-06-02"]).toBe(2); // PR + branch; tag ignored
    expect(byDate["2026-06-03"]).toBe(0); // fork ignored
    expect(Math.max(...flat.map((c) => c.level))).toBe(4);
  });

  it("returns only empty cells without events", () => {
    expect(buildHeatmap([], 4, end).flat().every((c) => c.count === 0 && c.level === 0)).toBe(true);
  });
});

describe("events", () => {
  it("describes pushes with commit subjects", () => {
    const v = toEventView(EVENTS[0])!;
    expect(v.type).toBe("push");
    expect(v.description).toBe("Pushed 2 commits to main");
    expect(v.commits).toEqual(["Fix bug", "Add feature"]);
  });

  it("describes merged pull requests", () => {
    expect(toEventView(EVENTS[2])!.description).toBe("Merged pull request #7: Improve docs");
  });

  it("keeps branches but drops tags and unsupported types", () => {
    expect(toEventViews(EVENTS).map((e) => e.type)).toEqual(["push", "star", "pull_request", "branch"]);
  });
});

describe("format", () => {
  it("normalises blog URLs and rejects unsafe schemes", () => {
    expect(safeUrl("octo.dev")).toBe("https://octo.dev/");
    expect(safeUrl("http://a.com/x")).toBe("http://a.com/x");
    expect(safeUrl("javascript:alert(1)")).toBeNull();
    expect(safeUrl("")).toBeNull();
    expect(safeUrl(null)).toBeNull();
  });

  it("formats relative times and dates", () => {
    const now = Date.parse("2026-06-10T00:00:00Z");
    expect(timeAgo("2026-06-09T00:00:00Z", now)).toBe("yesterday");
    expect(timeAgo("2026-06-09T23:59:50Z", now)).toBe("just now");
    expect(timeAgo(null)).toBe("—");
    expect(formatDate("2026-06-10T00:00:00Z")).toMatch(/2026/);
    expect(formatDate(undefined)).toBe("—");
  });
});

describe("username validation", () => {
  it.each(["torvalds", "a", "a-b", "User123"])("accepts %s", (n) => expect(isValidUsername(n)).toBe(true));
  it.each(["dan_abramov", "-a", "a-", "a--b", "", "a b", "x".repeat(40)])("rejects %j", (n) => expect(isValidUsername(n)).toBe(false));
});

describe("history", () => {
  it("de-duplicates case-insensitively, keeps newest first and caps at 10", () => {
    addToHistory("Torvalds");
    addToHistory("tj");
    expect(addToHistory("torvalds")).toEqual(["torvalds", "tj"]);
    for (let i = 0; i < 15; i++) addToHistory(`user${i}`);
    expect(loadHistory()).toHaveLength(10);
    expect(loadHistory()[0]).toBe("user14");
  });

  it("clears and tolerates corrupt storage", () => {
    addToHistory("a");
    expect(clearHistory()).toEqual([]);
    expect(loadHistory()).toEqual([]);
    localStorage.setItem("gpe:history", "{not json");
    expect(loadHistory()).toEqual([]);
  });
});
