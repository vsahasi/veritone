import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";
import { SCORE_THRESHOLDS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

export function getScoreColor(score: number): {
  text: string;
  bg: string;
  border: string;
} {
  if (score < SCORE_THRESHOLDS.LOW) {
    return {
      text: "var(--score-low)",
      bg: "var(--score-low-bg)",
      border: "var(--score-low)",
    };
  }
  if (score < SCORE_THRESHOLDS.MID) {
    return {
      text: "var(--score-mid)",
      bg: "var(--score-mid-bg)",
      border: "var(--score-mid)",
    };
  }
  return {
    text: "var(--score-high)",
    bg: "var(--score-high-bg)",
    border: "var(--score-high)",
  };
}

export function getScoreLabel(score: number): string {
  if (score < SCORE_THRESHOLDS.LOW) return "LOW";
  if (score < SCORE_THRESHOLDS.MID) return "MED";
  return "HIGH";
}

export function sentimentToScore(sentiment: string): number {
  const map: Record<string, number> = {
    positive: 0.15,
    neutral: 0.5,
    hedging: 0.65,
    deflecting: 0.75,
    negative: 0.85,
  };
  return map[sentiment] ?? 0.5;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}
