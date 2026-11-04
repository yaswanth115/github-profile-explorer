# GitHub Profile Explorer

A responsive analytics dashboard for any public GitHub profile: profile details, aggregated repository
statistics, a searchable repository browser with README previews, recent public activity, and interactive charts.

Built with React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui-style components, Lucide icons and Recharts.

## Features

- **Profile explorer**: search any username; shareable URLs such as `/?user=torvalds#repositories`.
- **Statistics**: total stars, forks, watchers, open issues, public repos, most-starred repo, top and recently updated repos, top languages.
- **Repository browser**: keyword search, sort (stars, recently updated, name), language filter, detail drawer with rendered README, languages, recent commits, default branch and license.
- **Activity**: push, pull request, issue, star, release and branch events with commit messages and relative times.
- **Analytics**: public-activity heatmap, language donut, top-repositories bar chart (each with a table view).
- **Explore**: suggested profiles, local search history, one-click re-search, clear history.
- **UX**: dark/light theme, sidebar (bottom bar on mobile), loading skeletons, error and empty states, keyboard-friendly search (`/` focuses it), error boundaries, reduced-motion support.

### Known limits (by design)

- **Total contributions** are not shown. The public REST API does not expose a reliable contribution total, so the tile says "Unavailable" instead of guessing.
- The **heatmap** is built from the public events feed only (latest 300 events, last 90 days). The UI says so next to the chart.
- Language charts count each repository's **primary language**; the repository drawer shows the full byte-level breakdown.

## Getting started

Requirements: Node.js 18+ and npm.

```bash
npm install
cp .env.example .env   # optional, see below
npm run dev            # http://localhost:5173
```

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start the dev server                  |
| `npm run build`     | Typecheck and build to `dist/`        |
| `npm run preview`   | Serve the production build locally    |
| `npm run typecheck` | TypeScript check only                 |
| `npm test`          | Run the unit and component test suite |

## Environment variables

| Variable              | Required | Description                                                         |
| --------------------- | -------- | ------------------------------------------------------------------- |
| `VITE_GITHUB_TOKEN`   | No       | Raises the rate limit from 60 to 5,000 requests/hour.               |
| `VITE_GITHUB_API_URL` | No       | API base URL. Defaults to `https://api.github.com`.                 |

**Security:** Vite embeds every `VITE_*` variable in the browser bundle, so anyone who can load the site can read the
token. Use it only for local development, and only with a token that has **no scopes** (public data only). `.env` is
git-ignored. For production with a higher rate limit, run a small server-side proxy that adds the token and set
`VITE_GITHUB_API_URL` to the proxy. Without a token the app works fine; it shows remaining requests in the header and
explains when the limit is hit.

## How it talks to GitHub

All requests go through `src/lib/github.ts`:

| Endpoint                                  | Used for                                            |
| ----------------------------------------- | --------------------------------------------------- |
| `GET /users/{username}`                   | Profile                                             |
| `GET /users/{username}/repos`             | All repos (100 per page, up to 10 pages)            |
| `GET /users/{username}/events/public`     | Activity and heatmap (up to 3 pages)                |
| `GET /repos/{owner}/{repo}`               | Drawer details                                      |
| `GET /repos/{owner}/{repo}/readme`        | README (decoded as UTF-8, rendered and sanitized)   |
| `GET /repos/{owner}/{repo}/languages`     | Drawer language breakdown                           |
| `GET /repos/{owner}/{repo}/commits`       | Drawer recent commits                               |

- **Caching:** in-memory plus `sessionStorage` with TTLs (2 to 30 minutes) and de-duplication of concurrent identical requests. Failures are never cached.
- **Rate limits:** `x-ratelimit-*` headers are tracked and shown; 403 with no quota left, and 429, become a clear "Rate limit reached" message with the reset time.
- **Errors:** invalid usernames are rejected before any request; 404, network failures and other HTTP errors each get their own message with a Retry action. A missing README or unavailable repo detail degrades gracefully.
- **Cancellation:** in-flight requests are aborted when you navigate away.
- README HTML is not enabled, and output is sanitized.

## Project structure

```
src/
  components/
    ui/            button, card, badge, input, skeleton, drawer (shadcn-style)
    charts/        Heatmap, LanguageDonut, StarsChart
    views/         Overview, Repositories, Activity, Analytics, Explore
    ...            Sidebar, SearchBar, ProfileHeader, RepoCard, RepoDrawer, ErrorBoundary
  hooks/           useAsync, useRoute, useTheme, useIsDark, useRateLimit
  lib/             github (API), cache, stats, events, history, format, palette
  types/           GitHub API interfaces
  test/            fixtures and tests
```

## Deployment

The app is a static single-page site (`dist/`), and profile URLs use query strings, so no rewrite rules are needed.

- **Vercel / Netlify / Cloudflare Pages:** build command `npm run build`, output directory `dist`. Set `VITE_*` variables in the project settings only if you accept the token caveat above.
- **GitHub Pages (configured):** `.github/workflows/deploy.yml` runs the tests, builds with `BASE_PATH=/<repo-name>/` and publishes `dist/` on every push to `main`. One-time setup: in the repository go to Settings → Pages and set **Source** to **GitHub Actions**. The site is then served at `https://<user>.github.io/<repo-name>/`. To build for a sub-path locally: `BASE_PATH=/github-profile-explorer/ npm run build`.
- **Any static host:** upload the contents of `dist/`.

## Testing

`npm test` runs 52 tests with Vitest and Testing Library against a mocked `fetch`: pagination, caching, rate limits,
error mapping, README decoding, stats and heatmap math, history, and end-to-end UI flows (search, shareable URLs,
sorting and filtering, drawer and README rendering, activity, analytics, theme toggle).
