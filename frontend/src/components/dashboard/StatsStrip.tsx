import type { Video } from "../../types";
import { MetricCard } from "../ui/MetricCard";

interface StatsStripProps {
  videos: Video[];
}

export function StatsStrip({ videos }: StatsStripProps) {
  const totalUtterances = videos.reduce((s, v) => s + v.utterance_count, 0);
  const avgDivergence =
    videos.length > 0
      ? videos.reduce((s, v) => s + v.avg_divergence, 0) / videos.length
      : 0;
  const totalFlags = videos.reduce((s, v) => s + v.high_divergence_count, 0);

  return (
    <div className="grid grid-cols-4 gap-3">
      <MetricCard
        value={videos.length}
        label="Videos Analyzed"
      />
      <MetricCard
        value={totalUtterances}
        label="Utterances"
      />
      <MetricCard
        value={avgDivergence}
        decimals={2}
        label="Avg Divergence"
        color={avgDivergence > 0.6 ? "var(--score-high)" : avgDivergence > 0.3 ? "var(--score-mid)" : "var(--text-primary)"}
      />
      <MetricCard
        value={totalFlags}
        label="High Flags"
        color={totalFlags > 0 ? "var(--score-high)" : undefined}
      />
    </div>
  );
}
