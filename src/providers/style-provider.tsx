"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/useUIStore";

export function StyleProvider({ children }: { children: React.ReactNode }) {
  const { themeColor, themeRadius, themeFont } = useUIStore();

  useEffect(() => {
    const root = document.documentElement;

    // Set Radius
    root.style.setProperty("--radius", `${themeRadius}rem`);

    // Set Font Family
    let fontValue = "var(--font-geist-sans)";
    if (themeFont === "Manrope") fontValue = "'Manrope', sans-serif";
    if (themeFont === "Outfit") fontValue = "'Outfit', sans-serif";
    if (themeFont === "Inter") fontValue = "'Inter', sans-serif";
    root.style.setProperty("font-family", fontValue);

    // Color definitions (Tailwind v4 mapped to HSL values used by Shadcn)
    const themes: Record<string, { light: string, dark: string, fgLight: string, fgDark: string }> = {
      zinc: { light: "#18181b", dark: "#fafafa", fgLight: "#ffffff", fgDark: "#18181b" },
      red: { light: "#ef4444", dark: "#ef4444", fgLight: "#ffffff", fgDark: "#ffffff" },
      rose: { light: "#f43f5e", dark: "#f43f5e", fgLight: "#ffffff", fgDark: "#ffffff" },
      orange: { light: "#f97316", dark: "#f97316", fgLight: "#ffffff", fgDark: "#ffffff" },
      green: { light: "#22c55e", dark: "#22c55e", fgLight: "#ffffff", fgDark: "#ffffff" },
      blue: { light: "#3b82f6", dark: "#3b82f6", fgLight: "#ffffff", fgDark: "#ffffff" },
      yellow: { light: "#eab308", dark: "#eab308", fgLight: "#ffffff", fgDark: "#18181b" }, // Yellow needs dark text
      violet: { light: "#8b5cf6", dark: "#8b5cf6", fgLight: "#ffffff", fgDark: "#ffffff" },
    };

    if (themes[themeColor]) {
      const isDark = root.classList.contains("dark");
      const primaryColor = isDark ? themes[themeColor].dark : themes[themeColor].light;
      const primaryFg = isDark ? themes[themeColor].fgDark : themes[themeColor].fgLight;
      
      // Update primary CSS variables that shadcn uses.
      root.style.setProperty("--primary", primaryColor);
      root.style.setProperty("--primary-foreground", primaryFg);
      root.style.setProperty("--ring", primaryColor);
    }

  }, [themeColor, themeRadius, themeFont]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      window.dispatchEvent(new CustomEvent("pwa-installable"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  return <>{children}</>;
}
