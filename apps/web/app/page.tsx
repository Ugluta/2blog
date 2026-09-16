import type { ApiSuccess } from "@2blog/types";

interface HealthStatus {
  status: string;
  timestamp: string;
}

async function getApiHealth(): Promise<HealthStatus | null> {
  const apiUrl = process.env.API_INTERNAL_URL ?? "http://localhost:4000";
  try {
    const res = await fetch(`${apiUrl}/api/v1/health`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    const body = (await res.json()) as ApiSuccess<HealthStatus>;
    return body.data;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const health = await getApiHealth();

  return (
    <main>
      <h1>2blog — Core Platform</h1>
      <p>
        API durumu: {health ? `${health.status} (${health.timestamp})` : "API'ye ulaşılamadı"}
      </p>
    </main>
  );
}
