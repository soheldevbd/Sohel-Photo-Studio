"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { errMsg, fd, getPlans } from "@/lib/util";
import { api } from "@/lib/api";
import type { Me, Payment, Plan, Tool } from "@/lib/types";
import { DEFAULTS } from "@/lib/defaults";

type Tab = "pays" | "users" | "settings";

export default function Admin() {
  const { isAdmin, loading } = useApp();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pays");
  useEffect(() => { if (!loading && !isAdmin) router.replace("/studio"); }, [loading, isAdmin, router]);
  if (!isAdmin) return null;
  return (
    <>
      <div className="card"><div className="row">
        <button className="sec sm" onClick={() => setTab("pays")}>💳 পেমেন্ট</button>
        <button className="sec sm" onClick={() => setTab("users")}>👥 ইউজার</button>
        <button className="sec sm" onClick={() => setTab("settings")}>⚙ সেটিংস</button>
      </div></div>
      {tab === "pays" && <Payments />}
      {tab === "users" && <Users />}
      {tab === "settings" && <SettingsForm />}
    </>
  );
}

/* ---------------- payments ---------------- */
function Payments() {
  const { settings, toast } = useApp();
  const plans = getPlans(settings);
  const [all, setAll] = useState<Payment[] | null>(null), [filter, setFilter] = useState("pending"), [err, setErr] = useState("");
  const load = async () => {
    try { setAll((await api<{ payments: Payment[] }>("/api/admin/payments")).payments); setErr(""); } catch (e) { setErr(errMsg(e)); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function act(p: Payment, action: "approve" | "reject") {
    try { await api(`/api/admin/payments/${p.id}`, { json: { action } }); toast(action === "approve" ? "✅ Pro করা হয়েছে" : "বাতিল করা হয়েছে"); load(); }
    catch (e) { toast(errMsg(e)); load(); }
  }
  const warn = (p: Payment) => { const pl = plans.find((x) => x.name === p.planName); return pl && +pl.price !== +(p.price as number) ? ` ⚠ এখন প্ল্যানের দাম ৳${pl.price}` : !pl && p.planName ? " ⚠ প্ল্যান এখন তালিকায় নেই" : ""; };

  const ap = (all || []).filter((p) => p.status === "approved"), pn = (all || []).filter((p) => p.status === "pending");
  const list = filter === "all" ? all || [] : (all || []).filter((p) => p.status === filter);
  return (
    <div className="card">
      <div className="row"><h3 className="grow">পেমেন্ট অনুরোধ</h3>
        <select style={{ width: "auto" }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="pending">পেন্ডিং</option><option value="approved">অনুমোদিত</option><option value="rejected">বাতিল</option><option value="all">সব</option></select></div>
      <div className="item" style={{ marginTop: 8 }}>⏳ পেন্ডিং: <b>{pn.length}</b> • ✅ মোট সাবস্ক্রিপশন বিক্রি: <b>{ap.length}</b> • আয় ≈ <b>৳{ap.reduce((t, p) => t + (+(p.price as number) || 0), 0)}</b></div>
      {err ? <div className="mut">{err}</div> : all === null ? <div className="mut">⏳</div> : list.length ? list.map((p) => (
        <div className="item" key={p.id}>
          <div className="row"><span className={"badge b-" + p.status}>{p.status}</span><b>{p.trxId}</b><span className="grow" /><span className="meta">{fd(p.createdAt)}</span></div>
          <div className="meta">{p.email} • বিকাশ: {p.sender}{p.planName ? ` • ${p.planName} ৳${p.price}${warn(p)}` : ""}</div>
          {p.status === "pending" && <div className="row" style={{ marginTop: 8 }}>
            <button className="ok sm" onClick={() => act(p, "approve")}>✔ অনুমোদন (+{p.days} দিন Pro)</button>
            <button className="bad sm" onClick={() => act(p, "reject")}>✖ বাতিল</button></div>}
        </div>
      )) : <div className="mut">কিছু নেই।</div>}
    </div>
  );
}

/* ---------------- users ---------------- */
function Users() {
  const { user, settings, toast, refresh, modal, closeModal } = useApp();
  const plans = getPlans(settings);
  const [all, setAll] = useState<Me[] | null>(null), [q, setQ] = useState(""), [fl, setFl] = useState("all"), [err, setErr] = useState("");
  const load = async () => {
    try { setAll((await api<{ users: Me[] }>("/api/admin/users")).users); setErr(""); } catch (e) { setErr(errMsg(e)); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const now = Date.now(), DAY = 86400000, isPro = (u: Me) => u.role === "admin" || (u.plan === "pro" && u.proUntil > now);
  async function act(u: Me, k: string) {
    try {
      let days: number | undefined;
      if (k === "ban" && !confirm("এই ইউজারকে ব্যান করবেন?")) return;
      if (k === "resetPassword" && !confirm("এই ইউজারের নতুন অস্থায়ী পাসওয়ার্ড তৈরি করবেন? পুরোনো সেশন বন্ধ হয়ে যাবে।")) return;
      if (k === "days") {
        days = parseInt(prompt("কত দিনের Pro দেবেন? (যেমন 7, 30, 90)", "30") || "", 10);
        if (!days || days < 1 || days > 800) return;
      }
      const r = await api<{ tempPassword?: string }>(`/api/admin/users/${u.id}`, { method: "PATCH", json: { action: k, days } });
      if (r.tempPassword) modal(<><h2>🔑 নতুন পাসওয়ার্ড</h2><p className="mut">{u.email}-কে এটা জানান। এটা আর দেখানো হবে না।</p><div className="codebox" style={{ fontSize: 18, userSelect: "all" }}>{r.tempPassword}</div><button className="full" onClick={closeModal}>ঠিক আছে</button></>);
      else toast("✅ হয়েছে");
      await load();
      if (u.id === user?.id) await refresh();
    } catch (e) { toast(errMsg(e)); }
  }
  const users = all || [];
  const proN = users.filter(isPro).length, today = users.filter((u) => now - (u.lastLogin || 0) < DAY).length, banned = users.filter((u) => u.banned).length;
  const list = users.filter((u) => (!q.trim() || (u.email || "").toLowerCase().includes(q.trim().toLowerCase())) && (fl === "all" || (fl === "banned" ? !!u.banned : (fl === "pro") === isPro(u))));
  return (
    <div className="card">
      <div className="row"><h3 className="grow">ইউজার</h3><input placeholder="ইমেইল খুঁজুন" style={{ width: "45%" }} value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <select style={{ marginTop: 8 }} value={fl} onChange={(e) => setFl(e.target.value)}>
        <option value="all">সব ইউজার</option><option value="pro">শুধু Pro (সাবস্ক্রাইবার)</option><option value="free">শুধু Free</option><option value="banned">শুধু ব্যান</option></select>
      <div className="mut" style={{ marginTop: 6 }}>মোট {users.length} জন • Pro {proN} • Free {users.length - proN} • গত ২৪ ঘণ্টায় লগইন {today} • ব্যান {banned}</div>
      {err ? <div className="mut">{err}</div> : all === null ? <div>⏳</div> : list.length ? list.map((u) => (
        <div className="item" key={u.id}>
          <div className="row"><b className="grow" style={{ wordBreak: "break-all" }}>{u.email}</b>{u.role === "admin" && <span className="badge b-approved">ADMIN</span>}{u.banned && <span className="badge b-rejected">BANNED</span>}<span className={"badge " + (isPro(u) ? "b-pro" : "b-free")}>{isPro(u) ? "PRO" : "FREE"}</span></div>
          <div className="meta">{u.name || ""} • যোগ: {fd(u.createdAt)} • শেষ লগইন: {fd(u.lastLogin)} • ট্রায়াল: {u.used1080 || 0}{u.plan === "pro" ? " • মেয়াদ: " + fd(u.proUntil) : ""}</div>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="ok sm" onClick={() => act(u, "pro")}>+{plans[0].days} দিন Pro</button>
            <button className="sec sm" onClick={() => act(u, "free")}>Free করুন</button>
            <button className="sec sm" onClick={() => act(u, "reset")}>কাউন্ট রিসেট</button>
            <button className="sec sm" onClick={() => act(u, "days")}>📅 দিন দিন</button>
            <button className="sec sm" onClick={() => act(u, "resetPassword")}>🔑 পাসওয়ার্ড রিসেট</button>
            {u.role !== "admin" && (u.banned ? <button className="ok sm" onClick={() => act(u, "unban")}>✅ আনব্যান</button> : <button className="bad sm" onClick={() => act(u, "ban")}>🚫 ব্যান</button>)}
          </div>
        </div>
      )) : <div className="mut">কেউ নেই।</div>}
    </div>
  );
}

/* ---------------- settings ---------------- */
function SettingsForm() {
  const { settings, setSettings, toast } = useApp();
  const [f, setF] = useState({ brand: settings.brand, whatsapp: settings.whatsapp, bkash: settings.bkash, free1080Limit: settings.free1080Limit, ticker: settings.ticker || "", notice: settings.notice || "", guide: settings.guide, promptTemplate: settings.promptTemplate });
  const [plans, setPlans] = useState<Plan[]>(getPlans(settings).map((p) => ({ ...p })));
  const [tools, setTools] = useState<Tool[]>((settings.tools || []).map((t) => ({ ...t })));
  const [msg, setMsg] = useState("");
  const setP = (i: number, patch: Partial<Plan>) => setPlans((a) => a.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const setT = (i: number, patch: Partial<Tool>) => setTools((a) => a.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  async function save() {
    const o = {
      brand: f.brand.trim() || DEFAULTS.brand, whatsapp: f.whatsapp.trim(), bkash: f.bkash.trim(),
      plans: plans.length ? plans.map((p) => ({ name: p.name.trim() || "Pro", price: +p.price || 0, oldPrice: +(p.oldPrice as number) || 0, days: +p.days || 30, features: (p.features || "").trim() })) : DEFAULTS.plans,
      tools: tools.filter((t) => t.name?.trim()).map((t) => ({ icon: t.icon?.trim() || "🧰", tag: (t.tag || "").trim(), name: t.name.trim(), short: (t.short || "").trim(), details: (t.details || "").trim(), url: (t.url || "").trim() })),
      ticker: f.ticker.trim(), free1080Limit: +f.free1080Limit || 0, notice: f.notice.trim(), guide: f.guide, promptTemplate: f.promptTemplate,
    };
    try { const r = await api<{ settings: typeof settings }>("/api/admin/settings", { method: "PUT", json: o }); setSettings({ ...settings, ...r.settings }); setMsg("✅ সেভ হয়েছে"); toast("সেভ হয়েছে"); } catch (e) { setMsg("❌ " + errMsg(e)); }
  }
  const area = { fontFamily: "inherit", fontSize: 14 } as const;
  return (
    <div className="card"><h3>সাইট সেটিংস</h3>
      <label>সাইটের নাম (ব্র্যান্ড)</label><input value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} />
      <div className="grid2">
        <div><label>WhatsApp নম্বর</label><input value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></div>
        <div><label>বিকাশ নম্বর</label><input value={f.bkash} onChange={(e) => setF({ ...f, bkash: e.target.value })} /></div>
        <div><label>ফ্রি ট্রায়াল ছবি (720p-র উপরে, 4K সহ)</label><input type="number" value={f.free1080Limit} onChange={(e) => setF({ ...f, free1080Limit: +e.target.value })} /></div>
      </div>

      <h3 style={{ marginTop: 14 }}>💎 সাবস্ক্রিপশন প্ল্যান</h3>
      <div className="mut">যত খুশি প্ল্যান যোগ করুন (যেমন ১ মাস, ৩ মাস, ১ বছর)। ইউজার পছন্দের প্ল্যান বেছে নেবে।</div>
      {plans.map((p, i) => (
        <div className="item" key={i}>
          <label>প্ল্যানের নাম</label><input value={p.name} onChange={(e) => setP(i, { name: e.target.value })} />
          <div className="grid2">
            <div><label>আসল দাম (কাটা দাম, ঐচ্ছিক)</label><input type="number" value={p.oldPrice || ""} placeholder="যেমন 299" onChange={(e) => setP(i, { oldPrice: +e.target.value })} /></div>
            <div><label>ছাড়ের পর দাম (৳)</label><input type="number" value={p.price} onChange={(e) => setP(i, { price: +e.target.value })} /></div>
            <div><label>কত দিনের</label><input type="number" value={p.days} onChange={(e) => setP(i, { days: +e.target.value })} /></div>
          </div>
          <label>ফিচার (এক লাইনে)</label><input value={p.features || ""} onChange={(e) => setP(i, { features: e.target.value })} />
          <button className="bad sm" style={{ marginTop: 8 }} onClick={() => setPlans((a) => a.filter((_, j) => j !== i))}>🗑 এই প্ল্যান মুছুন</button>
        </div>
      ))}
      <button className="sec sm" style={{ marginTop: 8 }} onClick={() => setPlans((a) => [...a, { name: "নতুন প্ল্যান", price: 199, oldPrice: 0, days: 30, features: "" }])}>➕ নতুন প্ল্যান যোগ করুন</button>

      <h3 style={{ marginTop: 14 }}>🧰 আরও টুলস (ইউজার "আরও টুলস" ট্যাবে দেখবে)</h3>
      {tools.map((x, i) => (
        <div className="item" key={i}>
          <div className="grid2">
            <div><label>আইকন (ইমোজি)</label><input value={x.icon || ""} onChange={(e) => setT(i, { icon: e.target.value })} /></div>
            <div><label>ট্যাগ (যেমন Free/নতুন)</label><input value={x.tag || ""} onChange={(e) => setT(i, { tag: e.target.value })} /></div>
          </div>
          <label>টুলের নাম</label><input value={x.name || ""} onChange={(e) => setT(i, { name: e.target.value })} />
          <label>ছোট বর্ণনা (কার্ডে দেখাবে)</label><input value={x.short || ""} onChange={(e) => setT(i, { short: e.target.value })} />
          <label>বিস্তারিত (ক্লিক করলে দেখাবে)</label><textarea style={{ ...area, minHeight: 90 }} value={x.details || ""} onChange={(e) => setT(i, { details: e.target.value })} />
          <label>লিংক (https://...)</label><input value={x.url || ""} placeholder="https://" onChange={(e) => setT(i, { url: e.target.value })} />
          <button className="bad sm" style={{ marginTop: 8 }} onClick={() => setTools((a) => a.filter((_, j) => j !== i))}>🗑 মুছুন</button>
        </div>
      ))}
      <button className="sec sm" style={{ marginTop: 8 }} onClick={() => setTools((a) => [...a, { icon: "🧰", name: "নতুন টুল", short: "", details: "", url: "", tag: "" }])}>➕ নতুন টুল যোগ করুন</button>

      <label>🔔 উপরের চলমান লেখা (বাম থেকে ডানে সরবে; খালি রাখলে বন্ধ)</label><input value={f.ticker} onChange={(e) => setF({ ...f, ticker: e.target.value })} />
      <label>ঘোষণা / নোটিশ (খালি রাখলে দেখাবে না)</label><input value={f.notice} onChange={(e) => setF({ ...f, notice: e.target.value })} />
      <label>"প্রমট বানানোর নিয়ম" লেখা (সবাই দেখবে)</label><textarea style={{ ...area, minHeight: 170 }} value={f.guide} onChange={(e) => setF({ ...f, guide: e.target.value })} />
      <label>AI প্রম্পট টেমপ্লেট (ইউজার কপি করবে)</label><textarea value={f.promptTemplate} onChange={(e) => setF({ ...f, promptTemplate: e.target.value })} />
      <button className="full" onClick={save}>সেভ করুন</button><div className="mut" style={{ marginTop: 8 }}>{msg}</div>
    </div>
  );
}
