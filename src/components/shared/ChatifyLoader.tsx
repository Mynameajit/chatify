"use client";

import { MessageSquareDashed } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatifyLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ChatifyLoader({ className, size = "md" }: ChatifyLoaderProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className={cn(
        "relative rounded-2xl bg-primary/10 flex items-center justify-center",
        sizeClasses[size]
      )}>
        <MessageSquareDashed className={cn("text-primary animate-pulse", iconSizes[size])} />
        <div className="absolute inset-0 rounded-2xl border-2 border-primary/20 animate-ping opacity-20" style={{ animationDuration: '1.5s' }} />
      </div>
      <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 animate-pulse">
        Loading...
      </span>
    </div>
  );
}
