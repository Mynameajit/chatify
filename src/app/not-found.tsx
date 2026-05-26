"use client";

import Link from "next/link";
import { Ghost, Home, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 text-center">
      <div className="relative mb-8 group">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-500"></div>
        <div className="h-40 w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] shadow-xl flex items-center justify-center relative z-10 animate-bounce hover:scale-105 transition-transform duration-300">
          <Ghost className="h-20 w-20 text-primary opacity-80" strokeWidth={1.5} />
        </div>
        
        {/* Floating elements */}
        <div className="absolute -top-6 -right-6 h-12 w-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full flex items-center justify-center shadow-lg animate-pulse delay-75 z-20">
          <span className="font-bold text-lg text-primary">4</span>
        </div>
        <div className="absolute -bottom-4 -left-4 h-16 w-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full flex items-center justify-center shadow-lg animate-pulse delay-150 z-20">
          <span className="font-bold text-2xl text-primary">0</span>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 -right-12 h-14 w-14 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full flex items-center justify-center shadow-lg animate-pulse delay-300 z-20">
          <span className="font-bold text-xl text-primary">4</span>
        </div>
      </div>
      
      <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-zinc-100 mb-4 tracking-tight">
        Oops! Page not found
      </h1>
      
      <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-10 text-lg">
        It seems you've wandered into the void. The page you're looking for doesn't exist or has been moved.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Button 
          onClick={() => router.back()} 
          variant="outline" 
          className="rounded-full px-8 py-6 h-auto text-base font-semibold shadow-sm w-full sm:w-auto"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Go Back
        </Button>
        <Link href="/" className="w-full sm:w-auto">
          <Button 
            className="rounded-full px-8 py-6 h-auto text-base font-semibold shadow-lg shadow-primary/25 w-full"
          >
            <Home className="h-5 w-5 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
