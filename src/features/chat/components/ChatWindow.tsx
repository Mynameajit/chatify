"use client";

import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { UserDetailsPanel } from "./UserDetailsPanel";

export function ChatWindow({ chatId }: { chatId: string }) {
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
