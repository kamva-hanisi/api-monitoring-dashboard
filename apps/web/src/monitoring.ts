
import { MonitoringClient } from "@monitor/sdk";

const API =
  import.meta.env.VITE_API_URL ??
  "http://localhost:4000";

// Replace this with your actual service ID
const SERVICE_ID = "PASTE_YOUR_SERVICE_ID";

export const monitoringClient = new MonitoringClient({
  onRequest: (metrics) => {
    const url = new URL(metrics.url);

    void fetch(`${API}/api/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        serviceId: SERVICE_ID,
        method: metrics.method,
        path: url.pathname,
        statusCode: metrics.statusCode,
        durationMs: metrics.durationMs,
      }),
    }).catch((error) => {
      console.error("Failed to report metrics:", error);
    });
  },
});
