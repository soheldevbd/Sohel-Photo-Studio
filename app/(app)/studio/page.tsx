"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { FORMATS, PALS, STYLE_NAMES, grain, h2r, mix, mk, mulberry, randPal, render, tierOf, type GenParams } from "@/lib/gen";
import { prepareHtml, renderHtmlImage } from "@/lib/capture";
import { fd } from "@/lib/util";
import { api } from "@/lib/api";

const SAMPLE = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;width:100%;height:100%;overflow:hidden;background:radial-gradient(circle at 25% 30%,#ff4f8b 0,transparent 50%),radial-gradient(circle at 78% 72%,#ffa03d 0,transparent 48%),#150a20}
.c{position:absolute;border-radius:50%}
</style></head><body><script>
for(let i=0;i<26;i++){const d=document.createElement('div');d.className='c';const s=40+Math.random()*220;
d.style.cssText='width:'+s+'px;height:'+s+'px;left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;background:rgba('+(180+Math.random()*75|0)+','+(80+Math.random()*120|0)+','+(120+Math.random()*135|0)+','+(0.08+Math.random()*0.22)+')';document.body.appendChild(d);}
<\/script></body></html>`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rndName = () => String(Math.floor(Math.random() * 9e9) + 1e9) + String(Date.now() % 1e5).padStart(5, "0");

export default function Studio() {
  const { user, settings, plan, isAdmin, modal, closeModal, setUser } = useApp();
  const router = useRouter();
  const [mode, setMode] = useState<"gen" | "html">("gen");
  // generator
  const [style, setStyle] = useState("neon"), [pal, setPal] = useState("neon");
  const [den, setDen] = useState(5), [blur, setBlur] = useState(40), [grainV, setGrainV] = useState(25), [seed, setSeed] = useState(1);
  const [col, setCol] = useState({ bg: "#0a0614", c1: "#ff2d95", c2: "#00e5ff", c3: "#7a3cff" });
  // export
  const [fmtV, setFmtV] = useState("3840,2160"), [ext, setExt] = useState("jpg"), [jq, setJq] = useState("0.95");
  // html mode
  const [src, setSrc] = useState(SAMPLE), [hGrain, setHGrain] = useState(20), [tsec, setTsec] = useState(0);
  const [status, setStatus] = useState("প্রস্তুত। বড় সাইজে (4K+) তৈরি হতে কয়েক সেকেন্ড লাগতে পারে। Chrome ব্যবহার করুন।");
  const [out, setOut] = useState<{ url: string; blob: Blob; name: string } | null>(null);
  const [busyUi, setBusyUi] = useState(false);

  const gvRef = useRef<HTMLCanvasElement>(null), stageRef = useRef<HTMLDivElement>(null), pvRef = useRef<HTMLIFrameElement>(null), fileRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false), prepared = useRef<string | null>(null), srcRef = useRef(SAMPLE);
  srcRef.current = src;

  const fmt = useCallback(() => {
    const [W, H] = fmtV.split(",").map(Number), k = 1080 / Math.min(W, H);
    return { W, H, lw: Math.round(W * k), lh: Math.round(H * k) };
  }, [fmtV]);

  const getPal = useCallback(() => {
    if (pal === "custom") { const c = [h2r(col.c1), h2r(col.c2), h2r(col.c3)]; return [h2r(col.bg), c[0], c[1], c[2], mix(c[0], c[2], 0.5)]; }
    if (pal === "random") return randPal(mulberry((+seed || 1) * 7 + 3));
    return PALS[pal].slice(1).map(h2r);
  }, [pal, col, seed]);
  const params = useCallback((): GenParams => ({ style, pal: getPal(), den, blur, grain: grainV, seed: +seed || 1 }), [style, getPal, den, blur, grainV, seed]);

  // live preview of the generator (debounced)
  useEffect(() => {
    if (mode !== "gen") return;
    const t = setTimeout(() => {
      const cv = gvRef.current; if (!cv) return;
      const { W, H } = fmt(), pw = 800, ph = Math.max(100, Math.round((pw * H) / W));
      cv.width = pw; cv.height = ph;
      try { render(cv, pw, ph, params()); } catch (e: any) { setStatus("প্রিভিউ ত্রুটি: " + e.message); }
    }, 90);
    return () => clearTimeout(t);
  }, [mode, fmt, params]);

  // HTML mode preview
  const layoutPreview = useCallback(() => {
    const st = stageRef.current, pv = pvRef.current; if (!st || !pv) return;
    const host = st.parentElement as HTMLElement; if (!host.clientWidth) return;
    const { lw, lh } = fmt(), maxW = Math.min(host.clientWidth - 16, (innerHeight * 0.55 * lw) / lh);
    st.style.width = maxW + "px"; st.style.height = (maxW * lh) / lw + "px";
    pv.style.width = lw + "px"; pv.style.height = lh + "px"; pv.style.transform = `scale(${maxW / lw})`;
  }, [fmt]);
  const applyTime = useCallback((t = tsec) => { try { (pvRef.current?.contentWindow as any).__vcAdvance((+t || 0) * 1000); } catch {} }, [tsec]);

  const loadPreview = useCallback(async () => {
    if (busy.current) return;
    setStatus("⏳ রিসোর্স প্রস্তুত হচ্ছে...");
    const { html, warn } = await prepareHtml(srcRef.current);
    prepared.current = html; layoutPreview();
    const pv = pvRef.current; if (!pv) return;
    await new Promise<void>((r) => { pv.onload = () => r(); pv.srcdoc = html; });
    try { (pv.contentWindow as any).__vcAdvance(0); } catch {}
    await sleep(250); applyTime();
    setStatus(warn.length ? `⚠ ${warn.length}টি বাইরের ফাইল লোড হয়নি। AI-কে বলুন সব ইনলাইন করতে।` : '✅ প্রিভিউ তৈরি। ঠিক থাকলে "ছবি তৈরি করুন" চাপুন।');
  }, [layoutPreview, applyTime]);

  useEffect(() => { if (mode === "html") { layoutPreview(); if (!prepared.current) loadPreview(); } }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (mode === "html") layoutPreview(); }, [fmtV, mode, layoutPreview]);
  useEffect(() => { const h = () => { if (mode === "html") layoutPreview(); }; addEventListener("resize", h); return () => removeEventListener("resize", h); }, [mode, layoutPreview]);
  useEffect(() => () => { if (out) URL.revokeObjectURL(out.url); }, [out]);

  // plan gate: free users get N trial images above 720p
  const lim = +settings.free1080Limit || 0, used = user?.used1080 || 0, left = lim - used;
  const gate = (W: number, H: number) => {
    const tier = tierOf(W, H);
    if (plan === "pro" || tier === "hd") return { ok: true, tier, why: "" };
    if (used >= lim) return { ok: false, tier, why: `আপনার ফ্রি ট্রায়ালের ${lim}টি Pro ছবি শেষ হয়ে গেছে। এখন ফ্রিতে শুধু 720p চলবে। 1080p, 1440p ও 4K-র জন্য Pro নিন।` };
    return { ok: true, tier, why: "" };
  };
  const upgradeModal = (why: string) => modal(<>
    <h2>⭐ Pro দরকার</h2><p>{why}</p><p className="mut">Pro নিলে 1080p থেকে 8K পর্যন্ত — সবকিছু আনলিমিটেড।</p>
    <div className="row"><button className="grow" onClick={() => { closeModal(); router.push("/plan"); }}>Pro আপগ্রেড করুন</button><button className="sec" onClick={closeModal}>ঠিক আছে</button></div>
  </>);

  async function generate() {
    if (busy.current || !user) return;
    const { W, H, lw, lh } = fmt(), gt = gate(W, H);
    if (!gt.ok) return upgradeModal(gt.why);
    busy.current = true; setBusyUi(true); setOut(null); setStatus("⏳ ছবি তৈরি হচ্ছে...");
    try {
      // the server decides if this size is allowed and counts the free-trial usage
      try {
        const r = await api<{ used: number }>("/api/usage/consume", { json: { w: W, h: H } });
        if (typeof r.used === "number" && r.used !== user.used1080) setUser({ ...user, used1080: r.used });
      } catch (e: any) {
        if (e.status === 403) { setStatus("🔒 Pro দরকার।"); upgradeModal(e.message); }
        else setStatus("ত্রুটি: " + e.message);
        return;
      }
      await sleep(60);
      const cv = mode === "gen" ? (() => { const c = mk(W, H); render(c, W, H, params()); return c; })() : await renderHtmlImage(srcRef.current, W, H, lw, lh, tsec, setStatus);
      if (mode === "html" && hGrain > 0) grain(cv.getContext("2d"), W, H, hGrain, mulberry((Date.now() % 99999) + 1));
      const type = ext === "png" ? "image/png" : "image/jpeg";
      const b: Blob | null = await new Promise((res) => cv.toBlob(res, type, +jq || 0.95));
      if (!b) throw new Error("এই সাইজের ছবি তৈরি করা গেল না (মেমরি কম)। ছোট সাইজ বেছে নিন।");
      setOut({ blob: b, url: URL.createObjectURL(b), name: `${rndName()}.${ext === "png" ? "png" : "jpg"}` });
      setStatus(`✅ সম্পন্ন! ${W}×${H}, ${(b.size / 1048576).toFixed(1)} MB`);
    } catch (e: any) {
      setStatus("ত্রুটি: " + (e.message || e) + "\n(খুব বড় সাইজে ফোনের মেমরি কম পড়লে একটু ছোট সাইজ বেছে নিন।)");
    } finally { busy.current = false; setBusyUi(false); }
  }
  const download = () => { if (!out) return; const a = document.createElement("a"); a.href = out.url; a.download = out.name; a.click(); };
  const share = async () => {
    if (!out) return;
    const f = new File([out.blob], out.name, { type: out.blob.type });
    if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f] }); } catch {} }
    else setStatus('শেয়ার সাপোর্ট নেই। "ডাউনলোড" চাপুন, ফাইল Downloads ফোল্ডারে যাবে।');
  };
  const dice = () => {
    const sk = Object.keys(STYLE_NAMES), pk = Object.keys(PALS);
    setStyle(sk[(Math.random() * sk.length) | 0]); setPal(pk[(Math.random() * pk.length) | 0]);
    setSeed(1 + ((Math.random() * 99999) | 0)); setDen(3 + ((Math.random() * 6) | 0));
  };

  const optLabel = (v: string, label: string) => {
    const [W, H] = v.split(",").map(Number), t = tierOf(W, H);
    return label + (t === "hd" ? " (ফ্রি)" : plan === "pro" ? "" : left > 0 ? " (ট্রায়াল)" : " 🔒 Pro");
  };
  const usage = plan === "pro"
    ? (isAdmin ? "🛠 অ্যাডমিন: সব সাইজ আনলিমিটেড" : `✅ Pro: সব সাইজ আনলিমিটেড (মেয়াদ ${fd(user?.proUntil)} পর্যন্ত)`)
    : left > 0 ? <>🎁 ফ্রি ট্রায়াল: Pro-র সব ফিচার (4K সহ) • বাকি <b>{left}/{lim}</b>টি ছবি • 720p সবসময় ফ্রি</> : "ট্রায়াল শেষ। ফ্রি: শুধু 720p আনলিমিটেড • 1080p/1440p/4K = 🔒 Pro";

  return (
    <>
      <div className="seg">
        <button className={mode === "gen" ? "on" : ""} onClick={() => setMode("gen")}>🎨 জেনারেটর</button>
        <button className={mode === "html" ? "on" : ""} onClick={() => setMode("html")}>&lt;/&gt; HTML → ছবি</button>
      </div>

      {mode === "gen" && (
        <>
          <div className="card pvcard"><canvas id="gv" ref={gvRef} /></div>
          <div className="card">
            <div className="grid2">
              <div><label>স্টাইল</label><select value={style} onChange={(e) => setStyle(e.target.value)}>{Object.entries(STYLE_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div><label>রঙের প্যালেট</label><select value={pal} onChange={(e) => setPal(e.target.value)}>
                {Object.entries(PALS).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}<option value="random">🎲 র‍্যান্ডম রঙ</option><option value="custom">🎨 কাস্টম রঙ</option></select></div>
            </div>
            {pal === "custom" && (
              <div className="grid2" style={{ marginTop: 6 }}>
                {([["bg", "ব্যাকগ্রাউন্ড রঙ"], ["c1", "রঙ ১"], ["c2", "রঙ ২"], ["c3", "রঙ ৩"]] as const).map(([k, l]) => (
                  <div key={k}><label>{l}</label><input type="color" value={col[k]} onChange={(e) => setCol({ ...col, [k]: e.target.value })} /></div>
                ))}
              </div>
            )}
            <label>জটিলতা (কতগুলো আকার): <b>{den}</b></label><input type="range" min={1} max={10} value={den} onChange={(e) => setDen(+e.target.value)} />
            <label>নরমতা / গ্লো: <b>{blur}</b></label><input type="range" min={0} max={100} value={blur} onChange={(e) => setBlur(+e.target.value)} />
            <label>গ্রেইন (রঙের ব্যান্ডিং কমায়): <b>{grainV}</b></label><input type="range" min={0} max={100} value={grainV} onChange={(e) => setGrainV(+e.target.value)} />
            <div className="row" style={{ marginTop: 6 }}>
              <div className="grow"><label>সিড (একই সংখ্যা = একই ডিজাইন)</label><input type="number" value={seed} onChange={(e) => setSeed(+e.target.value)} /></div>
              <button style={{ marginTop: 22 }} onClick={dice}>🎲 র‍্যান্ডম</button>
            </div>
          </div>
        </>
      )}

      {mode === "html" && (
        <>
          <div className="card pvcard"><div id="stage" ref={stageRef}><iframe id="pv" ref={pvRef} sandbox="allow-scripts allow-same-origin" /></div></div>
          <div className="card">
            <label>HTML কোড (যেকোনো AI থেকে পেস্ট করুন)</label>
            <textarea spellCheck={false} value={src} onChange={(e) => setSrc(e.target.value)} />
            <div className="grid3" style={{ marginTop: 8 }}>
              <button className="sec sm" onClick={() => fileRef.current?.click()}>📂 ফাইল</button>
              <button className="sec sm" onClick={() => { setSrc(SAMPLE); prepared.current = null; setTimeout(loadPreview, 60); }}>নমুনা</button>
              <button className="sec sm" onClick={() => setSrc("")}>মুছুন</button>
            </div>
            <input ref={fileRef} type="file" accept=".html,.htm,text/html" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setSrc(await f.text()); setTimeout(loadPreview, 60); } }} />
            <label>গ্রেইন/টেক্সচার যোগ করুন: <b>{hGrain}</b> (ব্যান্ডিং কমায়, ফাইল সাইজ বাড়ায়)</label><input type="range" min={0} max={100} value={hGrain} onChange={(e) => setHGrain(+e.target.value)} />
            <label>কোন সেকেন্ডের ফ্রেম (অ্যানিমেশন থাকলে; নাহলে 0)</label>
            <input type="number" min={0} max={60} step={0.1} value={tsec} onChange={(e) => { setTsec(+e.target.value); applyTime(+e.target.value); }} />
            <button className="full" onClick={loadPreview}>👁 প্রিভিউ দেখুন</button>
          </div>
        </>
      )}

      <div className="card">
        <div className="grid2">
          <div><label>সাইজ / রেজোলিউশন</label><select value={fmtV} onChange={(e) => setFmtV(e.target.value)}>{FORMATS.map(([v, l]) => <option key={v} value={v}>{optLabel(v, l)}</option>)}</select></div>
          <div><label>ফরম্যাট</label><select value={ext} onChange={(e) => setExt(e.target.value)}><option value="jpg">JPG (স্টকের জন্য)</option><option value="png">PNG (বড় ফাইল)</option></select></div>
          <div><label>JPG কোয়ালিটি</label><select value={jq} onChange={(e) => setJq(e.target.value)}><option value="1">ম্যাক্স (বড় ফাইল)</option><option value="0.95">হাই</option><option value="0.85">মাঝারি</option></select></div>
        </div>
        <div className="mut" style={{ marginTop: 8 }}>{usage}</div>
        <button className="full" disabled={busyUi} onClick={generate}>⬇ ছবি তৈরি করুন</button>
        <div id="st">{status}</div>
      </div>

      {out && (
        <div className="card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img id="outImg" src={out.url} alt="" />
          <div className="grid2" style={{ marginTop: 8 }}><button onClick={download}>⬇ ডাউনলোড</button><button className="sec" onClick={share}>📱 গ্যালারিতে সেভ / শেয়ার</button></div>
        </div>
      )}
    </>
  );
}
