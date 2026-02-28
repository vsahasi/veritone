import type { Video, Analysis, TimelinePoint, QueryRequest, QueryResponse } from "../types";
import {
  MOCK_VIDEOS,
  MOCK_ANALYSES,
  buildTimeline,
  MOCK_QUERY_RESPONSES,
} from "./mock-data";

const USE_MOCK = true;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchVideos(): Promise<Video[]> {
  if (USE_MOCK) {
    await sleep(400);
    return MOCK_VIDEOS;
  }
  const res = await fetch("/api/v1/videos");
  if (!res.ok) throw new Error("Failed to fetch videos");
  return res.json();
}

export async function fetchAnalysis(videoId: number): Promise<Analysis> {
  if (USE_MOCK) {
    await sleep(600);
    const analysis = MOCK_ANALYSES[videoId];
    if (!analysis) throw new Error(`No analysis found for video ${videoId}`);
    return analysis;
  }
  const res = await fetch(`/api/v1/analysis/${videoId}`);
  if (!res.ok) throw new Error("Failed to fetch analysis");
  return res.json();
}

export async function fetchTimeline(videoId: number): Promise<TimelinePoint[]> {
  if (USE_MOCK) {
    await sleep(300);
    const analysis = MOCK_ANALYSES[videoId];
    if (!analysis) throw new Error(`No analysis found for video ${videoId}`);
    return buildTimeline(analysis.utterances);
  }
  const res = await fetch(`/api/v1/timeline/${videoId}`);
  if (!res.ok) throw new Error("Failed to fetch timeline");
  return res.json();
}

export async function postQuery(req: QueryRequest): Promise<QueryResponse> {
  if (USE_MOCK) {
    await sleep(1200);
    const q = req.question.toLowerCase();
    if (q.includes("stress") || q.includes("vocal")) return MOCK_QUERY_RESPONSES.stress;
    if (q.includes("speaker") || q.includes("compare")) return MOCK_QUERY_RESPONSES.speakers;
    if (q.includes("visual") || q.includes("incongruence")) return MOCK_QUERY_RESPONSES.visual;
    return MOCK_QUERY_RESPONSES.default;
  }
  const res = await fetch("/api/v1/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error("Query failed");
  return res.json();
}

export async function ingestUrl(url: string, title?: string): Promise<Video> {
  if (USE_MOCK) {
    await sleep(800);
    return {
      ...MOCK_VIDEOS[0],
      id: Date.now(),
      title: title ?? "New Video",
      source_url: url,
      status: "ingesting",
      created_at: new Date().toISOString(),
    };
  }
  const res = await fetch("/api/v1/videos/ingest-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, title }),
  });
  if (!res.ok) throw new Error("Ingest failed");
  return res.json();
}
