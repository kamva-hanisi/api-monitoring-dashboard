import { MonitoringClient } from '@monitor/sdk';
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
export function createMonitoringClient(serviceId: string) {
  return new MonitoringClient({
    retries: 2, timeoutMs: 10000,
    onRequest: async metrics => {
      // Never use the monitoring client to report metrics: that would recursively log itself.
      try {
        const response = await fetch(`${API}/api/requests`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId, method: metrics.method, path: new URL(metrics.url).pathname,
            statusCode: metrics.statusCode, durationMs: metrics.durationMs
          })
        });
        if (!response.ok) console.warn('Metric reporting rejected', response.status);
      } catch (error) { console.warn('Metric reporting unavailable', error); }
    }
  });
}
