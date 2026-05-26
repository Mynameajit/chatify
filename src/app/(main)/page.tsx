"use client";

import { useChatStore } from "@/store/useChatStore";
import { ChatWindow } from "@/features/chat/components/ChatWindow";
import { RightSidebar } from "@/features/profile/components/RightSidebar";
import { LeftSidebar } from "@/features/chat/components/LeftSidebar";
import { useUIStore } from "@/store/useUIStore";
import { cn } from "@/lib/utils";

export default function MainPage() {
  const { activeChatId } = useChatStore();
  const { rightSidebarOpen } = useUIStore();

  return (
    <div className="flex h-full flex-1">
      {/* Mobile Sidebar View (when no chat is active) */}
      {!activeChatId && (
        <div className="md:hidden w-full h-full flex-col bg-white dark:bg-zinc-900 relative z-0">
          <LeftSidebar />
        </div>
      )}

      {/* Middle Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300 relative",
        rightSidebarOpen ? "hidden lg:flex" : "flex", // Hide on small screens if right sidebar open
        !activeChatId ? "hidden md:flex" : "flex" // Hide on mobile if no chat is active
      )}>
        {activeChatId ? (
          <ChatWindow chatId={activeChatId} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-950/50">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 dark:bg-primary/10 flex items-center justify-center mb-6 overflow-hidden shadow-sm">
              <img src="/logo.png" alt="Chatify" className="w-16 h-16 object-contain" />
            </div>
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Welcome to Chatify
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-center max-w-sm">
              Select a chat from the sidebar or start a new conversation to begin messaging.
            </p>
          </div>
        )}
      </div>

      {/* Right Sidebar (Profile/Details) */}
      {rightSidebarOpen && (
        <div className="w-full lg:w-[360px] border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-shrink-0 animate-in slide-in-from-right-10 duration-300 absolute inset-0 lg:static z-20">
          <RightSidebar />
        </div>
      )}
    </div>
  );
}
