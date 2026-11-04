import type { GitHubEvent, GitHubRepo, GitHubUser } from "@/types/github";

export function makeRepo(over: Partial<GitHubRepo> & { name: string }): GitHubRepo {
  return {
    id: Math.floor(Math.random() * 1e9),
    full_name: `octo/${over.name}`,
    html_url: `https://github.com/octo/${over.name}`,
    description: null,
    fork: false,
    homepage: null,
    language: null,
    topics: [],
    stargazers_count: 0,
    watchers_count: 0,
    forks_count: 0,
    open_issues_count: 0,
    default_branch: "main",
    license: null,
    pushed_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    created_at: "2020-01-01T00:00:00Z",
    archived: false,
    size: 1,
    owner: { login: "octo" },
    ...over,
  };
}

export const USER: GitHubUser = {
  login: "octo",
  id: 1,
  avatar_url: "https://example.com/a.png",
  html_url: "https://github.com/octo",
  name: "Octo Cat",
  company: "GitHub",
  blog: "octo.dev",
  location: "Internet",
  email: null,
  bio: "Testing things.",
  twitter_username: "octocat",
  public_repos: 3,
  public_gists: 0,
  followers: 1200,
  following: 4,
  created_at: "2015-03-01T00:00:00Z",
  type: "User",
};

export const REPOS: GitHubRepo[] = [
  makeRepo({ name: "alpha", language: "TypeScript", stargazers_count: 50, forks_count: 5, watchers_count: 50, open_issues_count: 2, topics: ["react", "ui"], description: "Alpha UI kit", pushed_at: "2026-03-01T00:00:00Z" }),
  makeRepo({ name: "Beta", language: "Python", stargazers_count: 10, forks_count: 1, watchers_count: 10, open_issues_count: 0, pushed_at: "2026-05-01T00:00:00Z" }),
  makeRepo({ name: "gamma", language: "TypeScript", stargazers_count: 200, forks_count: 20, watchers_count: 200, open_issues_count: 7, description: "Gamma tools", pushed_at: "2026-01-15T00:00:00Z" }),
];

export const EVENTS: GitHubEvent[] = [
  {
    id: "1",
    type: "PushEvent",
    created_at: "2026-06-01T10:00:00Z",
    repo: { name: "octo/alpha", url: "" },
    payload: { ref: "refs/heads/main", size: 2, commits: [{ sha: "a", message: "Fix bug\n\nlong body" }, { sha: "b", message: "Add feature" }] },
  },
  { id: "2", type: "WatchEvent", created_at: "2026-06-01T11:00:00Z", repo: { name: "x/y", url: "" }, payload: { action: "started" } },
  {
    id: "3",
    type: "PullRequestEvent",
    created_at: "2026-06-02T11:00:00Z",
    repo: { name: "octo/alpha", url: "" },
    payload: { action: "closed", pull_request: { number: 7, title: "Improve docs", merged: true, html_url: "https://github.com/octo/alpha/pull/7" } },
  },
  { id: "4", type: "CreateEvent", created_at: "2026-06-02T12:00:00Z", repo: { name: "octo/alpha", url: "" }, payload: { ref: "feature-x", ref_type: "branch" } },
  { id: "5", type: "CreateEvent", created_at: "2026-06-02T12:30:00Z", repo: { name: "octo/alpha", url: "" }, payload: { ref: "v1", ref_type: "tag" } },
  { id: "6", type: "ForkEvent", created_at: "2026-06-03T12:00:00Z", repo: { name: "octo/alpha", url: "" }, payload: {} },
];
