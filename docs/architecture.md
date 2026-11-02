# Architecture

React browser → TypeScript monitoring SDK → Express API → Prisma → PostgreSQL.

The SDK wraps selected browser requests, retries transient idempotent failures,
and asynchronously reports request timing to POST /api/requests.
Reporting uses ordinary fetch to prevent recursive instrumentation.

GET /metrics exposes Prometheus text metrics for backend traffic.
GET /api/overview returns historical totals, latest 100 request logs, and
p95/p99 values scoped to those 100 logs.

Security: this is a local development demo. Before public hosting, add
authentication, per-service authorization, ingestion credentials, request limits,
HTTPS, a data retention policy, and protect the Prometheus endpoint.
Do not register private or sensitive API URLs without redaction.
