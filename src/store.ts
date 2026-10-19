import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "./lib/types";

interface AuthState {
  token: string | null;
  user: User | null;
  setSession: (s: { token: string; user: User }) => void;
  setUser: (u: User) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: ({ token, user }) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: "folio-auth" },
  ),
);

export const isEditor = (u?: User | null) => u?.role === "editor" || u?.role === "admin";
