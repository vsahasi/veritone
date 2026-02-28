import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { PROCESSING_STAGES } from "../../lib/constants";
import type { VideoStatus } from "../../types";

const STAGE_KEYS = PROCESSING_STAGES.map((s) => s.key);

function getStageIndex(status: VideoStatus): number {
  return STAGE_KEYS.indexOf(status as (typeof STAGE_KEYS)[number]);
}

interface ProcessingTrackerProps {
  status: VideoStatus;
}

export function ProcessingTracker({ status }: ProcessingTrackerProps) {
  const currentIndex = getStageIndex(status);

  return (
    <div className="flex items-center gap-0">
      {PROCESSING_STAGES.map((stage, i) => {
        const isDone = currentIndex > i;
        const isCurrent = currentIndex === i;

        return (
          <div key={stage.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  background: isDone
                    ? "var(--score-low-bg)"
                    : isCurrent
                    ? "var(--accent-muted)"
                    : "var(--bg-elevated)",
                  border: `1.5px solid ${isDone ? "var(--score-low)" : isCurrent ? "var(--accent)" : "var(--border-muted)"}`,
                }}
              >
                {isDone ? (
                  <Check size={11} style={{ color: "var(--score-low)" }} />
                ) : isCurrent ? (
                  <motion.span
                    className="w-2 h-2 rounded-full bg-[var(--accent)]"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                ) : (
                  <span className="w-2 h-2 rounded-full" style={{ background: "var(--border-muted)" }} />
                )}
              </div>
              <span
                className="text-[10px] font-medium whitespace-nowrap"
                style={{
                  color: isDone
                    ? "var(--score-low)"
                    : isCurrent
                    ? "var(--accent)"
                    : "var(--text-tertiary)",
                }}
              >
                {stage.label}
              </span>
            </div>

            {i < PROCESSING_STAGES.length - 1 && (
              <div
                className="h-[1.5px] w-8 mb-5 mx-1 transition-colors"
                style={{
                  background: isDone
                    ? "var(--score-low)"
                    : "var(--border-subtle)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
