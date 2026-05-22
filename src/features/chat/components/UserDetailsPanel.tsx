"use client";

import { useEffect, useState } from "react";
import { X, Calendar, Image as ImageIcon, ShieldAlert, ShieldBan, Trash2, Download } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import api from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { downloadMedia } from "@/lib/utils";

export function UserDetailsPanel({ chatId }: { chatId: string }) {
  const { rightSidebarOpen, setRightSidebarOpen } = useUIStore();
  const { chats, fetchChats } = useChatStore();
  const { user } = useAuthStore();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const chat = chats.find((c) => c.id === chatId) || chats.find((c) => c.type === 'direct' && c.participants.some(p => p.id === chatId));
  const isGroup = chat?.type === "group";
  const otherParticipant = chat?.participants.find((p) => p.id !== user?.id);

  useEffect(() => {
    if (
      !rightSidebarOpen ||
      isGroup ||
      !otherParticipant ||
      !chat
    ) return;

    const fetchDetails = async () => {
      setLoading(true);

      try {
        const [profileRes, mediaRes] = await Promise.all([
          api.get(`/users/${otherParticipant.id}`),
          api.get(`/conversations/${chat.id}/media`)
        ]);

        if (profileRes.data.success) {
          setProfile(profileRes.data.data);
        }

        if (mediaRes.data.success) {
          setMedia(mediaRes.data.data);
        }

      } catch (error) {
        console.error("Failed to fetch user details", error);

      } finally {
        setLoading(false);
      }
    };

    fetchDetails();

  }, [rightSidebarOpen, chat, otherParticipant, isGroup]);
  if (!rightSidebarOpen) return null;
  if (isGroup) {
    return (
      <div className="w-80 h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col z-20 absolute right-0 shadow-xl lg:relative lg:shadow-none animate-in slide-in-from-right duration-300">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Group Details</h3>
          <Button variant="ghost" size="icon" onClick={() => setRightSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-6 text-center text-zinc-500">
          Group details not implemented yet.
        </div>
      </div>
    );
  }

  const handleBlock = async () => {
    if (!profile) return;
    try {
      if (profile.isBlocked) {
        await api.post("/users/unblock", { userId: profile.id });
        toast.success("User unblocked");
        setProfile({ ...profile, isBlocked: false });
      } else {
        await api.post("/users/block", { userId: profile.id });
        toast.success("User blocked");
        setProfile({ ...profile, isBlocked: true });
        fetchChats(); // Refresh chats as friendship might be removed
        router.push("/"); // Redirect since chat might be invalid
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to toggle block status");
    }
  };

  return (
    <div className="w-80 h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col z-20 absolute right-0 shadow-2xl lg:relative lg:shadow-none animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">User Details</h3>
        <Button variant="ghost" size="icon" onClick={() => setRightSidebarOpen(false)}>
          <X className="h-5 w-5 text-zinc-500" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-6 flex flex-col items-center justify-center space-y-4 h-64">
            <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="w-32 h-4 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
            <div className="w-24 h-3 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
          </div>
        ) : profile ? (
          <div className="p-6 flex flex-col items-center">
            <Avatar className="h-24 w-24 border-4 border-white dark:border-zinc-900 shadow-lg mb-4">
              <AvatarImage src={profile.profilePhoto} />
              <AvatarFallback className="text-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                no img
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{profile.name}</h2>
            <p className="text-sm text-zinc-500 mb-6">{profile.email}</p>

            {profile.friendshipDate && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl w-full mb-8">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Friends since {format(new Date(profile.friendshipDate), "MMM yyyy")}</span>
              </div>
            )}

            <div className="w-full space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-zinc-500" />
                    Shared Media
                  </h3>
                  <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">{media.length}</span>
                </div>
                {media.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {media.slice(0, 6).map((m: any) => (
                      <div key={m.id} className="aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 cursor-pointer transition-opacity relative group">
                        {m.type.startsWith("image") ? (
                          <>
                            <img src={m.url} alt="media" className="w-full h-full object-cover" />
                            <div
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadMedia(m.url, m.name || `shared_media_${m.id}`);
                              }}
                            >
                              <Download className="w-5 h-5 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-800">
                            <span className="text-xs text-zinc-500 font-semibold uppercase">Video</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-xl text-center">
                    <p className="text-sm text-zinc-500">No media shared yet.</p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-zinc-500" />
                  Privacy & Safety
                </h3>

                <Button
                  variant={profile.isBlocked ? "outline" : "destructive"}
                  className="w-full justify-start rounded-xl font-medium"
                  onClick={handleBlock}
                >
                  <ShieldBan className="h-4 w-4 mr-2" />
                  {profile.isBlocked ? "Unblock User" : "Block User"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-zinc-500">
            User details not found.
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
