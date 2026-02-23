"use client";

import { useState, useRef, useEffect, useCallback, useMemo, type ReactNode, type KeyboardEvent } from "react";
import { Copy, Pencil, Check, ArrowUp } from "lucide-react";
import type { ChatMessageOut } from "@/types/chat";

/**
 * Parses markdown-style text into React elements.
 * Supports: **bold**, *italic*, `inline code`, ```code blocks```, and newlines.
 */
function renderMarkdown(text: string): ReactNode[] {
  const elements: ReactNode[] = [];
  
  // Split by code blocks first (```...```)
  const codeBlockParts = text.split(/(```[\s\S]*?```)/g);
  
  codeBlockParts.forEach((part, blockIdx) => {
    // Code block
    if (part.startsWith("```") && part.endsWith("```")) {
      const inner = part.slice(3, -3);
      // Remove optional language identifier on first line
      const firstNewline = inner.indexOf("\n");
      const code = firstNewline >= 0 ? inner.slice(firstNewline + 1) : inner;
      elements.push(
        <pre key={`cb-${blockIdx}`} className="my-2 rounded-lg bg-black/10 p-3 text-xs overflow-x-auto font-mono">
          <code>{code}</code>
        </pre>
      );
      return;
    }

    // For non-code-block text, parse inline markdown
    // Split into lines to preserve whitespace
    const lines = part.split("\n");
    lines.forEach((line, lineIdx) => {
      if (lineIdx > 0) {
        elements.push(<br key={`br-${blockIdx}-${lineIdx}`} />);
      }

      const lineKey = `${blockIdx}-${lineIdx}`;

      // Check if line starts with "### " and make the text after it bold
      if (line.startsWith("### ")) {
        const textAfterHash = line.slice(4); // Remove "### "
        elements.push(
          <strong key={`h3-${lineKey}`} className="font-semibold">
            {textAfterHash}
          </strong>
        );
        return;
      }

      // Parse inline formatting: **bold**, *italic*, `code`
      // Regex matches: **bold**, *italic*, `code`, or plain text
      const inlineRegex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+?)`)/g;
      let lastIndex = 0;
      let match;

      while ((match = inlineRegex.exec(line)) !== null) {
        // Push plain text before this match
        if (match.index > lastIndex) {
          elements.push(
            <span key={`t-${lineKey}-${lastIndex}`}>
              {line.slice(lastIndex, match.index)}
            </span>
          );
        }

        if (match[2] !== undefined) {
          // **bold**
          elements.push(
            <strong key={`b-${lineKey}-${match.index}`} className="font-semibold">
              {match[2]}
            </strong>
          );
        } else if (match[3] !== undefined) {
          // *italic*
          elements.push(
            <em key={`i-${lineKey}-${match.index}`}>
              {match[3]}
            </em>
          );
        } else if (match[4] !== undefined) {
          // `inline code`
          elements.push(
            <code
              key={`c-${lineKey}-${match.index}`}
              className="rounded bg-black/10 px-1.5 py-0.5 text-xs font-mono"
            >
              {match[4]}
            </code>
          );
        }

        lastIndex = match.index + match[0].length;
      }

      // Push remaining plain text
      if (lastIndex < line.length) {
        elements.push(
          <span key={`t-${lineKey}-${lastIndex}`}>
            {line.slice(lastIndex)}
          </span>
        );
      }
    });
  });

  return elements;
}

interface ChatMessageProps {
  message: ChatMessageOut;
  onEdit?: (messageId: string, newContent: string) => Promise<void>;
}

export function ChatMessage({ message, onEdit }: ChatMessageProps) {
  const isUser = message.role === "user";
  const renderedContent = useMemo(() => renderMarkdown(message.content), [message.content]);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isCopying, setIsCopying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea when editing
  const autoResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
    }
  }, []);

  // Focus and auto-resize when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end of text
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
      autoResize();
    }
  }, [isEditing, autoResize]);

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
    if (!onEdit || editContent.trim() === message.content || !editContent.trim()) {
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

  // Keyboard: Enter to send, Shift+Enter for new line
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const canSend = !isSaving && editContent.trim() !== message.content && editContent.trim().length > 0;

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
        {isEditing ? (
          // Edit mode: Full width container like ChatGPT
          <div className="w-full -mx-4 px-4">
            <div className="mx-auto max-w-3xl">
              {/* Edit textarea container */}
              <div className="rounded-2xl border border-slate-300 bg-white shadow-sm overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
                <textarea
                  ref={textareaRef}
                  value={editContent}
                  onChange={(e) => {
                    setEditContent(e.target.value);
                    autoResize();
                  }}
                  onKeyDown={handleKeyDown}
                  className="w-full resize-none border-0 bg-transparent px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none"
                  style={{ minHeight: "48px", maxHeight: "300px" }}
                  placeholder="Type your message..."
                  disabled={isSaving}
                />
              </div>
              {/* Action buttons below */}
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!canSend}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Send (Enter)"
                >
                  {isSaving ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <ArrowUp className="w-3 h-3" />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
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
                {renderedContent}
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
            {/* Action buttons on hover (user messages only) */}
            {isUser && (
              <div className="flex items-center justify-end gap-0.5 mt-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Copy"
                >
                  {isCopying ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                {onEdit && (
                  <button
                    onClick={handleEdit}
                    className="flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Edit message"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
            {/* Copy button for assistant messages */}
            {!isUser && (
              <div className="flex items-center gap-0.5 mt-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Copy"
                >
                  {isCopying ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

