"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAgents } from "@/hooks/useAgents";
import { AppShell } from "@/components/layout/AppShell";
import { useChatContext } from "@/contexts/ChatContext";
import { ChatMessage } from "@/features/chat/components/ChatMessage";
import { MessageInput } from "@/features/chat/components/MessageInput";
import { AgentSelector } from "@/features/chat/components/AgentSelector";
import { ThinkingIndicator } from "@/features/chat/components/ThinkingIndicator";
import { useMobileMenu } from "@/contexts/MobileMenuContext";
import { Menu } from "lucide-react";

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: agents, isLoading: agentsLoading } = useAgents();
  const chatContext = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    selectedAgent,
    setSelectedAgent,
    currentChat,
    currentChatId,
    setCurrentChatId,
    isLoading: chatLoading,
    isSending,
    error,
    loadChat,
    sendMessage,
    editAndResend,
  } = chatContext;

  // Load chat from URL query param
  useEffect(() => {
    const chatIdFromUrl = searchParams.get("chatId");
    if (chatIdFromUrl && chatIdFromUrl !== currentChatId && selectedAgent) {
      setCurrentChatId(chatIdFromUrl);
      loadChat(chatIdFromUrl).catch((err) => {
        console.error("Failed to load chat from URL:", err);
      });
    }
  }, [searchParams, selectedAgent, currentChatId, loadChat, setCurrentChatId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat?.messages]);

  const handleSendMessage = async (content: string) => {
    if (!selectedAgent) return;
    
    try {
      let chatId = currentChatId;
      
      // Create a new chat if none exists
      if (!chatId) {
        const newChat = await chatContext.createNewChat();
        chatId = newChat.id;
        setCurrentChatId(chatId);
        await loadChat(chatId);
        // Update URL to reflect the new chat ID
        router.replace("/chat?chatId=" + encodeURIComponent(chatId));
      }
      
      // Send the message
      await sendMessage(chatId, content);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Use all agents (no filtering)
  const chatAgents = agents || [];

  const { openMobileMenu } = useMobileMenu();

  return (
    <div className="flex flex-1 flex-col h-full">
        {/* Top Bar */}
        <div className="flex items-center gap-4 bg-white px-4 py-3 border-b border-slate-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openMobileMenu();
            }}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <AgentSelector
            agents={chatAgents}
            selectedAgent={selectedAgent}
            onSelectAgent={setSelectedAgent}
            isLoading={agentsLoading}
          />
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {!selectedAgent ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900">
                  Select an agent to start chatting
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Choose an agent from the dropdown above
                </p>
              </div>
            </div>
          ) : currentChatId && currentChat && currentChat.messages.length > 0 ? (
            <div className="mx-auto max-w-3xl">
              {currentChat.messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onEdit={async (messageId, newContent) => {
                    if (currentChatId) {
                      await editAndResend(currentChatId, messageId, newContent);
                    }
                  }}
                />
              ))}
              {isSending && (
                <ThinkingIndicator />
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            /* New Chat - Centered welcome message and input */
            <div className="flex h-full flex-col items-center justify-center">
              <div className="text-center mb-8">
                <p className="text-2xl font-semibold text-slate-900">
                  What can I help with?
                </p>
              </div>
              <div className="w-full max-w-3xl px-4">
                <MessageInput
                  onSend={handleSendMessage}
                  disabled={isSending || chatLoading}
                  placeholder="Ask anything"
                  centered={true}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mx-4 mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Input Area - Only show at bottom when there are messages */}
        {selectedAgent && currentChatId && currentChat && currentChat.messages.length > 0 && (
          <MessageInput
            onSend={handleSendMessage}
            disabled={isSending || chatLoading}
            placeholder="Ask anything"
          />
        )}
      </div>
  );
}

export default function ChatPage() {
  return (
    <AppShell title="Chat">
      <ChatContent />
    </AppShell>
  );
}
