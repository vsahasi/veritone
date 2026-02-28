import { useState } from "react";
import * as api from "../api";

export default function Dashboard() {
  const [videoId, setVideoId] = useState("");
  const [ingestUrl, setIngestUrl] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<api.Awaited<ReturnType<typeof api.getAnalysis>> | null>(null);
  const [timeline, setTimeline] = useState<api.Awaited<ReturnType<typeof api.getTimeline>> | null>(null);
  const [queryText, setQueryText] = useState("");
  const [queryResults, setQueryResults] = useState<api.Awaited<ReturnType<typeof api.query>> | null>(null);

  const clearMessages = () => {
    setError(null);
  };

  const run = async (label: string, fn: () => Promise<unknown>) => {
    setLoading(label);
    setError(null);
    try {
      await fn();
      if (videoId && (label === "Transcribe" || label === "Vocal" || label === "Divergence")) {
        const [a, t] = await Promise.all([api.getAnalysis(videoId), api.getTimeline(videoId)]);
        setAnalysis(a);
        setTimeline(t);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    run("Ingest", async () => {
      const res = await api.ingestFile(file);
      setVideoId(res.video_id);
    });
    e.target.value = "";
  };

  const handleUrlIngest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestUrl.trim()) return;
    run("Ingest URL", async () => {
      const res = await api.ingestUrl(ingestUrl.trim());
      setVideoId(res.video_id);
    });
  };

  const handleQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;
    run("Query", async () => {
      const res = await api.query({
        query: queryText.trim(),
        video_id: videoId || undefined,
        limit: 10,
      });
      setQueryResults(res);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold">VeriTone</h1>
        <p className="text-sm text-slate-500">
          Multimodal credibility analysis — transcript, vocal emotion, divergence timeline
        </p>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-6">
        {error && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800"
            role="alert"
          >
            {error}
            <button
              type="button"
              onClick={clearMessages}
              className="ml-2 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-medium">Ingest video</h2>
          <div className="flex flex-wrap items-end gap-4">
            <label className="cursor-pointer rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
              Upload file
              <input
                type="file"
                accept=".mp4,.webm"
                className="hidden"
                onChange={handleFileUpload}
                disabled={!!loading}
              />
            </label>
            <form onSubmit={handleUrlIngest} className="flex flex-1 items-end gap-2">
              <input
                type="url"
                placeholder="YouTube or video URL"
                className="min-w-[200px] flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
                value={ingestUrl}
                onChange={(e) => setIngestUrl(e.target.value)}
                disabled={!!loading}
              />
              <button
                type="submit"
                className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                disabled={!!loading}
              >
                Ingest URL
              </button>
            </form>
          </div>
          {videoId && (
            <p className="mt-2 text-sm text-slate-600">
              Video ID: <code className="rounded bg-slate-100 px-1">{videoId}</code>
            </p>
          )}
        </section>

        {videoId && (
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-medium">Pipeline</h2>
            <p className="mb-3 text-sm text-slate-500">
              Run in order: Transcribe → Process vocal → Compute divergence
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  run("Transcribe", () => api.transcribe(videoId))
                }
                className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                disabled={!!loading}
              >
                {loading === "Transcribe" ? "Running…" : "Transcribe"}
              </button>
              <button
                type="button"
                onClick={() =>
                  run("Vocal", () => api.processVocal(videoId))
                }
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                disabled={!!loading}
              >
                {loading === "Vocal" ? "Running…" : "Process vocal"}
              </button>
              <button
                type="button"
                onClick={() =>
                  run("Divergence", () => api.computeDivergence(videoId))
                }
                className="rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                disabled={!!loading}
              >
                {loading === "Divergence" ? "Running…" : "Compute divergence"}
              </button>
              <button
                type="button"
                onClick={() =>
                  run("Load", async () => {
                    const [a, t] = await Promise.all([
                      api.getAnalysis(videoId),
                      api.getTimeline(videoId),
                    ]);
                    setAnalysis(a);
                    setTimeline(t);
                  })
                }
                className="rounded border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                disabled={!!loading}
              >
                {loading === "Load" ? "Loading…" : "Refresh analysis"}
              </button>
            </div>
          </section>
        )}

        {(analysis || timeline) && (
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-medium">
              {videoId ? `Analysis & timeline` : "Timeline"}
            </h2>
            {analysis && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-slate-600">Transcript</h3>
                <ul className="mt-1 max-h-60 overflow-y-auto rounded border border-slate-100 bg-slate-50/50 p-2 text-sm">
                  {analysis.utterances.map((u, i) => (
                    <li key={i} className="border-b border-slate-100 py-1 last:border-0">
                      <span className="text-slate-400">
                        [{u.start_ts.toFixed(1)}s–{u.end_ts.toFixed(1)}s]
                      </span>{" "}
                      {u.text}
                      {u.divergence_score != null && u.divergence_score > 0.3 && (
                        <span className="ml-2 rounded bg-amber-100 px-1 text-amber-800">
                          divergence {u.divergence_score.toFixed(2)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {timeline && timeline.entries.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-600">Divergence timeline</h3>
                <p className="text-xs text-slate-500">
                  Duration: {timeline.duration_seconds?.toFixed(1) ?? "—"}s
                </p>
                <div className="mt-1 flex h-12 items-end gap-0.5 overflow-x-auto rounded border border-slate-200 bg-slate-50 p-1">
                  {timeline.entries.map((e, i) => (
                    <div
                      key={i}
                      className="min-w-[4px] flex-1 rounded-sm bg-slate-300"
                      style={{
                        height: `${Math.max(8, (e.divergence_score ?? 0) * 100)}%`,
                        backgroundColor:
                          (e.divergence_score ?? 0) > 0.5
                            ? "#f59e0b"
                            : (e.divergence_score ?? 0) > 0.2
                              ? "#fbbf24"
                              : "#e2e8f0",
                      }}
                      title={`${e.start_ts.toFixed(1)}s: ${e.text.slice(0, 40)}…`}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-medium">Natural language query</h2>
          <p className="mb-2 text-sm text-slate-500">
            Search over transcripts. Use a video ID to limit to one video.
          </p>
          <form onSubmit={handleQuery} className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="e.g. moments about risk or margins"
              className="min-w-[240px] flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              disabled={!!loading}
            />
            <button
              type="submit"
              className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              disabled={!!loading}
            >
              {loading === "Query" ? "Searching…" : "Search"}
            </button>
          </form>
          {queryResults && (
            <ul className="mt-3 max-h-64 overflow-y-auto rounded border border-slate-200 p-2 text-sm">
              {queryResults.results.length === 0 ? (
                <li className="text-slate-500">No results</li>
              ) : (
                queryResults.results.map((r, i) => (
                  <li key={i} className="border-b border-slate-100 py-2 last:border-0">
                    <span className="text-slate-400">
                      [{r.start_ts.toFixed(1)}s] score {r.score.toFixed(2)}
                    </span>{" "}
                    {r.text}
                  </li>
                ))
              )}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
