// Request Types
export interface ChatCreate {
  title?: string;
  agent_id?: string; // Some backends require this in the body
}

export interface ChatUpdate {
  title?: string;
}

export interface MessageCreate {
  content: string;
}

// Response Types
export interface ChatOut {
  id: string;
  title: string;
  agent_id: string;
  user_id: string;
  account_id: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface ChatMessageOut {
  id: string;
  chat_id: string;
  role: "user" | "assistant";
  content: string;
  action?: "DESCRIBE" | "QUERY" | "ERROR";
  dax_attempts?: string;
  final_dax?: string;
  resolution_note?: string;
  error?: string;
  created_at: string;
}

export interface ChatWithMessagesOut {
  id: string;
  title: string;
  agent_id: string;
  user_id: string;
  account_id: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessageOut[];
}

export interface ChatListOut {
  chats: ChatOut[];
  total: number;
}

export interface MessageResponse {
  message: ChatMessageOut;
  chat: ChatOut;
}

export interface DeleteChatResponse {
  ok: boolean;
  message: string;
}

