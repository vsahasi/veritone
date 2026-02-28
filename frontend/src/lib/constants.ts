export const SCORE_THRESHOLDS = {
  LOW: 0.3,
  MID: 0.6,
} as const;

export const MODALITY_COLORS = {
  semantic: "var(--modality-semantic)",
  vocal: "var(--modality-vocal)",
  visual: "var(--modality-visual)",
} as const;

export const SENTIMENT_COLORS: Record<string, string> = {
  positive: "var(--sentiment-positive)",
  negative: "var(--sentiment-negative)",
  neutral: "var(--sentiment-neutral)",
  hedging: "var(--sentiment-hedging)",
  deflecting: "var(--sentiment-deflecting)",
};

export const VOCAL_COLORS: Record<string, string> = {
  confident: "var(--score-low)",
  stressed: "var(--score-high)",
  monotone: "var(--text-tertiary)",
  animated: "var(--accent)",
  hesitant: "var(--score-mid)",
};

export const VISUAL_COLORS: Record<string, string> = {
  congruent: "var(--score-low)",
  incongruent: "var(--score-high)",
  neutral: "var(--text-tertiary)",
};

export const SPEAKER_PALETTE = [
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#06b6d4",
  "#ec4899",
  "#10b981",
];

export const PROCESSING_STAGES = [
  { key: "ingesting", label: "Ingesting" },
  { key: "processing_audio", label: "Audio Processing" },
  { key: "processing_text", label: "Text Analysis" },
  { key: "processing_video", label: "Visual Analysis" },
  { key: "computing_divergence", label: "Divergence" },
  { key: "embedding", label: "Embedding" },
  { key: "complete", label: "Complete" },
] as const;
