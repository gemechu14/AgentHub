"use client";

import { useState } from "react";
import { Copy, Pencil, Check } from "lucide-react";
import type { ChatMessageOut } from "@/types/chat";

interface ChatMessageProps {
  message: ChatMessageOut;
  onEdit?: (messageId: string, newContent: string) => Promise<void>;
}

export function ChatMessage({ message, onEdit }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isCopying, setIsCopying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopying(true);
      setTimeout(() => setIsCopying(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(message.content);
  };

  const handleSave = async () => {
    if (!onEdit || editContent.trim() === message.content) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onEdit(message.id, editContent.trim());
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update message:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update message";
      if (errorMessage.includes("Not Found") || errorMessage.includes("404")) {
        alert("Message update is not supported by the API. The endpoint may not be available.");
      } else {
        alert(`Failed to update message: ${errorMessage}`);
      }
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  return (
    <div
      className={`group flex px-4 py-6 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex w-full ${
          isUser ? "flex-row-reverse justify-end" : "flex-row justify-start"
        }`}
      >
        <div
          className={`max-w-[85%] md:max-w-[80%] ${
            isUser ? "ml-auto" : "mr-auto"
          }`}
        >
          {isEditing ? (
            <div className="relative rounded-2xl p-4 min-h-[120px] bg-slate-100" style={{ width: '600px' }}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full resize-none bg-transparent border-0 outline-none text-slate-900 text-sm placeholder-slate-500 min-h-[80px]"
                rows={3}
                autoFocus
                placeholder="Type your message..."
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || editContent.trim() === message.content || !editContent.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`rounded-2xl px-4 py-3 text-sm ${
                isUser
                  ? "bg-blue-500 text-white rounded-br-sm"
                  : "bg-slate-100 text-slate-900 rounded-bl-sm"
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">
                {message.content}
              </div>
              {message.final_dax && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs opacity-80 hover:opacity-100">
                    View DAX Query
                  </summary>
                  <pre className="mt-2 rounded bg-black/10 p-2 text-xs overflow-x-auto">
                    {message.final_dax}
                  </pre>
                </details>
              )}
              {message.error && (
                <div className="mt-2 rounded bg-red-50 p-2 text-xs text-red-700">
                  Error: {message.error}
                </div>
              )}
            </div>
          )}
          {isUser && !isEditing && (
            <div className="flex items-center justify-end gap-0.5 mt-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={handleCopy}
                className="flex items-center justify-center w-7 h-7 rounded text-slate-600 hover:bg-slate-100 transition-colors"
                title="Copy"
              >
                {isCopying ? (
                  <Check className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              {onEdit && (
                <button
                  onClick={handleEdit}
                  className="flex items-center justify-center w-7 h-7 rounded text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

