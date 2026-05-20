"use client";

import { X, Image as ImageIcon, FileText, Link as LinkIcon, BellRing, UserMinus, Ban, LogOut, Mail, Calendar } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { useUIStore } from "@/store/useUIStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

export function RightSidebar() {
  const { user, logout } = useAuthStore();
  const { chats, activeChatId, messages } = useChatStore();
  const { setRightSidebarOpen } = useUIStore();

  const chat = chats.find((c) => c.id === activeChatId);
  const otherParticipant: any = chat?.participants.find((p) => p.id !== user?.id);

  const name = chat?.type === "group" ? chat.name : otherParticipant?.name;
  const avatar = chat?.type === "group" ? chat.avatar : otherParticipant?.avatar;
  const bio = chat?.type === "group" ? "Group Chat" : otherParticipant?.bio;
  const email = chat?.type === "group" ? undefined : otherParticipant?.email;
  const joinedDate = chat?.type === "group" ? undefined : otherParticipant?.createdAt;

  // Retrieve shared image attachments dynamically from this chat room
  const chatMessages = messages[activeChatId || ""] || [];
  const sharedImages = chatMessages
    .flatMap((m) => m.attachments || [])
    .filter((att) => att.type === "image");

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Contact Info</h3>
        <Button variant="ghost" size="icon" onClick={() => setRightSidebarOpen(false)}>
          <X className="h-5 w-5 text-zinc-500" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 flex flex-col items-center border-b border-zinc-200 dark:border-zinc-800">
          <Avatar className="h-24 w-24 mb-4 border-2 border-white dark:border-zinc-900 shadow-xl bg-white dark:bg-zinc-900">
            <AvatarImage src={avatar} />
            <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
              {name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{name}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mt-1">{bio || "No bio available"}</p>
        </div>

        <div className="p-4 space-y-6">
          
          {/* User Details */}
          {chat?.type !== "group" && otherParticipant && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                <Mail className="h-4.5 w-4.5 text-zinc-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Email Address</span>
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{email || "No email"}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                <Calendar className="h-4.5 w-4.5 text-zinc-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Member Since</span>
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {joinedDate ? format(new Date(joinedDate), "MMMM yyyy") : "May 2026"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Separator className="bg-zinc-200 dark:bg-zinc-800" />

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                <BellRing className="h-5 w-5 text-zinc-400" />
                <span className="text-sm font-medium">Mute Notifications</span>
              </div>
              <Switch />
            </div>
          </div>

          <Separator className="bg-zinc-200 dark:bg-zinc-800" />

          {/* Shared Media */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Shared Media</h4>
              <span className="text-xs text-zinc-500 font-medium">{sharedImages.length} images</span>
            </div>
            
            {sharedImages.length === 0 ? (
              <p className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 text-center">
                No shared photos or videos yet.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {sharedImages.slice(0, 9).map((att: any, idx) => (
                  <a
                    key={att.id || idx}
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-square rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-zinc-200/40 dark:border-zinc-800 shadow-sm relative group"
                  >
                    <img src={att.url} alt="Media" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <Separator className="bg-zinc-200 dark:bg-zinc-800" />

          {/* Danger Zone */}
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl font-semibold">
              <Ban className="h-4 w-4 mr-2" />
              Block User
            </Button>
            <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl font-semibold">
              <LogOut className="h-4 w-4 mr-2" />
              Clear Chat
            </Button>
          </div>
          
          <Separator className="bg-zinc-200 dark:bg-zinc-800" />
          
          <div className="space-y-2 pt-1">
            <Button variant="outline" className="w-full justify-start rounded-xl font-semibold" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
