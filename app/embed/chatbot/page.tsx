"use client";

import { useEffect, useState, useRef } from "react";
import { Send, X, Lightbulb, ChevronUp } from "lucide-react";
import { validateEmbedToken } from "@/services/embedService";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export default function EmbedChatbotPage() {
  const [token, setToken] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRecommended, setShowRecommended] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Extract token from URL hash
    const hash = window.location.hash.substring(1);
    if (hash) {
      setToken(hash);
      validateToken(hash);
    } else {
      setError("No token found in URL");
      setIsValidating(false);
    }
  }, []);

  const validateToken = async (tokenValue: string) => {
    try {
      setIsValidating(true);
      const data = await validateEmbedToken(tokenValue);
      setAgentId(data.agent_id);
      setIsValidating(false);
    } catch (err) {
      console.error("Failed to validate token:", err);
      setError(err instanceof Error ? err.message : "Invalid token");
      setIsValidating(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !agentId || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputMessage.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setError(null);

    try {
      // Call the chat endpoint with token
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${API_BASE_URL}/embed/chat/${agentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: inputMessage.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to send message" }));
        throw new Error(errorData.detail || errorData.message || "Failed to send message");
      }

      const data = await response.json();
      if (data.answer) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.answer,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setError(null);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isValidating) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent" />
          <p className="mt-4 text-sm text-slate-600">Loading chatbot...</p>
        </div>
      </div>
    );
  }

  if (error && !agentId) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-semibold">
            C
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">CRE Chatbot</h1>
            <p className="text-xs text-slate-400">Online</p>
          </div>
        </div>
        <button
          onClick={() => window.close()}
          className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col">
            {/* Recommended Section */}
            <div className="border-b border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowRecommended(!showRecommended)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-slate-900">Recommended</span>
                </div>
                <ChevronUp
                  className={`w-4 h-4 text-slate-500 transition-transform ${
                    showRecommended ? "" : "rotate-180"
                  }`}
                />
              </button>
              {showRecommended && (
                <div className="px-4 pb-4 space-y-2">
                  <div className="rounded-lg bg-slate-200 px-3 py-2 text-sm text-slate-600">
                    sdgf
                  </div>
                  <div className="rounded-lg bg-slate-200 px-3 py-2 text-sm text-slate-400">
                    {/* Empty recommended item */}
                  </div>
                  <div className="rounded-lg bg-slate-200 px-3 py-2 text-sm text-slate-400">
                    {/* Empty recommended item */}
                  </div>
                </div>
              )}
            </div>

            {/* Empty State */}
            <div className="flex-1 flex items-center justify-center p-4">
              <p className="text-sm text-slate-500">Start a conversation...</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] min-w-0 rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-slate-100 text-slate-900"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-slate-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0.2s" }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white p-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-lg border border-slate-300 bg-slate-50">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              disabled={isLoading || !agentId}
              rows={1}
              className="flex-1 resize-none border-0 bg-transparent px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                maxHeight: "200px",
                minHeight: "48px",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || !agentId}
              className="mb-2 mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white transition-colors hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

