import { useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  Brush,
} from "recharts";
import type { TimelinePoint } from "../../types";
import { formatTime, getScoreColor } from "../../lib/utils";

interface DivergenceTimelineProps {
  data: TimelinePoint[];
  currentTime: number;
  duration?: number;
  onSeek: (time: number) => void;
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; payload: TimelinePoint }[];
  label?: string | number;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const score = point.divergence_score;
  const colors = getScoreColor(score);

  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border-muted)] rounded-[var(--radius-sm)] px-2.5 py-2 shadow-lg text-xs max-w-[220px]">
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className="font-mono text-[var(--text-tertiary)]">{formatTime(point.time)}</span>
        <span className="font-mono font-semibold" style={{ color: colors.text }}>
          {score.toFixed(2)}
        </span>
      </div>
      <div className="text-[var(--text-secondary)] truncate">{point.speaker_name}</div>
      {point.flag && (
        <div className="mt-1 text-[var(--score-high)] font-medium">⚠ {point.flag}</div>
      )}
    </div>
  );
}

export function DivergenceTimeline({ data, currentTime, onSeek }: DivergenceTimelineProps) {
  const handleChartClick = useCallback(
    (chartData: { activePayload?: { payload: TimelinePoint }[] } | null) => {
      if (chartData?.activePayload?.[0]) {
        onSeek(chartData.activePayload[0].payload.time);
      }
    },
    [onSeek]
  );

  if (data.length === 0) return null;

  return (
    <div className="px-4 pt-3 pb-2 bg-[var(--bg-root)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.05em]">
          Divergence Timeline
        </span>
        <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
          Click to seek · ▲ flag
        </span>
      </div>

      <ResponsiveContainer width="100%" height={130}>
        <AreaChart
          data={data}
          margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          onClick={handleChartClick as any}
          style={{ cursor: "crosshair" }}
        >
          <defs>
            <linearGradient id="divGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--score-high)" stopOpacity={0.7} />
              <stop offset="50%" stopColor="var(--score-mid)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="var(--score-low)" stopOpacity={0.15} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="var(--border-subtle)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="time"
            tickFormatter={formatTime}
            tick={{ fontSize: 10, fill: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 1]}
            tickCount={3}
            tick={{ fontSize: 10, fill: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
            width={24}
          />
          <RechartsTooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "var(--border-muted)", strokeWidth: 1, strokeDasharray: "3 3" }}
          />

          {/* Flag markers */}
          {data
            .filter((p) => p.flag)
            .map((p) => (
              <ReferenceLine
                key={p.time}
                x={p.time}
                stroke="var(--score-high)"
                strokeWidth={1}
                strokeDasharray="2 2"
                strokeOpacity={0.6}
                label={{
                  value: "▲",
                  position: "top",
                  fill: "var(--score-high)",
                  fontSize: 8,
                }}
              />
            ))}

          {/* Playhead */}
          <ReferenceLine
            x={currentTime}
            stroke="var(--accent)"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            style={{ transition: "none" }}
          />

          <Area
            type="monotone"
            dataKey="divergence_score"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth={1.5}
            fill="url(#divGrad)"
            dot={false}
            activeDot={{ r: 3, fill: "white", strokeWidth: 0 }}
            isAnimationActive={false}
          />
          <Brush
            dataKey="time"
            height={20}
            stroke="var(--border-muted)"
            fill="var(--bg-surface)"
            tickFormatter={formatTime}
            travellerWidth={6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
