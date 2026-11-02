
export interface RequestMetrics {
  method: string;
  url: string;
  statusCode: number;
  durationMs: number;
  success: boolean;
  timestamp: string;
}

export interface MonitoringClientOptions {
  onRequest?: (metrics: RequestMetrics) => void;
}

export class MonitoringClient {
  constructor(
    private readonly options: MonitoringClientOptions = {}
  ) {}

  async request(
    url: string,
    init: RequestInit = {}
  ): Promise<Response> {
    const method = (init.method ?? "GET").toUpperCase();
    const start = performance.now();

    let statusCode = 0;

    try {
      const response = await fetch(url, init);
      statusCode = response.status;

      return response;
    } finally {
      const durationMs = Math.round(
        performance.now() - start
      );

      const metrics: RequestMetrics = {
        method,
        url,
        statusCode,
        durationMs,
        success: statusCode >= 200 && statusCode < 400,
        timestamp: new Date().toISOString(),
      };

      this.options.onRequest?.(metrics);
    }
  }
}
