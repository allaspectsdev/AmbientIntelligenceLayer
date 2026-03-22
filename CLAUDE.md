# Ambient Intelligence Layer (AIL)

## Project Overview
A TypeScript MVP implementing Mode 1 (Watch & Coach) of the Ambient Intelligence Layer — an always-on, privacy-respecting system that passively observes user computer activity, identifies patterns, and provides coaching suggestions.

## Architecture
- **Monorepo** with npm workspaces (`packages/*`)
- Local-first: all data in SQLite (`data/ail.db`) + filesystem
- Claude API integration is optional (works without API key)

## Packages
- `@ail/common` — Shared types, constants, privacy helpers
- `@ail/storage` — SQLite database layer (better-sqlite3)
- `@ail/capture` — Background capture daemon (active window + screenshots)
- `@ail/analysis` — Pattern detection + optional Claude coaching
- `@ail/api` — Fastify REST API (port 3333)
- `@ail/dashboard` — React + Vite + Tailwind + Recharts (port 5173)

## Running
```bash
npm run dev          # Start all services (capture, api, analysis, dashboard)
npm run dev:capture  # Just the capture service
npm run dev:api      # Just the API server
npm run dev:dashboard # Just the dashboard
npm start            # Start all via scripts/start-all.ts
```

## Key Conventions
- ESM modules (`"type": "module"`) throughout
- TypeScript strict mode
- SQLite with WAL mode for concurrent reads
- Privacy exclusions filter at capture time — excluded data never hits disk
- All API routes prefixed with `/api/`
- Dashboard proxies `/api` to the Fastify server

## macOS Permissions
- Window tracking uses AppleScript fallback (no special permissions needed)
- For enhanced tracking (URLs, etc.), grant Screen Recording permission to Terminal
- Screenshots require Screen Recording permission

## Environment Variables
- `ANTHROPIC_API_KEY` — Optional. Enables Claude-powered coaching suggestions
- `DATA_DIR` — Data directory path (default: `./data`)
