import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { clearCache } from "@/lib/cache";
import { EVENTS, REPOS, USER } from "./fixtures";

const README = "# Alpha readme\n\nSome **bold** text.\n\n<script>alert(1)</script>";
const b64 = btoa(README);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "x-ratelimit-limit": "60", "x-ratelimit-remaining": "55", "x-ratelimit-reset": "1893456000" },
  });
}

function route(url: string): Response {
  const { pathname } = new URL(url);
  if (pathname === "/users/octo") return json(USER);
  if (pathname === "/users/octo/repos") return json(REPOS);
  if (pathname === "/users/octo/events/public") return json(EVENTS);
  if (pathname === "/users/ghost") return json({ message: "Not Found" }, 404);
  if (pathname === "/repos/octo/alpha") return json(REPOS[0]);
  if (pathname === "/repos/octo/alpha/readme") return json({ content: b64, encoding: "base64" });
  if (pathname === "/repos/octo/alpha/languages") return json({ TypeScript: 9000, CSS: 1000 });
  if (pathname === "/repos/octo/alpha/commits") return json([{ sha: "abc", html_url: "https://x", commit: { message: "Initial commit", author: { name: "o", date: "2026-01-01T00:00:00Z" } } }]);
  return json({ message: "Not Found" }, 404);
}

beforeEach(() => {
  clearCache();
  window.history.replaceState({}, "", "/");
  vi.stubGlobal("fetch", vi.fn(async (url: string) => route(url)));
  // jsdom lacks ResizeObserver, which Recharts uses.
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});

describe("App", () => {
  it("shows the explore page with suggested profiles and empty history", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /explore github profiles/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /@torvalds/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /dan_abramov/ })).not.toBeInTheDocument();
    expect(screen.getByText(/no searches yet/i)).toBeInTheDocument();
  });

  it("loads a profile from a shareable ?user= URL and shows the dashboard", async () => {
    window.history.replaceState({}, "", "/?user=octo");
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Octo Cat" })).toBeInTheDocument();
    expect(screen.getByText("Testing things.")).toBeInTheDocument();
    expect(screen.getByText("@octocat")).toBeInTheDocument();
    expect(await screen.findByText("Total stars")).toBeInTheDocument();
    expect(screen.getAllByText("260")).toHaveLength(2); // total stars and total watchers
    expect(screen.getByText("Unavailable")).toBeInTheDocument(); // contributions not reliable
    expect(screen.getByText("Most-starred repository")).toBeInTheDocument();
  });

  it("searches via the form and records history", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText(/search github username/i), "octo{enter}");
    expect(await screen.findByRole("heading", { name: "Octo Cat" })).toBeInTheDocument();
    expect(window.location.search).toBe("?user=octo");
    expect(JSON.parse(localStorage.getItem("gpe:history")!)).toEqual(["octo"]);
  });

  it("rejects invalid usernames without calling the API", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText(/search github username/i), "dan_abramov{enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent(/letters, numbers/i);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows a not-found error for unknown users", async () => {
    window.history.replaceState({}, "", "/?user=ghost");
    render(<App />);
    expect(await screen.findByText("User not found")).toBeInTheDocument();
  });

  it("shows a network error with retry", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("offline"); }));
    window.history.replaceState({}, "", "/?user=octo");
    render(<App />);
    expect(await screen.findByText("Network problem")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("browses, searches, filters and sorts repositories", async () => {
    window.history.replaceState({}, "", "/?user=octo#repositories");
    render(<App />);
    await screen.findByText("Showing 3 of 3 repositories");

    const cards = () => screen.getAllByRole("button", { name: /^Open details for/ }).map((b) => b.getAttribute("aria-label")!.replace("Open details for ", ""));
    expect(cards()).toEqual(["Beta", "alpha", "gamma"]); // recently updated

    fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "stars" } });
    expect(cards()).toEqual(["gamma", "alpha", "Beta"]);
    fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "name" } });
    expect(cards()).toEqual(["alpha", "Beta", "gamma"]);

    fireEvent.change(screen.getByLabelText("Language"), { target: { value: "Python" } });
    expect(cards()).toEqual(["Beta"]);
    fireEvent.change(screen.getByLabelText("Language"), { target: { value: "" } });

    fireEvent.change(screen.getByLabelText("Search repositories"), { target: { value: "nothing-matches" } });
    expect(screen.getByText("No matching repositories")).toBeInTheDocument();
  });

  it("opens the repository drawer with a sanitized, rendered README", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/?user=octo#repositories");
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Open details for alpha" }));

    const dialog = await screen.findByRole("dialog", { name: "alpha" });
    expect(await within(dialog).findByRole("heading", { name: "Alpha readme" })).toBeInTheDocument();
    expect(within(dialog).getByText("bold").tagName).toBe("STRONG");
    expect(dialog.querySelector("script")).toBeNull();
    expect(within(dialog).getByText("main")).toBeInTheDocument(); // default branch
    expect(within(dialog).getByText("None specified")).toBeInTheDocument(); // license
    expect(await within(dialog).findByText("Initial commit")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("renders recent activity and an empty state", async () => {
    window.history.replaceState({}, "", "/?user=octo#activity");
    render(<App />);
    expect(await screen.findByText("Pushed 2 commits to main")).toBeInTheDocument();
    expect(screen.getByText("Fix bug")).toBeInTheDocument();
    expect(screen.getByText("Merged pull request #7: Improve docs")).toBeInTheDocument();
  });

  it("shows the activity empty state when there are no events", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => (new URL(url).pathname.endsWith("/events/public") ? json([]) : route(url))));
    window.history.replaceState({}, "", "/?user=octo#activity");
    render(<App />);
    expect(await screen.findByText("No recent public activity")).toBeInTheDocument();
  });

  it("renders analytics with the heatmap disclaimer, language legend and stars table", async () => {
    window.history.replaceState({}, "", "/?user=octo#analytics");
    render(<App />);
    expect(await screen.findByText(/not a complete picture/i)).toBeInTheDocument();
    const legend = await screen.findByRole("list", { name: "Language legend" });
    expect(within(legend).getByText(/2 repos · 66.7%/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Public activity heatmap/ })).toBeInTheDocument();
  });

  it("toggles the dark theme and persists it", async () => {
    const user = userEvent.setup();
    render(<App />);
    const before = document.documentElement.classList.contains("dark");
    await user.click(screen.getByRole("button", { name: /switch to (dark|light) theme/i }));
    expect(document.documentElement.classList.contains("dark")).toBe(!before);
    expect(localStorage.getItem("gpe:theme")).toBe(before ? "light" : "dark");
  });

  it("re-searches from history and clears it", async () => {
    const user = userEvent.setup();
    localStorage.setItem("gpe:history", JSON.stringify(["octo"]));
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Clear history" }));
    expect(screen.getByText(/no searches yet/i)).toBeInTheDocument();
    expect(localStorage.getItem("gpe:history")).toBeNull();

    localStorage.setItem("gpe:history", JSON.stringify(["octo"]));
    window.history.replaceState({}, "", "/");
    render(<App />);
    const chips = screen.getAllByRole("button", { name: /^@octo$/ });
    await user.click(chips[chips.length - 1]);
    expect(await screen.findAllByRole("heading", { name: "Octo Cat" })).not.toHaveLength(0);
  });
});
