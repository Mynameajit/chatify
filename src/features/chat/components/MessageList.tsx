"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { cn, downloadMedia } from "@/lib/utils";
import { 
  CheckCheck, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  X, 
  ZoomIn, 
  ZoomOut, 
  Play,
  Download
} from "lucide-react";

export function MessageList({ chatId }: { chatId: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const { 
    messages, 
    fetchMessages, 
    loadMoreMessages, 
    isLoadingFirstPage, 
    isLoadingMore, 
    hasMore 
  } = useChatStore();

  const chatMessages = messages[chatId] || [];

  // Compiles a list of all images and videos in sequence for the lightbox
  const allMedia = chatMessages
    .flatMap((m) =>
      (m.attachments || []).map((att) => ({
        id: att.id,
        url: att.url,
        type: att.type,
        name: att.name,
        messageId: m.id,
      }))
    )
    .filter((media) => media.type === "image" || media.type === "video");

  // Lightbox States
  const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  const handleNext = () => {
    if (activeMediaIndex !== null && activeMediaIndex < allMedia.length - 1) {
      setActiveMediaIndex(activeMediaIndex + 1);
      setZoomScale(1);
    }
  };

  const handlePrev = () => {
    if (activeMediaIndex !== null && activeMediaIndex > 0) {
      setActiveMediaIndex(activeMediaIndex - 1);
      setZoomScale(1);
    }
  };

  const toggleFullscreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const lightboxEl = document.getElementById("lightbox-container");
    if (!lightboxEl) return;

    if (!document.fullscreenElement) {
      lightboxEl.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => console.error("Fullscreen error", err));
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Keyboard navigation & Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeMediaIndex === null) return;
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") {
        setActiveMediaIndex(null);
        setZoomScale(1);
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeMediaIndex]);

  // Synchronize fullscreen exit state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    fetchMessages(chatId);
  }, [chatId, fetchMessages]);

  const prevChatIdRef = useRef(chatId);
  const prevMessagesLengthRef = useRef(chatMessages.length);
  const prevLoadingFirstPageRef = useRef(!!isLoadingFirstPage[chatId]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const isChatChanged = prevChatIdRef.current !== chatId;
    const isNewMessageAdded = chatMessages.length > prevMessagesLengthRef.current;
    
    const wasLoadingFirstPage = prevLoadingFirstPageRef.current;
    const finishedLoadingFirstPage = wasLoadingFirstPage && !isLoadingFirstPage[chatId];

    if (isChatChanged || finishedLoadingFirstPage) {
      // Chat changed or finished loading first page: scroll to bottom instantly!
      container.scrollTop = container.scrollHeight;
      prevChatIdRef.current = chatId;
    } else if (isNewMessageAdded) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      const isMe = lastMessage?.senderId === user?.id;

      // Check if user was scrolled near bottom (within 200px)
      const isNearBottom = container.scrollHeight - container.clientHeight - container.scrollTop < 200;

      if (isMe || isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }

    prevMessagesLengthRef.current = chatMessages.length;
    prevLoadingFirstPageRef.current = !!isLoadingFirstPage[chatId];
  }, [chatMessages, chatId, isLoadingFirstPage[chatId], user?.id]);

  // Handle load-on-scroll-up
  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (container.scrollTop < 50) {
      const hasMoreForChat = hasMore[chatId];
      const loadingMoreForChat = isLoadingMore[chatId];
      if (hasMoreForChat && !loadingMoreForChat) {
        const prevScrollHeight = container.scrollHeight;
        await loadMoreMessages(chatId);
        // Maintain exact scroll position after prepending older messages
        setTimeout(() => {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }, 0);
      }
    }
  };

  const currentMedia = activeMediaIndex !== null ? allMedia[activeMediaIndex] : null;

  // First page loading state (Skeleton selection screen placeholder)
  if (isLoadingFirstPage[chatId]) {
    return (
      <div className="flex-1 p-6 space-y-6 overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/30 flex flex-col justify-end">
        <div className="flex justify-center">
          <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-full" />
        </div>
        <div className="flex gap-2 max-w-[80%]">
          <div className="flex flex-col gap-1.5">
            <div className="h-16 w-64 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-2xl rounded-tl-sm" />
            <div className="h-3 w-12 bg-zinc-150 dark:bg-zinc-850 animate-pulse rounded-full ml-1" />
          </div>
        </div>
        <div className="flex gap-2 max-w-[80%] ml-auto justify-end">
          <div className="flex flex-col gap-1.5 items-end">
            <div className="h-20 w-72 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-2xl rounded-tr-sm" />
            <div className="h-3 w-16 bg-zinc-150 dark:bg-zinc-850 animate-pulse rounded-full mr-1" />
          </div>
        </div>
        <div className="flex gap-2 max-w-[80%]">
          <div className="flex flex-col gap-1.5">
            <div className="h-10 w-48 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-2xl rounded-tl-sm" />
            <div className="h-3 w-12 bg-zinc-150 dark:bg-zinc-850 animate-pulse rounded-full ml-1" />
          </div>
        </div>
        <div className="flex gap-2 max-w-[80%] ml-auto justify-end">
          <div className="flex flex-col gap-1.5 items-end">
            <div className="h-12 w-40 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-2xl rounded-tr-sm" />
            <div className="h-3 w-16 bg-zinc-150 dark:bg-zinc-850 animate-pulse rounded-full mr-1" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-6 bg-zinc-50/50 dark:bg-zinc-950/30 relative"
    >
      {/* Small loading spinner when loading older messages */}
      {isLoadingMore[chatId] && (
        <div className="flex justify-center py-2 select-none animate-in fade-in duration-300">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin shadow-sm" />
        </div>
      )}
      {chatMessages.map((msg, index) => {
        const isMe = msg.senderId === user?.id;

        // Simple date separator logic
        const showDate = index === 0 ||
          new Date(chatMessages[index - 1].timestamp).toDateString() !== new Date(msg.timestamp).toDateString();

        return (
          <div key={msg.id} className="flex flex-col">
            {showDate && (
              <div className="flex justify-center my-4">
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-200/50 dark:bg-zinc-850 px-3 py-1 rounded-full shadow-sm border border-zinc-200/20 dark:border-zinc-800/40">
                  {format(new Date(msg.timestamp), 'MMMM d, yyyy')}
                </span>
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-0 max-w-[83%]",
                isMe ? "self-end flex-row-reverse" : "self-start"
              )}
            >
              <div className={cn(
                "flex flex-col gap-0",
                isMe ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "px-3 py-2 rounded-2xl relative group shadow-sm",
                  isMe
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-100 dark:border-zinc-800/60 rounded-bl-sm"
                )}>
                  {/* Attachments Section */}
                  {msg.attachments?.map((att) => {
                    const mediaIndex = allMedia.findIndex((m) => m.id === att.id);
                    return (
                      <div key={att.id} className="mb-2 max-w-[240px] sm:max-w-[320px] rounded-xl overflow-hidden cursor-pointer hover:brightness-95 transition-all shadow-sm border border-white/10 relative group/media">
                        {att.type === 'image' && (
                          <img
                            src={att.url}
                            alt={att.name}
                            onClick={() => mediaIndex !== -1 && setActiveMediaIndex(mediaIndex)}
                            className="w-full h-full object-cover max-h-[220px]"
                          />
                        )}
                        {att.type === 'video' && (
                          <div 
                            onClick={() => mediaIndex !== -1 && setActiveMediaIndex(mediaIndex)}
                            className="relative flex items-center justify-center bg-black/40 min-h-[140px]"
                          >
                            <video
                              src={att.url}
                              className="w-full max-h-[220px] object-cover pointer-events-none"
                              muted
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover/media:bg-black/50 transition-colors">
                              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 group-hover/media:scale-110 transition-transform shadow-lg">
                                <Play className="w-6 h-6 fill-white ml-0.5" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {msg.content && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap pr-1">{msg.content}</p>
                  )}

                  <div className={cn(
                    "flex items-center gap-1.5 mt-1 justify-end select-none",
                    isMe ? "text-zinc-100/90" : "text-zinc-400"
                  )}>
                    <span className="text-[9px] font-medium tracking-wide">
                      {format(new Date(msg.timestamp), 'HH:mm')}
                    </span>
                    {/* Read Receipts Tick Logic */}
                    {isMe && (
                      <span className="flex items-center">
                        {msg.status === 'sending' ? (
                          <Clock className="h-3 w-3 opacity-80 animate-pulse text-white" />
                        ) : msg.status === 'seen' ? (
                          <CheckCheck className="h-3.5 w-3.5 text-emerald-300 font-bold drop-shadow-sm" />
                        ) : (
                          <CheckCheck className="h-3.5 w-3.5 text-zinc-300/70" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        );
      })}

      {/* Lightbox Pop-up Modal */}
      <AnimatePresence>
        {activeMediaIndex !== null && currentMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id="lightbox-container"
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between"
            onClick={() => {
              setActiveMediaIndex(null);
              setZoomScale(1);
              if (document.fullscreenElement) {
                document.exitFullscreen();
              }
            }}
          >
            {/* Header controls */}
            <div 
              className="flex justify-between items-center p-4 bg-gradient-to-b from-black/60 to-transparent w-full z-10 select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col text-white">
                <span className="text-sm font-semibold truncate max-w-[200px] sm:max-w-md">
                  {currentMedia.name || `Attachment ${activeMediaIndex + 1}`}
                </span>
                <span className="text-xs text-zinc-400">
                  {activeMediaIndex + 1} / {allMedia.length}
                </span>
              </div>

              {/* Controls bar */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setZoomScale(prev => Math.min(prev + 0.25, 3))}
                  className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setZoomScale(prev => Math.max(prev - 0.25, 0.75))}
                  className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentMedia) {
                      downloadMedia(currentMedia.url, currentMedia.name || `attachment_${currentMedia.id}`);
                    }
                  }}
                  className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setActiveMediaIndex(null);
                    setZoomScale(1);
                    if (document.fullscreenElement) {
                      document.exitFullscreen();
                    }
                  }}
                  className="p-2.5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all active:scale-95"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Center Content Section */}
            <div className="flex-1 w-full flex items-center justify-center relative p-4">
              {/* Previous Nav */}
              {activeMediaIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="absolute left-6 z-20 p-4 rounded-full bg-black/40 text-white/80 hover:text-white border border-white/10 hover:bg-black/60 transition-all hover:scale-105 active:scale-95"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Media Container with scale transformation */}
              <div 
                className="max-w-[90vw] max-h-[75vh] flex items-center justify-center overflow-hidden transition-transform duration-200"
                style={{ transform: `scale(${zoomScale})` }}
                onClick={(e) => e.stopPropagation()}
              >
                {currentMedia.type === "image" ? (
                  <img
                    src={currentMedia.url}
                    alt="Lightbox Preview"
                    className="max-w-full max-h-[75vh] rounded-lg shadow-2xl object-contain"
                  />
                ) : (
                  <video
                    src={currentMedia.url}
                    className="max-w-full max-h-[75vh] rounded-lg shadow-2xl"
                    controls
                    autoPlay
                  />
                )}
              </div>

              {/* Next Nav */}
              {activeMediaIndex < allMedia.length - 1 && (
                <button
                  onClick={handleNext}
                  className="absolute right-6 z-20 p-4 rounded-full bg-black/40 text-white/80 hover:text-white border border-white/10 hover:bg-black/60 transition-all hover:scale-105 active:scale-95"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Footer thumbnails or gap helper */}
            <div className="p-4 bg-gradient-to-t from-black/60 to-transparent w-full text-center text-xs text-zinc-500 select-none">
              Press Esc to close, Arrow keys to navigate
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
