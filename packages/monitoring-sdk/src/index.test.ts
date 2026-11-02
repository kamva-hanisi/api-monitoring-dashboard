import { describe, expect, it, vi } from 'vitest';
import { MonitoringClient } from './index.js';
describe('MonitoringClient', () => {
  it('captures successful request metrics', async () => {
    const onRequest = vi.fn();
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    const client = new MonitoringClient({ onRequest, fetchImpl, retries: 0 });
    await client.request('https://example.com/test');
    expect(onRequest).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 200, success: true, method: 'GET' }));
  });
  it('retries a transient GET error', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(new Response('', { status: 200 }));
    const response = await new MonitoringClient({ fetchImpl, baseDelayMs: 1 }).request('https://example.com');
    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
  it('does not retry POST requests', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('', { status: 503 }));
    await new MonitoringClient({ fetchImpl }).request('https://example.com', { method: 'POST' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
