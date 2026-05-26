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
import { Switch } from "@/components/ui/switch";
import { Mail, BellOff, LogOut } from "lucide-react";

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
    <div className="w-80 h-full bg-[#18181b] dark:bg-[#18181b] flex flex-col z-20 absolute right-0 shadow-2xl lg:relative lg:shadow-none animate-in slide-in-from-right duration-300">
      <div className="p-4 flex justify-between items-center text-zinc-100 sticky top-0 bg-[#18181b] border-b border-zinc-800">
        <h3 className="font-semibold text-lg">Contact Info</h3>
        <Button variant="ghost" size="icon" onClick={() => setRightSidebarOpen(false)} className="hover:bg-zinc-800 text-zinc-400">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-6 flex flex-col items-center justify-center space-y-4 h-64">
            <div className="w-24 h-24 rounded-full bg-zinc-800 animate-pulse" />
            <div className="w-32 h-4 bg-zinc-800 animate-pulse rounded" />
            <div className="w-24 h-3 bg-zinc-800 animate-pulse rounded" />
          </div>
        ) : profile ? (
          <div className="flex flex-col">
            {/* Avatar Section */}
            <div className="p-6 flex flex-col items-center border-b border-zinc-800">
              <Avatar className="h-28 w-28 shadow-xl mb-4">
                <AvatarImage src={profile.profilePhoto} />
                <AvatarFallback className="text-2xl bg-zinc-800 text-zinc-400">
                  {profile.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold text-zinc-100">{profile.name}</h2>
              <p className="text-sm text-zinc-400 mt-1">{profile.bio || "No bio available"}</p>
            </div>

            {/* Info Section */}
            <div className="p-4 border-b border-zinc-800 space-y-6">
              <div className="flex items-center gap-4">
                <Mail className="h-5 w-5 text-zinc-400" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-zinc-500 tracking-wider">EMAIL ADDRESS</span>
                  <span className="text-sm text-zinc-200 mt-0.5">{profile.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Calendar className="h-5 w-5 text-zinc-400" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-zinc-500 tracking-wider">MEMBER SINCE</span>
                  <span className="text-sm text-zinc-200 mt-0.5">{format(new Date(profile.createdAt || Date.now()), "MMMM yyyy")}</span>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <BellOff className="h-5 w-5 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-200">Mute Notifications</span>
              </div>
              <Switch />
            </div>

            {/* Shared Media */}
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-zinc-100">Shared Media</h3>
                <span className="text-xs text-zinc-500">{media.length} {media.length === 1 ? 'image' : 'images'}</span>
              </div>
              
              {media.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {media.slice(0, 6).map((m: any) => (
                    <div key={m.id} className="aspect-square rounded-lg overflow-hidden bg-zinc-800 cursor-pointer transition-opacity relative group">
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
                        <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                          <span className="text-xs text-zinc-500 font-semibold uppercase">Video</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-zinc-900/50 rounded-xl text-center border border-zinc-800/50">
                  <p className="text-sm text-zinc-500">No shared photos or videos yet.</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl h-12"
                onClick={handleBlock}
              >
                <ShieldBan className="h-5 w-5 mr-3" />
                {profile.isBlocked ? "Unblock User" : "Block User"}
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl h-12"
                onClick={() => {
                  toast.error("Clear chat not implemented yet.");
                }}
              >
                <LogOut className="h-5 w-5 mr-3 rotate-180" />
                Clear Chat
              </Button>
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
