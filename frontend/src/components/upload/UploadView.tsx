import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { DropZone } from "./DropZone";
import { ProcessingTracker } from "./ProcessingTracker";
import { ingestUrl } from "../../lib/api";
import type { VideoStatus } from "../../types";

const PROCESSING_FLOW: VideoStatus[] = [
  "ingesting",
  "processing_audio",
  "processing_text",
  "processing_video",
  "computing_divergence",
  "embedding",
  "complete",
];

export function UploadView() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<VideoStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setVideoId] = useState<number | null>(null);

  const isProcessing = status !== null && status !== "complete" && status !== "failed";

  const simulateProcessing = async (id: number) => {
    for (const s of PROCESSING_FLOW) {
      setStatus(s);
      await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
    }
    navigate(`/video/${id}`);
  };

  const handleFileSelect = async (_file: File) => {
    setError(null);
    setStatus("ingesting");
    await new Promise((r) => setTimeout(r, 800));
    const mockId = 1;
    setVideoId(mockId);
    simulateProcessing(mockId);
  };

  const handleUrlSubmit = async (url: string) => {
    setError(null);
    setStatus("ingesting");
    try {
      const video = await ingestUrl(url, title || undefined);
      setVideoId(video.id);
      simulateProcessing(video.id);
    } catch {
      setError("Failed to ingest video. Check the URL and try again.");
      setStatus(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="text-[40px] leading-none" style={{ color: "var(--accent)", opacity: 0.7 }}>◆</div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]" style={{ letterSpacing: "-0.025em" }}>
              Analyze a Video
            </h1>
            <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
              Upload a video file or link to an earnings call, congressional hearing, or press conference.
              VeriTone will extract semantic, vocal, and visual signals.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--score-high-bg)] border border-[var(--score-high)] text-sm text-[var(--score-high)]">
              {error}
            </div>
          )}

          {!isProcessing && status !== "complete" ? (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-6">
              <DropZone
                onFileSelect={handleFileSelect}
                onUrlSubmit={handleUrlSubmit}
                title={title}
                onTitleChange={setTitle}
                disabled={isProcessing}
              />
            </div>
          ) : (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-8 flex flex-col items-center gap-6">
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                  {status === "complete" ? "Analysis complete!" : "Processing your video..."}
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {status === "complete"
                    ? "Redirecting to analysis view..."
                    : "Extracting audio, generating transcript, analyzing modalities"}
                </p>
              </div>
              {status && <ProcessingTracker status={status} />}
            </div>
          )}

          {/* Context note */}
          {!isProcessing && status === null && (
            <div className="border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-4 space-y-3">
              <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.05em]">
                Optimized for
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Earnings calls",
                  "Congressional testimony",
                  "Press conferences",
                  "Startup pitch recordings",
                  "Political speeches",
                  "CEO announcements",
                ].map((t) => (
                  <div key={t} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="text-[var(--score-low)] text-[10px]">◆</span>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
