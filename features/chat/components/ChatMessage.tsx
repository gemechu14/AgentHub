"use client";

import type { ChatMessageOut } from "@/types/chat";

interface ChatMessageProps {
  message: ChatMessageOut;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex px-4 py-6 ${
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
        </div>
      </div>
    </div>
  );
}

