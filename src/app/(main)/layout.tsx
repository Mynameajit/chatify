"use client";

import { ProtectedLayout } from "@/components/shared/ProtectedLayout";
import { LeftSidebar } from "@/features/chat/components/LeftSidebar";
import { MobileNav } from "@/features/chat/components/MobileNav";
import { usePathname } from "next/navigation";
import { useChatStore } from "@/store/useChatStore";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { activeChatId } = useChatStore();
  
  // If we are on the main chat page and have an active chat or on a dynamic chat page, don't add bottom padding for MobileNav
  const isChatViewActive = (pathname === "/" && !!activeChatId) || pathname.startsWith("/chats/");

  return (
    <ProtectedLayout>
      <div className={`flex h-[100dvh] overflow-hidden bg-zinc-50 dark:bg-zinc-950 ${isChatViewActive ? '' : 'pb-16'} md:pb-0`}>
        {/* Left Sidebar (Hidden on mobile when chat is active, but we handle that in page) */}
        <div className="hidden md:flex w-80 lg:w-96 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-10 relative">
          <LeftSidebar />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-900 relative">
          {children}
        </main>
        
        <MobileNav />
      </div>
    </ProtectedLayout>
  );
}
