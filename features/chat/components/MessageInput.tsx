"use client";

import { useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  centered?: boolean;
}

export function MessageInput({
  onSend,
  disabled = false,
  placeholder = "Ask anything",
  centered = false,
}: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (centered) {
    return (
      <div className="w-full">
        <div className="flex items-end gap-2 rounded-lg border border-slate-200 bg-white shadow-sm">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none border-0 bg-transparent px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              maxHeight: "200px",
              minHeight: "48px",
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
            }}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className="mb-2 mr-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-200 bg-white p-4">
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-lg border border-slate-200 bg-white shadow-sm">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none border-0 bg-transparent px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            maxHeight: "200px",
            minHeight: "48px",
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
          }}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="mb-2 mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white transition-colors hover:bg-blue-400 disabled:bg-slate-300 disabled:cursor-not-allowed"
          title="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

