"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useChatStore } from "@/store/useChatStore";
import { useSocket } from "@/providers/SocketProvider";
import { ChatWindow } from "@/features/chat/components/ChatWindow";
import { ShieldAlert, ArrowLeft, UserX, UserCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChatSkeleton } from "@/features/chat/components/ChatSkeleton";

export default function ChatUserPage() {
  const params = useParams();
  const router = useRouter();
  const { chats, fetchChats, setActiveChatId, markMessagesAsSeen, isChatsLoading, hasFetchedChats } = useChatStore();
  const { socket } = useSocket();
  const userId = params?.userId as string;

  const [profileUser, setProfileUser] = useState<any | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Resolve chat by either direct ID or participant matching
  const chat = chats.find(c => c.id === userId) || chats.find(c => c.type === "direct" && c.participants.some(p => p.id === userId));
  const isGroupChat = chat?.type === "group";

  useEffect(() => {
    if (chat) {
      setActiveChatId(chat.id);
      markMessagesAsSeen(chat.id);
    }
  }, [chat?.id, setActiveChatId, markMessagesAsSeen]);

  const fetchTargetProfile = async () => {
    if (!userId || isGroupChat) {
      setIsLoadingProfile(false);
      return;
    }
    try {
      setIsLoadingProfile(true);
      const { default: api } = await import("@/lib/api");
      const res = await api.get(`/users/${userId}`);
      if (res.data.success) {
        const email = res.data.data.email;
        const searchRes = await api.get(`/users/search?q=${encodeURIComponent(email)}`);
        const matchedUser = searchRes.data.data?.find((u: any) => u.id === userId);
        if (matchedUser) {
          setProfileUser(matchedUser);
        } else {
          setProfileUser({
            id: res.data.data.id,
            name: res.data.data.name,
            avatar: res.data.data.profilePhoto || `https://i.pravatar.cc/150?u=${userId}`,
            username: email.split("@")[0],
            bio: res.data.data.bio || "",
            relationship: "NONE",
          });
        }
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchTargetProfile();
  }, [userId, isGroupChat]);

  // Listen for friend accepted events
  useEffect(() => {
    if (!socket) return;
    const handleFriendAccepted = (data: any) => {
      fetchTargetProfile();
    };
    const handleUserUpdated = (data: any) => {
      if (data.userId === userId) {
        fetchTargetProfile();
      }
    };
    
    socket.on("friend:accepted", handleFriendAccepted);
    socket.on("user:updated", handleUserUpdated);
    
    return () => {
      socket.off("friend:accepted", handleFriendAccepted);
      socket.off("user:updated", handleUserUpdated);
    };
  }, [socket, userId]);

  // Auto-create conversation if they are friends but chat doesn't exist
  useEffect(() => {
    if (!isLoadingProfile && profileUser?.relationship === "FRIENDS" && !chat && !isGroupChat && !isChatsLoading) {
      const createChat = async () => {
        try {
          const { default: api } = await import("@/lib/api");
          const res = await api.post("/conversations", {
            isGroup: false,
            participantIds: [userId]
          });
          if (res.data.success) {
            await fetchChats();
          }
        } catch (error) {
          console.error("Failed to create conversation automatically:", error);
        }
      };
      createChat();
    }
  }, [isLoadingProfile, profileUser?.relationship, chat, isGroupChat, userId, fetchChats, isChatsLoading]);

  const handleSendRequest = async () => {
    try {
      setIsProcessing(true);
      const { default: api } = await import("@/lib/api");
      const res = await api.post("/friends/request", { receiverId: userId });
      if (res.data.success) {
        const reqData = res.data.data;
        setProfileUser((prev: any) =>
          prev ? { ...prev, relationship: "SENT", requestId: reqData.id } : null
        );
        const { toast } = await import("sonner");
        toast.success("Friend request sent!");
      }
    } catch (err: any) {
      const { toast } = await import("sonner");
      toast.error(err.response?.data?.message || "Failed to send request");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!profileUser?.requestId) return;
    try {
      setIsProcessing(true);
      const { default: api } = await import("@/lib/api");
      const res = await api.post("/friends/accept", { requestId: profileUser.requestId });
      if (res.data.success) {
        setProfileUser((prev: any) =>
          prev ? { ...prev, relationship: "FRIENDS" } : null
        );
        const { toast } = await import("sonner");
        toast.success("Friend request accepted! Loading chat...");
        await fetchChats();
      }
    } catch (err: any) {
      const { toast } = await import("sonner");
      toast.error(err.response?.data?.message || "Failed to accept request");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!profileUser?.requestId) return;
    try {
      setIsProcessing(true);
      const { default: api } = await import("@/lib/api");
      const res = await api.post("/friends/cancel", { requestId: profileUser.requestId });
      if (res.data.success) {
        setProfileUser((prev: any) =>
          prev ? { ...prev, relationship: "NONE", requestId: undefined } : null
        );
        const { toast } = await import("sonner");
        toast.success("Friend request cancelled");
      }
    } catch (err: any) {
      const { toast } = await import("sonner");
      toast.error(err.response?.data?.message || "Failed to cancel request");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!userId) return null;

  // If we already found the chat in our store, we don't need to block on profile loading
  if (isChatsLoading || (!hasFetchedChats) || (!chat && isLoadingProfile)) {
    return (
      <div className="flex-1 h-full w-full absolute inset-0 animate-in fade-in duration-300">
        <ChatSkeleton />
      </div>
    );
  }

  // If user does not exist at all in our system and it's not a group chat
  if (!isGroupChat && !profileUser && !isLoadingProfile && !chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-50/50 dark:bg-zinc-950/50 h-full w-full absolute inset-0">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-6">
            <UserX className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">User Not Found</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">
            The user you are trying to reach does not exist or has deleted their account.
          </p>
          <Button onClick={() => router.push("/")} className="w-full rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // If the user is NOT a friend and no active chat exists
  if (!isGroupChat && !chat && profileUser && profileUser.relationship !== "FRIENDS") {
    const isReceived = profileUser.relationship === "RECEIVED";
    const isSent = profileUser.relationship === "SENT";

    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-zinc-50/50 dark:bg-zinc-950/50 animate-in fade-in duration-300 h-full w-full absolute inset-0 animate-duration-500">
        <div className="relative bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/85 dark:border-zinc-800/85 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[32px] p-8 max-w-sm w-full text-center overflow-hidden">
          
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-red-500/10 rounded-full blur-2xl" />

          <div className="relative w-24 h-24 mx-auto mb-6">
            <Avatar className="w-full h-full border-4 border-white dark:border-zinc-800 shadow-xl">
              <AvatarImage src={profileUser.avatar} />
              <AvatarFallback className="text-2xl">{profileUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-red-500 border-2 border-white dark:border-zinc-900 flex items-center justify-center shadow-lg animate-bounce">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-1">
            Access Restricted
          </h2>
          <p className="text-sm font-semibold text-primary mb-4">
            @{profileUser.username}
          </p>

          <div className="bg-zinc-100/55 dark:bg-zinc-800/35 border border-zinc-200/50 dark:border-zinc-700/30 rounded-2xl p-4 mb-6">
            <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed text-left font-medium">
              सुरक्षा कारणों से आप केवल अपने दोस्तों (friends) के साथ ही चैट कर सकते हैं। <strong>{profileUser.name}</strong> अभी आपके मित्र सूची में नहीं हैं।
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {isReceived ? (
              <Button
                onClick={handleAcceptRequest}
                disabled={isProcessing}
                className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 font-semibold h-11 transition-all hover:scale-[1.02]"
              >
                {isProcessing ? "Wait..." : <><UserCheck className="w-4 h-4 mr-2" /> Accept Friend Request</>}
              </Button>
            ) : isSent ? (
              <Button
                onClick={handleCancelRequest}
                disabled={isProcessing}
                className="w-full rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-600/20 font-semibold h-11 transition-all hover:scale-[1.02]"
              >
                {isProcessing ? "Wait..." : "Cancel Friend Request"}
              </Button>
            ) : (
              <Button
                onClick={handleSendRequest}
                disabled={isProcessing}
                className="w-full rounded-xl bg-primary hover:bg-primary/95 text-white shadow-lg shadow-primary/20 font-semibold h-11 transition-all hover:scale-[1.02]"
              >
                {isProcessing ? "Wait..." : "Send Friend Request"}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full rounded-xl border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 h-11"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!chat) return null;

  return (
    <div className="flex-1 h-full w-full relative animate-in fade-in duration-300">
      <ChatWindow chatId={chat.id} />
    </div>
  );
}
