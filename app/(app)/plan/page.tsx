"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Plans, Price } from "@/components/ui";
import { DAY, errMsg, fd, getPlans } from "@/lib/util";
import { api } from "@/lib/api";
import type { Payment } from "@/lib/types";

const LAB = { pending: "যাচাই চলছে", approved: "অনুমোদিত ✅", rejected: "বাতিল ❌" };

export default function PlanPage() {
  const { user, settings, plan, isAdmin, toast } = useApp();
  const plans = getPlans(settings);
  const [sel, setSel] = useState(0);
  const [sender, setSender] = useState(""), [trx, setTrx] = useState("");
  const [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  const [pays, setPays] = useState<Payment[] | null>(null);
  const cur = plans[sel] || plans[0];

  const load = async () => {
    if (!user) return;
    try { setPays((await api<{ payments: Payment[] }>("/api/payments")).payments); } catch (e) { toast(errMsg(e)); setPays([]); }
  };
  useEffect(() => { load(); }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit() {
    if (!user) return;
    const s = sender.trim().replace(/\s+/g, ""), t = trx.trim().toUpperCase();
    if (!/^01\d{9}$/.test(s)) return setMsg("❌ বিকাশ নম্বর সঠিক নয় (১১ সংখ্যা, 01 দিয়ে শুরু)।");
    if (!/^[A-Z0-9]{8,12}$/.test(t)) return setMsg("❌ TrxID সঠিক নয় (৮–১২ অক্ষর/সংখ্যা)।");
    setBusy(true); setMsg("⏳ পাঠানো হচ্ছে...");
    try {
      await api("/api/payments", { json: { trxId: t, sender: s, planName: cur.name } });
      setMsg("✅ অনুরোধ জমা হয়েছে। যাচাই হলে আপনার অ্যাকাউন্ট Pro হবে।"); setTrx(""); load();
    } catch (e) { setMsg("❌ " + errMsg(e)); }
    setBusy(false);
  }
  const copyNum = async () => { try { await navigator.clipboard.writeText(settings.bkash); toast("নম্বর কপি হয়েছে"); } catch { toast(settings.bkash); } };

  return (
    <>
      <div className="card"><h2>আপনার প্ল্যান</h2>
        {plan === "pro"
          ? isAdmin ? <><span className="badge b-pro">ADMIN</span> সব আনলিমিটেড</>
            : <><span className="badge b-pro">PRO</span> মেয়াদ: <b>{fd(user?.proUntil)}</b> ({Math.max(0, Math.ceil(((user?.proUntil || 0) - Date.now()) / DAY))} দিন বাকি)</>
          : <><span className="badge b-free">FREE</span> {user?.plan === "pro" && <span className="mut">(Pro মেয়াদ শেষ হয়েছে)</span>}<div className="mut">ট্রায়াল ব্যবহার: {user?.used1080 || 0}/{settings.free1080Limit}</div></>}
      </div>
      <div className="card"><Plans /></div>

      <div className="card">
        <h2>⭐ Pro আপগ্রেড (বিকাশ)</h2>
        <ol className="mut" style={{ paddingLeft: 18, margin: "6px 0" }}>
          <li>বিকাশ অ্যাপ থেকে নিচের নম্বরে <b>Send Money</b> করুন।</li><li>পেমেন্ট শেষে <b>TrxID</b> কপি করুন।</li>
          <li>নিচের ফর্মে আপনার বিকাশ নম্বর ও TrxID দিয়ে সাবমিট করুন।</li><li>যাচাই হলে আপনার অ্যাকাউন্ট Pro হয়ে যাবে।</li>
        </ol>
        <div className="mut" style={{ marginTop: 8 }}>প্ল্যান বেছে নিন</div>
        {plans.map((p, i) => (
          <label key={i} className="item" style={{ display: "block", cursor: "pointer" }}>
            <div className="row"><input type="radio" name="plsel" checked={i === sel} onChange={() => setSel(i)} /><b>{p.name}</b><span className="grow" /><b><Price p={p} /></b></div>
            <div className="meta">{p.days} দিন{p.features ? " • " + p.features : ""}</div>
          </label>
        ))}
        <div className="item"><div className="mut">বিকাশ নম্বর</div>
          <div className="row"><span className="bk">{settings.bkash}</span><button className="sec sm" onClick={copyNum}>কপি</button></div>
          <div className="mut">পরিমাণ: <b>৳{cur.price}</b> / {cur.days} দিন</div></div>
        <label>আপনার বিকাশ নম্বর (যে নম্বর থেকে পাঠিয়েছেন)</label><input value={sender} onChange={(e) => setSender(e.target.value)} inputMode="numeric" placeholder="01XXXXXXXXX" />
        <label>TrxID</label><input value={trx} onChange={(e) => setTrx(e.target.value)} placeholder="যেমন 8N7A6D5EE7" style={{ textTransform: "uppercase" }} />
        <button className="full" disabled={busy} onClick={submit}>সাবমিট করুন</button>
        <div className="mut" style={{ marginTop: 8 }}>{msg}</div>
      </div>

      <div className="card"><h3>আপনার অনুরোধগুলো</h3>
        {pays === null ? <div className="mut">—</div> : pays.length ? pays.map((p) => (
          <div className="item" key={p.id}><span className={"badge b-" + p.status}>{LAB[p.status]}</span> <b>{p.trxId}</b><div className="meta">{p.sender} • {fd(p.createdAt)}</div></div>
        )) : <div className="mut">কোনো অনুরোধ নেই।</div>}
      </div>
    </>
  );
}
