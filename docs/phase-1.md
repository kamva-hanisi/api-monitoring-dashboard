# Phase 1 architecture and acceptance criteria

Browser (React/Vite) -> HTTP JSON -> Express -> Prisma -> PostgreSQL

This is a single-tenant development scaffold. Do not deploy it publicly without authentication,
authorization, rate limiting, and production configuration.

Acceptance checklist:
- [ ] Docker database healthy
- [ ] Prisma migration applied
- [ ] API health endpoint returns status ok
- [ ] Dashboard loads with zero-state cards
- [ ] Adding a valid service persists after refresh
- [ ] Invalid service input returns HTTP 400
- [ ] Frontend and backend pass TypeScript checks

Phase 2: Add request ingestion and a typed SDK, metrics collection, true request charts,
and explicit monitoring windows. Existing totals currently cover all stored logs.
