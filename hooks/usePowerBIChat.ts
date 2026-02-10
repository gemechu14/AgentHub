"use client";

import { useState, useCallback } from "react";
import { chatWithPowerBI } from "@/services/powerbiChatService";
import type { ChatMessage, PowerBIChatResponse } from "@/types/powerbi";

interface UsePowerBIChatProps {
  accountId: string;
  agentId: string;
}

export function usePowerBIChat({ accountId, agentId }: UsePowerBIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || loading) return;

      setLoading(true);
      setError(null);

      try {
        const response = await chatWithPowerBI(accountId, agentId, question);

        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          question,
          response,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);
        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to get response from chat";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [accountId, agentId, loading]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
  };
}

