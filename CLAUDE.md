# Scotty Command Bridge

Internal mission control dashboard for OpenClaw (AI assistant platform). LCARS (Star Trek) themed Next.js app running locally on port 4000.

## Quick Reference

```bash
npm run dev -- --port 4000       # Dev server
npm run build                    # Production build
npm run lint                     # ESLint
npm rebuild better-sqlite3       # After Node version changes
```

## Environment

**Required**: `.env.local` must set `OPENCLAW_DIR=/Users/openclaw/.openclaw`

If `OPENCLAW_DIR` is missing or wrong, any API route reading `openclaw.json` will return 500. The app reads live data from `/Users/openclaw/.openclaw/openclaw.json` for agents, cron jobs, skills, etc.

See `.env.example` for all available variables.

## Architecture

- **Framework**: Next.js 16 App Router, React 19, TypeScript 5 (strict)
- **Styling**: Tailwind CSS v4, LCARS theme defined in `src/app/globals.css`
- **Database**: better-sqlite3 — SQLite with WAL mode at `data/activities.db`
- **3D Office**: React Three Fiber + Drei (WebGL voxel avatars)
- **Charts**: Recharts
- **Path alias**: `@/` → `./src/`

### Key directories

```
src/app/(dashboard)/   # 25 protected dashboard pages
src/app/api/           # 32 API route handlers
src/components/        # UI components (TenacitOS shell, Office3D, charts)
src/lib/               # Core logic (DB, paths, parsers, usage tracking)
data/                  # SQLite DB + JSON operational data (gitignored)
```

### Data flow

OpenClaw writes to `~/.openclaw/openclaw.json` → API routes read it → frontend renders. Activity data flows through `src/lib/activity-poller.ts` → SQLite → SSE stream at `/api/activities/stream`.

### Authentication

Middleware at `src/middleware.ts` — currently auth is disabled (local network only). Public routes: `/login`, `/api/auth/*`, `/api/health`.

## Conventions

- **Commits**: use `jonguttman@gmail.com` as author email (Vercel requirement)
- **Visual design**: LCARS-inspired chrome on navigation/layout, but content panels should be clean and readable — avoid over-theming inside cards
- **No tests**: No test framework is configured. Manual testing only.
- **Data files**: `data/*.json` and `data/*.db` are gitignored. Only `data/*.example.json` files are tracked.

## Common Issues

| Problem | Fix |
|---------|-----|
| `better-sqlite3` crashes after Node upgrade | `npm rebuild better-sqlite3` |
| API routes return 500 for agent/cron data | Check `OPENCLAW_DIR` in `.env.local` |
| Port conflict on 3000 | Always use `--port 4000` |
| `ALLOWED_DEV_ORIGINS` CORS errors | Set comma-separated origins in `.env.local` |

## Don't

- Don't add test infrastructure unless explicitly asked
- Don't refactor the LCARS CSS theme without discussion — it's intentionally detailed
- Don't commit `.env.local`, `data/*.json`, or `data/*.db` files
- Don't change the dev server binding (it uses `-H 0.0.0.0` for LAN access)
