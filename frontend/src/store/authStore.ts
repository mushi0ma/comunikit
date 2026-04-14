import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { BASE_URL as API_URL } from "@/lib/api";

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
        // Proactively refresh if the JWT is expired or about to expire.
        if (session.expires_at && session.expires_at * 1000 < Date.now() + 60_000) {
          const { data: refreshed } = await supabase.auth.refreshSession();
          session = refreshed.session;
          if (!session) {
            // Refresh token is also invalid — force re-login.
            set({ isLoading: false, isAuthenticated: false });
            return;
          }
        }
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
    // Try Supabase JS session first (email/password + GitHub OAuth).
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) {
        set({ user: data.user });
        return;
      }
    }

    // Fallback: cookie-based Telegram session — hydrate from /api/auth/me
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        credentials: "include",
      });
      if (res.ok) {
        const body = (await res.json()) as { data?: { user?: User } };
        if (body.data?.user) {
          set({ user: body.data.user });
          return;
        }
      }
    } catch {
      // Ignore — user may need to re-login
    }
  },
}));
