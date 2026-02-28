import { cn } from "../../lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({ children, color, className, style }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] text-xs font-medium whitespace-nowrap",
        className
      )}
      style={{
        backgroundColor: color ? `${color}22` : "var(--bg-elevated)",
        color: color ?? "var(--text-secondary)",
        border: `1px solid ${color ? `${color}44` : "var(--border-subtle)"}`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
