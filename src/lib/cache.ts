/**
 * Small TTL cache with in-flight request de-duplication.
 * Values are kept in memory and mirrored to sessionStorage so a page reload
 * does not re-spend API quota. Storage failures are ignored silently.
 */
const PREFIX = "gpe:cache:";

interface Entry<T> {
  value: T;
  expires: number;
}

const memory = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

function readStorage<T>(key: string): Entry<T> | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as Entry<T>) : null;
  } catch {
    return null;
  }
}

function writeStorage<T>(key: string, entry: Entry<T>) {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    /* quota exceeded or storage unavailable: memory cache still works */
  }
}

export function getCached<T>(key: string): T | undefined {
  const now = Date.now();
  let entry = memory.get(key) as Entry<T> | undefined;
  if (!entry) {
    const stored = readStorage<T>(key);
    if (stored) {
      memory.set(key, stored);
      entry = stored;
    }
  }
  if (entry && entry.expires > now) return entry.value;
  if (entry) memory.delete(key);
  return undefined;
}

export function setCached<T>(key: string, value: T, ttlMs: number) {
  const entry = { value, expires: Date.now() + ttlMs };
  memory.set(key, entry);
  writeStorage(key, entry);
}

/** Returns a cached value, or runs `loader` once even if called concurrently. */
export async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const hit = getCached<T>(key);
  if (hit !== undefined) return hit;
  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;
  const promise = loader()
    .then((value) => {
      setCached(key, value, ttlMs);
      return value;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

export function clearCache() {
  memory.clear();
  inflight.clear();
  try {
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => sessionStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
