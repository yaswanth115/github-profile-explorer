import { cached } from "./cache";
import type {
  GitHubCommitSummary,
  GitHubEvent,
  GitHubRepo,
  GitHubUser,
  LanguageBytes,
  RateLimitInfo,
} from "@/types/github";

const BASE_URL = (import.meta.env.VITE_GITHUB_API_URL as string | undefined) || "https://api.github.com";
const TOKEN = (import.meta.env.VITE_GITHUB_TOKEN as string | undefined) || "";

const TTL = {
  user: 5 * 60_000,
  repos: 5 * 60_000,
  events: 2 * 60_000,
  repo: 10 * 60_000,
  readme: 30 * 60_000,
  languages: 30 * 60_000,
  commits: 5 * 60_000,
};

const PER_PAGE = 100;
const MAX_REPO_PAGES = 10; // up to 1,000 repositories
const MAX_EVENT_PAGES = 3; // GitHub only exposes the latest 300 public events

export type ApiErrorKind = "not_found" | "rate_limit" | "network" | "http" | "aborted";

export class ApiError extends Error {
  kind: ApiErrorKind;
  status?: number;
  resetAt?: number;
  constructor(kind: ApiErrorKind, message: string, opts: { status?: number; resetAt?: number } = {}) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = opts.status;
    this.resetAt = opts.resetAt;
  }
}

/* ---------- rate limit tracking ---------- */

let rateLimit: RateLimitInfo | null = null;
const listeners = new Set<(info: RateLimitInfo | null) => void>();

export function getRateLimit() {
  return rateLimit;
}

export function subscribeRateLimit(fn: (info: RateLimitInfo | null) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function updateRateLimit(res: Response) {
  const limit = Number(res.headers.get("x-ratelimit-limit"));
  const remaining = Number(res.headers.get("x-ratelimit-remaining"));
  const reset = Number(res.headers.get("x-ratelimit-reset"));
  if (!res.headers.get("x-ratelimit-limit") || Number.isNaN(limit)) return;
  rateLimit = { limit, remaining, reset };
  listeners.forEach((fn) => fn(rateLimit));
}

/* ---------- core request ---------- */

interface RequestResult<T> {
  data: T;
  nextPage: boolean;
}

async function request<T>(path: string, signal?: AbortSignal): Promise<RequestResult<T>> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { headers, signal });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw new ApiError("aborted", "Request cancelled");
    throw new ApiError("network", "Network error. Check your connection and try again.");
  }

  updateRateLimit(res);

  if (res.ok) {
    const link = res.headers.get("link") || "";
    return { data: (await res.json()) as T, nextPage: /rel="next"/.test(link) };
  }

  const remaining = res.headers.get("x-ratelimit-remaining");
  const reset = Number(res.headers.get("x-ratelimit-reset")) || undefined;
  if (res.status === 429 || (res.status === 403 && remaining === "0")) {
    const when = reset ? ` Resets at ${new Date(reset * 1000).toLocaleTimeString()}.` : "";
    throw new ApiError("rate_limit", `GitHub API rate limit exceeded.${when}`, { status: res.status, resetAt: reset });
  }
  if (res.status === 404) throw new ApiError("not_found", "Not found", { status: 404 });
  throw new ApiError("http", `GitHub API error (${res.status}).`, { status: res.status });
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  return (await request<T>(path, signal)).data;
}

async function getAllPages<T>(basePath: string, perPage: number, maxPages: number, signal?: AbortSignal): Promise<T[]> {
  const out: T[] = [];
  const sep = basePath.includes("?") ? "&" : "?";
  for (let page = 1; page <= maxPages; page++) {
    const { data, nextPage } = await request<T[]>(`${basePath}${sep}per_page=${perPage}&page=${page}`, signal);
    out.push(...data);
    if (!nextPage || data.length < perPage) break;
  }
  return out;
}

/* ---------- public API ---------- */

const enc = encodeURIComponent;

export const USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function isValidUsername(name: string) {
  return USERNAME_RE.test(name);
}

export function getUser(username: string, signal?: AbortSignal) {
  return cached(`user:${username.toLowerCase()}`, TTL.user, () => getJson<GitHubUser>(`/users/${enc(username)}`, signal));
}

export function getUserRepos(username: string, signal?: AbortSignal) {
  return cached(`repos:${username.toLowerCase()}`, TTL.repos, () =>
    getAllPages<GitHubRepo>(`/users/${enc(username)}/repos?type=owner&sort=updated`, PER_PAGE, MAX_REPO_PAGES, signal),
  );
}

export function getUserEvents(username: string, signal?: AbortSignal) {
  return cached(`events:${username.toLowerCase()}`, TTL.events, () =>
    getAllPages<GitHubEvent>(`/users/${enc(username)}/events/public`, PER_PAGE, MAX_EVENT_PAGES, signal),
  );
}

export function getRepo(owner: string, repo: string, signal?: AbortSignal) {
  return cached(`repo:${owner}/${repo}`.toLowerCase(), TTL.repo, () =>
    getJson<GitHubRepo>(`/repos/${enc(owner)}/${enc(repo)}`, signal),
  );
}

export function getRepoLanguages(owner: string, repo: string, signal?: AbortSignal) {
  return cached(`langs:${owner}/${repo}`.toLowerCase(), TTL.languages, () =>
    getJson<LanguageBytes>(`/repos/${enc(owner)}/${enc(repo)}/languages`, signal),
  );
}

export function getRepoCommits(owner: string, repo: string, signal?: AbortSignal) {
  return cached(`commits:${owner}/${repo}`.toLowerCase(), TTL.commits, () =>
    getJson<GitHubCommitSummary[]>(`/repos/${enc(owner)}/${enc(repo)}/commits?per_page=5`, signal),
  );
}

/** Decodes a base64 string returned by the contents API as UTF-8. */
export function decodeBase64Utf8(b64: string): string {
  const binary = atob(b64.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

/** Returns README markdown, or null if the repository has none. */
export function getRepoReadme(owner: string, repo: string, signal?: AbortSignal) {
  return cached<string | null>(`readme:${owner}/${repo}`.toLowerCase(), TTL.readme, async () => {
    try {
      const data = await getJson<{ content: string; encoding: string }>(
        `/repos/${enc(owner)}/${enc(repo)}/readme`,
        signal,
      );
      return data.encoding === "base64" ? decodeBase64Utf8(data.content) : data.content;
    } catch (err) {
      if (err instanceof ApiError && err.kind === "not_found") return null;
      throw err;
    }
  });
}

export function describeError(err: unknown): { title: string; message: string } {
  if (err instanceof ApiError) {
    switch (err.kind) {
      case "not_found":
        return { title: "User not found", message: "No GitHub user matches that username. Check the spelling and try again." };
      case "rate_limit":
        return { title: "Rate limit reached", message: err.message + " Add a GitHub token (see README) for a higher limit." };
      case "network":
        return { title: "Network problem", message: err.message };
      default:
        return { title: "Something went wrong", message: err.message };
    }
  }
  return { title: "Something went wrong", message: "An unexpected error occurred." };
}
