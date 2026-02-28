import type { Speaker } from "../../types";

interface SpeakerTabsProps {
  speakers: Speaker[];
  activeSpeakerId: number | null;
  onSelect: (id: number | null) => void;
}

export function SpeakerTabs({ speakers, activeSpeakerId, onSelect }: SpeakerTabsProps) {
  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-[var(--border-subtle)] overflow-x-auto shrink-0">
      <button
        onClick={() => onSelect(null)}
        className="px-3 py-1 rounded-[var(--radius-sm)] text-xs font-medium transition-colors whitespace-nowrap"
        style={{
          background: activeSpeakerId === null ? "var(--accent-muted)" : "transparent",
          color: activeSpeakerId === null ? "var(--accent)" : "var(--text-secondary)",
          border: activeSpeakerId === null ? "1px solid var(--border-accent)" : "1px solid transparent",
        }}
      >
        All Speakers
      </button>
      {speakers.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className="px-3 py-1 rounded-[var(--radius-sm)] text-xs font-medium transition-colors whitespace-nowrap"
          style={{
            background: activeSpeakerId === s.id ? `${s.color}22` : "transparent",
            color: activeSpeakerId === s.id ? s.color : "var(--text-secondary)",
            border: activeSpeakerId === s.id ? `1px solid ${s.color}44` : "1px solid transparent",
          }}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}
