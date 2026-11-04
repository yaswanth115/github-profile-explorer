const KEY = "gpe:history";
const MAX = 10;

export function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function save(list: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable */
  }
}

/** Adds a username to the front, de-duplicating case-insensitively. Returns the new list. */
export function addToHistory(username: string): string[] {
  const next = [username, ...loadHistory().filter((u) => u.toLowerCase() !== username.toLowerCase())].slice(0, MAX);
  save(next);
  return next;
}

export function clearHistory(): string[] {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return [];
}

/**
 * Notable profiles shown on the Explore page.
 * Note: "dan_abramov" from the original brief is not a valid GitHub username (underscores are
 * not allowed); Dan Abramov's account is "gaearon", already included. "yyx990803" is used instead.
 */
export const SUGGESTED_PROFILES = [
  { login: "torvalds", blurb: "Creator of Linux and Git" },
  { login: "gaearon", blurb: "Dan Abramov, React core team" },
  { login: "sindresorhus", blurb: "Prolific open source maintainer" },
  { login: "tj", blurb: "Creator of Express and many Node tools" },
  { login: "yyx990803", blurb: "Evan You, creator of Vue and Vite" },
];
