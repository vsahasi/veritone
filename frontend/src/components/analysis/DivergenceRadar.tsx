import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import type { Utterance } from "../../types";

interface DivergenceRadarProps {
  utterance: Utterance;
}

export function DivergenceRadar({ utterance }: DivergenceRadarProps) {
  const { divergence_details: d } = utterance;

  const data = [
    { subject: "Sem↔Voc", value: d.semantic_vocal_distance },
    { subject: "Sem↔Vis", value: d.semantic_visual_distance },
    { subject: "Voc↔Vis", value: d.vocal_visual_distance },
  ];

  return (
    <ResponsiveContainer width={120} height={120}>
      <RadarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <PolarGrid stroke="var(--border-subtle)" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: 9, fill: "var(--text-tertiary)" }}
        />
        <Radar
          dataKey="value"
          stroke="var(--score-high)"
          fill="var(--score-high)"
          fillOpacity={0.15}
          strokeWidth={1.5}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
