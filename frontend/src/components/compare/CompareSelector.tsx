import type { Video } from "../../types";
import { ChevronDown } from "lucide-react";

interface CompareSelectorProps {
  videos: Video[];
  selectedId: number | null;
  label: string;
  onSelect: (id: number) => void;
}

export function CompareSelector({ videos, selectedId, label, onSelect }: CompareSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.05em]">
        {label}
      </label>
      <div className="relative">
        <select
          value={selectedId ?? ""}
          onChange={(e) => onSelect(parseInt(e.target.value, 10))}
          className="w-full appearance-none bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-2 pr-8 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-accent)] cursor-pointer transition-colors hover:border-[var(--border-muted)]"
        >
          <option value="">Select a video...</option>
          {videos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.title}
            </option>
          ))}
        </select>
        <ChevronDown
          size={13}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
        />
      </div>
    </div>
  );
}
