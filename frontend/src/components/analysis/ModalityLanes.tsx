import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { TimelinePoint } from "../../types";
import { MODALITY_COLORS } from "../../lib/constants";

interface ModalityLanesProps {
  data: TimelinePoint[];
  currentTime: number;
  onSeek: (time: number) => void;
}

const LANES = [
  { key: "semantic_score" as const, label: "SEM", color: MODALITY_COLORS.semantic },
  { key: "vocal_score" as const, label: "VOC", color: MODALITY_COLORS.vocal },
  { key: "visual_score" as const, label: "VIS", color: MODALITY_COLORS.visual },
];

export function ModalityLanes({ data, currentTime, onSeek }: ModalityLanesProps) {
  if (data.length === 0) return null;

  return (
    <div className="px-4 pb-3 space-y-0.5">
      {LANES.map(({ key, label, color }) => (
        <div key={key} className="flex items-center gap-2">
          <span
            className="text-[10px] font-semibold uppercase tracking-wide w-8 shrink-0 text-right"
            style={{ color, fontFamily: "var(--font-mono)" }}
          >
            {label}
          </span>
          <div
            className="flex-1 cursor-crosshair"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              const maxTime = data[data.length - 1]?.time ?? 0;
              onSeek(ratio * maxTime);
            }}
          >
            <ResponsiveContainer width="100%" height={24}>
              <LineChart data={data} margin={{ top: 2, right: 4, bottom: 2, left: 0 }}>
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 1]} hide />
                <ReferenceLine
                  x={currentTime}
                  stroke="var(--accent)"
                  strokeWidth={1}
                  strokeDasharray="3 2"
                />
                <Line
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={1.5}
                  dot={false}
                  strokeOpacity={0.8}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}
