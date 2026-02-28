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

// ─── Section header ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-[0.05em] text-[var(--text-tertiary)] mb-2">
      {children}
    </p>
  );
}

// ─── Delta strip ─────────────────────────────────────────────────────────────

interface DeltaBadgeProps {
  aVal: number;
  bVal: number;
  label: string;
  higherIsBad?: boolean;
}

function DeltaBadge({ aVal, bVal, label, higherIsBad = true }: DeltaBadgeProps) {
  const diff = bVal - aVal;
  const pct = aVal > 0 ? Math.abs((diff / aVal) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-1">
        {diff === 0 ? (
          <Minus size={12} className="text-[var(--text-tertiary)]" />
        ) : diff > 0 ? (
          <ArrowUp size={12} style={{ color: higherIsBad ? "var(--score-high)" : "var(--score-low)" }} />
        ) : (
          <ArrowDown size={12} style={{ color: higherIsBad ? "var(--score-low)" : "var(--score-high)" }} />
        )}
        <span className="font-mono text-xs text-[var(--text-secondary)]">{pct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

// ─── Per-side stat cards ──────────────────────────────────────────────────────

function StatCards({ analysis }: { analysis: Analysis | null }) {
  if (!analysis) {
    return (
      <div className="grid grid-cols-4 gap-2 opacity-0 pointer-events-none" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-2.5 h-14" />
        ))}
      </div>
    );
  }

  const { summary } = analysis;
  const items = [
    { label: "Utterances", value: summary.total_utterances },
    { label: "Avg Divg", value: summary.avg_divergence.toFixed(2) },
    { label: "Max", value: summary.max_divergence.toFixed(2) },
    { label: "Flags", value: summary.high_divergence_count },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((m) => (
        <div
          key={m.label}
          className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-2.5 text-center"
        >
          <div className="font-mono text-sm font-semibold text-[var(--text-primary)] tabular-nums">
            {m.value}
          </div>
          <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide mt-0.5">
            {m.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Per-side timeline ────────────────────────────────────────────────────────

function TimelinePanel({ analysis, gradientId }: { analysis: Analysis | null; gradientId: string }) {
  if (!analysis) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-3 h-[148px] opacity-30" />
    );
  }

  const timeline = buildTimeline(analysis.utterances);

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-3">
      <SectionLabel>Divergence Timeline</SectionLabel>
      <ResponsiveContainer width="100%" height={100}>
        <AreaChart data={timeline} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--score-high)" stopOpacity={0.7} />
              <stop offset="50%" stopColor="var(--score-mid)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--score-low)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tickFormatter={formatTime}
            tick={{ fontSize: 9, fill: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis domain={[0, 1]} hide />
          <RechartsTooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const val = payload[0].value as number;
              const c = getScoreColor(val);
              return (
                <div
                  className="bg-[var(--bg-elevated)] border border-[var(--border-muted)] rounded px-2 py-1 text-xs font-mono"
                  style={{ color: c.text }}
                >
                  {val.toFixed(2)}
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="divergence_score"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Per-side speakers ────────────────────────────────────────────────────────

function SpeakersPanel({ analysis }: { analysis: Analysis | null }) {
  const speakers = analysis?.speakers ?? [];

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-3">
      <SectionLabel>Speakers</SectionLabel>
      <div className="space-y-2.5">
        {speakers.length === 0 ? (
          <p className="text-xs text-[var(--text-tertiary)]">—</p>
        ) : (
          speakers.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="text-sm text-[var(--text-primary)] truncate">{s.name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-[var(--text-tertiary)] font-mono">{s.utterance_count} utt.</span>
                <ScoreBadge score={s.avg_divergence} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Per-side top utterances ──────────────────────────────────────────────────

const TOP_N = 5;

function TopUtterancesPanel({ analysis }: { analysis: Analysis | null }) {
  const utterances = analysis
    ? [...analysis.utterances].sort((a, b) => b.divergence_score - a.divergence_score).slice(0, TOP_N)
    : [];

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-3">
      <SectionLabel>Top Divergent Utterances</SectionLabel>
      <div className="space-y-0">
        {utterances.length === 0 ? (
          <p className="text-xs text-[var(--text-tertiary)]">—</p>
        ) : (
          utterances.map((u) => {
            const c = getScoreColor(u.divergence_score);
            return (
              <div
                key={u.id}
                className="flex items-start gap-2 py-2 border-b border-[var(--border-subtle)] last:border-0"
              >
                <span className="font-mono text-[10px] text-[var(--text-tertiary)] w-10 shrink-0 pt-0.5 tabular-nums">
                  {formatTime(u.start_time)}
                </span>
                <p className="flex-1 text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-1 min-w-0">
                  {u.text}
                </p>
                <span
                  className="font-mono text-xs font-semibold shrink-0 tabular-nums"
                  style={{ color: c.text }}
                >
                  {u.divergence_score.toFixed(2)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Placeholder for no selection ────────────────────────────────────────────

function EmptySlot() {
  return (
    <div className="flex flex-col items-center justify-center h-32 border border-dashed border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
      <p className="text-xs text-[var(--text-tertiary)]">Select a video above</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function CompareView() {
  const [leftId, setLeftId] = useState<number | null>(1);
  const [rightId, setRightId] = useState<number | null>(2);

  const left = leftId ? (MOCK_ANALYSES[leftId] ?? null) : null;
  const right = rightId ? (MOCK_ANALYSES[rightId] ?? null) : null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Page header */}
        <div>
          <h1
            className="text-2xl font-semibold text-[var(--text-primary)]"
            style={{ letterSpacing: "-0.025em" }}
          >
            Compare
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Side-by-side analysis of two videos
          </p>
        </div>

        {/* Video selectors */}
        <div className="grid grid-cols-2 gap-4">
          <CompareSelector videos={MOCK_VIDEOS} selectedId={leftId} label="Video A" onSelect={setLeftId} />
          <CompareSelector videos={MOCK_VIDEOS} selectedId={rightId} label="Video B" onSelect={setRightId} />
        </div>

        {/* Delta strip */}
        {left && right && (
          <div className="flex items-center justify-center gap-10 py-3 px-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
            <DeltaBadge aVal={left.summary.avg_divergence} bVal={right.summary.avg_divergence} label="Avg Divg" />
            <DeltaBadge aVal={left.summary.max_divergence} bVal={right.summary.max_divergence} label="Max Divg" />
            <DeltaBadge aVal={left.summary.high_divergence_count} bVal={right.summary.high_divergence_count} label="Flags" />
            <DeltaBadge
              aVal={left.summary.modality_agreement_rate}
              bVal={right.summary.modality_agreement_rate}
              label="Agreement"
              higherIsBad={false}
            />
          </div>
        )}

        {/* Video titles */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            {left && (
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">{left.video.title}</h2>
            )}
          </div>
          <div>
            {right && (
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">{right.video.title}</h2>
            )}
          </div>
        </div>

        {/* ── Row 1: Stats ── */}
        <div className="grid grid-cols-2 gap-6">
          {left ? <StatCards analysis={left} /> : <EmptySlot />}
          {right ? <StatCards analysis={right} /> : <EmptySlot />}
        </div>

        {/* ── Row 2: Timelines ── */}
        <div className="grid grid-cols-2 gap-6">
          <TimelinePanel analysis={left} gradientId="compareGradLeft" />
          <TimelinePanel analysis={right} gradientId="compareGradRight" />
        </div>

        {/* ── Row 3: Speakers ── */}
        <div className="grid grid-cols-2 gap-6 items-start">
          <SpeakersPanel analysis={left} />
          <SpeakersPanel analysis={right} />
        </div>

        {/* ── Row 4: Top divergent utterances ── */}
        <div className="grid grid-cols-2 gap-6 items-start">
          <TopUtterancesPanel analysis={left} />
          <TopUtterancesPanel analysis={right} />
        </div>

      </div>
    </div>
  );
}
