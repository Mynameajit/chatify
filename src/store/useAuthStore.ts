import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        try {
          const { useChatStore } = require('./useChatStore');
          useChatStore.getState().setChats([]);
        } catch (e) {
          console.error('Failed to clear chat store on logout', e);
        }
      },
      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "auth-storage", // name of the item in the storage (must be unique)
    }
  )
);
