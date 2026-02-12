"use client";

import { ReactNode, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAgents } from "@/hooks/useAgents";
import { useChat } from "@/hooks/useChat";
import { ChatProvider } from "@/contexts/ChatContext";
import type { Agent } from "@/types/agent";

/**
 * ChatStateProvider - Self-contained provider for all chat state.
 * 
 * This component is placed in the ROOT LAYOUT so it persists across
 * all page navigations. When the user navigates between /chat, /settings,
 * /admin etc., this provider stays mounted and keeps all chat state alive.
 * 
 * This is the key fix: AppShell remounts on every page navigation because
 * each page creates <AppShell>. But this provider lives ABOVE the pages,
 * so it never remounts.
 */
export function ChatStateProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: agents } = useAgents();

  // Filter chat-compatible agents
  const chatAgents = useMemo(
    () => agents?.filter((agent) => agent.connection_type === "POWERBI") || [],
    [agents]
  );

  // Initialize selectedAgentId from localStorage
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("selectedAgentId");
    }
    return null;
  });

  // Restore/validate selected agent when agents are loaded
  useEffect(() => {
    if (chatAgents.length > 0) {
      const savedAgentId = localStorage.getItem("selectedAgentId");

      if (savedAgentId && chatAgents.some((a) => a.id === savedAgentId)) {
        if (selectedAgentId !== savedAgentId) {
          setSelectedAgentId(savedAgentId);
        }
      } else if (!selectedAgentId || !chatAgents.some((a) => a.id === selectedAgentId)) {
        const firstAgentId = chatAgents[0].id;
        setSelectedAgentId(firstAgentId);
        localStorage.setItem("selectedAgentId", firstAgentId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatAgents]);

  // Persist selected agent ID
  useEffect(() => {
    if (selectedAgentId && typeof window !== "undefined") {
      localStorage.setItem("selectedAgentId", selectedAgentId);
    }
  }, [selectedAgentId]);

  // Derive selectedAgent object
  const selectedAgent = useMemo(
    () =>
      chatAgents.find((agent) => agent.id === selectedAgentId) ||
      (chatAgents.length > 0 ? chatAgents[0] : null),
    [chatAgents, selectedAgentId]
  );

  // Chat hook - this is the core state that must persist
  const {
    chats,
    currentChat,
    isLoading: chatLoading,
    isSending,
    error: chatError,
    createNewChat,
    loadChat,
    sendMessage,
    updateMessage,
    updateTitle,
    deleteChat,
  } = useChat(selectedAgent?.id || null);

  // Persist currentChatId in sessionStorage
  const [currentChatId, setCurrentChatId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("currentChatId") || null;
    }
    return null;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (currentChatId) {
        sessionStorage.setItem("currentChatId", currentChatId);
      } else {
        sessionStorage.removeItem("currentChatId");
      }
    }
  }, [currentChatId]);

  // Stable setSelectedAgent handler
  const setSelectedAgent = useCallback((agent: Agent | null) => {
    if (agent) {
      setSelectedAgentId(agent.id);
      localStorage.setItem("selectedAgentId", agent.id);
    }
  }, []);

  // Refs for stable handlers (access latest values without dependency changes)
  const selectedAgentRef = useRef(selectedAgent);
  const loadChatRef = useRef(loadChat);
  const deleteChatRef = useRef(deleteChat);
  const updateTitleRef = useRef(updateTitle);
  const routerRef = useRef(router);

  useEffect(() => {
    selectedAgentRef.current = selectedAgent;
    loadChatRef.current = loadChat;
    deleteChatRef.current = deleteChat;
    updateTitleRef.current = updateTitle;
    routerRef.current = router;
  }, [selectedAgent, loadChat, deleteChat, updateTitle, router]);

  // Stable handlers - these NEVER change reference
  const handleNewChat = useCallback(() => {
    if (!selectedAgentRef.current) return;
    setCurrentChatId(null);
    routerRef.current.replace("/chat");
  }, []);

  const handleSelectChat = useCallback(async (chatId: string) => {
    setCurrentChatId(chatId);
    await loadChatRef.current(chatId);
    routerRef.current.replace("/chat?chatId=" + encodeURIComponent(chatId));
  }, []);

  const handleDeleteChat = useCallback(async (chatId: string) => {
    if (!confirm("Are you sure you want to delete this chat?")) return;
    try {
      await deleteChatRef.current(chatId);
      setCurrentChatId((prev) => (prev === chatId ? null : prev));
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  }, []);

  const handleRenameChat = useCallback(async (chatId: string, newTitle: string) => {
    try {
      await updateTitleRef.current(chatId, newTitle);
    } catch (err) {
      console.error("Failed to rename chat:", err);
    }
  }, []);

  // Memoize chats to maintain stable reference
  const memoizedChats = useMemo(() => chats, [chats]);

  // Memoize the entire context value - only changes when actual data changes
  const contextValue = useMemo(
    () => ({
      selectedAgent,
      setSelectedAgent,
      chats: memoizedChats,
      currentChat,
      currentChatId,
      setCurrentChatId,
      isLoading: chatLoading,
      isSending: isSending || false,
      error: chatError || null,
      createNewChat,
      loadChat,
      sendMessage,
      updateMessage,
      updateTitle,
      deleteChat,
      handleNewChat,
      handleSelectChat,
      handleDeleteChat,
      handleRenameChat,
    }),
    [
      selectedAgent,
      setSelectedAgent,
      memoizedChats,
      currentChat,
      currentChatId,
      chatLoading,
      isSending,
      chatError,
      createNewChat,
      loadChat,
      sendMessage,
      updateMessage,
      updateTitle,
      deleteChat,
      handleNewChat,
      handleSelectChat,
      handleDeleteChat,
      handleRenameChat,
    ]
  );

  return <ChatProvider value={contextValue}>{children}</ChatProvider>;
}

