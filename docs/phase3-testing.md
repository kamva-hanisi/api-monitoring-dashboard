# Phase 3 testing and benchmarking

## Tests

Run `npm run typecheck`, `npm test`, and `npm run build` from the repository root.

API HTTP integration tests use Supertest with **mocked Prisma persistence**; they do not verify PostgreSQL itself.

For browser tests, start Docker and the API (`npm run dev` in the root), then:

```bash
npx playwright install chromium
npm run test:e2e -w @monitor/web
```

The browser smoke test checks dashboard rendering. Add real service creation and monitoring journeys before claiming comprehensive E2E coverage.

## Database performance benchmarks

Run this against your **local development database only**, with a repeatable dataset:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM "RequestLog" ORDER BY "createdAt" DESC LIMIT 100;
```

Capture execution time, row count, PostgreSQL version, and index usage. Compare under identical load and dataset conditions before and after any change. **No improvement has been measured or claimed.**

## CI

The GitHub Actions workflow runs type checks, unit/API tests and builds. Browser tests are not part of CI yet; they need an API and database test environment.
