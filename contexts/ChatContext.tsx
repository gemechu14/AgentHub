"use client";

import { createContext, useContext, ReactNode } from "react";
import type { Agent } from "@/types/agent";
import type { ChatOut, ChatWithMessagesOut } from "@/types/chat";

export interface ChatContextValue {
  selectedAgent: Agent | null;
  setSelectedAgent: (agent: Agent | null) => void;
  chats: ChatOut[];
  currentChat: ChatWithMessagesOut | null;
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  createNewChat: () => Promise<ChatOut>;
  loadChat: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, content: string) => Promise<void>;
  updateMessage: (chatId: string, messageId: string, newContent: string) => Promise<void>;
  updateTitle: (chatId: string, newTitle: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  handleNewChat: () => void;
  handleSelectChat: (chatId: string) => void;
  handleDeleteChat: (chatId: string) => void;
  handleRenameChat: (chatId: string, newTitle: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children, value }: { children: ReactNode; value: ChatContextValue }) {
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return context;
}
