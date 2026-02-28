import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import { NavLink } from "./NavLink";
import { CommandPalette } from "./CommandPalette";

export function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-root)]">
      <nav
        className="flex items-center h-12 px-4 border-b border-[var(--border-subtle)] shrink-0 z-30"
        style={{ background: "var(--bg-root)" }}
      >
        <div className="flex items-center gap-1 mr-6">
          <span
            className="text-[var(--accent)] text-lg leading-none select-none"
            aria-hidden
          >
            ◆
          </span>
          <span
            className="text-[16px] font-semibold text-[var(--text-primary)]"
            style={{ letterSpacing: "-0.02em" }}
          >
            VeriTone
          </span>
        </div>

        <div className="flex items-center h-full gap-0.5">
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/compare">Compare</NavLink>
          <NavLink to="/upload">Upload</NavLink>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2 px-3 h-7 rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-xs text-[var(--text-tertiary)] hover:border-[var(--border-muted)] hover:text-[var(--text-secondary)] transition-colors"
            aria-label="Open command palette"
          >
            <span>Search</span>
            <kbd className="font-mono text-[10px] opacity-60">⌘K</kbd>
          </button>
          <button
            className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
            aria-label="Help and documentation"
          >
            <HelpCircle size={15} />
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
