import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import client from 'prom-client';
import { percentile } from './percentile.js';

const prisma = new PrismaClient();
const app = express();
const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });
const requestDuration = new client.Histogram({
  name: 'pulseboard_http_request_duration_seconds',
  help: 'HTTP server request duration in seconds',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.005,0.01,0.025,0.05,0.1,0.25,0.5,1,2,5],
  registers: [registry]
});
app.use((req, res, next) => {
  const started = process.hrtime.bigint();
  res.on('finish', () => {
    if (req.path === '/metrics') return;
    const seconds = Number(process.hrtime.bigint() - started) / 1e9;
    requestDuration.observe({
      method: req.method, route: req.route?.path ?? 'unmatched',
      status: String(res.statusCode)
    }, seconds);
  });
  next();
});
app.use(cors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '32kb' }));

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', registry.contentType);
  res.send(await registry.metrics());
});
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.get('/api/services', async (_req, res, next) => {
  try {
    const services = await prisma.service.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(services);
  } catch (err) { next(err); }
});

const serviceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  endpoint: z.string().url().max(500)
});
app.post('/api/services', async (req, res, next) => {
  try {
    const parsed = serviceSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: 'Invalid service', details: parsed.error.flatten() }); return; }
    const service = await prisma.service.create({ data: parsed.data });
    res.status(201).json(service);
  } catch (err) { next(err); }
});

const requestLogSchema = z.object({
  serviceId: z.string().min(1),
  method: z.string().min(1).max(10),
  path: z.string().min(1).max(2048),
  statusCode: z.number().int().min(0).max(599),
  durationMs: z.number().int().min(0).max(3600000),
});
app.post('/api/requests', async (req, res, next) => {
  try {
    const parsed = requestLogSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request metrics', details: parsed.error.flatten() });
      return;
    }
    const service = await prisma.service.findUnique({ where: { id: parsed.data.serviceId } });
    if (!service) { res.status(404).json({ error: 'Service not found' }); return; }
    const log = await prisma.requestLog.create({ data: parsed.data });
    res.status(201).json(log);
  } catch (error) { next(error); }
});

app.get('/api/overview', async (_req, res, next) => {
  try {
    const [services, totalRequests, failedRequests, aggregate, recent] = await Promise.all([
      prisma.service.count(),
      prisma.requestLog.count(),
      prisma.requestLog.count({ where: { statusCode: { gte: 500 } } }),
      prisma.requestLog.aggregate({ _avg: { durationMs: true } }),
      prisma.requestLog.findMany({
        take: 100, orderBy: { createdAt: 'desc' },
        select: { id: true, method: true, path: true, statusCode: true, durationMs: true, createdAt: true, service: { select: { name: true } } }
      })
    ]);
    res.json({
      services, totalRequests, failedRequests,
      errorRate: totalRequests ? Math.round((failedRequests / totalRequests) * 10000) / 100 : 0,
      avgLatencyMs: Math.round(aggregate._avg.durationMs ?? 0),
      recent,
      recentP95Ms: percentile(recent.map(r => r.durationMs), 0.95),
      recentP99Ms: percentile(recent.map(r => r.durationMs), 0.99),
      percentileWindow: 'latest 100 requests'
    });
  } catch (err) { next(err); }
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.PORT ?? 4000);
const server = app.listen(port, () => console.log(`API ready at http://localhost:${port}`));
process.on('SIGTERM', () => server.close(() => prisma.$disconnect()));
