const BASE = "";

export async function ingestFile(file: File): Promise<{ video_id: string; status: string }> {
  const form = new FormData();
  form.append("file", file);
  const r = await fetch(`${BASE}/api/v1/ingest`, { method: "POST", body: form });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function ingestUrl(url: string): Promise<{ video_id: string; status: string }> {
  const r = await fetch(`${BASE}/api/v1/ingest/url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function transcribe(videoId: string) {
  const r = await fetch(`${BASE}/api/v1/videos/${videoId}/transcribe`, { method: "POST" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function processVocal(videoId: string) {
  const r = await fetch(`${BASE}/api/v1/videos/${videoId}/process-vocal`, { method: "POST" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function computeDivergence(videoId: string) {
  const r = await fetch(`${BASE}/api/v1/videos/${videoId}/compute-divergence`, {
    method: "POST",
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getAnalysis(videoId: string) {
  const r = await fetch(`${BASE}/api/v1/analysis/${videoId}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getTimeline(videoId: string) {
  const r = await fetch(`${BASE}/api/v1/timeline/${videoId}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function query(params: {
  query: string;
  video_id?: string;
  limit?: number;
  rebuild?: boolean;
}) {
  const r = await fetch(`${BASE}/api/v1/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
