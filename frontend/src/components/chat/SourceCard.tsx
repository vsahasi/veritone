import type { QuerySourceItem } from "../../types";
import { formatTime, getScoreColor } from "../../lib/utils";
import { Target } from "lucide-react";

interface SourceCardProps {
  source: QuerySourceItem;
  onClick: (source: QuerySourceItem) => void;
}

export function SourceCard({ source, onClick }: SourceCardProps) {
  const colors = getScoreColor(source.divergence_score);

  return (
    <div
      className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] p-2.5 cursor-pointer hover:border-[var(--border-muted)] transition-colors"
      onClick={() => onClick(source)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(source)}
      aria-label={`Go to ${source.speaker_name} at ${formatTime(source.start_time)}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
          <Target size={10} style={{ color: "var(--accent)" }} />
          <span className="font-mono">{formatTime(source.start_time)}</span>
          <span>·</span>
          <span className="text-[var(--text-secondary)]">{source.speaker_name}</span>
        </div>
        <span
          className="font-mono text-[11px] font-medium"
          style={{ color: colors.text }}
        >
          {source.divergence_score.toFixed(2)}
        </span>
      </div>
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        "{source.text}"
      </p>
    </div>
  );
}
