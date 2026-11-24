import type { Settings } from "./types";

export const DEFAULTS: Settings = {
  brand: "Rotno Photo Studio", whatsapp: "01965911606", bkash: "01XXXXXXXXX", price: 199, proDays: 30, free1080Limit: 20, notice: "",
  ticker: "🎨 স্বাগতম! প্রথম ২০টি ছবি Pro ফিচারসহ ফ্রি — 4K ব্যাকগ্রাউন্ড এক ক্লিকে বানান",
  tools: [],
  plans: [{ name: "Pro ১ মাস", price: 199, days: 30, features: "4K, 5K ও 8K ছবি, JPG/PNG, আনলিমিটেড" }],
  guide: "১) জেনারেটর: স্টাইল (নিয়ন, অরোরা, মেশ গ্রেডিয়েন্ট, বোকে, ওয়েভ, লো-পলি, জিওমেট্রিক, সিনথওয়েভ) ও রঙ বেছে নিন।\n২) জটিলতা, গ্লো ও গ্রেইন স্লাইডারে মনের মতো করুন। 🎲 র‍্যান্ডম চাপলে নতুন নতুন ডিজাইন আসবে। পছন্দের ডিজাইনের সিড নম্বর লিখে রাখলে পরে একই ডিজাইন আবার পাবেন।\n৩) সাইজ বেছে (4K সাধারণত ভালো) JPG বা PNG তে \"ছবি তৈরি করুন\" চাপুন।\n\nHTML → ছবি: যেকোনো AI-র বানানো HTML পেস্ট করে প্রিভিউ দেখুন, তারপর 4K ছবি নামান। বাইরের ছবি/ফন্ট ব্যবহার না করাই ভালো।\n\nস্টকে বেচার টিপস: গ্রেইন ২০-৪০ রাখলে গাঢ় গ্রেডিয়েন্টে ব্যান্ডিং কমে। JPG ব্যবহার করুন। লোগো, ব্র্যান্ড ও অন্যের ডিজাইন মেশাবেন না। AI-সহায়তার নিয়ম প্ল্যাটফর্মের বর্তমান নীতি দেখে নিন।",
  promptTemplate: "Create ONE self-contained HTML file that draws a beautiful STATIC background image (no animation needed) on a 1920x1080 stage.\n\nRULES (follow strictly):\n1. Use: html,body{margin:0;width:100%;height:100%;overflow:hidden}. Fill the whole screen.\n2. Use only inline CSS, inline SVG and <canvas>. No external images, fonts or files. No text unless I ask. No people, logos, brands or copyrighted characters.\n3. Style: [neon / aurora / mesh gradient / low poly / geometric / bokeh / waves / synthwave]. Rich smooth gradients with layered shapes and fine subtle details. Avoid large flat empty areas so gradients do not show banding. Add soft grain or texture.\n4. It must work as a commercial stock background with some clean empty space for text.\n5. Output only the HTML code, nothing else.\n\nTHEME: [describe your idea here]",
};

// Makes any HTML animation deterministic (frame by frame). Injected before the page's own scripts.
export const VCLOCK = `(function () {
  var now = 0, tid = 1, rid = 1, timers = [], rafs = [], seed = 1234567;
  var base = 1767225600000, D = Date;
  window.__rafReal = window.requestAnimationFrame.bind(window);
  Math.random = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  performance.now = function () { return now; };
  window.Date = class VDate extends D {
    constructor(...a) { if (a.length === 0) super(base + now); else super(...a); }
    static now() { return base + now; }
  };
  window.setTimeout = function (f, ms) {
    var a = [].slice.call(arguments, 2), id = tid++;
    timers.push({ id: id, due: now + (+ms || 0), f: f, a: a, iv: 0 }); return id;
  };
  window.setInterval = function (f, ms) {
    var a = [].slice.call(arguments, 2), id = tid++, iv = Math.max(+ms || 0, 1);
    timers.push({ id: id, due: now + iv, f: f, a: a, iv: iv }); return id;
  };
  window.clearTimeout = window.clearInterval = function (id) { timers = timers.filter(function (t) { return t.id !== id; }); };
  window.requestAnimationFrame = function (f) { var id = rid++; rafs.push({ id: id, f: f }); return id; };
  window.cancelAnimationFrame = function (id) { rafs = rafs.filter(function (r) { return r.id !== id; }); };
  window.__vcAdvance = function (t) {
    now = t;
    var guard = 0;
    while (guard++ < 10000) {
      var due = timers.filter(function (x) { return x.due <= now; }).sort(function (a, b) { return a.due - b.due; })[0];
      if (!due) break;
      if (due.iv) due.due += due.iv; else timers = timers.filter(function (x) { return x !== due; });
      try { due.f.apply(window, due.a); } catch (e) { console.error(e); }
    }
    var list = rafs; rafs = [];
    list.forEach(function (r) { try { r.f(now); } catch (e) { console.error(e); } });
    try { document.getAnimations().forEach(function (a) { a.pause(); a.currentTime = now; }); } catch (e) {}
  };
})();
`;
