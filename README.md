# Pulseboard — API Monitoring Dashboard

Full-stack React 19 + TypeScript + Express + Prisma + PostgreSQL developer portfolio project.

## Quick start (Windows / Git Bash)

Prerequisites: Node.js 22, npm, Docker Desktop.

1. `docker compose up -d db`
2. `cp apps/api/.env.example apps/api/.env`
3. `npm install`
4. `npm run db:generate -w @monitor/api`
5. `npm run db:migrate -w @monitor/api -- --name init`
6. `npm run dev`
7. Open http://localhost:5173

**Database host port is 5433** to avoid the Windows PostgreSQL port 5432 conflict.
The API remains on port 4000.

Register a service in the dashboard, then select it from
**Track dashboard API requests under**. Refresh to record SDK requests.
The selected service is only a label for dashboard-originated requests,
not proof that an external endpoint is being actively monitored.

## Verification

- `npm run typecheck`
- `npm test`
- `npm run build`
- API: http://localhost:4000/api/health
- Prometheus: http://localhost:4000/metrics

## Implemented in source

- Service registration and persistence
- Request ingestion and dashboard summaries
- Typed TypeScript SDK with timeout, safe-method retries, exponential backoff
- Automatic SDK reporting for dashboard requests (opt-in selection)
- Recent-request latency line chart
- Prometheus instrumentation for backend requests
- Latest-100-request p95 and p99 calculations
- Initial SDK, API utility, and frontend tests
- GitHub Actions typecheck/test/build workflow
- OpenAPI spec and architecture documentation

## Important limitations

This is a development scaffold, not production-ready SaaS. No user authentication,
service-level access control, ingestion keys, retention, or production deployment.
The SDK does not continuously poll third-party endpoints. CI must be confirmed in
GitHub and benchmark claims require measured results.

The monitoring callback does not await reporting; a page closing immediately
after a request can lose the metric. The retry logic retries GET/HEAD/OPTIONS/PUT/DELETE
but not POST. Retry safety still depends on endpoint semantics.

See `docs/architecture.md`, `docs/api.yaml`, and `docs/performance-benchmark.md`.

## Phase 3 additions

- Supertest HTTP endpoint tests with mocked database
- Playwright browser smoke test (run separately)
- Database benchmarking instructions in `docs/phase3-testing.md`
- API entrypoint split into `src/index.ts` (importable app) and `src/server.ts` (listener)

Run `npm install` after extraction. These additions are **not yet validated on your Windows environment**.
