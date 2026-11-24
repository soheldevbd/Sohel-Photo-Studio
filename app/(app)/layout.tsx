"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

const TABS = [
  ["/studio", "🎨", "স্টুডিও"], ["/guide", "📘", "প্রমট নিয়ম"], ["/tools", "🧰", "আরও টুলস"], ["/plan", "⭐", "প্ল্যান"],
] as const;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, settings, plan, isAdmin, logout } = useApp();
  const router = useRouter();
  const path = usePathname();
  useEffect(() => { if (!loading && !user) router.replace("/"); }, [loading, user, router]);
  if (loading || !user) return <div className="spin">⏳ লোড হচ্ছে...</div>;

  return (
    <>
      <div className="top">
        <div className="wrap">
          <span className="brand">{settings.brand}</span><span className="grow" />
          <span className={"badge " + (plan === "pro" ? "b-pro" : "b-free")}>{plan === "pro" ? "PRO" : "FREE"}</span>
          <button className="sec sm" onClick={logout}>বের হন</button>
        </div>
        <nav className="tabs">
          {TABS.map(([href, ic, label]) => (
            <Link key={href} href={href} className={"tab" + (path === href ? " on" : "")}><span className="ic">{ic}</span>{label}</Link>
          ))}
          {isAdmin && <Link href="/admin" className={"tab adm" + (path === "/admin" ? " on" : "")}><span className="ic">🛠</span>অ্যাডমিন</Link>}
        </nav>
      </div>
      <div className="wrap">
        {settings.notice && <div className="card" style={{ borderColor: "#d9a441" }}>{settings.notice}</div>}
        {children}
      </div>
    </>
  );
}
