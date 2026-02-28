const SUGGESTIONS = [
  "High divergence moments",
  "Compare speakers",
  "Vocal stress on forward claims",
  "Visual incongruence spikes",
];

interface SuggestedQueriesProps {
  onSelect: (query: string) => void;
}

export function SuggestedQueries({ onSelect }: SuggestedQueriesProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SUGGESTIONS.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
