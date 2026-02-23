"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Send, X, MessageCircle, Lightbulb, ChevronUp, Bot } from "lucide-react";
import { validateEmbedToken } from "@/services/embedService";
import { DEFAULT_THEME, type EmbedTheme } from "@/types/theme";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// Helper function to parse markdown (### headings and **bold**)
function parseMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const lines = text.split("\n");
  
  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) {
      parts.push(<br key={`br-${lineIdx}`} />);
    }
    
    // Handle ### headings
    if (line.startsWith("### ")) {
      parts.push(
        <strong key={`h3-${lineIdx}`} className="font-semibold">
          {line.slice(4)}
        </strong>
      );
      return;
    }
    
    // Handle **bold** syntax
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;
    const lineParts: React.ReactNode[] = [];
    
    while ((match = boldRegex.exec(line)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        lineParts.push(line.slice(lastIndex, match.index));
      }
      // Add bold text
      lineParts.push(
        <strong key={`bold-${lineIdx}-${match.index}`} className="font-semibold">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < line.length) {
      lineParts.push(line.slice(lastIndex));
    }
    
    // If no bold found, just add the line as-is
    if (lineParts.length === 0) {
      parts.push(<span key={`line-${lineIdx}`}>{line}</span>);
    } else {
      parts.push(
        <span key={`line-${lineIdx}`}>{lineParts}</span>
      );
    }
  });
  
  return parts;
}

export default function EmbedWidgetPage() {
  const [token, setToken] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [agentName, setAgentName] = useState<string>("Chatbot");
  const [recommendedQuestions, setRecommendedQuestions] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showRecommended, setShowRecommended] = useState(true);
  const [isInIframe, setIsInIframe] = useState(false);
  const [theme, setTheme] = useState<EmbedTheme>(DEFAULT_THEME);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Detect iframe on mount (client-only)
  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true); // cross-origin iframe
    }
  }, []);

  // Notify parent (embed.js) about open/close state
  const notifyParent = useCallback(
    (type: "chatbot-open" | "chatbot-close") => {
      try {
        window.parent.postMessage(
          { source: "agenthub-chatbot", type },
          "*"
        );
      } catch {
        // Ignore if not in iframe
      }
    },
    []
  );

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    notifyParent("chatbot-open");
  }, [notifyParent]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    notifyParent("chatbot-close");
  }, [notifyParent]);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token") || hash;

    if (tokenParam) {
      setToken(tokenParam);
      validateToken(tokenParam);
    } else {
      setError("No token found in URL");
      setIsValidating(false);
    }
  }, []);

  const validateToken = async (tokenValue: string) => {
    try {
      setIsValidating(true);
      const data = await validateEmbedToken(tokenValue);
      
      // Check if agent is active
      if (data.status !== "active") {
        setError("This agent is not active. The token may be expired or invalid.");
        setIsValidating(false);
        return;
      }
      
      setAgentId(data.agent_id);
      setAgentName(data.agent_name || "Chatbot");
      setRecommendedQuestions(data.recommended_questions || []);
      // Set theme from API response or use default
      if (data.theme) {
        setTheme(data.theme);
      }
      setIsValidating(false);
    } catch (err: any) {
      console.error("Failed to validate token:", err);
      // Handle 403 errors specifically
      if (err?.response?.status === 403 || err?.status === 403) {
        const errorMessage = err?.response?.data?.detail || err?.message || "Embed is currently disabled for this agent. Please enable it to use embed.";
        setError(errorMessage);
      } else {
        setError(err instanceof Error ? err.message : "Invalid token");
      }
      setIsValidating(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (questionOverride?: string) => {
    const messageToSend = questionOverride || inputMessage.trim();
    if (!messageToSend || !agentId || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageToSend,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!questionOverride) {
      setInputMessage("");
    }
    setIsLoading(true);
    setError(null);

    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${API_BASE_URL}/embed/chat/${agentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: messageToSend,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to send message" }));
        throw new Error(
          errorData.detail || errorData.message || "Failed to send message"
        );
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

  // =============================================
  // When inside iframe: fill the container (embed.js manages sizing)
  // When direct tab: use fixed bottom-right positioning
  // =============================================

  // --- Circle button (closed state) ---
  if (!isOpen) {
    // Loading spinner
    if (isValidating) {
      const spinnerCircle = (
        <div 
          className="flex h-[60px] w-[60px] items-center justify-center rounded-full shadow-lg cursor-pointer"
          style={{ backgroundColor: theme.primary }}
        >
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      );

      if (isInIframe) {
        return spinnerCircle;
      }

      return (
        <div className="fixed bottom-5 right-5 z-[2147483647]">
          {spinnerCircle}
        </div>
      );
    }

    // Error icon
    if (error && !agentId) {
      const errorCircle = (
        <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-red-500 shadow-lg cursor-pointer" title={error}>
          <X className="h-6 w-6 text-white" />
        </div>
      );

      if (isInIframe) {
        return errorCircle;
      }

      return (
        <div className="fixed bottom-5 right-5 z-[2147483647]">
          {errorCircle}
        </div>
      );
    }

    // Normal circle button - launcher button uses primary
    const circleButton = (
      <button
        onClick={handleOpen}
        className="flex h-[60px] w-[60px] items-center justify-center rounded-full text-white shadow-lg transition-all hover:scale-110 border-none outline-none cursor-pointer"
        style={{ 
          backgroundColor: theme.primary,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "0.9";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
        aria-label="Open chat"
      >
        <MessageCircle className="h-7 w-7" />
      </button>
    );

    if (isInIframe) {
      return circleButton;
    }

    return (
      <div className="fixed bottom-5 right-5 z-[2147483647]">
        {circleButton}
      </div>
    );
  }

  // --- Chat popup (open state) ---
  const chatPopup = (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl shadow-2xl ${
        isInIframe ? "w-full h-full" : "w-[400px] h-[600px]"
      }`}
      style={{ 
        backgroundColor: theme.surface,
        borderColor: theme.border,
        borderWidth: "1px",
        borderStyle: "solid",
      }}
    >
      {/* Header - uses primary */}
      <div 
        className="flex items-center justify-between border-b px-4 py-3 flex-shrink-0"
        style={{ 
          backgroundColor: theme.primary,
          borderColor: theme.border,
        }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="flex h-8 w-8 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: theme.accent }}
          >
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 
              className="text-sm font-semibold"
              style={{ color: theme.surface }}
            >
              {agentName}
            </h1>
            <p 
              className="text-xs"
              style={{ color: theme.success }}
            >
              Online
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleClose();
          }}
          className="p-1 rounded transition-colors"
          style={{ 
            color: theme.surface,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area - uses background */}
      <div 
        className="flex-1 overflow-y-auto min-h-0"
        style={{ backgroundColor: theme.background }}
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col">
            {/* Try Asking Section - cards use surface */}
            {recommendedQuestions.length > 0 && (
              <div 
                className="border-b"
                style={{ 
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                }}
              >
                <button
                  onClick={() => setShowRecommended(!showRecommended)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors"
                  style={{ 
                    color: theme.textPrimary,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.9";
                    e.currentTarget.style.backgroundColor = theme.background;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    <span 
                      className="text-sm font-medium"
                      style={{ color: theme.textPrimary }}
                    >
                      Try Asking
                    </span>
                  </div>
                  <ChevronUp
                    className={`w-4 h-4 transition-transform ${
                      showRecommended ? "" : "rotate-180"
                    }`}
                    style={{ color: theme.textPrimary }}
                  />
                </button>
                {showRecommended && (
                  <div className="px-4 pb-4 space-y-2">
                    {recommendedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleSendMessage(question)}
                        className="w-full text-left rounded-lg px-3 py-2 text-sm transition-colors"
                        style={{ 
                          backgroundColor: theme.surface,
                          color: theme.textPrimary,
                          borderColor: theme.border,
                          borderWidth: "1px",
                          borderStyle: "solid",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = "0.9";
                          e.currentTarget.style.backgroundColor = theme.accent;
                          e.currentTarget.style.color = theme.surface;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = "1";
                          e.currentTarget.style.backgroundColor = theme.surface;
                          e.currentTarget.style.color = theme.textPrimary;
                        }}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            <div className="flex-1 flex items-center justify-center p-4">
              <p 
                className="text-sm"
                style={{ color: theme.textPrimary }}
              >
                Start a conversation...
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className="max-w-[80%] min-w-0 rounded-2xl px-4 py-3"
                  style={{
                    backgroundColor: message.role === "user" ? theme.primary : theme.surface,
                    color: message.role === "user" ? theme.surface : theme.textPrimary,
                  }}
                >
                  <div
                    className="text-sm whitespace-pre-wrap break-words"
                    style={{ 
                      overflowWrap: "anywhere",
                      color: message.role === "user" ? theme.surface : theme.textPrimary,
                    }}
                  >
                    {parseMarkdown(message.content)}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div 
                  className="rounded-2xl px-4 py-3"
                  style={{ backgroundColor: theme.surface }}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2 w-2 animate-bounce rounded-full"
                      style={{ backgroundColor: theme.textPrimary, opacity: 0.6 }}
                    />
                    <div
                      className="h-2 w-2 animate-bounce rounded-full"
                      style={{ 
                        backgroundColor: theme.textPrimary, 
                        opacity: 0.6,
                        animationDelay: "0.2s" 
                      }}
                    />
                    <div
                      className="h-2 w-2 animate-bounce rounded-full"
                      style={{ 
                        backgroundColor: theme.textPrimary, 
                        opacity: 0.6,
                        animationDelay: "0.4s" 
                      }}
                    />
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
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 flex-shrink-0">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Input Area - input/suggestions use surface, border uses border */}
      <div 
        className="border-t p-4 flex-shrink-0"
        style={{ 
          borderColor: theme.border,
          backgroundColor: theme.surface,
        }}
      >
        <div 
          className="flex items-end gap-2 rounded-lg border"
          style={{ 
            borderColor: theme.border,
            backgroundColor: theme.surface,
          }}
        >
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            disabled={isLoading || !agentId}
            rows={1}
            className="flex-1 resize-none border-0 bg-transparent px-4 py-3 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              maxHeight: "120px",
              minHeight: "48px",
              color: theme.textPrimary,
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading || !agentId}
            className="mb-2 mr-2 flex h-8 w-8 items-center justify-center rounded-lg text-white transition-colors disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: theme.accent,
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.opacity = "0.9";
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.opacity = "1";
              }
            }}
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (isInIframe) {
    return chatPopup;
  }

  return (
    <div className="fixed bottom-5 right-5 z-[2147483647]">
      {chatPopup}
    </div>
  );
}
