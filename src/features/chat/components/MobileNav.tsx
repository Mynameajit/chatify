"use client";

import { MessageSquare, Users, Bell, User as UserIcon } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { mockChats, mockNotifications } from "@/mock";

export function MobileNav() {
  const { activeSidebarTab, setActiveSidebarTab } = useUIStore();
  const { user } = useAuthStore();
  const { activeChatId } = useChatStore();
  const pathname = usePathname();
  const router = useRouter();

  // Hide MobileNav if we are on the main chat route and a chat is actively opened, or inside a dynamic chat route
  if ((pathname === "/" && activeChatId) || pathname.startsWith("/chats/")) {
    return null;
  }

  const isChatsActive = pathname === "/" && activeSidebarTab === "chats";
  const isFriendsActive = pathname === "/" && activeSidebarTab === "friends";
  const isNotificationsActive = pathname === "/notifications";
  const isProfileActive = pathname === "/profile";

  const totalUnreadChats = mockChats.reduce((acc, chat) => acc + chat.unreadCount, 0);
  const unreadNotificationsCount = mockNotifications.filter(n => !n.isRead).length;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around z-50 pb-safe px-4">
      
      {/* Chats Tab */}
      <button 
        onClick={() => {
          setActiveSidebarTab("chats");
          router.push("/");
        }}
        className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${isChatsActive ? "text-primary" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
      >
        {isChatsActive && (
          <motion.div
            layoutId="activeMobileTab"
            className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-xl border border-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.1)] -z-10"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
        <div className="relative">
          <MessageSquare className={`h-5 w-5 ${isChatsActive ? "scale-110" : ""}`} />
          {totalUnreadChats > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-sm border border-white dark:border-zinc-900 flex-shrink-0">
              {totalUnreadChats}
            </span>
          )}
        </div>
      </button>
      
      {/* Friends Tab */}
      <button 
        onClick={() => {
          setActiveSidebarTab("friends");
          router.push("/");
        }}
        className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${isFriendsActive ? "text-primary" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
      >
        {isFriendsActive && (
          <motion.div
            layoutId="activeMobileTab"
            className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-xl border border-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.1)] -z-10"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
        <Users className={`h-5 w-5 ${isFriendsActive ? "scale-110" : ""}`} />
      </button>

      {/* Notifications Tab */}
      <button 
        onClick={() => router.push("/notifications")}
        className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${isNotificationsActive ? "text-primary" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
      >
        {isNotificationsActive && (
          <motion.div
            layoutId="activeMobileTab"
            className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-xl border border-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.1)] -z-10"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
        <div className="relative">
          <Bell className={`h-5 w-5 ${isNotificationsActive ? "scale-110" : ""}`} />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-sm border border-white dark:border-zinc-900 flex-shrink-0">
              {unreadNotificationsCount}
            </span>
          )}
        </div>
      </button>

      {/* Profile Tab */}
      <button 
        onClick={() => router.push("/profile")}
        className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${isProfileActive ? "text-primary" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
      >
        {isProfileActive && (
          <motion.div
            layoutId="activeMobileTab"
            className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-xl border border-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.1)] -z-10"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
        <Avatar className={`h-6 w-6 border-2 transition-transform duration-300 ${isProfileActive ? "border-primary scale-110" : "border-zinc-200 dark:border-zinc-700"}`}>
          <AvatarImage src={user?.avatar} />
          <AvatarFallback className="text-[10px]">{user?.name?.charAt(0)}</AvatarFallback>
        </Avatar>
      </button>
    </div>
  );
}
