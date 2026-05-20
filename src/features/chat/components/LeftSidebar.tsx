"use client";

import { useState, useEffect } from "react";
import { Search, Bell, Settings, Edit, Users, MessageSquare, MessageSquareDashed, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { useUIStore } from "@/store/useUIStore";
import { mockUsers } from "@/mock";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatListItem } from "./ChatListItem";
import { SettingsModal } from "@/features/settings/components/SettingsModal";
import { FriendRequestsModal } from "@/features/friends/components/FriendRequestsModal";

export function LeftSidebar() {
  const { user } = useAuthStore();
  const { activeChatId, setActiveChatId, chats, fetchChats } = useChatStore();
  const { activeSidebarTab, setActiveSidebarTab } = useUIStore();

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const router = useRouter();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register service worker for push notifications & installability
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(
        (reg) => console.log("ServiceWorker registered successfully:", reg.scope),
        (err) => console.error("ServiceWorker registration failed:", err)
      );
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA installation outcome: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const fetchDbUsers = async (query: string) => {
    try {
      setIsLoadingUsers(true);
      const { default: api } = await import("@/lib/api");
      const res = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      if (res.data.success) {
        setDbUsers(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch database users:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeSidebarTab === "friends") {
      fetchDbUsers(searchQuery);
    }
  }, [activeSidebarTab, searchQuery]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSendRequest = async (receiverId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { default: api } = await import("@/lib/api");
      const res = await api.post("/friends/request", { receiverId });
      if (res.data.success) {
        const reqData = res.data.data;
        setDbUsers((prev) =>
          prev.map((u) =>
            u.id === receiverId ? { ...u, relationship: "SENT", requestId: reqData.id } : u
          )
        );
        const { toast } = await import("sonner");
        toast.success("Friend request sent!");
      }
    } catch (err: any) {
      const { toast } = await import("sonner");
      toast.error(err.response?.data?.message || "Failed to send request");
    }
  };

  const handleCancelRequest = async (requestId: string, friendId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { default: api } = await import("@/lib/api");
      const res = await api.post("/friends/cancel", { requestId });
      if (res.data.success) {
        setDbUsers((prev) =>
          prev.map((u) =>
            u.id === friendId ? { ...u, relationship: "NONE", requestId: undefined } : u
          )
        );
        const { toast } = await import("sonner");
        toast.success("Friend request cancelled!");
      }
    } catch (err: any) {
      const { toast } = await import("sonner");
      toast.error(err.response?.data?.message || "Failed to cancel request");
    }
  };

  const handleAcceptRequest = async (requestId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { default: api } = await import("@/lib/api");
      const res = await api.post("/friends/accept", { requestId });
      if (res.data.success) {
        setDbUsers((prev) =>
          prev.map((u) =>
            u.requestId === requestId ? { ...u, relationship: "FRIENDS" } : u
          )
        );
        const { toast } = await import("sonner");
        toast.success("Friend request accepted!");
        fetchChats();
      }
    } catch (err: any) {
      const { toast } = await import("sonner");
      toast.error(err.response?.data?.message || "Failed to accept request");
    }
  };

  const handleStartChat = async (friendId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetchChats();
    router.push(`/chats/${friendId}`);
  };

  const filteredChats = chats.filter((chat) => {
    if (searchQuery) {
      const chatName = chat.name || chat.participants.find(p => p.id !== user?.id)?.name || "";
      return chatName.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
      {/* Header Profile Area */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <MessageSquareDashed className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Chatify
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Search Button for Mobile only */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
          >
            <Search className="h-4 w-4" />
          </Button>

          {isInstallable && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8 text-primary hover:bg-primary/10 animate-pulse"
              onClick={handleInstallClick}
              title="Download App"
            >
              <Download className="h-4 w-4 text-blue-500" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            onClick={() => router.push('/notifications')}
          >
            <Bell className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            onClick={() => router.push('/settings')}
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* Avatar - hidden on mobile header */}
          <div className="hidden md:flex items-center">
            <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1" />
            <Avatar
              className="h-8 w-8 cursor-pointer hover:opacity-80 border border-zinc-200 dark:border-zinc-700 ml-1"
              onClick={() => router.push('/profile')}
            >
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-xs">{user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="p-4 pb-2 space-y-4">
        {/* Toggleable search bar for mobile, always visible on desktop */}
        <div className={showMobileSearch ? "flex gap-2 animate-in slide-in-from-top-2 duration-200" : "hidden md:flex gap-2"}>
          <div className="relative flex-1">
            <Input
              placeholder="Search..."
              className="px-4 bg-zinc-100 dark:bg-zinc-800/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-xl"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button
            size="icon"
            variant="default"
            onClick={handleSearch}
            className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm flex-shrink-0"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Tabs value={activeSidebarTab} onValueChange={(v) => setActiveSidebarTab(v as any)} className="w-full">

          {/* SM screen: sirf active tab ka label dikhao, tabs nahi */}
          <div className="flex items-center gap-2 px-1 py-2 lg:hidden">
            {activeSidebarTab === "chats" && (
              <>
                <MessageSquare className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Chats</span>
              </>
            )}
            {activeSidebarTab === "friends" && (
              <>
                <Users className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Add Friend</span>
              </>
            )}
            {activeSidebarTab === "notifications" && (
              <>
                <Bell className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Notifications</span>
              </>
            )}
          </div>

          {/* LG screen: full tabs dikhao */}
          <TabsList className="hidden lg:grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl">
            <TabsTrigger value="chats" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chats
            </TabsTrigger>
            <TabsTrigger value="friends" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm">
              <Users className="h-4 w-4 mr-2" />
              Add Friend
            </TabsTrigger>
          </TabsList>

        </Tabs>

      </div>

      {/* List Area */}
      <ScrollArea className="flex-1 px-3">
        <AnimatePresence>
          {activeSidebarTab === "chats" && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex flex-col gap-1 py-2"
            >
              {filteredChats.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  isActive={activeChatId === chat.id}
                  onClick={() => {
                    setActiveChatId(chat.id);
                    const otherParticipant = chat.participants.find(p => p.id !== user?.id);
                    const targetId = chat.type === "direct" && otherParticipant ? otherParticipant.id : chat.id;
                    router.push(`/chats/${targetId}`);
                  }}
                />
              ))}
              {filteredChats.length === 0 && (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  No chats found.
                </div>
              )}
            </motion.div>
          )}

          {activeSidebarTab === "friends" && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col gap-1 py-2 w-full overflow-hidden"
            >
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <span className="text-sm text-zinc-500">Loading users...</span>
                </div>
              ) : (
                dbUsers.map((friend) => {
                  return (
                    <div
                      key={friend.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors w-full justify-between"
                      onClick={() => {
                        router.push(`/chats/${friend.id}`);
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-12 w-12 border border-zinc-200 dark:border-zinc-800">
                            <AvatarImage src={friend.avatar} />
                            <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {friend.status === "online" && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-zinc-900 bg-green-500 rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{friend.name}</h4>
                          <p className="text-xs text-zinc-500 truncate">{friend.bio || `@${friend.username}`}</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        {friend.relationship === "FRIENDS" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="rounded-full text-xs h-7 w-24 flex items-center justify-center font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                            onClick={(e) => handleStartChat(friend.id, e)}
                          >
                            Message
                          </Button>
                        )}
                        {friend.relationship === "SENT" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="rounded-full text-xs h-7 w-24 flex items-center justify-center font-semibold bg-red-500 hover:bg-red-600 text-white"
                            onClick={(e) => handleCancelRequest(friend.requestId, friend.id, e)}
                          >
                            Cancel
                          </Button>
                        )}
                        {friend.relationship === "RECEIVED" && (
                          <Button
                            size="sm"
                            className="rounded-full text-xs h-7 w-24 flex items-center justify-center font-semibold bg-green-500 hover:bg-green-600 text-white"
                            onClick={(e) => handleAcceptRequest(friend.requestId, e)}
                          >
                            Accept
                          </Button>
                        )}
                        {friend.relationship === "NONE" && (
                          <Button
                            size="sm"
                            className="rounded-full text-xs h-7 w-24 flex items-center justify-center font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                            onClick={(e) => handleSendRequest(friend.id, e)}
                          >
                            Follow
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {!isLoadingUsers && dbUsers.length === 0 && (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  No users found.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}
