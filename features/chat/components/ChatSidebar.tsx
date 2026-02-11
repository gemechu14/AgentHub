"use client";

import { useState } from "react";
import { FileText, NotebookPen, Trash2, Pencil } from "lucide-react";
import type { ChatOut } from "@/types/chat";

interface ChatSidebarProps {
  chats: ChatOut[];
  currentChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  isLoading?: boolean;
  isCollapsed?: boolean;
}

export function ChatSidebar({
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  isLoading,
}: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleStartEdit = (chat: ChatOut) => {
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const handleSaveEdit = (chatId: string) => {
    if (editTitle.trim()) {
      onRenameChat(chatId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  return (
    <div className="flex h-full flex-col bg-[#0d1321] text-white">
      {/* New Chat Button */}
      <div className="flex-shrink-0 px-2 pt-2 pb-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-400"
        >
          <NotebookPen className="h-4 w-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Recent Chats */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2">
        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          RECENT CHATS
        </div>
        {isLoading ? (
          <div className="px-3 py-2 text-sm text-slate-400">Loading...</div>
        ) : chats.length === 0 ? (
          <div className="px-3 py-2 text-sm text-slate-400">No chats yet</div>
        ) : (
          <div className="space-y-1">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  currentChatId === chat.id
                    ? "bg-blue-500/20 text-blue-400"
                    : "text-slate-300 hover:bg-slate-800/50"
                }`}
              >
                <FileText className="h-4 w-4 flex-shrink-0" />
                {editingId === chat.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleSaveEdit(chat.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSaveEdit(chat.id);
                      } else if (e.key === "Escape") {
                        handleCancelEdit();
                      }
                    }}
                    className="flex-1 bg-slate-800 text-white outline-none"
                    autoFocus
                  />
                ) : (
                  <>
                    <button
                      onClick={() => onSelectChat(chat.id)}
                      className="flex-1 truncate text-left"
                    >
                      {chat.title}
                    </button>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleStartEdit(chat)}
                        className="p-1 rounded hover:bg-slate-700"
                        title="Rename chat"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onDeleteChat(chat.id)}
                        className="p-1 rounded hover:bg-slate-700"
                        title="Delete chat"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

