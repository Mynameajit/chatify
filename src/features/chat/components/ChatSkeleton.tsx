"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { MessageInput } from "./MessageInput";

export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>

      {/* Messages Skeleton */}
      <div className="flex-1 p-4 space-y-6 overflow-hidden">
        {/* Date Separator Skeleton */}
        <div className="flex justify-center">
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>

        {/* Message from other (Left) */}
        <div className="flex gap-2 max-w-[80%]">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-16 w-64 rounded-2xl rounded-tl-sm" />
            <Skeleton className="h-3 w-12 ml-1" />
          </div>
        </div>

        {/* Message from me (Right) */}
        <div className="flex gap-2 max-w-[80%] ml-auto justify-end">
          <div className="flex flex-col gap-1 items-end">
            <Skeleton className="h-20 w-72 rounded-2xl rounded-tr-sm bg-primary/20" />
            <Skeleton className="h-3 w-16 mr-1" />
          </div>
        </div>

        {/* Message from other (Left) short */}
        <div className="flex gap-2 max-w-[80%]">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-10 w-48 rounded-2xl rounded-tl-sm" />
            <Skeleton className="h-3 w-12 ml-1" />
          </div>
        </div>

        {/* Message from me (Right) short */}
        <div className="flex gap-2 max-w-[80%] ml-auto justify-end">
          <div className="flex flex-col gap-1 items-end">
            <Skeleton className="h-12 w-40 rounded-2xl rounded-tr-sm bg-primary/20" />
            <Skeleton className="h-3 w-16 mr-1" />
          </div>
        </div>
      </div>

      {/* Message Input Skeleton - just rendering the visual shell */}
      <div className="p-2 py-2 md:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-end gap-2">
        <Skeleton className="flex-1 h-11 md:h-12 rounded-full md:rounded-2xl" />
        <Skeleton className="h-11 w-11 md:h-12 md:w-12 rounded-full md:rounded-2xl flex-shrink-0 bg-primary/20" />
      </div>
    </div>
  );
}
