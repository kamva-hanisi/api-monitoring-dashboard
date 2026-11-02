# Performance benchmarking worksheet

No performance improvement is claimed until benchmarked.

1. Record the database size and query under test.
2. Run EXPLAIN (ANALYZE, BUFFERS) for the selected query.
3. Record p95 and p99 API latency over the same workload.
4. Apply a justified index or query change.
5. Repeat the benchmark with the same load and environment.
6. Document before/after results, including sample size.

The Prisma RequestLog schema already includes indexes on createdAt
and (serviceId, createdAt). Do not claim an optimization from these
indexes without before/after measurements.
