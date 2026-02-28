import { motion } from "framer-motion";
import type { ChatMessage as ChatMessageType, QuerySourceItem } from "../../types";
import { SourceCard } from "./SourceCard";

interface ChatMessageProps {
  message: ChatMessageType;
  onSourceClick: (source: QuerySourceItem) => void;
}

export function ChatMessage({ message, onSourceClick }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className={`max-w-[90%] space-y-2 ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className="text-sm leading-relaxed px-3 py-2.5 rounded-[var(--radius-lg)]"
          style={
            isUser
              ? {
                  background: "var(--accent)",
                  color: "white",
                  borderBottomRightRadius: "var(--radius-sm)",
                }
              : {
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-subtle)",
                  borderBottomLeftRadius: "var(--radius-sm)",
                }
          }
        >
          {message.content}
        </div>

        {message.sources && message.sources.length > 0 && (
          <motion.div
            className="space-y-1.5 w-full"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: { staggerChildren: 0.06, delayChildren: 0.1 },
              },
            }}
          >
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide px-0.5">
              Sources
            </span>
            {message.sources.map((source) => (
              <motion.div
                key={`${source.video_id}-${source.utterance_id}`}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <SourceCard source={source} onClick={onSourceClick} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
