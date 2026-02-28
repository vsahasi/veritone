import { useRef, useEffect } from "react";
import type { Utterance } from "../../types";
import { formatTime, getScoreColor } from "../../lib/utils";

interface TranscriptProps {
  utterances: Utterance[];
  speakerColorMap: Record<number, string>;
  activeIndex: number | null;
  selectedId: number | null;
  onUtteranceClick: (u: Utterance) => void;
}

export function Transcript({
  utterances,
  speakerColorMap,
  activeIndex,
  selectedId,
  onUtteranceClick,
}: TranscriptProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIndex]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5"
    >
      {utterances.map((u, idx) => {
        const isActive = idx === activeIndex;
        const isSelected = u.id === selectedId;
        const scoreColors = getScoreColor(u.divergence_score);
        const color = speakerColorMap[u.speaker_id] ?? "var(--accent)";

        return (
          <div
            key={u.id}
            ref={isActive ? activeRef : undefined}
            className="flex gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] cursor-pointer transition-colors"
            style={{
              background: isSelected
                ? "var(--accent-muted)"
                : isActive
                ? "rgba(255,255,255,0.04)"
                : "transparent",
              borderLeft: `2px solid ${isSelected ? "var(--accent)" : isActive ? "var(--border-muted)" : "transparent"}`,
            }}
            onClick={() => onUtteranceClick(u)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onUtteranceClick(u)}
            aria-label={`${u.speaker_name} at ${formatTime(u.start_time)}`}
          >
            <div className="shrink-0 pt-0.5">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full mt-1"
                style={{ backgroundColor: scoreColors.text }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className="text-[10px] font-medium px-1 py-0.5 rounded"
                  style={{ background: `${color}22`, color }}
                >
                  {u.speaker_name.split(" ").slice(-1)[0]}
                </span>
                <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                  {formatTime(u.start_time)}
                </span>
              </div>
              <p
                className="text-xs leading-relaxed"
                style={{
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                }}
              >
                {u.text}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
