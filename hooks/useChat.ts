import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAccountId } from "@/services/agentsService";
import {
  createChat,
  listChats,
  getChat,
  updateChatTitle,
  deleteChat,
  sendMessage,
  updateMessage,
} from "@/services/chatService";
import type {
  ChatOut,
  ChatWithMessagesOut,
  ChatCreate,
  ChatUpdate,
  MessageCreate,
} from "@/types/chat";
import { ApiError } from "@/services/apiClient";

interface UseChatState {
  chats: ChatOut[];
  currentChat: ChatWithMessagesOut | null;
  isLoading: boolean; // For loading chats list
  isLoadingChat: boolean; // For loading a single chat
  isSending: boolean;
  error: string | null;
}

export function useChat(agentId: string | null) {
  const { user } = useAuth();
  const [state, setState] = useState<UseChatState>({
    chats: [],
    currentChat: null,
    isLoading: false, // For loading chats list
    isLoadingChat: false, // For loading a single chat
    isSending: false,
    error: null,
  });

  const accountId = user ? getAccountId(user) : null;
  // Track the last accountId+agentId combination we loaded chats for to prevent unnecessary refetches
  const lastLoadedKeyRef = useRef<string | null>(null);
  // Track if we're currently loading to prevent concurrent loads
  const isLoadingRef = useRef(false);
  // Store chats in a ref to maintain stable reference unless they actually change
  const chatsRef = useRef<ChatOut[]>(state.chats);

  // Load all chats for the agent
  const loadChats = useCallback(async (force = false) => {
    if (!accountId || !agentId) return;
    
    // Prevent loading if we've already loaded chats for this agent (unless forced)
    const currentKey = `${accountId}:${agentId}`;
    if (!force && lastLoadedKeyRef.current === currentKey) {
      return;
    }
    
    // Prevent concurrent loads
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const response = await listChats(accountId, agentId, 0, 100);
      // Update the ref after successful load
      lastLoadedKeyRef.current = currentKey;
      
      // Only update state if chats actually changed (deep comparison)
      const chatsChanged = 
        chatsRef.current.length !== response.chats.length ||
        chatsRef.current.some((oldChat, index) => {
          const newChat = response.chats[index];
          return !newChat || 
                 oldChat.id !== newChat.id || 
                 oldChat.title !== newChat.title ||
                 oldChat.updated_at !== newChat.updated_at;
        });
      
      if (chatsChanged) {
        chatsRef.current = response.chats;
        setState((prev) => ({
          ...prev,
          chats: response.chats,
          isLoading: false,
        }));
      } else {
        // Chats didn't change, keep the same reference
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Failed to load chats";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
    } finally {
      isLoadingRef.current = false;
    }
  }, [accountId, agentId]);

  // Create a new chat
  const createNewChat = useCallback(
    async (title?: string) => {
      if (!accountId || !agentId) {
        throw new Error("Account ID and Agent ID are required");
      }

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        const newChat = await createChat(accountId, agentId, { title });
        const updatedChats = [newChat, ...chatsRef.current];
        chatsRef.current = updatedChats;
        setState((prev) => ({
          ...prev,
          chats: updatedChats,
          isLoading: false,
        }));
        return newChat;
      } catch (err) {
        const errorMessage =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : "Failed to create chat";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        throw err;
      }
    },
    [accountId, agentId]
  );

  // Load a specific chat with messages
  const loadChat = useCallback(
    async (chatId: string) => {
      if (!accountId || !agentId) return;

      try {
        // Use isLoadingChat instead of isLoading to avoid affecting sidebar
        setState((prev) => ({ ...prev, isLoadingChat: true, error: null }));
        const chat = await getChat(accountId, agentId, chatId);
        setState((prev) => ({
          ...prev,
          currentChat: chat,
          isLoadingChat: false,
        }));
        return chat;
      } catch (err) {
        const errorMessage =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : "Failed to load chat";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoadingChat: false,
        }));
        throw err;
      }
    },
    [accountId, agentId]
  );

  // Send a message
  const sendChatMessage = useCallback(
    async (chatId: string, content: string) => {
      if (!accountId || !agentId) {
        throw new Error("Account ID and Agent ID are required");
      }

      try {
        setState((prev) => ({ ...prev, isSending: true, error: null }));
        
        // Optimistically add user message to current chat
        setState((prev) => {
          if (!prev.currentChat || prev.currentChat.id !== chatId) {
            return prev;
          }
          
          const userMessage = {
            id: `temp-${Date.now()}`,
            chat_id: chatId,
            role: "user" as const,
            content,
            created_at: new Date().toISOString(),
          };
          
          return {
            ...prev,
            currentChat: {
              ...prev.currentChat,
              messages: [...prev.currentChat.messages, userMessage],
            },
          };
        });

        const response = await sendMessage(accountId, agentId, chatId, {
          content,
        });

        // Reload the chat to get all messages (including user message and assistant response)
        await loadChat(chatId);
        // Reload chats list to update message_count (force refresh)
        await loadChats(true);

        setState((prev) => ({ ...prev, isSending: false }));
        return response;
      } catch (err) {
        // Remove optimistic user message on error
        setState((prev) => {
          if (!prev.currentChat || prev.currentChat.id !== chatId) {
            return { ...prev, isSending: false };
          }
          
          return {
            ...prev,
            currentChat: {
              ...prev.currentChat,
              messages: prev.currentChat.messages.filter(
                (msg) => !msg.id.startsWith("temp-")
              ),
            },
            isSending: false,
          };
        });

        const errorMessage =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : "Failed to send message";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
        }));
        throw err;
      }
    },
    [accountId, agentId, loadChat, loadChats]
  );

  // Update chat title
  const updateTitle = useCallback(
    async (chatId: string, newTitle: string) => {
      if (!accountId || !agentId) return;

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        const updatedChat = await updateChatTitle(accountId, agentId, chatId, {
          title: newTitle,
        });
        const updatedChats = chatsRef.current.map((chat) =>
          chat.id === chatId ? updatedChat : chat
        );
        chatsRef.current = updatedChats;
        setState((prev) => ({
          ...prev,
          chats: updatedChats,
          currentChat:
            prev.currentChat && prev.currentChat.id === chatId
              ? { ...prev.currentChat, title: newTitle }
              : prev.currentChat,
          isLoading: false,
        }));
        return updatedChat;
      } catch (err) {
        const errorMessage =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : "Failed to update title";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        throw err;
      }
    },
    [accountId, agentId]
  );

  // Update a message
  const updateMessageContent = useCallback(
    async (chatId: string, messageId: string, newContent: string) => {
      if (!accountId || !agentId) return;

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        const updatedMessage = await updateMessage(
          accountId,
          agentId,
          chatId,
          messageId,
          { content: newContent }
        );
        setState((prev) => {
          if (!prev.currentChat || prev.currentChat.id !== chatId) {
            return prev;
          }
          return {
            ...prev,
            currentChat: {
              ...prev.currentChat,
              messages: prev.currentChat.messages.map((msg) =>
                msg.id === messageId ? updatedMessage : msg
              ),
            },
            isLoading: false,
          };
        });
        return updatedMessage;
      } catch (err) {
        const errorMessage =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : "Failed to update message";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        throw err;
      }
    },
    [accountId, agentId]
  );

  // Delete a chat
  const removeChat = useCallback(
    async (chatId: string) => {
      if (!accountId || !agentId) return;

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        await deleteChat(accountId, agentId, chatId);
        const updatedChats = chatsRef.current.filter((chat) => chat.id !== chatId);
        chatsRef.current = updatedChats;
        setState((prev) => ({
          ...prev,
          chats: updatedChats,
          currentChat:
            prev.currentChat && prev.currentChat.id === chatId
              ? null
              : prev.currentChat,
          isLoading: false,
        }));
      } catch (err) {
        const errorMessage =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : "Failed to delete chat";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        throw err;
      }
    },
    [accountId, agentId]
  );

  // Keep chatsRef in sync with state.chats
  useEffect(() => {
    chatsRef.current = state.chats;
  }, [state.chats]);

  // Load chats when agent changes (only when accountId or agentId actually changes)
  useEffect(() => {
    if (accountId && agentId) {
      // Create a unique key from accountId and agentId
      const currentKey = `${accountId}:${agentId}`;
      // Only load chats if this is a different combination than the last one we loaded for
      if (lastLoadedKeyRef.current !== currentKey) {
        // Reset chats ref when agent changes
        chatsRef.current = [];
        // Force load when agent changes (don't set ref yet, let loadChats set it after successful load)
        loadChats(true); // Force to bypass the ref check since agent changed
      }
    } else {
      // Reset the ref if agent/account is cleared
      lastLoadedKeyRef.current = null;
      chatsRef.current = [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, agentId]);

  return {
    ...state,
    loadChats,
    createNewChat,
    loadChat,
    sendMessage: sendChatMessage,
    updateTitle,
    updateMessage: updateMessageContent,
    deleteChat: removeChat,
  };
}

