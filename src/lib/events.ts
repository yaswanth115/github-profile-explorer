import type { GitHubEvent } from "@/types/github";

export interface EventView {
  id: string;
  type: "push" | "pull_request" | "issue" | "star" | "release" | "branch" | "other";
  label: string;
  repo: string;
  description: string;
  commits: string[];
  createdAt: string;
  url: string | null;
}

const repoUrl = (name: string) => `https://github.com/${name}`;

/** Maps a raw public event to a displayable summary. Returns null for unsupported event types. */
export function toEventView(e: GitHubEvent): EventView | null {
  const p = e.payload;
  const base = { id: e.id, repo: e.repo.name, createdAt: e.created_at, commits: [] as string[] };
  switch (e.type) {
    case "PushEvent": {
      const branch = (p.ref || "").replace("refs/heads/", "") || "default branch";
      const n = p.size ?? p.commits?.length ?? 0;
      return {
        ...base,
        type: "push",
        label: "Push",
        description: `Pushed ${n > 0 ? `${n} commit${n === 1 ? "" : "s"}` : "commits"} to ${branch}`,
        commits: (p.commits || []).slice(0, 3).map((c) => c.message.split("\n")[0]),
        url: repoUrl(e.repo.name),
      };
    }
    case "PullRequestEvent": {
      const pr = p.pull_request;
      const action = p.action === "closed" && pr?.merged ? "merged" : p.action || "updated";
      return {
        ...base,
        type: "pull_request",
        label: "Pull request",
        description: `${capitalize(action)} pull request${pr ? ` #${pr.number}: ${pr.title}` : ""}`,
        url: pr?.html_url ?? repoUrl(e.repo.name),
      };
    }
    case "IssuesEvent": {
      const issue = p.issue;
      return {
        ...base,
        type: "issue",
        label: "Issue",
        description: `${capitalize(p.action || "updated")} issue${issue ? ` #${issue.number}: ${issue.title}` : ""}`,
        url: issue?.html_url ?? repoUrl(e.repo.name),
      };
    }
    case "WatchEvent":
      return { ...base, type: "star", label: "Star", description: "Starred this repository", url: repoUrl(e.repo.name) };
    case "ReleaseEvent": {
      const rel = p.release;
      return {
        ...base,
        type: "release",
        label: "Release",
        description: `${capitalize(p.action || "published")} release ${rel?.name || rel?.tag_name || ""}`.trim(),
        url: rel?.html_url ?? repoUrl(e.repo.name),
      };
    }
    case "CreateEvent": {
      if (p.ref_type === "branch") {
        return {
          ...base,
          type: "branch",
          label: "Branch",
          description: `Created branch ${p.ref ?? ""}`.trim(),
          url: repoUrl(e.repo.name),
        };
      }
      return null;
    }
    default:
      return null;
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function toEventViews(events: GitHubEvent[]): EventView[] {
  return events.map(toEventView).filter((v): v is EventView => v !== null);
}
