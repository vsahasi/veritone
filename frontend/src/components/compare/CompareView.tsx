import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import type { Analysis } from "../../types";
import { CompareSelector } from "./CompareSelector";
import { MOCK_VIDEOS, MOCK_ANALYSES, buildTimeline } from "../../lib/mock-data";
import { formatTime, getScoreColor } from "../../lib/utils";
import { ScoreBadge } from "../ui/ScoreBadge";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface ComparePanelProps {
  analysis: Analysis | null;
  gradient: string;
}

function ComparePanel({ analysis, gradient }: ComparePanelProps) {
  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2 border border-dashed border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
        <p className="text-sm text-[var(--text-tertiary)]">Select a video above</p>
      </div>
    );
  }

  const { speakers, utterances, summary } = analysis;
  const timeline = buildTimeline(utterances);
  const topUtterances = [...utterances]
    .sort((a, b) => b.divergence_score - a.divergence_score)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Utterances", value: summary.total_utterances },
          { label: "Avg Divg", value: summary.avg_divergence.toFixed(2) },
          { label: "Max", value: summary.max_divergence.toFixed(2) },
          { label: "Flags", value: summary.high_divergence_count },
        ].map((m) => (
          <div key={m.label} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-2.5 text-center">
            <div className="font-mono text-sm font-semibold text-[var(--text-primary)] tabular-nums">{m.value}</div>
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.05em] text-[var(--text-tertiary)] mb-2">
          Divergence Timeline
        </p>
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={timeline} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--score-high)" stopOpacity={0.7} />
                <stop offset="50%" stopColor="var(--score-mid)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--score-low)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeDasharray="3 3" />
            <XAxis dataKey="time" tickFormatter={formatTime} tick={{ fontSize: 9, fill: "var(--text-tertiary)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis domain={[0, 1]} hide />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const val = payload[0].value as number;
                const c = getScoreColor(val);
                return (
                  <div className="bg-[var(--bg-elevated)] border border-[var(--border-muted)] rounded px-2 py-1 text-xs font-mono" style={{ color: c.text }}>
                    {val.toFixed(2)}
                  </div>
                );
              }}
            />
            <Area type="monotone" dataKey="divergence_score" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} fill={`url(#${gradient})`} dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Speakers */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-3 space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.05em] text-[var(--text-tertiary)]">Speakers</p>
        {speakers.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="text-sm text-[var(--text-primary)]">{s.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--text-tertiary)]">{s.utterance_count} utt.</span>
              <ScoreBadge score={s.avg_divergence} />
            </div>
          </div>
        ))}
      </div>

      {/* Top divergent utterances */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-3 space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
          Top Divergent Utterances
        </p>
        {topUtterances.map((u) => {
          const c = getScoreColor(u.divergence_score);
          return (
            <div key={u.id} className="flex gap-2 py-1.5 border-b border-[var(--border-subtle)] last:border-0">
              <span className="font-mono text-[10px] text-[var(--text-tertiary)] w-10 shrink-0 pt-0.5">
                {formatTime(u.start_time)}
              </span>
              <p className="flex-1 text-xs text-[var(--text-secondary)] line-clamp-1">{u.text}</p>
              <span className="font-mono text-xs font-medium shrink-0" style={{ color: c.text }}>
                {u.divergence_score.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DeltaBadgeProps {
  aVal: number;
  bVal: number;
  label: string;
  decimals?: number;
}

function DeltaBadge({ aVal, bVal, label }: DeltaBadgeProps) {
  const diff = bVal - aVal;
  const pct = aVal > 0 ? ((diff / aVal) * 100) : 0;
  const isHigherBad = label !== "Agreement";

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-1">
        {diff === 0 ? (
          <Minus size={12} className="text-[var(--text-tertiary)]" />
        ) : diff > 0 ? (
          <ArrowUp size={12} style={{ color: isHigherBad ? "var(--score-high)" : "var(--score-low)" }} />
        ) : (
          <ArrowDown size={12} style={{ color: isHigherBad ? "var(--score-low)" : "var(--score-high)" }} />
        )}
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {Math.abs(pct).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

export function CompareView() {
  const [leftId, setLeftId] = useState<number | null>(1);
  const [rightId, setRightId] = useState<number | null>(2);

  const leftAnalysis = leftId ? MOCK_ANALYSES[leftId] ?? null : null;
  const rightAnalysis = rightId ? MOCK_ANALYSES[rightId] ?? null : null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]" style={{ letterSpacing: "-0.025em" }}>
            Compare
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Side-by-side analysis of two videos
          </p>
        </div>

        {/* Selectors */}
        <div className="grid grid-cols-2 gap-4">
          <CompareSelector
            videos={MOCK_VIDEOS}
            selectedId={leftId}
            label="Video A"
            onSelect={setLeftId}
          />
          <CompareSelector
            videos={MOCK_VIDEOS}
            selectedId={rightId}
            label="Video B"
            onSelect={setRightId}
          />
        </div>

        {/* Delta strip */}
        {leftAnalysis && rightAnalysis && (
          <div className="flex items-center justify-center gap-8 p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
            <DeltaBadge aVal={leftAnalysis.summary.avg_divergence} bVal={rightAnalysis.summary.avg_divergence} label="Avg Divg" decimals={2} />
            <DeltaBadge aVal={leftAnalysis.summary.max_divergence} bVal={rightAnalysis.summary.max_divergence} label="Max Divg" decimals={2} />
            <DeltaBadge aVal={leftAnalysis.summary.high_divergence_count} bVal={rightAnalysis.summary.high_divergence_count} label="Flags" />
            <DeltaBadge aVal={leftAnalysis.summary.modality_agreement_rate} bVal={rightAnalysis.summary.modality_agreement_rate} label="Agreement" />
          </div>
        )}

        {/* Side by side */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            {leftAnalysis && (
              <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                {leftAnalysis.video.title}
              </h2>
            )}
            <ComparePanel analysis={leftAnalysis} gradient="compareGradLeft" />
          </div>
          <div>
            {rightAnalysis && (
              <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                {rightAnalysis.video.title}
              </h2>
            )}
            <ComparePanel analysis={rightAnalysis} gradient="compareGradRight" />
          </div>
        </div>
      </div>
    </div>
  );
}
