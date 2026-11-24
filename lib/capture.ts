/* eslint-disable @typescript-eslint/no-explicit-any */
// HTML -> image: inline remote resources, run the page on a virtual clock, then draw the live DOM via SVG foreignObject.
import { VCLOCK } from "./defaults";
import { mk } from "./gen";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function toDataUrl(url: string): Promise<string> {
  const r = await fetch(url); if (!r.ok) throw new Error(String(r.status));
  const b = await r.blob();
  return new Promise((res) => { const f = new FileReader(); f.onload = () => res(f.result as string); f.readAsDataURL(b); });
}
async function inlineCssUrls(css: string, baseUrl: string, warn: string[]) {
  const re = /url\(\s*(['"]?)([^)'"]+)\1\s*\)/g; const jobs: string[] = [];
  css.replace(re, (m, q, u) => { if (!/^data:|^#/.test(u)) jobs.push(u); return m; });
  const map: Record<string, string> = {};
  await Promise.all([...new Set(jobs)].map(async (u) => { try { map[u] = await toDataUrl(new URL(u, baseUrl).href); } catch { warn.push(u); } }));
  return css.replace(re, (m, q, u) => (map[u] ? `url("${map[u]}")` : m));
}
export async function prepareHtml(src: string) {
  const warn: string[] = [];
  const d = new DOMParser().parseFromString(src, "text/html");
  for (const l of Array.from(d.querySelectorAll('link[rel~="stylesheet"][href]'))) {
    const href = l.getAttribute("href") || ""; if (!/^https?:/.test(href)) continue;
    try {
      const r = await fetch(href); const css = await inlineCssUrls(await r.text(), href, warn);
      const s = d.createElement("style"); s.textContent = css; l.replaceWith(s);
    } catch { warn.push(href); }
  }
  for (const s of Array.from(d.querySelectorAll("style"))) s.textContent = await inlineCssUrls(s.textContent || "", location.href, warn);
  for (const im of Array.from(d.querySelectorAll("img[src]"))) {
    const u = im.getAttribute("src") || ""; if (!/^https?:/.test(u)) continue;
    try { im.setAttribute("src", await toDataUrl(u)); } catch { warn.push(u); }
  }
  const clk = d.createElement("script"); clk.textContent = VCLOCK; d.head.prepend(clk);
  return { html: "<!DOCTYPE html>" + d.documentElement.outerHTML, warn };
}

async function capture(doc: Document, win: any, ctx: any, W: number, H: number, lw: number, lh: number) {
  const live = Array.from(doc.documentElement.querySelectorAll("*")) as HTMLElement[];
  const root = doc.documentElement.cloneNode(true) as HTMLElement;
  const cl = Array.from(root.querySelectorAll("*")) as HTMLElement[];
  const targets = new Set<Element>();
  const animProps = new Map<Element, Set<string>>();
  doc.getAnimations().forEach((a: any) => {
    const e = a.effect; if (!e || !e.target || e.pseudoElement) return;
    targets.add(e.target);
    let m = animProps.get(e.target); if (!m) { m = new Set(); animProps.set(e.target, m); }
    try { e.getKeyframes().forEach((k: any) => Object.keys(k).forEach((p) => { if (!["offset", "easing", "composite", "computedOffset", "cssFloat"].includes(p)) m!.add(p); })); } catch {}
  });
  const swaps: [HTMLElement, HTMLElement][] = [];
  for (let i = 0; i < live.length; i++) {
    const el = live[i], c = cl[i];
    if (el.tagName === "CANVAS") {
      let url: string; try { url = (el as HTMLCanvasElement).toDataURL("image/png"); } catch { continue; }
      const im = doc.createElement("img"); im.setAttribute("src", url);
      if (el.id) im.id = el.id; if (el.className) im.className = el.className as string;
      im.setAttribute("style", (el.getAttribute("style") || "") + `;width:${el.clientWidth}px;height:${el.clientHeight}px`);
      swaps.push([c, im]);
    } else if (targets.has(el)) {
      const cs = win.getComputedStyle(el);
      for (const p of animProps.get(el)!) { try { (c.style as any)[p] = cs[p]; } catch {} }
      c.style.setProperty("animation", "none", "important"); c.style.setProperty("transition", "none", "important");
    }
  }
  swaps.forEach(([c, im]) => c.replaceWith(im));
  root.querySelectorAll("script,noscript").forEach((n) => n.remove());
  root.style.width = lw + "px"; root.style.height = lh + "px"; root.style.overflow = "hidden";
  const xml = new XMLSerializer().serializeToString(root);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${lw}" height="${lh}"><foreignObject x="0" y="0" width="${lw}" height="${lh}">${xml}</foreignObject></svg>`;
  const img = new Image(); img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); // data: URL keeps the canvas untainted
  await img.decode();
  const opaque = (c: string) => c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent";
  const hb = win.getComputedStyle(doc.documentElement).backgroundColor, bb = win.getComputedStyle(doc.body).backgroundColor;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = opaque(hb) ? hb : opaque(bb) ? bb : "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(img, 0, 0, W, H);
}

export async function renderHtmlImage(src: string, W: number, H: number, lw: number, lh: number, tsec: number, setStatus: (s: string) => void) {
  setStatus("⏳ রিসোর্স প্রস্তুত হচ্ছে...");
  const { html } = await prepareHtml(src);
  const ex = document.createElement("iframe");
  ex.setAttribute("sandbox", "allow-scripts allow-same-origin");
  ex.style.cssText = `position:fixed;left:0;top:0;width:${lw}px;height:${lh}px;border:0;opacity:0.01;pointer-events:none;z-index:-1`;
  document.body.appendChild(ex);
  try {
    await new Promise<void>((r) => { ex.onload = () => r(); ex.srcdoc = html; });
    const win: any = ex.contentWindow, doc = ex.contentDocument as Document;
    try { await (doc as any).fonts.ready; } catch {}
    await sleep(400); win.__vcAdvance(0); await sleep(250); win.__vcAdvance((tsec || 0) * 1000); await sleep(150);
    const cv = mk(W, H); setStatus("⏳ ছবি আঁকা হচ্ছে...");
    await capture(doc, win, cv.getContext("2d"), W, H, lw, lh);
    return cv;
  } finally { ex.remove(); }
}
