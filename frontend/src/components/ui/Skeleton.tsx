import { cn } from "../../lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton rounded-[var(--radius-md)]", className)}
      style={style}
      aria-hidden="true"
    />
  );
}
