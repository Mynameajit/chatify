import { create } from "zustand";

interface UIState {
  isMobileSidebarOpen: boolean;
  activeSidebarTab: "chats" | "friends" | "notifications";
  rightSidebarOpen: boolean;
  themeColor: string;
  themeRadius: string;
  themeFont: string;
  chatWallpaper: string;
  unreadNotifsCount: number;
  
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (isOpen: boolean) => void;
  setActiveSidebarTab: (tab: "chats" | "friends" | "notifications") => void;
  setUnreadNotifsCount: (count: number | ((prev: number) => number)) => void;
  toggleRightSidebar: () => void;
  setRightSidebarOpen: (isOpen: boolean) => void;
  setThemeColor: (color: string) => void;
  setThemeRadius: (radius: string) => void;
  setThemeFont: (font: string) => void;
  setChatWallpaper: (wallpaper: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileSidebarOpen: false,
  activeSidebarTab: "chats",
  rightSidebarOpen: false, // For desktop right profile sidebar
  themeColor: "violet",
  themeRadius: "0.5",
  themeFont: "Inter",
  chatWallpaper: "none",
  unreadNotifsCount: 0,
  
  toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
  setMobileSidebarOpen: (isOpen) => set({ isMobileSidebarOpen: isOpen }),
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
  setUnreadNotifsCount: (count) => set((state) => ({ 
    unreadNotifsCount: typeof count === "function" ? count(state.unreadNotifsCount) : count 
  })),
  toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
  setRightSidebarOpen: (isOpen) => set({ rightSidebarOpen: isOpen }),
  setThemeColor: (color) => set({ themeColor: color }),
  setThemeRadius: (radius) => set({ themeRadius: radius }),
  setThemeFont: (font) => set({ themeFont: font }),
  setChatWallpaper: (wallpaper) => set({ chatWallpaper: wallpaper }),
}));
