import { cn } from "../../lib/utils";
import { getScoreColor } from "../../lib/utils";

interface ScoreBadgeProps {
  score: number;
  showBar?: boolean;
  className?: string;
}

export function ScoreBadge({ score, showBar = false, className }: ScoreBadgeProps) {
  const colors = getScoreColor(score);
  const isPulsing = score > 0.7;

  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      {showBar && (
        <span
          className="inline-block h-1 w-10 rounded-full overflow-hidden bg-[var(--bg-elevated)]"
          aria-hidden
        >
          <span
            className="block h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.round(score * 100)}%`,
              backgroundColor: colors.text,
            }}
          />
        </span>
      )}
      <span
        className={cn(
          "font-mono text-[13px] font-medium tabular-nums",
          isPulsing && "animate-pulse_glow rounded"
        )}
        style={{ color: colors.text }}
      >
        {score.toFixed(2)}
      </span>
    </span>
  );
}
