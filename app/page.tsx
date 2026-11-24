"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Plans } from "@/components/ui";
import { errMsg, waLink } from "@/lib/util";

export default function Home() {
  const { user, loading, settings, login, signup } = useApp();
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [f, setF] = useState({ name: "", email: "", pass: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) router.replace("/studio"); }, [user, router]);
  if (loading || user) return <div className="spin">⏳ লোড হচ্ছে...</div>;

  async function go() {
    const email = f.email.trim();
    if (!email || !f.pass) return setMsg("ইমেইল ও পাসওয়ার্ড দিন।");
    setBusy(true); setMsg("⏳ অপেক্ষা করুন...");
    try { isSignup ? await signup(f.name.trim(), email, f.pass) : await login(email, f.pass); setMsg(""); }
    catch (e) { setMsg("❌ " + errMsg(e)); }
    setBusy(false);
  }
  const sel = (on: boolean) => ({ outline: on ? "2px solid var(--ac)" : "" });

  return (
    <div className="wrap">
      <div className="row" style={{ padding: "6px 0" }}><span className="brand">{settings.brand}</span></div>
      <div className="hero">
        <h1>প্রিমিয়াম 4K ব্যাকগ্রাউন্ড<br />এক ক্লিকে বানান</h1>
        <p>নিয়ন, অরোরা, গ্রেডিয়েন্ট, জিওমেট্রিক — ডজনখানেক স্টাইলে 4K থেকে 8K ব্যাকগ্রাউন্ড ছবি। ফোনেই, কোনো সফটওয়্যার ছাড়া।</p>
      </div>
      <div className="card"><Plans /></div>
      <div className="card">
        <div className="row" style={{ marginBottom: 6 }}>
          <button className="sec sm" style={sel(!isSignup)} onClick={() => { setIsSignup(false); setMsg(""); }}>লগইন</button>
          <button className="sec sm" style={sel(isSignup)} onClick={() => { setIsSignup(true); setMsg(""); }}>নতুন অ্যাকাউন্ট</button>
        </div>
        {isSignup && <><label>আপনার নাম</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" /></>}
        <label>ইমেইল</label><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" inputMode="email" />
        <label>পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)</label><input type="password" value={f.pass} onChange={(e) => setF({ ...f, pass: e.target.value })} autoComplete={isSignup ? "new-password" : "current-password"} onKeyDown={(e) => e.key === "Enter" && go()} />
        <button className="full" disabled={busy} onClick={go}>{isSignup ? "অ্যাকাউন্ট খুলুন" : "লগইন করুন"}</button>
        <div className="mut" style={{ marginTop: 8 }}>{msg}</div>
        <div className="mut" style={{ marginTop: 8 }}>পাসওয়ার্ড ভুলে গেছেন? <a href={waLink(settings.whatsapp, settings.brand)} target="_blank" rel="noopener noreferrer">WhatsApp-এ যোগাযোগ করুন</a>, অ্যাডমিন নতুন পাসওয়ার্ড দেবেন।</div>
      </div>
    </div>
  );
}
