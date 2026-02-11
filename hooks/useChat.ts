import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAccountId } from "@/services/agentsService";
import {
  createChat,
  listChats,
  getChat,
  updateChatTitle,
  deleteChat,
  sendMessage,
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
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
}

export function useChat(agentId: string | null) {
  const { user } = useAuth();
  const [state, setState] = useState<UseChatState>({
    chats: [],
    currentChat: null,
    isLoading: false,
    isSending: false,
    error: null,
  });

  const accountId = user ? getAccountId(user) : null;

  // Load all chats for the agent
  const loadChats = useCallback(async () => {
    if (!accountId || !agentId) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const response = await listChats(accountId, agentId, 0, 100);
      setState((prev) => ({
        ...prev,
        chats: response.chats,
        isLoading: false,
      }));
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
        setState((prev) => ({
          ...prev,
          chats: [newChat, ...prev.chats],
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
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        const chat = await getChat(accountId, agentId, chatId);
        setState((prev) => ({
          ...prev,
          currentChat: chat,
          isLoading: false,
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
          isLoading: false,
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
        // Reload chats list to update message_count
        await loadChats();

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
        setState((prev) => ({
          ...prev,
          chats: prev.chats.map((chat) =>
            chat.id === chatId ? updatedChat : chat
          ),
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

  // Delete a chat
  const removeChat = useCallback(
    async (chatId: string) => {
      if (!accountId || !agentId) return;

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        await deleteChat(accountId, agentId, chatId);
        setState((prev) => ({
          ...prev,
          chats: prev.chats.filter((chat) => chat.id !== chatId),
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

  // Load chats when agent changes
  useEffect(() => {
    if (accountId && agentId) {
      loadChats();
    }
  }, [accountId, agentId, loadChats]);

  return {
    ...state,
    loadChats,
    createNewChat,
    loadChat,
    sendMessage: sendChatMessage,
    updateTitle,
    deleteChat: removeChat,
  };
}

