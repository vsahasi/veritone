import { useState, useCallback } from "react";
import type { ChatMessage } from "../types";
import { postQuery } from "../lib/api";

interface UseRAGQueryReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sendQuery: (question: string, videoIds?: number[]) => Promise<void>;
  clearMessages: () => void;
}

let messageCounter = 0;

export function useRAGQuery(): UseRAGQueryReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendQuery = useCallback(async (question: string, videoIds?: number[]) => {
    const userMsg: ChatMessage = {
      id: `msg-${++messageCounter}`,
      role: "user",
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await postQuery({ question, video_ids: videoIds });
      const assistantMsg: ChatMessage = {
        id: `msg-${++messageCounter}`,
        role: "assistant",
        content: response.answer,
        sources: response.sources,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `msg-${++messageCounter}`,
        role: "assistant",
        content: "Analysis failed. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendQuery, clearMessages };
}
