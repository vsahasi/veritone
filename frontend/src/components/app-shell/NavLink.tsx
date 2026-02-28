import { NavLink as RouterNavLink } from "react-router-dom";
import { cn } from "../../lib/utils";

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
}

export function NavLink({ to, children }: NavLinkProps) {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "relative px-3 h-full inline-flex items-center text-sm font-medium transition-colors",
          "hover:text-[var(--text-primary)]",
          isActive
            ? "text-[var(--text-primary)]"
            : "text-[var(--text-secondary)]"
        )
      }
    >
      {({ isActive }) => (
        <>
          {children}
          {isActive && (
            <span
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)] rounded-t-sm"
              style={{ animation: "none" }}
            />
          )}
        </>
      )}
    </RouterNavLink>
  );
}
