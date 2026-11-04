import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearCache } from "@/lib/cache";
import { ApiError, decodeBase64Utf8, getRepoReadme, getUser, getUserEvents, getUserRepos, describeError } from "@/lib/github";
import { makeRepo } from "./fixtures";

function res(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers: { "content-type": "application/json", ...init.headers } });
}

const fetchMock = vi.fn();

beforeEach(() => {
  clearCache();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("github api", () => {
  it("fetches a user and caches the result", async () => {
    fetchMock.mockResolvedValue(res({ login: "octo" }));
    expect((await getUser("octo")).login).toBe("octo");
    await getUser("OCTO");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.github.com/users/octo");
  });

  it("de-duplicates concurrent identical requests", async () => {
    fetchMock.mockResolvedValue(res({ login: "octo" }));
    await Promise.all([getUser("octo"), getUser("octo"), getUser("octo")]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("maps 404 to not_found", async () => {
    fetchMock.mockResolvedValue(res({ message: "Not Found" }, { status: 404 }));
    await expect(getUser("ghost")).rejects.toMatchObject({ kind: "not_found" });
    expect(describeError(new ApiError("not_found", "x")).title).toBe("User not found");
  });

  it("maps an exhausted quota (403) to rate_limit with a reset time", async () => {
    fetchMock.mockResolvedValue(res({ message: "rate limited" }, { status: 403, headers: { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1893456000", "x-ratelimit-limit": "60" } }));
    await expect(getUser("octo")).rejects.toMatchObject({ kind: "rate_limit", resetAt: 1893456000 });
  });

  it("treats a 403 with quota remaining as a generic http error", async () => {
    fetchMock.mockResolvedValue(res({}, { status: 403, headers: { "x-ratelimit-remaining": "50" } }));
    await expect(getUser("octo")).rejects.toMatchObject({ kind: "http", status: 403 });
  });

  it("maps fetch failures to network errors", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(getUser("octo")).rejects.toMatchObject({ kind: "network" });
  });

  it("does not cache failures", async () => {
    fetchMock.mockResolvedValueOnce(res({}, { status: 500 })).mockResolvedValueOnce(res({ login: "octo" }));
    await expect(getUser("octo")).rejects.toBeInstanceOf(ApiError);
    expect((await getUser("octo")).login).toBe("octo");
  });

  it("paginates repositories until there is no next page", async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => makeRepo({ name: `r${i}` }));
    const page2 = [makeRepo({ name: "last" })];
    fetchMock
      .mockResolvedValueOnce(res(page1, { headers: { link: '<https://api.github.com/x?page=2>; rel="next"' } }))
      .mockResolvedValueOnce(res(page2));
    const repos = await getUserRepos("octo");
    expect(repos).toHaveLength(101);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toContain("page=2");
    expect(fetchMock.mock.calls[0][0]).toContain("per_page=100");
  });

  it("stops after one page when the result is short", async () => {
    fetchMock.mockResolvedValue(res([makeRepo({ name: "only" })]));
    expect(await getUserRepos("octo")).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns an empty list of events for inactive users", async () => {
    fetchMock.mockResolvedValue(res([]));
    expect(await getUserEvents("octo")).toEqual([]);
  });

  it("decodes README content as UTF-8 and returns null when missing", async () => {
    const text = "# Héllo 👋";
    const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(text)));
    expect(decodeBase64Utf8(b64.replace(/(.{10})/g, "$1\n"))).toBe(text);

    fetchMock.mockResolvedValueOnce(res({ content: b64, encoding: "base64" }));
    expect(await getRepoReadme("octo", "alpha")).toBe(text);

    fetchMock.mockResolvedValueOnce(res({}, { status: 404 }));
    expect(await getRepoReadme("octo", "no-readme")).toBeNull();
  });

  it("propagates abort as an aborted error", async () => {
    const err = new DOMException("aborted", "AbortError");
    fetchMock.mockRejectedValue(err);
    await expect(getUser("octo")).rejects.toMatchObject({ kind: "aborted" });
  });
});
