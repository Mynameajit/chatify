"use client";

import { MessageSquareDashed } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatifyLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function ChatifyLoader({ className, size = "md" }: ChatifyLoaderProps) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
  };

  const iconSizes = {
    sm: "w-full h-full",
    md: "w-full h-full",
    lg: "w-full h-full",
    xl: "w-full h-full",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className={cn(
        "relative rounded-2xl flex items-center justify-center overflow-hidden",
        sizeClasses[size]
      )}>
        <img src="/logo.png" alt="Loading" className={cn("object-contain animate-bounce", iconSizes[size])} />
        <div className="absolute inset-0 rounded-2xl border-2 border-primary/20 animate-ping opacity-20" style={{ animationDuration: '1.5s' }} />
      </div>
      <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 animate-pulse">
        Loading...
      </span>
    </div>
  );
}
