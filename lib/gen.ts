/* eslint-disable @typescript-eslint/no-explicit-any */
// Procedural background generator (8 styles). Pure canvas code, ported 1:1 from the original single-file app.

export const FORMATS: [string, string][] = [
  ["1280,720", "ল্যান্ডস্কেপ 720p"], ["720,1280", "ভার্টিকাল 720p"], ["1920,1080", "ল্যান্ডস্কেপ Full HD 1080p"], ["1080,1920", "ভার্টিকাল Full HD"], ["1080,1080", "স্কয়ার 1080"],
  ["2560,1440", "ল্যান্ডস্কেপ 1440p"], ["3840,2160", "ল্যান্ডস্কেপ 4K 3840×2160"], ["2160,3840", "ভার্টিকাল 4K 2160×3840"], ["3840,3840", "স্কয়ার 4K 3840×3840"],
  ["5120,2880", "5K 5120×2880"], ["7680,4320", "8K 7680×4320 (শক্তিশালী ডিভাইস)"],
];
export const tierOf = (W: number, H: number) => { const m = Math.min(W, H); return m <= 720 ? "hd" : m <= 1080 ? "fhd" : "pro"; };

export const PALS: Record<string, string[]> = {
  neon: ["নিয়ন নাইট", "#0a0614", "#ff2d95", "#00e5ff", "#7a3cff", "#ffe14d"],
  aurora: ["অরোরা", "#050b1a", "#2bffb0", "#2f7bff", "#a24bff", "#00e1ff"],
  sunset: ["সানসেট", "#1a0b2e", "#ff5e62", "#ff9966", "#ffd36e", "#8a2be2"],
  ocean: ["ওশান", "#04141f", "#0aa8c4", "#1de9b6", "#2979ff", "#b3f5ff"],
  forest: ["ফরেস্ট", "#07130d", "#1fa35c", "#9be564", "#0e5c3b", "#e8ffb0"],
  candy: ["ক্যান্ডি (হালকা)", "#fff4f8", "#ff8fc7", "#8fd3ff", "#ffe08f", "#b8a2ff"],
  royal: ["রয়্যাল", "#0c0a24", "#5b3df5", "#c04dff", "#ffcf5c", "#2fd5ff"],
  mono: ["মনোক্রোম", "#0b0b0c", "#3a3a40", "#8c8c96", "#d9d9e0", "#ffffff"],
  peach: ["পিচ ক্রিম (হালকা)", "#fff1e6", "#ffb38a", "#ff7a8a", "#ffd9a8", "#c9a7ff"],
  cyber: ["সাইবারপাংক", "#0b0420", "#ff0090", "#00f0ff", "#fcee0a", "#7d00ff"],
};
export const STYLE_NAMES: Record<string, string> = { mesh: "মেশ গ্রেডিয়েন্ট", aurora: "অরোরা", neon: "নিয়ন গ্লো", bokeh: "বোকে", waves: "ওয়েভ", lowpoly: "লো-পলি", geometric: "জিওমেট্রিক", synthwave: "সিনথওয়েভ" };

export type Rgb = number[];
export type GenParams = { style: string; pal: Rgb[]; den: number; blur: number; grain: number; seed: number };

export const mk = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
export const h2r = (h: string): Rgb => { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
const rgba = (c: Rgb, a: number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function hsl2rgb(h: number, s: number, l: number): Rgb { h = ((h % 360) + 360) % 360; s /= 100; l /= 100; const k = (n: number) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return [f(0) * 255, f(8) * 255, f(4) * 255]; }
export function mulberry(a: number) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function randPal(r: () => number): Rgb[] { const h = r() * 360; return [hsl2rgb(h + 210, 45, 6 + r() * 8), hsl2rgb(h, 85, 58), hsl2rgb(h + 45, 85, 62), hsl2rgb(h + 185, 80, 58), hsl2rgb(h + 300, 85, 66)]; }

function layer(ctx: any, W: number, H: number, blur: number, fn: (g: any) => void, comp?: string) {
  const t = mk(W, H), g = t.getContext("2d"); fn(g);
  ctx.save(); if (comp) ctx.globalCompositeOperation = comp; if (blur > 0.5) ctx.filter = `blur(${blur}px)`; ctx.drawImage(t, 0, 0); ctx.restore();
}
export function grain(ctx: any, W: number, H: number, amt: number, r: () => number) {
  if (amt <= 0) return;
  const T = 256, t = mk(T, T), tc = t.getContext("2d"), id = tc.createImageData(T, T);
  for (let i = 0; i < id.data.length; i += 4) { const v = Math.max(0, Math.min(255, 128 + (r() + r() - 1) * 220)) | 0; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  tc.putImageData(id, 0, 0);
  const pat = ctx.createPattern(t, "repeat");
  ctx.save(); ctx.fillStyle = pat;
  ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = Math.min(1, (amt / 100) * 0.45); ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = (amt / 100) * 0.05; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

type StyleFn = (ctx: any, W: number, H: number, r: () => number, pal: Rgb[], P: GenParams, S: number, M: number, b: number) => void;
const STYLES: Record<string, StyleFn> = {
  mesh(ctx, W, H, r, pal, P, S, M) {
    ctx.fillStyle = rgba(pal[0], 1); ctx.fillRect(0, 0, W, H);
    const n = 3 + Math.round(P.den * 1.3);
    layer(ctx, W, H, 0, (g) => {
      for (let i = 0; i < n; i++) {
        const x = r() * W, y = r() * H, rad = (0.28 + r() * 0.42) * M * (0.8 + (P.blur / 100) * 0.7), c = pal[1 + ((r() * 4) | 0)];
        const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba(c, 0.95)); gr.addColorStop(0.55, rgba(c, 0.35)); gr.addColorStop(1, rgba(c, 0));
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
      }
    });
    const gr = ctx.createLinearGradient(0, 0, W, H); gr.addColorStop(0, "rgba(255,255,255,.06)"); gr.addColorStop(1, "rgba(0,0,0,.18)"); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  },
  aurora(ctx, W, H, r, pal, P, S, M, b) {
    const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, rgba(pal[0], 1)); gr.addColorStop(1, rgba(mix(pal[0], pal[2], 0.28), 1)); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    const ns = 90 + P.den * 25;
    for (let i = 0; i < ns; i++) { const x = r() * W, y = r() * H * 0.75, s = (0.4 + r() * 1.4) * S * 0.0016; ctx.fillStyle = rgba([255, 255, 255], 0.15 + r() * 0.7); ctx.beginPath(); ctx.arc(x, y, s, 0, 6.283); ctx.fill(); }
    const n = 2 + Math.round(P.den * 0.5), rib: any[] = [];
    for (let i = 0; i < n; i++) rib.push({ c: pal[1 + (i % 4)], base: H * (0.22 + r() * 0.38), amp: H * (0.04 + r() * 0.1), f: 0.8 + r() * 1.8, ph: r() * 6.283, th: H * (0.2 + r() * 0.25) });
    const draw = (g: any) => {
      g.globalCompositeOperation = "lighter";
      rib.forEach((o) => {
        const steps = 140, ys: number[] = []; g.beginPath();
        for (let k = 0; k <= steps; k++) { const x = (W * k) / steps, u = (k / steps) * 6.283; const y = o.base + Math.sin(u * o.f + o.ph) * o.amp + Math.sin(u * o.f * 2.7 + o.ph * 2) * o.amp * 0.4; ys.push(y); k ? g.lineTo(x, y) : g.moveTo(x, y); }
        for (let k = steps; k >= 0; k--) g.lineTo((W * k) / steps, ys[k] + o.th);
        g.closePath();
        const lg = g.createLinearGradient(0, o.base - o.amp, 0, o.base + o.amp + o.th); lg.addColorStop(0, rgba(o.c, 0)); lg.addColorStop(0.18, rgba(o.c, 0.65)); lg.addColorStop(0.55, rgba(o.c, 0.18)); lg.addColorStop(1, rgba(o.c, 0));
        g.fillStyle = lg; g.fill();
      });
    };
    layer(ctx, W, H, b * 0.6 + M * 0.006, draw, "lighter");
    ctx.globalAlpha = 0.45; layer(ctx, W, H, b * 0.15 + M * 0.0015, draw, "lighter"); ctx.globalAlpha = 1;
  },
  neon(ctx, W, H, r, pal, P, S, M, b) {
    const gr = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, M * 0.75); gr.addColorStop(0, rgba(mix(pal[0], pal[2], 0.18), 1)); gr.addColorStop(1, rgba(pal[0], 1)); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    const n = 3 + Math.round(P.den * 1.1), shapes: any[] = [];
    for (let i = 0; i < n; i++) shapes.push({ t: (r() * 5) | 0, c: pal[1 + ((r() * 4) | 0)], x: r() * W, y: r() * H, s: S * (0.12 + r() * 0.35), rot: r() * 6.283, q: r() });
    const lw = S * 0.0055;
    const path = (g: any, o: any) => {
      g.beginPath();
      if (o.t === 0) g.arc(o.x, o.y, o.s, 0, 6.283);
      else if (o.t === 1) g.arc(o.x, o.y, o.s, o.rot, o.rot + 2 + o.q * 3.5);
      else if (o.t === 2) { g.moveTo(o.x + Math.cos(o.rot) * o.s, o.y + Math.sin(o.rot) * o.s); for (let j = 1; j <= 2; j++) g.lineTo(o.x + Math.cos(o.rot + j * 2.0944) * o.s, o.y + Math.sin(o.rot + j * 2.0944) * o.s); g.closePath(); }
      else if (o.t === 3) { g.moveTo(o.x - o.s, o.y); g.bezierCurveTo(o.x - o.s * 0.3, o.y - o.s * (0.8 + o.q), o.x + o.s * 0.3, o.y + o.s * (0.8 + o.q), o.x + o.s, o.y); }
      else { const k = o.s * 0.8; g.rect(o.x - k / 2, o.y - k / 2, k, k * (0.5 + o.q * 0.6)); }
    };
    const paint = (g: any, w: number) => {
      g.lineCap = "round"; g.lineJoin = "round";
      shapes.forEach((o) => {
        ([[w * 6, 0.1], [w * 3, 0.2], [w * 1.5, 0.55]] as number[][]).forEach(([lwid, a]) => { g.lineWidth = lwid; g.strokeStyle = rgba(o.c, a); path(g, o); g.stroke(); });
        g.lineWidth = w * 0.6; g.strokeStyle = rgba(mix(o.c, [255, 255, 255], 0.75), 1); path(g, o); g.stroke();
      });
    };
    layer(ctx, W, H, b * 0.9 + S * 0.012, (g) => { g.globalCompositeOperation = "lighter"; paint(g, lw * 2); }, "lighter");
    ctx.save(); ctx.globalCompositeOperation = "lighter"; paint(ctx, lw); ctx.restore();
  },
  bokeh(ctx, W, H, r, pal, P, S, M, b) {
    const gr = ctx.createLinearGradient(0, 0, W, H); gr.addColorStop(0, rgba(pal[0], 1)); gr.addColorStop(1, rgba(mix(pal[0], pal[2], 0.35), 1)); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    const n = 22 + P.den * 12, cs: any[] = [];
    for (let i = 0; i < n; i++) cs.push({ x: r() * W, y: r() * H, rad: S * (0.018 + Math.pow(r(), 2.2) * 0.12), c: pal[1 + ((r() * 4) | 0)] });
    layer(ctx, W, H, b * 0.35, (g) => {
      g.globalCompositeOperation = "lighter";
      cs.forEach((o) => { const rg = g.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.rad); rg.addColorStop(0, rgba(o.c, 0.12)); rg.addColorStop(0.8, rgba(o.c, 0.3)); rg.addColorStop(0.92, rgba(o.c, 0.6)); rg.addColorStop(1, rgba(o.c, 0)); g.fillStyle = rg; g.beginPath(); g.arc(o.x, o.y, o.rad, 0, 6.283); g.fill(); });
    }, "lighter");
  },
  waves(ctx, W, H, r, pal, P, S, M, b) {
    const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, rgba(pal[0], 1)); gr.addColorStop(1, rgba(mix(pal[0], pal[2], 0.4), 1)); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    const n = 3 + Math.round(P.den * 0.7);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1 || 1), y0 = H * (0.2 + 0.62 * t), amp = H * (0.025 + r() * 0.06), f = 0.6 + r() * 1.6, ph = r() * 6.283, c = pal[1 + (i % 4)], pts: number[][] = [];
      for (let k = 0; k <= 160; k++) { const u = (k / 160) * 6.283; pts.push([(W * k) / 160, y0 + Math.sin(u * f + ph) * amp + Math.sin(u * f * 2.3 + ph * 1.7) * amp * 0.35]); }
      ctx.beginPath(); ctx.moveTo(0, H); pts.forEach((p) => ctx.lineTo(p[0], p[1])); ctx.lineTo(W, H); ctx.closePath();
      const lg = ctx.createLinearGradient(0, y0 - amp, 0, H); lg.addColorStop(0, rgba(mix(c, [255, 255, 255], 0.1), 0.92)); lg.addColorStop(1, rgba(mix(c, pal[0], 0.7), 0.96)); ctx.fillStyle = lg; ctx.fill();
      ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.lineWidth = S * 0.002; ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.stroke();
    }
    if (b > 2) { ctx.save(); ctx.filter = `blur(${b * 0.25}px)`; ctx.globalAlpha = 0.35; ctx.drawImage(ctx.canvas, 0, 0); ctx.restore(); }
  },
  lowpoly(ctx, W, H, r, pal, P, S) {
    ctx.fillStyle = rgba(pal[0], 1); ctx.fillRect(0, 0, W, H);
    const cols = 4 + P.den * 2, cw = W / cols, rows = Math.ceil(H / cw), ch = H / rows, pts: number[][][] = [];
    for (let j = 0; j <= rows; j++) { pts[j] = []; for (let i = 0; i <= cols; i++) { let x = i * cw, y = j * ch; if (i > 0 && i < cols) x += (r() - 0.5) * cw * 0.75; if (j > 0 && j < rows) y += (r() - 0.5) * ch * 0.75; pts[j][i] = [x, y]; } }
    const ramp = [pal[0], pal[1], pal[2], pal[3], pal[4]];
    const col = (t: number) => { t = Math.max(0, Math.min(0.999, t)) * (ramp.length - 1); const i = t | 0; return mix(ramp[i], ramp[i + 1], t - i); };
    const tri = (a: number[], b2: number[], c: number[]) => {
      const cx = (a[0] + b2[0] + c[0]) / 3, cy = (a[1] + b2[1] + c[1]) / 3; let cc = col((cx / W) * 0.55 + (cy / H) * 0.45); const sh = (r() - 0.5) * 0.28;
      cc = sh > 0 ? mix(cc, [255, 255, 255], sh) : mix(cc, [0, 0, 0], -sh);
      ctx.fillStyle = ctx.strokeStyle = rgba(cc, 1); ctx.lineWidth = S * 0.0012 + 0.6;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b2[0], b2[1]); ctx.lineTo(c[0], c[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
    };
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const p00 = pts[j][i], p10 = pts[j][i + 1], p01 = pts[j + 1][i], p11 = pts[j + 1][i + 1];
      if (r() < 0.5) { tri(p00, p10, p11); tri(p00, p11, p01); } else { tri(p00, p10, p01); tri(p10, p11, p01); }
    }
    const vg = ctx.createLinearGradient(0, H * 0.4, 0, H); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, rgba(pal[0], 0.5)); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  },
  geometric(ctx, W, H, r, pal, P, S, M) {
    ctx.fillStyle = rgba(pal[0], 1); ctx.fillRect(0, 0, W, H);
    const t = M / (3 + Math.round(P.den * 1.2)), nx = Math.ceil(W / t), ny = Math.ceil(H / t);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const x = i * t, y = j * t, c = pal[1 + ((r() * 4) | 0)], c2 = pal[1 + ((r() * 4) | 0)], k = (r() * 6) | 0, cr = (r() * 4) | 0;
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, t, t); ctx.clip();
      ctx.fillStyle = rgba(mix(pal[0], c2, 0.18), 1); ctx.fillRect(x, y, t, t); ctx.fillStyle = rgba(c, 1);
      const cx = cr === 1 || cr === 2 ? x + t : x, cy = cr >= 2 ? y + t : y;
      if (k === 0) { ctx.beginPath(); ctx.arc(cx, cy, t, 0, 6.283); ctx.fill(); }
      else if (k === 1) { ctx.beginPath(); ctx.arc(x + t / 2, y + t / 2, t * 0.42, 0, 6.283); ctx.fill(); }
      else if (k === 2) { for (let q = 3; q >= 1; q--) { ctx.fillStyle = rgba(q % 2 ? c : c2, 1); ctx.beginPath(); ctx.arc(x + t / 2, y + t / 2, (t * q) / 6, 0, 6.283); ctx.fill(); } }
      else if (k === 3) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + t, y + t); ctx.lineTo(x, y + t); ctx.closePath(); ctx.fill(); }
      else if (k === 4) { ctx.beginPath(); ctx.arc(x + t / 2, y + (r() < 0.5 ? 0 : t), t / 2, 0, 6.283); ctx.fill(); }
      else { ctx.fillRect(x + t * 0.15, y + t * 0.15, t * 0.7, t * 0.7 * (0.4 + r() * 0.6)); }
      ctx.restore();
    }
  },
  synthwave(ctx, W, H, r, pal, P, S, M, b) {
    const hz = H * 0.62;
    let gr = ctx.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, rgba(pal[0], 1)); gr.addColorStop(0.7, rgba(mix(pal[0], pal[1], 0.45), 1)); gr.addColorStop(1, rgba(mix(pal[1], pal[4], 0.4), 1)); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, hz);
    const ns = 60 + P.den * 14; for (let i = 0; i < ns; i++) { ctx.fillStyle = rgba([255, 255, 255], 0.2 + r() * 0.7); ctx.beginPath(); ctx.arc(r() * W, r() * hz * 0.55, (0.4 + r() * 1.2) * S * 0.0016, 0, 6.283); ctx.fill(); }
    const sr = S * 0.27, sx = W / 2, sy = hz - sr * 0.35, t = mk(W, H), g = t.getContext("2d");
    const g2 = g.createLinearGradient(0, sy - sr, 0, sy + sr); g2.addColorStop(0, rgba(pal[4], 1)); g2.addColorStop(1, rgba(pal[2], 1)); g.fillStyle = g2; g.beginPath(); g.arc(sx, sy, sr, 0, 6.283); g.fill();
    g.globalCompositeOperation = "destination-out"; for (let k = 0; k < 9; k++) g.fillRect(sx - sr, sy + sr * (-0.1 + k * 0.13), sr * 2, sr * 0.012 * (1 + k * 0.9));
    ctx.save(); ctx.filter = `blur(${S * 0.03 + b * 0.5}px)`; ctx.globalAlpha = 0.55; ctx.drawImage(t, 0, 0); ctx.restore(); ctx.drawImage(t, 0, 0);
    gr = ctx.createLinearGradient(0, hz, 0, H); gr.addColorStop(0, rgba(mix(pal[0], pal[1], 0.35), 1)); gr.addColorStop(1, rgba(pal[0], 1)); ctx.fillStyle = gr; ctx.fillRect(0, hz, W, H - hz);
    const nh = 8 + P.den;
    const grid = (g3: any, lw: number) => {
      g3.lineWidth = lw;
      for (let k = -36; k <= 36; k++) { g3.beginPath(); g3.moveTo(W / 2 + k * W * 0.006, hz); g3.lineTo(W / 2 + k * W * 0.07, H); g3.stroke(); }
      for (let k = 1; k <= nh; k++) { const y = hz + (H - hz) * Math.pow(k / nh, 2.3); g3.beginPath(); g3.moveTo(0, y); g3.lineTo(W, y); g3.stroke(); }
    };
    layer(ctx, W, H, b * 0.4 + S * 0.004, (g3) => { g3.strokeStyle = rgba(pal[2], 0.9); grid(g3, S * 0.004); }, "lighter");
    ctx.save(); ctx.strokeStyle = rgba(mix(pal[2], [255, 255, 255], 0.5), 0.85); ctx.globalCompositeOperation = "lighter"; grid(ctx, S * 0.0016); ctx.restore();
    const hg = ctx.createRadialGradient(W / 2, hz, 0, W / 2, hz, W * 0.5); hg.addColorStop(0, rgba(pal[1], 0.5)); hg.addColorStop(1, rgba(pal[1], 0));
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = hg; ctx.fillRect(0, hz - H * 0.12, W, H * 0.24); ctx.restore();
  },
};

export function render(cv: any, W: number, H: number, P: GenParams) {
  const ctx = cv.getContext("2d"), r = mulberry((P.seed | 0) || 1), S = Math.min(W, H), M = Math.max(W, H);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; ctx.filter = "none";
  STYLES[P.style](ctx, W, H, r, P.pal, P, S, M, (P.blur / 100) * 0.03 * M);
  grain(ctx, W, H, P.grain, mulberry(((P.seed | 0) || 1) + 99));
}
