"use client";
import type { Plan } from "@/lib/types";
import { useApp } from "@/context/AppContext";
import { getPlans, waLink } from "@/lib/util";

export function Price({ p }: { p: Plan }) {
  const o = +(p.oldPrice as number) || 0, n = +p.price || 0;
  return o > n && n >= 0
    ? <><s className="mut" style={{ fontSize: ".75em", fontWeight: 400 }}>৳{o}</s> ৳{n} <span className="badge b-approved">{Math.round(((o - n) / o) * 100)}% ছাড়</span></>
    : <>৳{n}</>;
}

export function Plans() {
  const { settings: st } = useApp();
  return (
    <div className="plans">
      <div className="plan">
        <div className="row"><b>Free</b><span className="grow" /><span className="price">৳০</span></div>
        <ul><li>🎁 শুরুতে <b>{st.free1080Limit}টি ছবি</b> Pro-র সব ফিচারসহ (4K সহ)</li><li>তারপর 720p — আনলিমিটেড</li></ul>
      </div>
      {getPlans(st).map((p, i) => (
        <div className="plan pro" key={i}>
          <div className="row"><b>{p.name} ⭐</b><span className="grow" /><span className="price"><Price p={p} /><span className="mut">/{p.days} দিন</span></span></div>
          <ul><li>1080p থেকে <b>8K</b> পর্যন্ত — আনলিমিটেড</li>{p.features && <li>{p.features}</li>}</ul>
        </div>
      ))}
    </div>
  );
}

// Ticker, demo bar, WhatsApp button, modal and toast: shared by every page
export function Chrome() {
  const { settings, modalNode, closeModal, toastMsg } = useApp();
  const tk = (settings.ticker || "").trim();
  return (
    <>
      {tk && <div className="ticker"><div className="tk" style={{ animationDuration: Math.max(10, 8 + tk.length * 0.18) + "s" }}>{tk}</div></div>}
      <a className="wa" href={waLink(settings.whatsapp, settings.brand)} target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>
      {modalNode && <div id="modalBg" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}><div id="modal">{modalNode}</div></div>}
      {toastMsg && <div id="toast">{toastMsg}</div>}
    </>
  );
}
