"use client";

import { useState, useRef, useEffect } from "react";
import { Smile, Paperclip, Send, Mic, X, Image as ImageIcon } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import api from "@/lib/api";
import { toast } from "sonner";
import { useSocket } from "@/providers/SocketProvider";
import { Loader2 } from "lucide-react";

export function MessageInput({ chatId }: { chatId: string }) {
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node) && !showActions) {
        setShowEmoji(false);
      }
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showActions]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !selectedFile) return;

    // Fast-path: capture current input state
    const messageContent = message.trim();
    const currentSelectedFile = selectedFile;
    const optimisticId = `temp-${Date.now()}`;
    
    // Clear UI state instantly for snappy UX
    setMessage("");
    setSelectedImage(null);
    setSelectedFile(null);
    setShowEmoji(false);
    setShowActions(false);

    const { useAuthStore } = await import("@/store/useAuthStore");
    const { useChatStore } = await import("@/store/useChatStore");
    const currentUser = useAuthStore.getState().user;

    let optimisticAttachments: { id: string; type: "image" | "video" | "audio" | "document"; url: string; name: string; size: number }[] | undefined = undefined;
    if (currentSelectedFile) {
      optimisticAttachments = [{
        id: `temp-att-${Date.now()}`,
        type: currentSelectedFile.type.startsWith('video/') ? 'video' : 'image',
        url: URL.createObjectURL(currentSelectedFile),
        name: currentSelectedFile.name,
        size: currentSelectedFile.size,
      }];
    }

    // Optimistic UI Update!
    if (currentUser) {
      useChatStore.getState().addMessage(chatId, {
        id: optimisticId,
        chatId,
        senderId: currentUser.id,
        content: messageContent,
        timestamp: new Date(),
        status: 'sent',
        attachments: optimisticAttachments,
      });
      useChatStore.getState().fetchChats();
    }

    try {
      let attachments = undefined;

      if (currentSelectedFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', currentSelectedFile);
        
        const uploadRes = await api.post('/uploads/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (uploadRes.data.success) {
          attachments = [{
            url: uploadRes.data.data.url,
            type: uploadRes.data.data.type,
            size: uploadRes.data.data.bytes,
            name: currentSelectedFile.name,
          }];
        }
      }

      const isVideo = currentSelectedFile?.type.startsWith('video/');
      const messageType = currentSelectedFile ? (isVideo ? 'VIDEO' : 'IMAGE') : 'TEXT';

      const res = await api.post('/messages/send', {
        conversationId: chatId,
        content: messageContent || undefined,
        type: messageType,
        attachments
      });

      if (res.data.success) {
        const newMsg = res.data.data;
        // Swap optimistic message with the real one
        useChatStore.getState().removeMessageLocally(chatId, optimisticId);
        useChatStore.getState().addMessage(chatId, {
          id: newMsg.id,
          chatId: newMsg.conversationId,
          senderId: newMsg.senderId,
          content: newMsg.content || '',
          timestamp: new Date(newMsg.createdAt),
          status: 'seen',
          attachments: newMsg.attachments?.map((att: any) => ({
            id: att.id,
            type: att.type.toLowerCase(),
            url: att.url,
            name: att.name || 'attachment',
            size: att.size,
          })),
        });
        useChatStore.getState().fetchChats();
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to send message');
      useChatStore.getState().removeMessageLocally(chatId, optimisticId);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setSelectedFile(file);
      setShowActions(false);
    }
  };

  const onEmojiClick = (emojiObject: any) => {
    setMessage(prev => prev + emojiObject.emoji);
  };

  return (
    <div className="flex flex-col bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 relative">

      {/* Image/Video Preview Area */}
      {selectedImage && (
        <div className="p-2 md:p-4 pb-0 flex items-start">
          <div className="relative inline-block">
            {selectedFile?.type.startsWith('video/') ? (
              <video src={selectedImage} className="h-24 md:h-32 w-auto rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 shadow-sm" controls />
            ) : (
              <img src={selectedImage} alt="Preview" className="h-24 md:h-32 w-auto rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 shadow-sm" />
            )}
            <button
              onClick={() => { setSelectedImage(null); setSelectedFile(null); }}
              className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors z-10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Action Menu Popup */}
      {showActions && (
        <div ref={actionsRef} className="absolute bottom-[4.5rem] left-2 md:left-4 z-50 shadow-lg rounded-2xl overflow-hidden bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2 flex flex-col gap-2 w-48 animate-in fade-in slide-in-from-bottom-5">
          <Button
            variant="ghost"
            className="justify-start w-full text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
            onClick={() => { setShowEmoji(!showEmoji); setShowActions(false); }}
          >
            <Smile className="h-5 w-5 mr-3 text-blue-500" /> Emoji
          </Button>
          <Button
            variant="ghost"
            className="justify-start w-full text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
            onClick={() => { fileInputRef.current?.click(); }}
          >
            <Paperclip className="h-5 w-5 mr-3 text-green-500" /> Photo or Video
          </Button>
          <Button
            variant="ghost"
            className="justify-start w-full text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
            onClick={() => setShowActions(false)}
          >
            <Mic className="h-5 w-5 mr-3 text-red-500" /> Voice Message
          </Button>
        </div>
      )}

      {/* Emoji Picker Popup */}
      {showEmoji && (
        <div ref={emojiRef} className="absolute bottom-[4.5rem] left-2 md:left-4 z-50 shadow-2xl rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
          />
        </div>
      )}

      <div className="p-2 py-2 md:p-4">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="flex-1  rounded-full md:rounded-2xl flex items-center p-1 md:p-1.5 transition-colors  ">

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-9 w-9 md:h-10 md:w-10 rounded-full text-zinc-500 flex-shrink-0 transition-transform ${showActions ? "bg-zinc-200 dark:bg-zinc-700 rotate-45" : "hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
              onClick={() => {
                setShowActions(!showActions);
                if (showEmoji) setShowEmoji(false);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32 " height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus h-5 w-5"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
            </Button>

            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageSelect}
            />

            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message..."
              className="flex-1 border-0 focus-within:ring-1 focus-within:ring-primary  focus-visible:ring-0 focus-visible:ring-offset-0 px-3 md:px-4 py-2 min-h-[36px] md:min-h-[44px] text-sm md:text-base shadow-none rounded-3xl bg-zinc-100 dark:bg-zinc-800/50"
            />
          </div>

          <div className="flex shrink-0">
            <Button
              type="submit"
              size="icon"
              disabled={(!message.trim() && !selectedImage) || isUploading}
              className="h-11 w-11 md:h-12 md:w-12 rounded-full md:rounded-2xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground shadow-sm transition-all flex items-center justify-center"
            >
              {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 md:ml-1" />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
