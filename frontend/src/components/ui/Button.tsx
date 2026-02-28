import { forwardRef } from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-[var(--radius-md)] transition-all duration-[var(--transition-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-root)] disabled:opacity-40 disabled:pointer-events-none select-none",
          {
            "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-[0.99]":
              variant === "primary",
            "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-muted)] hover:bg-[var(--bg-elevated)] active:scale-[0.99]":
              variant === "secondary",
            "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] active:scale-[0.99]":
              variant === "ghost",
            "bg-[var(--score-high-bg)] text-[var(--score-high)] border border-[var(--score-high)] hover:bg-[var(--score-high)] hover:text-white active:scale-[0.99]":
              variant === "danger",
          },
          {
            "text-xs px-2.5 h-7 gap-1.5": size === "sm",
            "text-sm px-3.5 h-9 gap-2": size === "md",
            "text-sm px-5 h-11 gap-2": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
