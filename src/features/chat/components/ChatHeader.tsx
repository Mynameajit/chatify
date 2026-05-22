"use client";

import { ArrowLeft, Phone, Video, Menu } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function ChatHeader({ chatId }: { chatId: string }) {
  const { user } = useAuthStore();
  const { chats, setActiveChatId } = useChatStore();
  const { rightSidebarOpen, setRightSidebarOpen } = useUIStore();
  const router = useRouter();

  const chat = chats.find((c) => c.id === chatId) || chats.find((c) => c.type === 'direct' && c.participants.some(p => p.id === chatId));
  if (!chat) return null;

  const isGroup = chat.type === "group";
  const otherParticipant = chat.participants.find((p) => p.id !== user?.id);

  const chatName = isGroup ? chat.name : otherParticipant?.name;
  const chatAvatar = isGroup ? chat.avatar : otherParticipant?.avatar;
  const status = !isGroup ? otherParticipant?.status : null;

  const handleStartCall = (video: boolean) => {
    if (!otherParticipant) return;
    window.dispatchEvent(new CustomEvent('start-call', {
      detail: { receiverId: otherParticipant.id, video }
    }));
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden mr-1 -ml-2"
          onClick={() => {
            setActiveChatId(null);
            router.push('/');
          }}
        >
          <ArrowLeft className="h-5 w-5 text-zinc-500" />
        </Button>

        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
        >
          <div className="relative">
            <Avatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-800">
              <AvatarImage src={chatAvatar} alt={chatName} />
              <AvatarFallback>{chatName?.charAt(0)}</AvatarFallback>
            </Avatar>
            {status === "online" && (
              <span className="absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-zinc-900 bg-green-500 rounded-full" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
              {chatName}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
              {isGroup ? `${chat.participants.length} members` : status || "offline"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          onClick={() => handleStartCall(false)}
        >
          <Phone className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          onClick={() => handleStartCall(true)}
        >
          <Video className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 ${rightSidebarOpen ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : ''}`}
          onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
