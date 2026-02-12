"use client";

import { useState, useRef, useEffect, memo } from "react";
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

function ChatSidebarComponent({
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Preserve scroll position
  useEffect(() => {
    if (scrollContainerRef.current && typeof window !== "undefined") {
      const savedScroll = sessionStorage.getItem("chatSidebarScroll");
      if (savedScroll) {
        scrollContainerRef.current.scrollTop = parseInt(savedScroll, 10);
      }
    }
  }, []);

  // Save scroll position
  const handleScroll = () => {
    if (scrollContainerRef.current && typeof window !== "undefined") {
      sessionStorage.setItem("chatSidebarScroll", String(scrollContainerRef.current.scrollTop));
    }
  };

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
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto px-2 pb-2"
      >
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

// Memoize to prevent unnecessary re-renders
export const ChatSidebar = memo(ChatSidebarComponent, (prevProps, nextProps) => {
  // Re-render if loading state changes
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  
  // Re-render if current chat changes
  if (prevProps.currentChatId !== nextProps.currentChatId) return false;
  
  // Re-render if chats array length changes
  if (prevProps.chats.length !== nextProps.chats.length) return false;
  
  // Re-render if any chat changed (check by reference first for performance)
  if (prevProps.chats === nextProps.chats) return true; // Same reference, no change
  
  // Deep check if chats array changed
  const chatsChanged = prevProps.chats.some((chat, index) => {
    const nextChat = nextProps.chats[index];
    return !nextChat || chat.id !== nextChat.id || chat.title !== nextChat.title || chat.updated_at !== nextChat.updated_at;
  });
  
  // Return true to skip re-render if nothing changed
  return !chatsChanged;
});

