import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env.PROD ? "https://comunikit-production.up.railway.app" : "http://localhost:3001");

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    studentId: string,
    name: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  initAuth: () => void;
  /**
   * Reads the HTTP-only session cookie via GET /api/auth/me and mirrors the
   * resulting user onto the store. Used by the Telegram Login Widget flow,
   * which never exposes the access_token to JS.
   */
  hydrateFromCookie: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,

  initAuth: () => {
    // First try Supabase client (email/password + GitHub OAuth sessions live
    // in localStorage there). If no Supabase session is found, fall back to
    // the cookie flow — the user may have signed in via Telegram Widget and
    // only has an HTTP-only cookie.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        set({
          session,
          user: session.user,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
        });
        if (!res.ok) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }
        const body = (await res.json()) as { data?: { user?: User } };
        if (body.data?.user) {
          set({
            session: null,
            user: body.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({ isLoading: false, isAuthenticated: false });
        }
      } catch {
        set({ isLoading: false, isAuthenticated: false });
      }
    });

    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        set({
          session,
          user: session.user,
          isAuthenticated: true,
          isLoading: false,
        });
      }
      if (event === "PASSWORD_RECOVERY") {
        // Session is active from the reset link — redirect handled by redirectTo URL
      }
    });
  },

  hydrateFromCookie: async () => {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to hydrate session from cookie");
    const body = (await res.json()) as { data?: { user?: User } };
    if (!body.data?.user) throw new Error("No user in /auth/me response");
    set({
      session: null,
      user: body.data.user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },

  signUp: async (email, password, studentId, name) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { studentId, name },
      },
    });
    if (error) throw error;
  },

  signOut: async () => {
    // Clear both possible session sources: Supabase localStorage and the
    // HTTP-only cookie set by /auth/telegram-login.
    await supabase.auth.signOut().catch(() => undefined);
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => undefined);
    set({ user: null, session: null, isAuthenticated: false });
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  refreshUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    set({ user: data.user });
  },
}));
