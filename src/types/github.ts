export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  type: string;
}

export interface GitHubLicense {
  key: string;
  name: string;
  spdx_id: string | null;
  url: string | null;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  homepage: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  license: GitHubLicense | null;
  pushed_at: string | null;
  updated_at: string;
  created_at: string;
  archived: boolean;
  size: number;
  owner: { login: string };
}

export type LanguageBytes = Record<string, number>;

export interface GitHubReadme {
  content: string; // base64
  encoding: string;
  html_url: string;
}

export interface GitHubCommitSummary {
  sha: string;
  html_url: string;
  commit: { message: string; author: { name: string; date: string } | null };
}

export interface GitHubEvent {
  id: string;
  type: string;
  created_at: string;
  repo: { name: string; url: string };
  payload: {
    action?: string;
    ref?: string | null;
    ref_type?: string;
    size?: number;
    commits?: { sha: string; message: string }[];
    pull_request?: { number: number; title: string; merged?: boolean; html_url: string };
    issue?: { number: number; title: string; html_url: string };
    release?: { tag_name: string; name: string | null; html_url: string };
    forkee?: { full_name: string };
  };
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // epoch seconds
}
