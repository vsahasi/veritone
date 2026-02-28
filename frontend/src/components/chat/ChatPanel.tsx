import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, ChevronRight } from "lucide-react";
import type { QuerySourceItem } from "../../types";
import { useRAGQuery } from "../../hooks/useRAGQuery";
import { ChatMessage } from "./ChatMessage";
import { SuggestedQueries } from "./SuggestedQueries";

interface ChatPanelProps {
  videoId?: number;
  isCollapsed: boolean;
  onToggle: () => void;
  onSourceClick: (source: QuerySourceItem) => void;
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div
        className="flex items-center gap-1 px-3 py-2.5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)]"
        style={{ background: "var(--bg-surface)", borderBottomLeftRadius: "var(--radius-sm)" }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)]"
            style={{
              animation: `bounce_dot 1.2s ease-in-out ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function ChatPanel({ videoId, isCollapsed, onToggle, onSourceClick }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const { messages, isLoading, sendQuery } = useRAGQuery();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const q = input.trim();
    setInput("");
    await sendQuery(q, videoId ? [videoId] : undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="flex flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0 transition-all"
      style={{ width: isCollapsed ? 40 : 320 }}
    >
      {isCollapsed ? (
        <div className="flex flex-col items-center py-4 gap-4">
          <button
            onClick={onToggle}
            className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
            aria-label="Expand chat panel"
          >
            <ChevronRight size={14} />
          </button>
          <span
            className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.1em]"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Ask VeriTone
          </span>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key="expanded"
            className="flex flex-col h-full overflow-hidden"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--border-subtle)] shrink-0">
              <div className="flex items-center gap-1.5">
                <Sparkles size={13} style={{ color: "var(--accent)" }} />
                <span className="text-sm font-medium text-[var(--text-primary)]">Ask VeriTone</span>
              </div>
              <button
                onClick={onToggle}
                className="w-6 h-6 flex items-center justify-center rounded text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
                aria-label="Collapse chat panel"
              >
                <ChevronRight size={13} className="rotate-180" />
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                    Ask questions about the credibility analysis. I'll cite specific moments in the transcript.
                  </p>
                  <SuggestedQueries onSelect={(q) => { setInput(q); }} />
                </div>
              ) : (
                messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    onSourceClick={onSourceClick}
                  />
                ))
              )}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[var(--border-subtle)] shrink-0 space-y-2">
              <p className="text-[10px] text-[var(--text-tertiary)]">
                Analyzing{" "}
                <span className="text-[var(--text-secondary)]">
                  {videoId ? "1 video" : "all videos"}
                </span>
              </p>
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question..."
                  className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--border-accent)] transition-colors"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Send message"
                >
                  <Send size={13} className="text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
