"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, X, Bell, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUIStore } from "@/store/useUIStore";
import { useSocket } from "@/providers/SocketProvider";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { socket } = useSocket();
  const { setUnreadNotifsCount } = useUIStore();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const { default: api } = await import("@/lib/api");
      const res = await api.get("/friends/notifications");
      if (res.data.success) {
        setNotifications(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const markRead = async () => {
      try {
        const { default: api } = await import("@/lib/api");
        await api.post("/friends/notifications/read");
        setUnreadNotifsCount(0);
      } catch (err) {
        console.error("Failed to mark notifications as read:", err);
      }
    };
    markRead();
  }, [setUnreadNotifsCount]);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotif = (notif: any) => {
      console.log("WebSocket notification received in notifications page:", notif);
      setNotifications((prev) => {
        // Avoid duplicate additions
        if (prev.some((n) => n.id === notif.id)) return prev;

        const mapped = {
          id: notif.id,
          userId: notif.userId,
          type: notif.type?.toLowerCase() === "friend_request" ? "friend_request" : "system",
          content: notif.content,
          isRead: false,
          entityId: notif.entityId || notif.id,
          createdAt: notif.createdAt || new Date().toISOString(),
          status: "PENDING",
          sender: notif.sender,
        };
        return [mapped, ...prev];
      });
    };

    socket.on("notification:new", handleNewNotif);
    return () => {
      socket.off("notification:new", handleNewNotif);
    };
  }, [socket]);

  const handleAccept = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      const { default: api } = await import("@/lib/api");
      const res = await api.post("/friends/accept", { requestId });
      if (res.data.success) {
        const { toast } = await import("sonner");
        toast.success("Friend request accepted!");
        await fetchNotifications();
        const { useChatStore } = await import("@/store/useChatStore");
        await useChatStore.getState().fetchChats();
      }
    } catch (err: any) {
      const { toast } = await import("sonner");
      toast.error(err.response?.data?.message || "Failed to accept request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      const { default: api } = await import("@/lib/api");
      const res = await api.post("/friends/reject", { requestId });
      if (res.data.success) {
        const { toast } = await import("sonner");
        toast.success("Friend request rejected");
        await fetchNotifications();
      }
    } catch (err: any) {
      const { toast } = await import("sonner");
      toast.error(err.response?.data?.message || "Failed to reject request");
    } finally {
      setProcessingId(null);
    }
  };

  const pendingRequests = notifications.filter(n => n.type === "friend_request");
  const systemNotifs = notifications.filter(n => n.type === "system");

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-900 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="mr-2">
          <ArrowLeft className="h-5 w-5 text-zinc-500" />
        </Button>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Notifications</h2>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-zinc-400 animate-spin" />
        </div>
      ) : (
        <div className="p-6 max-w-2xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
          
          {/* Pending Requests */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Friend Requests</h3>
            {pendingRequests.length === 0 ? (
              <p className="text-sm text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl">No pending requests.</p>
            ) : (
              pendingRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border border-zinc-200 dark:border-zinc-700">
                      <AvatarImage src={req.sender?.avatar} />
                      <AvatarFallback className="bg-primary/20 text-primary/95 font-semibold">
                        {req.sender?.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{req.sender?.name}</span>
                      <span className="text-xs text-zinc-500">Wants to add you as a friend</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {req.status === "PENDING" ? (
                      <>
                        <Button size="sm" onClick={() => handleAccept(req.entityId)} disabled={processingId !== null} className="bg-primary hover:bg-primary/90 text-white rounded-xl font-medium">
                          {processingId === req.entityId ? "Wait..." : <><Check className="h-4 w-4 mr-1" /> Accept</>}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(req.entityId)} disabled={processingId !== null} className="rounded-xl border-zinc-200 dark:border-zinc-700 font-medium">
                          {processingId === req.entityId ? "Wait..." : <><X className="h-4 w-4 mr-1" /> Reject</>}
                        </Button>
                      </>
                    ) : (
                      <span className={`text-xs font-semibold capitalize px-3 py-1.5 rounded-xl border ${
                        req.status === "ACCEPTED" 
                          ? "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800" 
                          : "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                      }`}>
                        {req.status?.toLowerCase()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* System Notifications */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">System Alerts</h3>
            {systemNotifs.length === 0 ? (
              <p className="text-sm text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl">No system notifications.</p>
            ) : (
              systemNotifs.map(req => (
                <div key={req.id} className="flex items-start gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full shrink-0">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{req.content}</span>
                    <span className="text-xs text-zinc-500 mt-1">
                      {req.createdAt ? (() => {
                        try {
                          const { formatDistanceToNow } = require("date-fns");
                          return formatDistanceToNow(new Date(req.createdAt), { addSuffix: true });
                        } catch(e) {
                          return new Date(req.createdAt).toLocaleString();
                        }
                      })() : "Just now"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
}
