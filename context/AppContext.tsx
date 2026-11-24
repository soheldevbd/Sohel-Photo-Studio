"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { DEFAULTS } from "@/lib/defaults";
import type { Me, Settings } from "@/lib/types";

type AppCtx = {
  user: Me | null; settings: Settings; loading: boolean; isAdmin: boolean; plan: "pro" | "free";
  setUser: (u: Me | null) => void; setSettings: (s: Settings) => void; refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>; signup: (name: string, email: string, password: string) => Promise<void>; logout: () => Promise<void>;
  toast: (m: string) => void; modal: (n: ReactNode) => void; closeModal: () => void; modalNode: ReactNode; toastMsg: string;
};
const Ctx = createContext<AppCtx>(null as any);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [modalNode, setModalNode] = useState<ReactNode>(null);
  const tt = useRef<any>(null);

  const toast = useCallback((m: string) => { setToastMsg(m); clearTimeout(tt.current); tt.current = setTimeout(() => setToastMsg(""), 3200); }, []);
  const modal = useCallback((n: ReactNode) => setModalNode(n), []);
  const closeModal = useCallback(() => setModalNode(null), []);

  useEffect(() => {
    let dead = false;
    (async () => {
      const [s, me] = await Promise.all([api<Settings>("/api/settings").catch(() => null), api<{ user: Me | null }>("/api/auth/me").catch(() => ({ user: null }))]);
      if (dead) return;
      if (s) setSettings({ ...DEFAULTS, ...s });
      setUser(me.user); setLoading(false);
    })();
    return () => { dead = true; };
  }, []);

  const refresh = useCallback(async () => {
    const [s, me] = await Promise.all([api<Settings>("/api/settings").catch(() => null), api<{ user: Me | null }>("/api/auth/me").catch(() => ({ user: null }))]);
    if (s) setSettings({ ...DEFAULTS, ...s });
    setUser(me.user);
  }, []);
  const login = useCallback(async (email: string, password: string) => { setUser((await api<{ user: Me }>("/api/auth/login", { json: { email, password } })).user); }, []);
  const signup = useCallback(async (name: string, email: string, password: string) => { setUser((await api<{ user: Me }>("/api/auth/signup", { json: { name, email, password } })).user); }, []);
  const logout = useCallback(async () => { await api("/api/auth/logout", { method: "POST", json: {} }).catch(() => {}); setUser(null); }, []);

  const isAdmin = user?.role === "admin";
  const plan: "pro" | "free" = isAdmin ? "pro" : user && user.plan === "pro" && user.proUntil > Date.now() ? "pro" : "free";
  const value = useMemo<AppCtx>(() => ({
    user, settings, loading, isAdmin, plan, setUser, setSettings, refresh, login, signup, logout, toast, modal, closeModal, modalNode, toastMsg,
  }), [user, settings, loading, isAdmin, plan, refresh, login, signup, logout, toast, modal, closeModal, modalNode, toastMsg]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
