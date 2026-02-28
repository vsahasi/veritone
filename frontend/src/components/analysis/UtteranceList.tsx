import { useRef, useEffect } from "react";
import type { Analysis, Utterance } from "../../types";
import { UtteranceRow } from "./UtteranceRow";
import { SpeakerTabs } from "./SpeakerTabs";
import { formatDuration } from "../../lib/utils";
import { Clock, Users, CheckSquare } from "lucide-react";

interface UtteranceListProps {
  analysis: Analysis;
  activeSpeakerId: number | null;
  onSpeakerSelect: (id: number | null) => void;
  activeUtteranceIndex: number | null;
  selectedUtterance: Utterance | null;
  onSelectUtterance: (u: Utterance) => void;
  onSeek: (time: number) => void;
}

export function UtteranceList({
  analysis,
  activeSpeakerId,
  onSpeakerSelect,
  activeUtteranceIndex,
  selectedUtterance,
  onSelectUtterance,
  onSeek,
}: UtteranceListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLDivElement>(null);

  const { video, speakers, utterances, summary } = analysis;

  const filtered =
    activeSpeakerId === null
      ? utterances
      : utterances.filter((u) => u.speaker_id === activeSpeakerId);

  const speakerColorMap = Object.fromEntries(speakers.map((s) => [s.id, s.color]));

  useEffect(() => {
    if (activeRowRef.current) {
      activeRowRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeUtteranceIndex]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 shrink-0 border-b border-[var(--border-subtle)]">
        <h2 className="text-base font-semibold text-[var(--text-primary)] truncate" style={{ letterSpacing: "-0.01em" }}>
          {video.title}
        </h2>
        <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {formatDuration(video.duration_seconds)}
          </span>
          <span className="text-[var(--text-tertiary)]">·</span>
          <span className="flex items-center gap-1">
            <Users size={10} />
            {video.speaker_count} speakers
          </span>
          <span className="text-[var(--text-tertiary)]">·</span>
          <span className="flex items-center gap-1">
            <CheckSquare size={10} />
            {Math.round(summary.modality_agreement_rate * 100)}% agreement
          </span>
        </div>
      </div>

      <SpeakerTabs
        speakers={speakers}
        activeSpeakerId={activeSpeakerId}
        onSelect={onSpeakerSelect}
      />

      {/* Mini stats */}
      <div className="grid grid-cols-4 gap-1.5 px-3 py-2 shrink-0 border-b border-[var(--border-subtle)]">
        {[
          { value: summary.total_utterances, label: "Utt." },
          { value: summary.avg_divergence, label: "Avg Divg", decimals: 2 },
          { value: summary.high_divergence_count, label: "Flags", color: summary.high_divergence_count > 0 ? "var(--score-high)" : undefined },
          { value: Math.round(summary.modality_agreement_rate * 100), label: "Agmt%", suffix: "" },
        ].map((m) => (
          <div key={m.label} className="bg-[var(--bg-root)] rounded-[var(--radius-sm)] p-1.5 text-center">
            <div
              className="font-mono text-sm font-semibold tabular-nums"
              style={{ color: m.color ?? "var(--text-primary)" }}
            >
              {m.decimals ? Number(m.value).toFixed(m.decimals) : m.value}
            </div>
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide mt-0.5">
              {m.label}
            </div>
          </div>
        ))}
      </div>

      {/* Utterance list */}
      <div ref={listRef} className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]">
    {filtered.map((u) => {
      const isActive = utterances.indexOf(u) === activeUtteranceIndex;
          return (
            <div
              key={u.id}
              ref={isActive ? activeRowRef : undefined}
            >
              <UtteranceRow
                utterance={u}
                isActive={isActive}
                isSelected={selectedUtterance?.id === u.id}
                speakerColor={speakerColorMap[u.speaker_id] ?? "var(--accent)"}
                onClick={() => {
                  onSelectUtterance(u);
                  onSeek(u.start_time);
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
