import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface MetricCardProps {
  value: number | string;
  label: string;
  decimals?: number;
  color?: string;
  className?: string;
  suffix?: string;
}

function useCountUp(target: number, duration: number = 400) {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    startRef.current = null;

    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(target * eased);
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return current;
}

export function MetricCard({ value, label, decimals = 0, color, className, suffix }: MetricCardProps) {
  const numericValue = typeof value === "number" ? value : parseFloat(String(value));
  const isNumeric = !isNaN(numericValue);
  const animated = useCountUp(isNumeric ? numericValue : 0);

  const displayValue = isNumeric
    ? decimals > 0
      ? animated.toFixed(decimals)
      : Math.round(animated).toString()
    : value;

  return (
    <div
      className={cn(
        "p-4 rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-muted)] transition-all cursor-default",
        className
      )}
    >
      <div
        className="text-[28px] font-semibold font-mono tabular-nums tracking-tight leading-none"
        style={{ color: color ?? "var(--text-primary)" }}
      >
        {displayValue}
        {suffix && <span className="text-lg ml-0.5">{suffix}</span>}
      </div>
      <div className="mt-1.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.05em]">
        {label}
      </div>
    </div>
  );
}
