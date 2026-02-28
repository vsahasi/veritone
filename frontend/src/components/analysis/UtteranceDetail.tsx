import { motion } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";
import type { Utterance } from "../../types";
import { formatTime, getScoreColor } from "../../lib/utils";
import { MODALITY_COLORS, SENTIMENT_COLORS, VOCAL_COLORS, VISUAL_COLORS } from "../../lib/constants";
import { DivergenceRadar } from "./DivergenceRadar";

interface UtteranceDetailProps {
  utterance: Utterance;
  speakerColor: string;
  onClose: () => void;
}

function DetailCard({
  label,
  color,
  rows,
}: {
  label: string;
  color: string;
  rows: { k: string; v: React.ReactNode }[];
}) {
  return (
    <div
      className="flex-1 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden"
      style={{ borderTop: `3px solid ${color}` }}
    >
      <div className="px-3 py-1.5 border-b border-[var(--border-subtle)]">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.08em]"
          style={{ color }}
        >
          {label}
        </span>
      </div>
      <div className="px-3 py-2 space-y-1.5">
        {rows.map(({ k, v }) => (
          <div key={k} className="flex items-center justify-between gap-4">
            <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">{k}</span>
            <span className="font-mono text-[13px] font-medium text-[var(--text-primary)] text-right">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function UtteranceDetail({ utterance: u, speakerColor, onClose }: UtteranceDetailProps) {
  const scoreColors = getScoreColor(u.divergence_score);
  const d = u.divergence_details;

  return (
    <motion.div
      className="border-t border-[var(--border-subtle)] bg-[var(--bg-root)] overflow-hidden"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-medium text-[var(--text-tertiary)]">
                Utterance #{u.index + 1}
              </span>
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{ background: `${speakerColor}22`, color: speakerColor }}
              >
                {u.speaker_name}
              </span>
              <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
                {formatTime(u.start_time)} → {formatTime(u.end_time)}
              </span>
            </div>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">
              "{u.text}"
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] mt-0.5 shrink-0"
            aria-label="Close detail"
          >
            <X size={14} />
          </button>
        </div>

        {/* Modality cards */}
        <div className="flex gap-3">
          <DetailCard
            label="Semantic"
            color={MODALITY_COLORS.semantic}
            rows={[
              { k: "Sentiment", v: <span style={{ color: SENTIMENT_COLORS[u.semantic_sentiment] }}>{u.semantic_sentiment}</span> },
              { k: "Confidence", v: u.semantic_confidence.toFixed(2) },
              { k: "Claim density", v: u.semantic_claim_density.toFixed(2) },
            ]}
          />
          <DetailCard
            label="Vocal"
            color={MODALITY_COLORS.vocal}
            rows={[
              { k: "Affect", v: <span style={{ color: VOCAL_COLORS[u.vocal_affect] }}>{u.vocal_affect}</span> },
              { k: "Stress index", v: u.vocal_stress_index.toFixed(2) },
              { k: "F0 deviation", v: `${u.vocal_f0_deviation > 0 ? "+" : ""}${u.vocal_f0_deviation.toFixed(1)}%` },
              { k: "Speech rate", v: `${Math.round(u.vocal_speech_rate)} wpm` },
              { k: "Pause before", v: `${u.vocal_pause_before.toFixed(1)}s` },
            ]}
          />
          <DetailCard
            label="Visual"
            color={MODALITY_COLORS.visual}
            rows={[
              { k: "Affect", v: <span style={{ color: VISUAL_COLORS[u.visual_affect] }}>{u.visual_affect}</span> },
              { k: "Congruence", v: u.visual_congruence_score.toFixed(2) },
              { k: "Blink rate", v: `${Math.round(u.visual_blink_rate)}/min` },
              { k: "Lip compress.", v: u.visual_lip_compression.toFixed(2) },
              { k: "Gaze deviation", v: `${u.visual_gaze_deviation.toFixed(1)}°` },
            ]}
          />
        </div>

        {/* Divergence bar */}
        <div
          className="rounded-[var(--radius-md)] border px-3 py-2.5 space-y-2"
          style={{
            borderColor: scoreColors.border,
            background: scoreColors.bg,
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wide">Divergence</span>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 rounded-full inline-block"
                  style={{
                    width: 80,
                    background: `linear-gradient(to right, ${scoreColors.text} ${u.divergence_score * 100}%, var(--bg-elevated) ${u.divergence_score * 100}%)`,
                  }}
                />
                <span
                  className="font-mono text-sm font-semibold tabular-nums"
                  style={{ color: scoreColors.text }}
                >
                  {u.divergence_score.toFixed(2)}
                </span>
              </div>
            </div>
            {u.divergence_flag && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--score-high)" }}>
                <AlertTriangle size={12} />
                <span>{u.divergence_flag}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {[
              { label: "Sem↔Voc", val: d.semantic_vocal_distance },
              { label: "Sem↔Vis", val: d.semantic_visual_distance },
              { label: "Voc↔Vis", val: d.vocal_visual_distance },
            ].map(({ label, val }) => {
              const c = getScoreColor(val);
              return (
                <span
                  key={label}
                  className="px-2 py-0.5 rounded text-[11px] font-mono"
                  style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}33` }}
                >
                  {label}: {val.toFixed(2)}
                </span>
              );
            })}
            <div className="ml-auto">
              <DivergenceRadar utterance={u} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
