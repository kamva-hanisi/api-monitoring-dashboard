export type RequestMetrics = {
  method: string; url: string; statusCode: number; durationMs: number;
  success: boolean; timestamp: string;
};
export type MonitoringOptions = {
  onRequest?: (metrics: RequestMetrics) => void | Promise<void>;
  retries?: number; baseDelayMs?: number; timeoutMs?: number;
  fetchImpl?: typeof fetch;
};
export class HttpStatusError extends Error {
  constructor(public readonly statusCode: number) { super(`HTTP ${statusCode}`); this.name = 'HttpStatusError'; }
}
export class MonitoringClient {
  constructor(private readonly options: MonitoringOptions = {}) {}
  async request(url: string, init: RequestInit = {}): Promise<Response> {
    const method = (init.method ?? 'GET').toUpperCase();
    const safeMethod = ['GET','HEAD','OPTIONS','PUT','DELETE'].includes(method);
    const retries = safeMethod ? Math.max(0, this.options.retries ?? 2) : 0;
    const fetcher = this.options.fetchImpl ?? fetch;
    const started = performance.now();
    let statusCode = 0;
    try {
      for (let attempt = 0; ; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 10000);
        const abort = () => controller.abort();
        init.signal?.addEventListener('abort', abort, { once: true });
        try {
          const response = await fetcher(url, { ...init, signal: controller.signal });
          statusCode = response.status;
          if ([429,502,503,504].includes(statusCode) && attempt < retries) {
            await response.body?.cancel();
            await delay((this.options.baseDelayMs ?? 250) * 2 ** attempt);
            continue;
          }
          return response;
        } catch (error) {
          if (attempt >= retries || init.signal?.aborted || controller.signal.aborted) throw error;
          await delay((this.options.baseDelayMs ?? 250) * 2 ** attempt);
        } finally {
          clearTimeout(timeout);
          init.signal?.removeEventListener('abort', abort);
        }
      }
    } finally {
      const metric: RequestMetrics = {
        method, url, statusCode, durationMs: Math.round(performance.now()-started),
        success: statusCode >= 200 && statusCode < 400, timestamp: new Date().toISOString()
      };
      try { void Promise.resolve(this.options.onRequest?.(metric)).catch(console.error); }
      catch (error) { console.error('Metric callback failed', error); }
    }
  }
}
function delay(ms: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, ms)); }
