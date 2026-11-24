"use client";
import { useApp } from "@/context/AppContext";

export default function Guide() {
  const { settings, toast } = useApp();
  const copy = async () => { try { await navigator.clipboard.writeText(settings.promptTemplate); toast("প্রম্পট কপি হয়েছে"); } catch { toast("সিলেক্ট করে কপি করুন"); } };
  return (
    <>
      <div className="card"><h2>📘 প্রমট বানানোর নিয়ম</h2><div className="pre">{settings.guide}</div></div>
      <div className="card"><h3>🤖 AI-কে দেওয়ার প্রম্পট টেমপ্লেট</h3>
        <div className="mut" style={{ marginBottom: 6 }}>কপি করে যেকোনো AI-তে দিন। THEME অংশে আপনার আইডিয়া লিখুন।</div>
        <div className="codebox">{settings.promptTemplate}</div>
        <button className="full sec" onClick={copy}>প্রম্পট কপি করুন</button>
      </div>
    </>
  );
}
