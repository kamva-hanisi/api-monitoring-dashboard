import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
const { prismaMock } = vi.hoisted(() => ({ prismaMock: {
  service: { findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
  requestLog: { create: vi.fn(), count: vi.fn(), aggregate: vi.fn(), findMany: vi.fn() }
} }));
vi.mock('@prisma/client', () => ({ PrismaClient: vi.fn(function () { return prismaMock; }) }));
import { app } from './index.js';
beforeEach(() => vi.clearAllMocks());
describe('API HTTP integration (mocked persistence)', () => {
  it('returns healthy response', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
  it('rejects malformed service input', async () => {
    const response = await request(app).post('/api/services').send({ name: 'x', endpoint: 'invalid' });
    expect(response.status).toBe(400);
    expect(prismaMock.service.create).not.toHaveBeenCalled();
  });
  it('creates a valid service', async () => {
    prismaMock.service.create.mockResolvedValue({ id: 'svc1', name: 'Payments', endpoint: 'https://example.com' });
    const response = await request(app).post('/api/services').send({ name: 'Payments', endpoint: 'https://example.com' });
    expect(response.status).toBe(201);
    expect(response.body.id).toBe('svc1');
  });
  it('rejects invalid request metrics', async () => {
    const response = await request(app).post('/api/requests').send({ statusCode: 999 });
    expect(response.status).toBe(400);
  });
  it('returns 404 for an unknown service', async () => {
    prismaMock.service.findUnique.mockResolvedValue(null);
    const response = await request(app).post('/api/requests').send({ serviceId: 'missing', method: 'GET', path: '/health', statusCode: 200, durationMs: 10 });
    expect(response.status).toBe(404);
  });
  it('persists valid request metrics', async () => {
    prismaMock.service.findUnique.mockResolvedValue({ id: 'svc1' });
    prismaMock.requestLog.create.mockResolvedValue({ id: 'log1', serviceId: 'svc1' });
    const response = await request(app).post('/api/requests').send({ serviceId: 'svc1', method: 'GET', path: '/health', statusCode: 200, durationMs: 10 });
    expect(response.status).toBe(201);
    expect(prismaMock.requestLog.create).toHaveBeenCalledOnce();
  });
});
