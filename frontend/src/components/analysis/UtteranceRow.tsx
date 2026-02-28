import { AlertTriangle } from "lucide-react";
import type { Utterance } from "../../types";
import { formatTime, getScoreColor } from "../../lib/utils";
import { MODALITY_COLORS, SENTIMENT_COLORS, VOCAL_COLORS, VISUAL_COLORS } from "../../lib/constants";

interface UtteranceRowProps {
  utterance: Utterance;
  isActive: boolean;
  isSelected: boolean;
  speakerColor: string;
  onClick: () => void;
}

export function UtteranceRow({ utterance: u, isActive, isSelected, speakerColor, onClick }: UtteranceRowProps) {
  const scoreColors = getScoreColor(u.divergence_score);

  return (
    <div
      className="flex flex-col gap-1.5 px-3 py-2.5 cursor-pointer transition-colors border-l-2"
      style={{
        background: isSelected
          ? "var(--accent-muted)"
          : isActive
          ? "rgba(255,255,255,0.03)"
          : "transparent",
        borderLeftColor: isSelected
          ? "var(--accent)"
          : isActive
          ? "var(--border-muted)"
          : "transparent",
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-[var(--text-tertiary)] tabular-nums w-10 shrink-0">
          {formatTime(u.start_time)}
        </span>
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"
          style={{
            background: `${speakerColor}22`,
            color: speakerColor,
          }}
        >
          {u.speaker_name.split(" ").slice(-1)[0]}
        </span>
        <p className="text-xs text-[var(--text-primary)] truncate flex-1 leading-normal">
          {u.text}
        </p>
        {u.divergence_flag && (
          <AlertTriangle size={11} style={{ color: "var(--score-high)", flexShrink: 0 }} />
        )}
      </div>

      <div className="flex items-center gap-3 pl-12">
        <span className="text-[10px] flex items-center gap-1" style={{ color: SENTIMENT_COLORS[u.semantic_sentiment] ?? "var(--text-tertiary)" }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: MODALITY_COLORS.semantic }} />
          {u.semantic_sentiment}
        </span>
        <span className="text-[10px] flex items-center gap-1" style={{ color: VOCAL_COLORS[u.vocal_affect] ?? "var(--text-tertiary)" }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: MODALITY_COLORS.vocal }} />
          {u.vocal_affect}
        </span>
        <span className="text-[10px] flex items-center gap-1" style={{ color: VISUAL_COLORS[u.visual_affect] ?? "var(--text-tertiary)" }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: MODALITY_COLORS.visual }} />
          {u.visual_affect}
        </span>
        <span className="ml-auto flex items-center gap-1">
          <span
            className="h-1 rounded-full inline-block"
            style={{
              width: 40,
              background: `linear-gradient(to right, ${scoreColors.text} ${u.divergence_score * 100}%, var(--bg-elevated) ${u.divergence_score * 100}%)`,
            }}
          />
          <span className="font-mono text-[11px] tabular-nums" style={{ color: scoreColors.text }}>
            {u.divergence_score.toFixed(2)}
          </span>
        </span>
      </div>
    </div>
  );
}
