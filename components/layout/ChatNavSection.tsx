"use client";

import { memo, useCallback } from "react";
import { NotebookPen } from "lucide-react";
import { ChatSidebar } from "@/features/chat/components/ChatSidebar";
import { useChatContext } from "@/contexts/ChatContext";
import { useMobileMenu } from "@/contexts/MobileMenuContext";

interface ChatNavSectionProps {
  isCollapsed: boolean;
}

// This component reads directly from context - only re-renders when context values change
// It behaves like a navigation menu item that doesn't re-render on route changes
const ChatNavSectionComponent = ({ isCollapsed }: ChatNavSectionProps) => {
  const {
    chats,
    currentChatId,
    handleNewChat,
    handleSelectChat,
    handleDeleteChat,
    handleRenameChat,
    isLoading,
  } = useChatContext();
  const { closeMobileMenu } = useMobileMenu();

  // Handlers are already stable from context, but wrap them to ensure they never change
  const onNewChat = useCallback(() => {
    handleNewChat();
    closeMobileMenu();
  }, [handleNewChat, closeMobileMenu]);
  
  const onSelectChat = useCallback((chatId: string) => {
    handleSelectChat(chatId);
    closeMobileMenu();
  }, [handleSelectChat, closeMobileMenu]);
  
  const onDeleteChat = useCallback((chatId: string) => {
    handleDeleteChat(chatId);
  }, [handleDeleteChat]);
  
  const onRenameChat = useCallback((chatId: string, newTitle: string) => {
    handleRenameChat(chatId, newTitle);
  }, [handleRenameChat]);

  if (isCollapsed) {
    return (
      <div className="flex-1 flex flex-col items-center pt-2">
        <button
          onClick={() => {
            onNewChat();
            closeMobileMenu();
          }}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500 text-white transition-colors hover:bg-blue-400"
          title="New Chat"
        >
          <NotebookPen className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onNewChat={onNewChat}
        onSelectChat={onSelectChat}
        onDeleteChat={onDeleteChat}
        onRenameChat={onRenameChat}
        isLoading={isLoading}
        isCollapsed={false}
      />
    </div>
  );
};

// Memoize: Only re-render if isCollapsed changes
// Since this component reads from context, it will only re-render when context values change
// Context is memoized, so navigation won't cause re-renders
export const ChatNavSection = memo(ChatNavSectionComponent, (prevProps, nextProps) => {
  // Only re-render if collapsed state actually changed
  return prevProps.isCollapsed === nextProps.isCollapsed;
});

