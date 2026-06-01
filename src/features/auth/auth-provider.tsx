"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { clearAdminToken, getAdminMe, setAdminClerkTokenProvider, setAdminToken } from "@/lib/admin-api";

type AdminUser = {
  id?: string | number;
  email?: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
};

type AuthStatus = "idle" | "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  user: AdminUser | null;
  status: AuthStatus;
  persistForTab: boolean;
  setPersistForTab: (persist: boolean) => void;
  acceptToken: (token: string) => void;
  refreshMe: (tokenOverride?: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_TOKEN_STORAGE_KEY = "aniyume-admin-session-token";
const CLERK_JWT_TEMPLATE = process.env.NEXT_PUBLIC_CLERK_JWT_TEMPLATE || undefined;

function readSessionToken() {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(SESSION_TOKEN_STORAGE_KEY) ?? "";
}

function writeSessionToken(token: string) {
  if (typeof window === "undefined") return;
  if (token) window.sessionStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token);
  else window.sessionStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn } = useClerkAuth();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [persistForTab, setPersistForTab] = useState(false);

  const acceptToken = useCallback((token: string) => {
    setAdminToken(token);
  }, []);

  const clearAuth = useCallback(() => {
    clearAdminToken();
    writeSessionToken("");
    setUser(null);
    setStatus("anonymous");
  }, []);

  const refreshMe = useCallback(
    async (tokenOverride?: string) => {
      const token = tokenOverride ?? readSessionToken();
      if (token) setAdminToken(token);

      setAdminClerkTokenProvider(isSignedIn ? () => getToken({ template: CLERK_JWT_TEMPLATE }) : null);

      setStatus("loading");
      const result = await getAdminMe();

      if (!result.ok) {
        if (token) clearAdminToken();
        writeSessionToken("");
        setUser(null);
        setStatus("anonymous");
        return { ok: false as const, message: result.message };
      }

      if (tokenOverride !== undefined) writeSessionToken(persistForTab ? tokenOverride : "");

      // The read API shape may evolve. Keep this shell permissive and let runtime data drive UI later.
      setUser(result.data as AdminUser);
      setStatus("authenticated");
      return { ok: true as const };
    },
    [getToken, isSignedIn, persistForTab],
  );

  const value = useMemo(
    () => ({ user, status, persistForTab, setPersistForTab, acceptToken, refreshMe, clearAuth }),
    [acceptToken, clearAuth, persistForTab, refreshMe, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
