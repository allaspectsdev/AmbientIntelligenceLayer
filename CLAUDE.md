# Ambient Intelligence Layer (AIL)

## Project Overview
Full implementation of the Ambient Intelligence Layer whitepaper — an always-on, privacy-respecting AI system that passively observes user computer activity, identifies patterns, coaches users, auto-generates automations, and delegates tasks to AI agents.

Implements all 3 modes: Watch & Coach, Auto-Generate Automations, Progressive Agent Delegation.
Implements all 5 architectural layers: Capture, Pattern Recognition, AI Reasoning, Automation Generation, Agent Orchestration.

## Architecture
- **Monorepo** with npm workspaces (`packages/*`)
- Local-first: all data in SQLite (`data/ail.db`) + filesystem
- Claude API integration is optional (works without API key for local heuristics)
- Privacy-first: exclusion rules filter at capture time — excluded data never hits disk

## Packages (8 total)
- `@ail/common` — Shared types, constants, privacy helpers
- `@ail/storage` — SQLite database layer (better-sqlite3, 18 tables, migration-based schema)
- `@ail/capture` — Background capture daemon (window, keyboard, mouse, clipboard, file system)
- `@ail/analysis` — Pattern detection (7 types), confidence scoring, lifecycle management, Claude coaching + Vision
- `@ail/automation` — Automation generators (AppleScript, Playwright, n8n, API stubs), executor, risk classification
- `@ail/orchestration` — MCP server, agent management, approval gates, encrypted credentials, audit logging
- `@ail/api` — Fastify REST API + WebSocket (port 3333, 30+ endpoints)
- `@ail/dashboard` — React + Vite + Tailwind + Recharts (port 5173, 9 pages)

## Running
```bash
npm run dev          # Start all services concurrently
npm run dev:capture  # Just the capture service
npm run dev:api      # Just the API server
npm run dev:dashboard # Just the dashboard
npm start            # Start all via scripts/start-all.ts
```

## Key Conventions
- ESM modules (`"type": "module"`) throughout
- TypeScript strict mode
- Node16 module resolution
- SQLite with WAL mode for concurrent reads
- Repository pattern for all database access
- Fastify plugin pattern for route registration
- React Query with 10s auto-refetch for dashboard data
- All API routes prefixed with `/api/`
- Dashboard proxies `/api` and `/api/ws` to the Fastify server

## Database Schema (18 tables)
Core: activity_events, screenshots, patterns, suggestions, config, exclusions
Capture: keyboard_events, mouse_events, clipboard_events, file_events
Automation: automations, automation_executions
Orchestration: agents, agent_tasks, approvals, credentials, audit_log
System: _migrations

## Pattern Types
app_sequence, time_sink, tab_switching, keyboard_sequence, clipboard_bridge, file_workflow, compound

## Automation Types
applescript, playwright, n8n, api_stub

## Dashboard Pages
/, /activity, /screenshots, /patterns, /automations, /agents, /approvals, /audit, /settings

## macOS Permissions
- Window tracking uses AppleScript fallback (no special permissions needed)
- Keyboard/mouse tracking requires iohook + Accessibility permissions
- Screenshots require Screen Recording permission
- Clipboard monitoring uses polling (no special permissions)

## Environment Variables
- `ANTHROPIC_API_KEY` — Optional. Enables Claude coaching + Vision analysis
- `DATA_DIR` — Data directory path (default: `./data`)
