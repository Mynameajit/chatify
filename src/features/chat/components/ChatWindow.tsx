"use client";

import { useState, useEffect } from "react";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ChatSkeleton } from "./ChatSkeleton";
import { UserDetailsPanel } from "./UserDetailsPanel";

export function ChatWindow({ chatId }: { chatId: string }) {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate network loading state when changing chats
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400); // 400ms loading skeleton

    return () => clearTimeout(timer);
  }, [chatId]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full absolute inset-0">
        <ChatSkeleton />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full absolute inset-0 animate-in fade-in duration-300 overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 h-full min-w-0">
        <ChatHeader chatId={chatId} />
        <MessageList chatId={chatId} />
        <MessageInput chatId={chatId} />
      </div>

      {/* Right Sidebar Panel */}
      <UserDetailsPanel chatId={chatId} />
    </div>
  );
}
