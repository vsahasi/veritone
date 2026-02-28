import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { MOCK_VIDEOS } from "../../lib/mock-data";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const commands = [
  { label: "Dashboard", action: "/", type: "nav" },
  { label: "Compare Videos", action: "/compare", type: "nav" },
  { label: "Upload Video", action: "/upload", type: "nav" },
  ...MOCK_VIDEOS.map((v) => ({
    label: v.title,
    action: `/video/${v.id}`,
    type: "video",
  })),
];

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (action: string) => {
    navigate(action);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-[var(--bg-overlay)] z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <div className="mx-4 bg-[var(--bg-surface)] border border-[var(--border-muted)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)]">
                <Search size={16} className="text-[var(--text-tertiary)]" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search or navigate..."
                  className="flex-1 bg-transparent text-[var(--text-primary)] text-sm placeholder:text-[var(--text-tertiary)] outline-none"
                />
                <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                  <X size={14} />
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto py-1.5">
                {filtered.length === 0 && (
                  <div className="px-4 py-3 text-sm text-[var(--text-tertiary)]">No results</div>
                )}
                {filtered.map((cmd) => (
                  <button
                    key={cmd.action}
                    onClick={() => handleSelect(cmd.action)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] text-left transition-colors"
                  >
                    <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-tertiary)] w-10 shrink-0">
                      {cmd.type}
                    </span>
                    {cmd.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
