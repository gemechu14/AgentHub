import { api } from "./apiClient";
import type {
  ChatCreate,
  ChatUpdate,
  ChatOut,
  ChatListOut,
  ChatWithMessagesOut,
  MessageCreate,
  MessageUpdate,
  MessageResponse,
  DeleteChatResponse,
} from "@/types/chat";

/**
 * Create a new chat conversation for an agent
 * POST /chats/{account_id}/{agent_id}
 */
export async function createChat(
  accountId: string,
  agentId: string,
  data?: ChatCreate
): Promise<ChatOut> {
  // Include agent_id in body as some backends require it
  const requestBody: ChatCreate = {
    ...data,
    agent_id: agentId,
  };
  return api.post<ChatOut>(`/chats/${accountId}/${agentId}`, requestBody);
}

/**
 * List all chats for an agent with pagination
 * GET /chats/{account_id}/{agent_id}?skip=0&limit=100
 */
export async function listChats(
  accountId: string,
  agentId: string,
  skip = 0,
  limit = 100
): Promise<ChatListOut> {
  return api.get<ChatListOut>(
    `/chats/${accountId}/${agentId}?skip=${skip}&limit=${limit}`
  );
}

/**
 * Get a specific chat with all its messages
 * GET /chats/{account_id}/{agent_id}/{chat_id}
 */
export async function getChat(
  accountId: string,
  agentId: string,
  chatId: string
): Promise<ChatWithMessagesOut> {
  return api.get<ChatWithMessagesOut>(`/chats/${accountId}/${agentId}/${chatId}`);
}

/**
 * Update chat title
 * PATCH /chats/{account_id}/{agent_id}/{chat_id}
 */
export async function updateChatTitle(
  accountId: string,
  agentId: string,
  chatId: string,
  data: ChatUpdate
): Promise<ChatOut> {
  return api.patch<ChatOut>(`/chats/${accountId}/${agentId}/${chatId}`, data);
}

/**
 * Delete a chat conversation
 * DELETE /chats/{account_id}/{agent_id}/{chat_id}
 */
export async function deleteChat(
  accountId: string,
  agentId: string,
  chatId: string
): Promise<DeleteChatResponse> {
  return api.delete<DeleteChatResponse>(`/chats/${accountId}/${agentId}/${chatId}`);
}

/**
 * Send a message in a chat and get AI response
 * POST /chats/{account_id}/{agent_id}/{chat_id}/messages
 */
export async function sendMessage(
  accountId: string,
  agentId: string,
  chatId: string,
  data: MessageCreate
): Promise<MessageResponse> {
  return api.post<MessageResponse>(
    `/chats/${accountId}/${agentId}/${chatId}/messages`,
    data
  );
}

/**
 * Update a message in a chat
 * PATCH /chats/{account_id}/{agent_id}/{chat_id}/messages/{message_id}
 */
export async function updateMessage(
  accountId: string,
  agentId: string,
  chatId: string,
  messageId: string,
  data: MessageUpdate
): Promise<ChatMessageOut> {
  return api.patch<ChatMessageOut>(
    `/chats/${accountId}/${agentId}/${chatId}/messages/${messageId}`,
    data
  );
}

