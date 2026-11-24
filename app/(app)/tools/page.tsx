"use client";
import { useApp } from "@/context/AppContext";
import { getTools, safeUrl } from "@/lib/util";

export default function Tools() {
  const { settings, modal, closeModal } = useApp();
  const tools = getTools(settings);
  const info = (i: number) => {
    const x = tools[i];
    modal(<>
      <h2>{x.icon || "🧰"} {x.name}</h2>
      <div className="pre" style={{ margin: "8px 0" }}>{x.details || x.short || ""}</div>
      <div className="row">
        {safeUrl(x.url) && <a className="bl" href={safeUrl(x.url)} target="_blank" rel="noopener noreferrer">🔗 টুলটি খুলুন</a>}
        <button className="sec sm" onClick={closeModal}>বন্ধ করুন</button>
      </div>
    </>);
  };
  return (
    <>
      <div className="card"><h2>🧰 আরও টুলস</h2><div className="mut">আমাদের অন্যান্য কাজের টুল। বিস্তারিত দেখুন বা সরাসরি খুলুন।</div></div>
      {tools.length ? tools.map((x, i) => (
        <div className="card" key={i}>
          <div className="row"><span style={{ fontSize: 30 }}>{x.icon || "🧰"}</span>
            <div className="grow"><b>{x.name}</b>{x.tag && <> <span className="badge b-free">{x.tag}</span></>}<div className="mut">{x.short}</div></div></div>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="sec sm" onClick={() => info(i)}>ℹ বিস্তারিত</button>
            {safeUrl(x.url) && <a className="bl" href={safeUrl(x.url)} target="_blank" rel="noopener noreferrer">🔗 খুলুন</a>}
          </div>
        </div>
      )) : <div className="card mut">শীঘ্রই নতুন টুল আসছে।</div>}
    </>
  );
}
