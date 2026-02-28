import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Clock, Users, MessageSquare } from "lucide-react";
import type { Video } from "../../types";
import { ScoreBadge } from "../ui/ScoreBadge";
import { formatDuration, formatRelativeTime, getScoreColor } from "../../lib/utils";
import { buildTimeline, MOCK_ANALYSES } from "../../lib/mock-data";

interface VideoCardProps {
  video: Video;
}

const STATUS_COLORS: Record<string, string> = {
  complete: "var(--score-low)",
  failed: "var(--score-high)",
};

function statusColor(status: string): string {
  if (status === "complete") return STATUS_COLORS.complete;
  if (status === "failed") return STATUS_COLORS.failed;
  return "var(--score-mid)";
}

function StatusDot({ status }: { status: string }) {
  const color = statusColor(status);
  const isProcessing = status !== "complete" && status !== "failed";
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={isProcessing ? "animate-pulse" : ""}
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
      <span
        className="text-[11px] font-medium uppercase tracking-wide"
        style={{ color }}
      >
        {status === "complete"
          ? "Complete"
          : status === "failed"
          ? "Failed"
          : "Processing"}
      </span>
    </span>
  );
}

export function VideoCard({ video }: VideoCardProps) {
  const navigate = useNavigate();
  const analysis = MOCK_ANALYSES[video.id];
  const timeline = analysis ? buildTimeline(analysis.utterances) : [];
  const sparkData = timeline.map((t) => ({ t: t.time, v: t.divergence_score }));

  const maxColors = getScoreColor(video.max_divergence);

  return (
    <motion.div
      className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-4 cursor-pointer flex flex-col gap-3 overflow-hidden"
      whileHover={{
        y: -1,
        borderColor: "var(--border-muted)",
        boxShadow: "var(--shadow-md)",
      }}
      transition={{ duration: 0.15 }}
      onClick={() => navigate(`/video/${video.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/video/${video.id}`)}
      aria-label={`Analyze ${video.title}`}
    >
      <div className="flex items-start justify-between">
        <StatusDot status={video.status} />
        <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
          {formatRelativeTime(video.created_at)}
        </span>
      </div>

      <div>
        <h3 className="text-base font-semibold text-[var(--text-primary)] leading-snug">
          {video.title}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {formatDuration(video.duration_seconds)}
          </span>
          <span className="text-[var(--text-tertiary)]">·</span>
          <span className="flex items-center gap-1">
            <Users size={11} />
            {video.speaker_count} speaker{video.speaker_count !== 1 ? "s" : ""}
          </span>
          <span className="text-[var(--text-tertiary)]">·</span>
          <span className="flex items-center gap-1">
            <MessageSquare size={11} />
            {video.utterance_count} utterances
          </span>
        </div>
      </div>

      {sparkData.length > 0 && (
        <div
          className="rounded-[var(--radius-sm)] overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-root)]"
          style={{ height: 60 }}
          aria-hidden
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`sparkGrad-${video.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--score-high)" stopOpacity={0.6} />
                  <stop offset="50%" stopColor="var(--score-mid)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--score-low)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke="none"
                fill={`url(#sparkGrad-${video.id})`}
                isAnimationActive={false}
              />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const val = payload[0].value as number;
                  const colors = getScoreColor(val);
                  return (
                    <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-2 py-1 text-xs font-mono" style={{ color: colors.text }}>
                      {val.toFixed(2)}
                    </div>
                  );
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex items-center gap-4 pt-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">Avg</span>
          <ScoreBadge score={video.avg_divergence} />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">Max</span>
          <span
            className="font-mono text-[13px] font-medium tabular-nums"
            style={{ color: maxColors.text }}
          >
            {video.max_divergence.toFixed(2)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">Flags</span>
          <span
            className="font-mono text-[13px] font-medium tabular-nums"
            style={{ color: video.high_divergence_count > 0 ? "var(--score-high)" : "var(--text-secondary)" }}
          >
            {video.high_divergence_count}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
