import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "../lib/api";
import type { User } from "../types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<Pick<User, "name" | "theme">>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function applyTheme(theme: User["theme"]) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  root.classList.toggle("dark", dark);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    const data = await api<{ user: User }>("/api/auth/me");
    setUser(data.user);
    applyTheme(data.user.theme);
  };

  useEffect(() => {
    refreshUser()
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    applyTheme(user.theme);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme(user.theme);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        const data = await api<{ token: string; user: User }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setToken(data.token);
        setUser(data.user);
        applyTheme(data.user.theme);
      },
      async register(name, email, password) {
        const data = await api<{ token: string; user: User }>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
        setToken(data.token);
        setUser(data.user);
        applyTheme(data.user.theme);
      },
      async logout() {
        try {
          await api("/api/auth/logout", { method: "POST" });
        } catch {
          // ignore network errors on logout
        }
        setToken(null);
        setUser(null);
      },
      refreshUser,
      async updateProfile(partial) {
        const data = await api<{ user: User }>("/api/user/profile", {
          method: "PATCH",
          body: JSON.stringify(partial),
        });
        setUser(data.user);
        applyTheme(data.user.theme);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
