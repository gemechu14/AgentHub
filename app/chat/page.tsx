"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAgents } from "@/hooks/useAgents";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/contexts/AuthContext";
import { ChatSidebar } from "@/features/chat/components/ChatSidebar";
import { ChatMessage } from "@/features/chat/components/ChatMessage";
import { MessageInput } from "@/features/chat/components/MessageInput";
import { AgentSelector } from "@/features/chat/components/AgentSelector";
import { Settings, Shield, ChevronLeft, ChevronRight, NotebookPen } from "lucide-react";
import type { Agent } from "@/types/agent";
import { APP_NAME } from "@/lib/config";
import { Bot } from "lucide-react";

function getUserInitials(user: { first_name: string; last_name: string } | null): string {
  if (!user) return "U";
  const first = user.first_name?.charAt(0).toUpperCase() || "";
  const last = user.last_name?.charAt(0).toUpperCase() || "";
  return first + last || "U";
}

function getUserFullName(user: { first_name: string; last_name: string } | null): string {
  if (!user) return "User";
  return `${user.first_name || ""} ${user.last_name || ""}`.trim() || "User";
}

export default function ChatPage() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();
  const { data: agents, isLoading: agentsLoading } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userInitials = getUserInitials(user);
  const userFullName = getUserFullName(user);

  const {
    chats,
    currentChat,
    isLoading: chatLoading,
    isSending,
    error,
    createNewChat,
    loadChat,
    sendMessage,
    updateTitle,
    deleteChat,
  } = useChat(selectedAgent?.id || null);

  // Auto-select first POWERBI agent if available
  useEffect(() => {
    if (!selectedAgent && agents && agents.length > 0) {
      const powerBiAgents = agents.filter((agent) => agent.connection_type === "POWERBI");
      if (powerBiAgents.length > 0) {
        setSelectedAgent(powerBiAgents[0]);
      }
    }
  }, [agents, selectedAgent]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat?.messages]);

  const handleNewChat = async () => {
    if (!selectedAgent) return;
    try {
      const newChat = await createNewChat();
      setCurrentChatId(newChat.id);
      await loadChat(newChat.id);
    } catch (err) {
      console.error("Failed to create chat:", err);
    }
  };

  const handleSelectChat = async (chatId: string) => {
    setCurrentChatId(chatId);
    await loadChat(chatId);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedAgent) return;
    
    try {
      let chatId = currentChatId;
      
      // Create a new chat if none exists
      if (!chatId) {
        const newChat = await createNewChat();
        chatId = newChat.id;
        setCurrentChatId(chatId);
        await loadChat(chatId);
      }
      
      // Send the message
      await sendMessage(chatId, content);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm("Are you sure you want to delete this chat?")) return;
    try {
      await deleteChat(chatId);
      if (currentChatId === chatId) {
        setCurrentChatId(null);
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    try {
      await updateTitle(chatId, newTitle);
    } catch (err) {
      console.error("Failed to rename chat:", err);
    }
  };

  // Filter agents to only show those with POWERBI connection (chat support)
  const chatAgents = agents?.filter(
    (agent) => agent.connection_type === "POWERBI"
  ) || [];

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className={`${isCollapsed ? "w-16" : "w-64"} flex-shrink-0 flex flex-col h-screen bg-[#0d1321] border-r border-slate-800/50 transition-all duration-300`}>
        {/* Header */}
        <div className="flex-shrink-0 flex h-16 items-center justify-between border-b border-slate-800/50 px-4">
          {!isCollapsed && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-semibold tracking-tight text-white">
                  {APP_NAME}
                </span>
              </div>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </>
          )}
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Chat Sidebar */}
        {!isCollapsed && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatSidebar
              chats={chats}
              currentChatId={currentChatId}
              onNewChat={handleNewChat}
              onSelectChat={handleSelectChat}
              onDeleteChat={handleDeleteChat}
              onRenameChat={handleRenameChat}
              isLoading={chatLoading}
              isCollapsed={false}
            />
          </div>
        )}
        {isCollapsed && (
          <div className="flex-1 flex flex-col items-center pt-2">
            <button
              onClick={handleNewChat}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500 text-white transition-colors hover:bg-blue-400"
              title="New Chat"
            >
              <NotebookPen className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Footer Navigation */}
        {!isCollapsed && (
          <div className="mt-auto p-2 border-t border-slate-800/50 space-y-1">
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white"
            >
              <Shield className="w-5 h-5" />
              <span>Admin Portal</span>
            </Link>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-semibold text-white flex-shrink-0">
                {authLoading ? "..." : userInitials}
              </div>
              <span className="truncate text-sm">
                {authLoading ? "Loading..." : userFullName}
              </span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="mt-auto p-2 border-t border-slate-800/50 space-y-1">
            <Link
              href="/settings"
              className="flex items-center justify-center px-3 py-2.5 rounded-lg transition-all text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <Link
              href="/admin"
              className="flex items-center justify-center px-3 py-2.5 rounded-lg transition-all text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white"
              title="Admin Portal"
            >
              <Shield className="w-5 h-5" />
            </Link>
            <div className="flex items-center justify-center px-3 py-2.5 rounded-lg text-sm text-slate-400">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-semibold text-white flex-shrink-0">
                {authLoading ? "..." : userInitials}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
        <div className="flex items-center gap-4 border-b border-slate-200 bg-white px-4 py-3">
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
                <ChatMessage key={message.id} message={message} />
              ))}
              {isSending && (
                <div className="flex justify-start px-4 py-6">
                  <div className="w-full">
                    <div className="max-w-[85%] md:max-w-[80%]">
                      <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></div>
                            <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></div>
                            <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
    </div>
  );
}

