import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const app = express();
app.use(cors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '32kb' }));

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
      recent
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
