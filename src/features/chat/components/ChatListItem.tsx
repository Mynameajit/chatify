"use client";

import { formatDistanceToNow } from "date-fns";
import { Check, CheckCheck } from "lucide-react";
import { Chat, Message } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChatListItemProps {
  chat: Chat;
  isActive: boolean;
  onClick: () => void;
}

export function ChatListItem({ chat, isActive, onClick }: ChatListItemProps) {
  const { user } = useAuthStore();
  
  // Determine chat name and avatar based on type
  const isGroup = chat.type === "group";
  const otherParticipant = chat.participants.find(p => p.id !== user?.id);
  
  const chatName = isGroup ? chat.name : otherParticipant?.name;
  const chatAvatar = isGroup ? chat.avatar : otherParticipant?.avatar;
  const status = !isGroup ? otherParticipant?.status : null;
  
  const lastMessage = chat.lastMessage;
  const isMe = lastMessage?.senderId === user?.id;

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
        isActive 
          ? "bg-primary/10 dark:bg-primary/10" 
          : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
      )}
    >
      <div className="relative flex-shrink-0">
        <Avatar className="h-12 w-12 border border-zinc-200 dark:border-zinc-800">
          <AvatarImage src={chatAvatar} alt={chatName} />
          <AvatarFallback>{chatName?.charAt(0)}</AvatarFallback>
        </Avatar>
        {status === "online" && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white dark:border-zinc-900 bg-green-500 rounded-full" />
        )}
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-baseline mb-1">
          <h4 className={cn(
            "text-sm font-semibold truncate",
            isActive ? "text-primary/90 dark:text-primary/80" : "text-zinc-900 dark:text-zinc-100"
          )}>
            {chatName}
          </h4>
          {lastMessage && (
            <span className={cn(
              "text-[10px] whitespace-nowrap ml-2 flex-shrink-0",
              chat.unreadCount > 0 ? "text-primary dark:text-primary font-semibold" : "text-zinc-500"
            )}>
              {formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: false }).replace('about ', '')}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1 text-xs">
          {isMe && lastMessage && (
            <span className="text-zinc-400 flex items-center">
              {lastMessage.status === "seen" ? (
                <CheckCheck className="h-3.5 w-3.5 text-emerald-500 font-bold" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5 text-zinc-400" />
              )}
            </span>
          )}
          <p className={cn(
            "truncate flex-1",
            chat.unreadCount > 0 
              ? "text-zinc-900 dark:text-zinc-100 font-medium" 
              : "text-zinc-500 dark:text-zinc-400"
          )}>
            {isMe && "You: "}
            {lastMessage?.content || "Started a chat"}
          </p>
          
          {chat.unreadCount > 0 && (
            <Badge className="ml-2 bg-primary hover:bg-primary/90 text-white border-0 px-1.5 min-w-[20px] flex justify-center text-[10px] h-5 rounded-full flex-shrink-0">
              {chat.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
