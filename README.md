# Pulseboard — API Monitoring Dashboard

**Phase 1: Foundation** — React 19 + TypeScript + Vite, Express 5 + TypeScript, PostgreSQL + Prisma.

## Prerequisites
- Node.js 20.19+ (Node 22 recommended)
- npm 10+
- Docker Desktop (or an existing PostgreSQL 16 server)

## Run locally
1. Start PostgreSQL: `docker compose up -d db`
2. Copy `apps/api/.env.example` to `apps/api/.env`.
3. Copy `apps/web/.env.example` to `apps/web/.env` (optional; defaults to localhost:4000).
4. Run `npm install` from the repository root.
5. Run `npm run db:generate -w @monitor/api`.
6. Run `npm run db:migrate -w @monitor/api -- --name init`.
7. Run `npm run dev`.
8. Open http://localhost:5173.

The API runs at http://localhost:4000; check http://localhost:4000/api/health.

## What works in Phase 1
- Responsive dashboard with overview cards, services list, and request log table.
- PostgreSQL schema for services and request logs.
- List and create services (with Zod validation).
- Overview counts and average latency based on stored request logs.
- Error states and manual refresh.

## Not implemented yet
- Request ingestion, SDK, and telemetry instrumentation (Phase 2).
- Real time-series charts: the activity bars are a clearly marked visual placeholder.
- Authentication, background health checks, automatic polling, tests, and CI/CD (later phases).
- Service endpoint URL is stored, not fetched by the server in Phase 1.

## API endpoints
- `GET /api/health`
- `GET /api/services`
- `POST /api/services` body: `{ "name": "Payments API", "endpoint": "https://example.com" }`
- `GET /api/overview`

## Build / type check
`npm run typecheck`
`npm run build`

## Project layout
- `apps/web`: React frontend
- `apps/api`: Express backend and Prisma schema
- `docs`: implementation notes
