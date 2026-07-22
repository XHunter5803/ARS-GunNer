"use client";

import {
  AlertTriangle,
  Bot,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileJson2,
  Globe2,
  Languages,
  Link2,
  LoaderCircle,
  MessageCircle,
  Plus,
  RadioTower,
  Save,
  Search,
  ShieldCheck,
  Send,
  ThumbsUp,
  Trash2,
  UserCheck,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type InteractiveSection = "favorites" | "sources" | "fact-check" | "articles" | "publishing";

type Favorite = {
  id: number;
  kind: "keyword" | "outlet" | "reporter";
  value: string;
  label: string;
  isActive: boolean;
  demo?: boolean;
};

type Source = {
  id: number;
  name: string;
  homepageUrl: string;
  feedUrl: string;
  sourceType: "official" | "original" | "reporter" | "outlet";
  reliabilityWeight: number;
  status: "active" | "paused" | "error";
  demo?: boolean;
};

export type SelectedNewsSource = {
  id: number;
  headline: string;
  canonical_url: string;
  reporter: string | null;
  published_at: string | null;
  clean_text: string;
  source_name: string | null;
  source_type: string | null;
};

type ValidationResult = {
  valid: boolean;
  readiness_score: number;
  status: string;
  errors: string[];
  readiness_notes: string[];
};

const demoFavorites: Favorite[] = [
  { id: -1, kind: "keyword", value: "transfer strategy", label: "Transfer strategy", isActive: true, demo: true },
  { id: -2, kind: "outlet", value: "Official Club News", label: "Official Club News", isActive: true, demo: true },
  { id: -3, kind: "reporter", value: "Demo Reporter", label: "Demo Reporter", isActive: false, demo: true },
];

const demoSources: Source[] = [
  { id: -1, name: "Official Club Feed", homepageUrl: "https://example.com", feedUrl: "https://example.com/rss", sourceType: "official", reliabilityWeight: 100, status: "active", demo: true },
  { id: -2, name: "Demo Sports Wire", homepageUrl: "https://example.org", feedUrl: "https://example.org/feed", sourceType: "original", reliabilityWeight: 85, status: "active", demo: true },
];

const factGroups = {
  confirmed: [
    "Demo: สโมสรยืนยันการเปลี่ยนบทบาททีมงานผ่านประกาศทางการ",
    "Demo: รายงานอิสระสองต้นทางระบุวันเผยแพร่ตรงกัน",
  ],
  claims: [
    "Demo: มีรายงานว่าสโมสรสนใจทางเลือกใหม่ แต่ยังไม่มีการยืนยันการเจรจา",
    "Demo: Reporter รายหนึ่งคาดว่าการตัดสินใจอาจเกิดขึ้นในสัปดาห์หน้า",
  ],
  conflicts: [
    "Demo: รายงานจากแต่ละแหล่งยังให้ข้อมูลไม่ตรงกันเรื่องกรอบเวลา",
  ],
};

const emptyParagraphs = ["", "", "", "", ""];

function StatusBanner({ mode, message }: { mode: "loading" | "live" | "demo" | "error"; message: string }) {
  const style = mode === "live" ? "bg-[#eaf9f2] text-[#247a5e]" : mode === "error" ? "bg-[#fff0f1] text-[#b8343d]" : "bg-[#fff5dd] text-[#8d6414]";
  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-[10px] font-semibold ${style}`}>
      {mode === "loading" ? <LoaderCircle className="size-3.5 animate-spin" /> : mode === "live" ? <CheckCircle2 className="size-3.5" /> : mode === "error" ? <XCircle className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
      {message}
    </div>
  );
}

function FavoritesWorkspace({ notify }: { notify: (message: string) => void }) {
  const [favorites, setFavorites] = useState<Favorite[]>(demoFavorites);
  const [kind, setKind] = useState<Favorite["kind"]>("keyword");
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<"loading" | "live" | "demo" | "error">("loading");
  const [message, setMessage] = useState("กำลังตรวจ D1...");

  useEffect(() => {
    let active = true;
    fetch("/api/v1/favorites", { headers: { accept: "application/json" } })
      .then(async (response) => {
        const payload = await response.json() as { data?: { favorites?: Favorite[] }; error?: { message?: string } };
        if (!active) return;
        if (!response.ok) throw new Error(payload.error?.message || "D1 unavailable");
        setFavorites(payload.data?.favorites ?? []);
        setMode("live");
        setMessage("เชื่อม D1 แล้ว · รายการใหม่จะถูกบันทึกถาวร");
      })
      .catch(() => {
        if (!active) return;
        setMode("demo");
        setMessage("แสดงข้อมูล Demo · D1 จะพร้อมหลัง Migration ถูกใช้งาน");
      });
    return () => { active = false; };
  }, []);

  const addFavorite = async () => {
    if (value.trim().length < 2) {
      notify("กรุณากรอกอย่างน้อย 2 ตัวอักษร");
      return;
    }
    if (mode !== "live") {
      notify("ยังไม่บันทึก: D1 ไม่พร้อมในโหมด Demo");
      return;
    }
    const response = await fetch("/api/v1/favorites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, value, label: value }),
    });
    const payload = await response.json() as { data?: { favorite?: Favorite }; error?: { message?: string } };
    if (!response.ok || !payload.data?.favorite) {
      notify(payload.error?.message || "เพิ่มรายการไม่สำเร็จ");
      return;
    }
    setFavorites((items) => [payload.data!.favorite!, ...items]);
    setValue("");
    notify("บันทึกรายการติดตามลง D1 แล้ว");
  };

  const removeFavorite = async (item: Favorite) => {
    if (item.demo || mode !== "live") {
      notify("รายการ Demo ไม่ถูกลบจากฐานข้อมูล");
      return;
    }
    const response = await fetch(`/api/v1/favorites?id=${item.id}`, { method: "DELETE" });
    if (!response.ok) {
      notify("ลบรายการไม่สำเร็จ");
      return;
    }
    setFavorites((items) => items.filter((favorite) => favorite.id !== item.id));
    notify("ลบรายการติดตามแล้ว");
  };

  return (
    <section className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
      <article className="rounded-[22px] border border-[#e7e4de] bg-white p-5 shadow-[0_10px_30px_rgba(31,41,58,.04)]">
        <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#9a9ea7]">New monitoring rule</p>
        <h2 className="mt-1 text-lg font-extrabold text-[#1c2537]">เพิ่มรายการติดตาม</h2>
        <div className="mt-5 grid grid-cols-3 gap-1 rounded-xl bg-[#f2efe9] p-1">
          {(["keyword", "outlet", "reporter"] as const).map((item) => (
            <button type="button" key={item} onClick={() => setKind(item)} className={`rounded-lg py-2 text-[10px] font-bold capitalize ${kind === item ? "bg-white text-[#20293b] shadow-sm" : "text-[#858b96]"}`}>{item}</button>
          ))}
        </div>
        <label className="mt-4 block text-[10px] font-bold text-[#5f6673]" htmlFor="favorite-value">ชื่อหรือคำค้น</label>
        <div className="relative mt-2">
          {kind === "keyword" ? <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ba0a9]" /> : kind === "outlet" ? <Globe2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ba0a9]" /> : <UserCheck className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ba0a9]" />}
          <input id="favorite-value" value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void addFavorite(); }} placeholder={kind === "keyword" ? "เช่น transfer strategy" : kind === "outlet" ? "ชื่อสำนักข่าว" : "ชื่อ Reporter"} className="h-11 w-full rounded-xl border border-[#dedad3] bg-[#fffefa] pl-10 pr-3 text-xs outline-none focus:border-[#dc626a] focus:ring-4 focus:ring-[#ef4b55]/10" />
        </div>
        <button type="button" onClick={() => void addFavorite()} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#18243a] px-4 py-3 text-[11px] font-bold text-white hover:bg-[#22314d]"><Plus className="size-4" />Add favorite</button>
        <div className="mt-4"><StatusBanner mode={mode} message={message} /></div>
      </article>

      <article className="rounded-[22px] border border-[#e7e4de] bg-white p-5 shadow-[0_10px_30px_rgba(31,41,58,.04)]">
        <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#9a9ea7]">Active monitor</p><h2 className="mt-1 text-lg font-extrabold text-[#1c2537]">Favorites</h2></div><span className="rounded-full bg-[#f1eee8] px-2.5 py-1 text-[9px] font-bold text-[#737986]">{favorites.length} rules</span></div>
        <div className="mt-4 space-y-2">
          {favorites.length ? favorites.map((item) => (
            <div key={`${item.id}-${item.kind}`} className="flex items-center gap-3 rounded-xl border border-[#ece8e1] bg-[#fffefa] p-3">
              <div className={`grid size-9 place-items-center rounded-xl ${item.kind === "keyword" ? "bg-[#fff0f1] text-[#db3d47]" : item.kind === "outlet" ? "bg-[#edf4ff] text-[#3e6cc2]" : "bg-[#edf9f4] text-[#268064]"}`}>
                {item.kind === "keyword" ? <Search className="size-4" /> : item.kind === "outlet" ? <Globe2 className="size-4" /> : <UserCheck className="size-4" />}
              </div>
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-[#283143]">{item.label}</p><p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[.1em] text-[#9a9fa8]">{item.kind}{item.demo ? " · demo" : " · D1"}</p></div>
              <span className={`size-2 rounded-full ${item.isActive ? "bg-[#48b88c]" : "bg-[#c3c5ca]"}`} />
              <button type="button" onClick={() => void removeFavorite(item)} aria-label={`ลบ ${item.label}`} className="grid size-8 place-items-center rounded-lg text-[#a1a5ad] hover:bg-[#fff0f1] hover:text-[#d83b45]"><Trash2 className="size-4" /></button>
            </div>
          )) : <div className="grid min-h-44 place-items-center rounded-xl border border-dashed border-[#ddd8cf] text-center"><div><Search className="mx-auto size-6 text-[#a4a8af]" /><p className="mt-2 text-xs font-bold text-[#565e6a]">ยังไม่มีรายการติดตาม</p></div></div>}
        </div>
      </article>
    </section>
  );
}

function SourcesWorkspace({ notify }: { notify: (message: string) => void }) {
  const [sources, setSources] = useState<Source[]>(demoSources);
  const [mode, setMode] = useState<"loading" | "live" | "demo" | "error">("loading");
  const [form, setForm] = useState({ name: "", homepage: "", feed: "", type: "outlet" as Source["sourceType"] });

  useEffect(() => {
    let active = true;
    fetch("/api/v1/sources")
      .then(async (response) => {
        const payload = await response.json() as { data?: { sources?: Source[] } };
        if (!active) return;
        if (!response.ok) throw new Error("D1 unavailable");
        setSources(payload.data?.sources ?? []);
        setMode("live");
      })
      .catch(() => { if (active) setMode("demo"); });
    return () => { active = false; };
  }, []);

  const addSource = async () => {
    if (mode !== "live") return notify("ยังไม่บันทึก: D1 ไม่พร้อมในโหมด Demo");
    const response = await fetch("/api/v1/sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: form.name, homepage_url: form.homepage, feed_url: form.feed, source_type: form.type, reliability_weight: form.type === "official" ? 100 : 70 }),
    });
    const payload = await response.json() as { data?: { source?: Source }; error?: { message?: string } };
    if (!response.ok || !payload.data?.source) return notify(payload.error?.message || "เพิ่มแหล่งข่าวไม่สำเร็จ");
    setSources((items) => [payload.data!.source!, ...items]);
    setForm({ name: "", homepage: "", feed: "", type: "outlet" });
    notify("บันทึกแหล่งข่าวลง D1 แล้ว");
  };

  return (
    <section className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
      <article className="rounded-[22px] border border-[#e7e4de] bg-white p-5 shadow-[0_10px_30px_rgba(31,41,58,.04)]">
        <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#9a9ea7]">RSS allowlist</p><h2 className="mt-1 text-lg font-extrabold">เพิ่มแหล่งข่าว</h2>
        <div className="mt-4 space-y-3">
          <input aria-label="ชื่อแหล่งข่าว" placeholder="Source name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-11 w-full rounded-xl border border-[#dedad3] px-3 text-xs outline-none focus:border-[#dc626a]" />
          <input aria-label="เว็บไซต์หลัก" placeholder="https://example.com" value={form.homepage} onChange={(event) => setForm({ ...form, homepage: event.target.value })} className="h-11 w-full rounded-xl border border-[#dedad3] px-3 text-xs outline-none focus:border-[#dc626a]" />
          <input aria-label="RSS Feed URL" placeholder="https://example.com/rss" value={form.feed} onChange={(event) => setForm({ ...form, feed: event.target.value })} className="h-11 w-full rounded-xl border border-[#dedad3] px-3 text-xs outline-none focus:border-[#dc626a]" />
          <select aria-label="ประเภทแหล่งข่าว" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as Source["sourceType"] })} className="h-11 w-full rounded-xl border border-[#dedad3] bg-white px-3 text-xs outline-none focus:border-[#dc626a]"><option value="official">Official</option><option value="original">Original source</option><option value="reporter">Reporter</option><option value="outlet">News outlet</option></select>
        </div>
        <button type="button" onClick={() => void addSource()} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#18243a] py-3 text-[11px] font-bold text-white"><Plus className="size-4" />Add source</button>
        <div className="mt-4"><StatusBanner mode={mode} message={mode === "live" ? "เชื่อม D1 แล้ว · ตรวจ HTTPS และ Private network ก่อนบันทึก" : "แสดงข้อมูล Demo · ยังไม่ส่ง Request ไปยัง RSS ภายนอก"} /></div>
      </article>
      <article className="rounded-[22px] border border-[#e7e4de] bg-white p-5 shadow-[0_10px_30px_rgba(31,41,58,.04)]">
        <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">Source registry</h2><span className="rounded-full bg-[#f1eee8] px-2.5 py-1 text-[9px] font-bold">{sources.length} feeds</span></div>
        <div className="mt-4 space-y-2">
          {sources.map((source) => <div key={source.id} className="flex items-center gap-3 rounded-xl border border-[#ece8e1] p-3"><div className="grid size-10 place-items-center rounded-xl bg-[#edf4ff] text-[#3f6fc7]"><RadioTower className="size-4" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-xs font-bold">{source.name}</p>{source.demo ? <span className="rounded bg-[#fff4d8] px-1.5 py-0.5 text-[8px] font-bold text-[#91650f]">DEMO</span> : null}</div><p className="mt-1 truncate text-[9px] text-[#9297a0]">{source.feedUrl}</p></div><div className="text-right"><p className="text-[10px] font-extrabold text-[#273044]">{source.reliabilityWeight}</p><p className="text-[8px] uppercase text-[#9ca0a8]">weight</p></div><span className={`size-2 rounded-full ${source.status === "active" ? "bg-[#48b88c]" : "bg-[#d9a044]"}`} /></div>)}
        </div>
      </article>
    </section>
  );
}

function FactCheckWorkspace({ notify }: { notify: (message: string) => void }) {
  const [tab, setTab] = useState<keyof typeof factGroups>("confirmed");
  const [verified, setVerified] = useState(false);
  const tabs = [{ id: "confirmed" as const, label: "Confirmed facts", count: 2 }, { id: "claims" as const, label: "Reported claims", count: 2 }, { id: "conflicts" as const, label: "Conflicts", count: 1 }];
  return (
    <section className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
      <article className="rounded-[22px] border border-[#e7e4de] bg-white p-5 shadow-[0_10px_30px_rgba(31,41,58,.04)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#9a9ea7]">Cluster #demo-001</p><h2 className="mt-1 text-lg font-extrabold">Source comparison</h2></div><span className="rounded-full bg-[#fff4d8] px-3 py-1.5 text-[9px] font-bold text-[#95690f]">Demo evidence</span></div>
        <div className="mt-5 grid gap-2 sm:grid-cols-3">{tabs.map((item) => <button type="button" key={item.id} onClick={() => setTab(item.id)} className={`rounded-xl border px-3 py-3 text-left ${tab === item.id ? "border-[#db626a] bg-[#fff4f4]" : "border-[#e8e4dd] bg-[#fffefa]"}`}><span className="text-[10px] font-bold text-[#5c6471]">{item.label}</span><strong className={`mt-2 block text-xl ${tab === item.id ? "text-[#d83b45]" : "text-[#253044]"}`}>{item.count}</strong></button>)}</div>
        <div className="mt-4 space-y-2">{factGroups[tab].map((item) => <div key={item} className="flex items-start gap-3 rounded-xl border border-[#ece8e1] bg-[#fffefa] p-3"><div className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${tab === "confirmed" ? "bg-[#eaf9f2] text-[#277e62]" : tab === "claims" ? "bg-[#edf4ff] text-[#3f6fc7]" : "bg-[#fff0e8] text-[#b26127]"}`}>{tab === "confirmed" ? <Check className="size-4" /> : tab === "claims" ? <ShieldCheck className="size-4" /> : <AlertTriangle className="size-4" />}</div><p className="text-xs leading-5 text-[#5f6673]">{item}</p></div>)}</div>
      </article>
      <aside className="space-y-4">
        <article className="rounded-[22px] border border-[#e7e4de] bg-white p-5 shadow-[0_10px_30px_rgba(31,41,58,.04)]"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#9a9ea7]">Evidence map</p><div className="mt-4 space-y-3">{[{ name: "Official Club Feed", type: "Main · Official", score: 100 }, { name: "Demo Sports Wire", type: "Independent", score: 85 }, { name: "Demo Reporter", type: "Reporter", score: 72 }].map((source) => <div key={source.name} className="flex items-center gap-3"><div className="grid size-8 place-items-center rounded-lg bg-[#f1eee8] text-[#687080]"><Link2 className="size-3.5" /></div><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-bold">{source.name}</p><p className="text-[9px] text-[#9a9fa8]">{source.type}</p></div><strong className="text-[11px] text-[#2c735c]">{source.score}</strong></div>)}</div></article>
        <button type="button" onClick={() => { setVerified(!verified); notify(verified ? "ยกเลิกสถานะตรวจสอบใน Demo" : "ทำเครื่องหมายว่าตรวจแล้วใน Demo"); }} className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[11px] font-bold text-white ${verified ? "bg-[#657080]" : "bg-[#1f8a69]"}`}>{verified ? <XCircle className="size-4" /> : <CheckCircle2 className="size-4" />}{verified ? "Undo demo verification" : "Mark demo as verified"}</button>
        <StatusBanner mode="demo" message="การยืนยันนี้เป็น Demo และยังไม่บันทึก Fact Check ลง D1" />
      </aside>
    </section>
  );
}

function ArticleWorkspace({ notify, selectedNews }: { notify: (message: string) => void; selectedNews: SelectedNewsSource[] }) {
  const [language, setLanguage] = useState<"th" | "en" | "bilingual">("th");
  const [headline, setHeadline] = useState("");
  const [paragraphs, setParagraphs] = useState(emptyParagraphs);
  const [closingQuestion, setClosingQuestion] = useState("");
  const [signature, setSignature] = useState("— ตลาดไม่ปิด ข่าวก็ยังไม่จบ");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [articleId, setArticleId] = useState<number | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState("unsaved");
  const [working, setWorking] = useState(false);
  const selectedSources = useMemo(() => selectedNews.map((item) => ({
    source_name: item.source_name || "Unknown source",
    reporter: item.reporter || undefined,
    published_at: item.published_at || undefined,
    url: item.canonical_url,
    headline: item.headline,
    article_text: item.clean_text || item.headline,
    source_type: (["official", "original", "reporter", "outlet"].includes(item.source_type || "") ? item.source_type : "outlet") as "official" | "original" | "reporter" | "outlet",
    reported_claims: [item.clean_text || item.headline],
  })), [selectedNews]);
  const article = useMemo(() => ({
    language,
    pattern: "perspective" as const,
    category: "ฟุตบอล",
    label: "มุมมอง",
    headline,
    paragraphs,
    closing_question: closingQuestion,
    signature,
    hashtags: ["#TransferNews", "#Football", "#TransferTruth"],
    main_source: selectedSources[0] ? { source_name: selectedSources[0].source_name, reporter: selectedSources[0].reporter, published_at: selectedSources[0].published_at, url: selectedSources[0].url } : { source_name: "", url: "" },
    supporting_sources: selectedSources.slice(1).map((source) => ({ source_name: source.source_name, reporter: source.reporter, published_at: source.published_at, url: source.url })),
    confirmed_facts: [] as string[],
    reported_claims: selectedSources.map((source) => source.article_text).filter(Boolean),
    conflicts: [] as string[],
  }), [closingQuestion, headline, language, paragraphs, selectedSources, signature]);

  const updateParagraph = (index: number, value: string) => setParagraphs((items) => items.map((item, current) => current === index ? value : item));
  const validate = async () => {
    const response = await fetch("/api/v1/articles/validate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ article }) });
    const payload = await response.json() as { data?: ValidationResult; error?: { message?: string } };
    if (!response.ok || !payload.data) return notify(payload.error?.message || "ตรวจบทความไม่สำเร็จ");
    setValidation(payload.data);
    notify(`Readiness Score ${payload.data.readiness_score}/100`);
  };

  const generateWithAi = async () => {
    if (!selectedSources.length) {
      notify("กรุณากลับไปหน้า Dashboard แล้วเลือกข่าวอย่างน้อย 1 ข่าว");
      return;
    }
    setWorking(true);
    try {
      const response = await fetch("/api/v1/articles/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          language,
          category: "ฟุตบอล",
          signature,
          brand_hashtags: ["#TransferNews", "#Football", "#TransferTruth"],
          sources: selectedSources,
        }),
      });
      const payload = await response.json() as { data?: { article?: typeof article; validation?: ValidationResult }; error?: { message?: string } };
      if (!response.ok || !payload.data?.article) return notify(payload.error?.message || "Workers AI สร้างบทความไม่สำเร็จ");
      setHeadline(payload.data.article.headline);
      setParagraphs(payload.data.article.paragraphs);
      setClosingQuestion(payload.data.article.closing_question);
      setSignature(payload.data.article.signature);
      setValidation(payload.data.validation ?? null);
      setWorkflowStatus("ai-draft");
      notify(`Workers AI สร้าง Draft จากข่าวจริง ${selectedSources.length} แหล่งแล้ว`);
    } finally {
      setWorking(false);
    }
  };

  const saveRevision = async () => {
    setWorking(true);
    try {
      const response = await fetch("/api/v1/articles", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ article, article_id: articleId ?? undefined }) });
      const payload = await response.json() as { data?: { article?: { id: number }; article_id?: number; validation?: ValidationResult }; error?: { message?: string } };
      if (!response.ok || !payload.data) return notify(payload.error?.message || "บันทึก Revision ไม่สำเร็จ");
      const id = payload.data.article?.id ?? payload.data.article_id;
      if (id) setArticleId(id);
      if (payload.data.validation) setValidation(payload.data.validation);
      setWorkflowStatus("draft");
      notify(articleId ? "บันทึก Revision ใหม่ลง D1 แล้ว" : "สร้างบทความและ Revision 1 ใน D1 แล้ว");
    } finally {
      setWorking(false);
    }
  };

  const transition = async (status: "review" | "approved") => {
    if (!articleId) return notify("กรุณาบันทึก Draft ก่อนเปลี่ยนสถานะ");
    setWorking(true);
    try {
      const response = await fetch("/api/v1/articles", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: articleId, status }) });
      const payload = await response.json() as { data?: { article?: { status?: string } }; error?: { message?: string } };
      if (!response.ok) return notify(payload.error?.message || "เปลี่ยนสถานะไม่สำเร็จ");
      setWorkflowStatus(payload.data?.article?.status ?? status);
      notify(status === "approved" ? "อนุมัติบทความแล้ว" : "ส่งบทความเข้าคิวตรวจแล้ว");
    } finally {
      setWorking(false);
    }
  };

  return (
    <section className="grid gap-4 2xl:grid-cols-[1.35fr_.65fr]">
      <article className="rounded-[22px] border border-[#e7e4de] bg-white p-5 shadow-[0_10px_30px_rgba(31,41,58,.04)]">
        <div className={`mb-5 rounded-xl border p-4 ${selectedNews.length ? "border-[#cddbf8] bg-[#f5f8ff]" : "border-[#f0c9cc] bg-[#fff7f7]"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#3f6ad8]">ข่าวต้นทางที่เลือก</p><h3 className="mt-1 text-sm font-extrabold text-[#273044]">{selectedNews.length ? `${selectedNews.length} ข่าวพร้อมส่งให้ AI` : "ยังไม่ได้เลือกข่าว"}</h3></div>
            <span className="rounded-full bg-white px-3 py-1 text-[9px] font-bold text-[#596372] shadow-sm">Main + supporting sources</span>
          </div>
          {selectedNews.length ? <div className="mt-3 space-y-2">{selectedNews.map((item, index) => <div key={item.id} className="flex items-start gap-3 rounded-lg bg-white p-3"><span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[9px] font-extrabold ${index === 0 ? "bg-[#3f6ad8] text-white" : "bg-[#e9efff] text-[#3f6ad8]"}`}>{index + 1}</span><div className="min-w-0"><p className="line-clamp-2 text-[11px] font-bold leading-5 text-[#303949]">{item.headline}</p><p className="mt-1 text-[9px] text-[#89919d]">{item.source_name || "Unknown source"} · {item.reporter || "ไม่ระบุ Reporter"}</p></div></div>)}</div> : <p className="mt-2 text-[10px] leading-5 text-[#9a5b61]">กลับไปหน้า Dashboard เลือกข่าว แล้วกด “สร้างบทความด้วย AI”</p>}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#9a9ea7]">Perspective pattern</p><h2 className="mt-1 text-lg font-extrabold">Article editor</h2></div><div className="grid grid-cols-3 rounded-xl bg-[#f1eee8] p-1">{(["th", "en", "bilingual"] as const).map((item) => <button type="button" key={item} onClick={() => setLanguage(item)} className={`rounded-lg px-3 py-2 text-[9px] font-bold ${language === item ? "bg-white text-[#222c3f] shadow-sm" : "text-[#858b96]"}`}>{item}</button>)}</div></div>
        <label htmlFor="article-headline" className="mt-5 block text-[10px] font-bold text-[#606775]">พาดหัวเหตุและผล</label><textarea id="article-headline" value={headline} onChange={(event) => setHeadline(event.target.value)} rows={2} className="mt-2 w-full resize-none rounded-xl border border-[#dedad3] bg-[#fffefa] p-3 text-sm font-bold leading-6 outline-none focus:border-[#dc626a] focus:ring-4 focus:ring-[#ef4b55]/10" />
        <div className="mt-4 space-y-3">{paragraphs.map((paragraph, index) => <div key={index}><div className="mb-1.5 flex items-center justify-between"><label htmlFor={`paragraph-${index}`} className="text-[10px] font-bold text-[#606775]">ย่อหน้าที่ {index + 1}</label><span className="text-[9px] text-[#9ba0a9]">{paragraph.length} chars</span></div><textarea id={`paragraph-${index}`} value={paragraph} onChange={(event) => updateParagraph(index, event.target.value)} rows={3} className="w-full resize-y rounded-xl border border-[#e1ddd6] bg-[#fffefa] p-3 text-xs leading-5 outline-none focus:border-[#dc626a]" /></div>)}</div>
        <label htmlFor="article-signature" className="mt-4 block text-[10px] font-bold text-[#606775]">Signature</label><input id="article-signature" value={signature} onChange={(event) => setSignature(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#dedad3] bg-[#fffefa] px-3 text-xs outline-none focus:border-[#dc626a]" />
        <label htmlFor="article-closing" className="mt-4 block text-[10px] font-bold text-[#606775]">คำถามปิดท้าย</label><textarea id="article-closing" value={closingQuestion} onChange={(event) => setClosingQuestion(event.target.value)} rows={2} className="mt-2 w-full resize-y rounded-xl border border-[#e1ddd6] bg-[#fffefa] p-3 text-xs leading-5 outline-none focus:border-[#dc626a]" />
        <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => void generateWithAi()} disabled={working || !selectedNews.length} className="inline-flex items-center gap-2 rounded-xl bg-[#3f6ad8] px-4 py-3 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"><Bot className="size-4" />{working ? "AI กำลังเขียน..." : "สร้างบทความจากข่าวที่เลือก"}</button><button type="button" onClick={() => void validate()} disabled={working || !headline.trim()} className="inline-flex items-center gap-2 rounded-xl bg-[#ef4b55] px-4 py-3 text-[11px] font-bold text-white disabled:opacity-60"><ShieldCheck className="size-4" />Validate draft</button><button type="button" onClick={() => void saveRevision()} disabled={working || !headline.trim()} className="inline-flex items-center gap-2 rounded-xl border border-[#dedad3] bg-white px-4 py-3 text-[11px] font-bold text-[#4e5664] disabled:opacity-60"><Save className="size-4" />Save revision</button><button type="button" onClick={() => setShowJson(!showJson)} className="inline-flex items-center gap-2 rounded-xl border border-[#dedad3] bg-white px-4 py-3 text-[11px] font-bold text-[#4e5664]"><FileJson2 className="size-4" />{showJson ? "Hide JSON" : "Preview JSON"}</button></div>
      </article>
      <aside className="space-y-4">
        <article className="rounded-[22px] border border-[#e7e4de] bg-white p-5 shadow-[0_10px_30px_rgba(31,41,58,.04)]"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#9a9ea7]">Readiness gate</p><h2 className="mt-1 text-lg font-extrabold">{validation ? `${validation.readiness_score}/100` : "Not checked"}</h2></div><div className={`grid size-12 place-items-center rounded-2xl ${validation?.readiness_score && validation.readiness_score >= 85 ? "bg-[#eaf9f2] text-[#258064]" : "bg-[#fff2e8] text-[#b46329]"}`}><ShieldCheck className="size-6" /></div></div>{validation ? <div className="mt-4"><div className="h-2 overflow-hidden rounded-full bg-[#ece9e3]"><div className="h-full rounded-full bg-[linear-gradient(90deg,#ef4b55,#ff777e)]" style={{ width: `${validation.readiness_score}%` }} /></div><p className="mt-3 text-[10px] font-bold uppercase tracking-[.1em] text-[#6a7180]">Status: {validation.status}</p><div className="mt-3 space-y-2">{validation.readiness_notes.length ? validation.readiness_notes.map((note) => <p key={note} className="flex items-start gap-2 text-[10px] leading-4 text-[#777e89]"><ChevronRight className="mt-0.5 size-3 shrink-0 text-[#ef4b55]" />{note}</p>) : <p className="text-[10px] text-[#287a60]">ผ่านกฎโครงสร้างและภาษา</p>}</div></div> : <p className="mt-4 text-[10px] leading-5 text-[#838994]">กด Validate draft เพื่อตรวจแหล่งข่าว โครงสร้าง ภาษา และข้อความหลุดก่อนอนุมัติ</p>}</article>
        <article className="rounded-[22px] border border-[#e7e4de] bg-white p-5 shadow-[0_10px_30px_rgba(31,41,58,.04)]"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#9a9ea7]">Approval workflow</p><h3 className="mt-1 text-sm font-extrabold capitalize">{workflowStatus}</h3></div><span className="rounded-full bg-[#f1eee8] px-2.5 py-1 text-[9px] font-bold">{articleId ? `#${articleId}` : "Not saved"}</span></div><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => void transition("review")} disabled={working || workflowStatus !== "draft"} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#edf4ff] px-3 py-2.5 text-[10px] font-bold text-[#3e67b5] disabled:cursor-not-allowed disabled:opacity-45"><Send className="size-3.5" />Request review</button><button type="button" onClick={() => void transition("approved")} disabled={working || workflowStatus !== "review" || (validation?.readiness_score ?? 0) < 85} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#eaf9f2] px-3 py-2.5 text-[10px] font-bold text-[#26795f] disabled:cursor-not-allowed disabled:opacity-45"><ThumbsUp className="size-3.5" />Approve</button></div><p className="mt-3 text-[9px] leading-4 text-[#9297a0]">ปุ่ม Approve เปิดเมื่อบทความอยู่ใน Review และ Readiness Score ≥ 85</p></article>
        <article className="rounded-[22px] border border-[#e7e4de] bg-white p-5 shadow-[0_10px_30px_rgba(31,41,58,.04)]"><div className="flex items-center gap-2"><Languages className="size-4 text-[#466fc0]" /><h3 className="text-xs font-extrabold">Language policy</h3></div><p className="mt-2 text-[10px] leading-5 text-[#7b818c]">ค่า <strong>{language}</strong> จะถูกตรวจว่าไม่มีภาษาอื่นหลุดเป็นประโยคยาว และลบ SOURCE, JSON, advertisement หรือ prompt residue</p></article>
        {showJson ? <pre className="max-h-[520px] overflow-auto rounded-[22px] bg-[#101b2d] p-4 text-[9px] leading-4 text-[#b8c4d8] shadow-xl">{JSON.stringify(article, null, 2)}</pre> : null}
      </aside>
    </section>
  );
}

type PublishingArticle = { id: number; headline: string; status: string; readinessScore: number };
type PublishingJob = { id: number; articleId: number; channel: "telegram"; scheduledAt: string | null; status: string; attemptCount: number; previewText: string };
type PublishingPreview = { channel: "telegram"; text: string; character_count: number; character_limit: number; truncated: boolean };

const demoSocialPreviews: PublishingPreview[] = [
  { channel: "telegram", text: "มุมมอง\nเมื่อแผนเดิมยังไม่ชัดเจน สโมสรจึงอาจต้องเปิดทางเลือกใหม่\n\nข้อมูลตัวอย่างสำหรับ Preview เท่านั้น\n\n#TransferNews #Football #TransferTruth", character_count: 139, character_limit: 4096, truncated: false },
];

function PublishingWorkspace({ notify }: { notify: (message: string) => void }) {
  const [articlesList, setArticlesList] = useState<PublishingArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState("");
  const [previews, setPreviews] = useState<PublishingPreview[]>(demoSocialPreviews);
  const [channels, setChannels] = useState<Array<PublishingPreview["channel"]>>(["telegram"]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [jobs, setJobs] = useState<PublishingJob[]>([]);
  const [mode, setMode] = useState<"loading" | "live" | "demo" | "error">("loading");
  const [working, setWorking] = useState(false);

  const loadData = async () => {
    try {
      const [articleResponse, jobResponse] = await Promise.all([fetch("/api/v1/articles"), fetch("/api/v1/publishing/jobs")]);
      const articlePayload = await articleResponse.json() as { data?: { articles?: PublishingArticle[] } };
      const jobPayload = await jobResponse.json() as { data?: { jobs?: PublishingJob[] } };
      if (!articleResponse.ok || !jobResponse.ok) throw new Error("D1 unavailable");
      const approved = (articlePayload.data?.articles ?? []).filter((article) => ["approved", "scheduled", "published"].includes(article.status));
      setArticlesList(approved);
      setJobs(jobPayload.data?.jobs ?? []);
      setMode("live");
    } catch {
      setMode("demo");
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([fetch("/api/v1/articles"), fetch("/api/v1/publishing/jobs")])
      .then(async ([articleResponse, jobResponse]) => {
        const articlePayload = await articleResponse.json() as { data?: { articles?: PublishingArticle[] } };
        const jobPayload = await jobResponse.json() as { data?: { jobs?: PublishingJob[] } };
        if (!active) return;
        if (!articleResponse.ok || !jobResponse.ok) throw new Error("D1 unavailable");
        setArticlesList((articlePayload.data?.articles ?? []).filter((article) => ["approved", "scheduled", "published"].includes(article.status)));
        setJobs(jobPayload.data?.jobs ?? []);
        setMode("live");
      })
      .catch(() => { if (active) setMode("demo"); });
    return () => { active = false; };
  }, []);

  const previewArticle = async () => {
    if (!selectedArticle) return notify("เลือกบทความ Approved ก่อนสร้าง Preview");
    setWorking(true);
    try {
      const response = await fetch("/api/v1/publishing/preview", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ article_id: Number(selectedArticle) }) });
      const payload = await response.json() as { data?: { previews?: PublishingPreview[] }; error?: { message?: string } };
      if (!response.ok || !payload.data?.previews) return notify(payload.error?.message || "สร้าง Preview ไม่สำเร็จ");
      setPreviews(payload.data.previews);
      notify("สร้าง Social Preview จาก Revision ล่าสุดแล้ว");
    } finally { setWorking(false); }
  };

  const toggleChannel = (channel: PublishingPreview["channel"]) => setChannels((items) => items.includes(channel) ? items.filter((item) => item !== channel) : [...items, channel]);

  const schedule = async () => {
    if (!selectedArticle || !channels.length) return notify("เลือกบทความและอย่างน้อยหนึ่งช่องทาง");
    setWorking(true);
    try {
      const response = await fetch("/api/v1/publishing/jobs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ article_id: Number(selectedArticle), channels, scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined }) });
      const payload = await response.json() as { data?: { jobs?: PublishingJob[] }; error?: { message?: string } };
      if (!response.ok || !payload.data?.jobs) return notify(payload.error?.message || "จัดคิวไม่สำเร็จ");
      setJobs((items) => [...payload.data!.jobs!, ...items]);
      notify(`จัดคิว ${payload.data.jobs.length} ช่องทางแล้ว · ยังไม่ส่งจนกว่า Dispatcher จะทำงาน`);
    } finally { setWorking(false); }
  };

  const dispatch = async () => {
    setWorking(true);
    try {
      const response = await fetch("/api/v1/publishing/dispatch", { method: "POST" });
      const payload = await response.json() as { data?: { enabled?: boolean; sent?: number; failed?: number; message?: string }; error?: { message?: string } };
      if (!response.ok || !payload.data) return notify(payload.error?.message || "Dispatcher ไม่พร้อม");
      notify(payload.data.enabled ? `ส่งสำเร็จ ${payload.data.sent ?? 0} · ล้มเหลว ${payload.data.failed ?? 0}` : "External publishing ถูกปิดจากฝั่ง Server");
      await loadData();
    } finally { setWorking(false); }
  };

  const cancelJob = async (job: PublishingJob) => {
    const response = await fetch("/api/v1/publishing/jobs", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: job.id, action: "cancel" }) });
    if (!response.ok) return notify("ยกเลิกได้เฉพาะงานที่ยังอยู่ในคิว");
    setJobs((items) => items.map((item) => item.id === job.id ? { ...item, status: "cancelled" } : item));
    notify("ยกเลิกงานในคิวแล้ว");
  };

  const channelIcon = () => <MessageCircle className="size-4" />;

  return (
    <section className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
        <article className="rounded-[22px] border border-[#e7e4de] bg-white p-5 shadow-[0_10px_30px_rgba(31,41,58,.04)]">
          <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#9a9ea7]">Queue controls</p><h2 className="mt-1 text-lg font-extrabold">Schedule approved article</h2>
          <label className="mt-4 block text-[10px] font-bold text-[#626a78]" htmlFor="publishing-article">บทความ Approved</label>
          <select id="publishing-article" value={selectedArticle} onChange={(event) => setSelectedArticle(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#dedad3] bg-white px-3 text-xs"><option value="">Select article</option>{articlesList.map((article) => <option key={article.id} value={article.id}>#{article.id} · {article.headline}</option>)}</select>
          <div className="mt-3 grid grid-cols-1 gap-2">{(["telegram"] as const).map((channel) => <button type="button" key={channel} onClick={() => toggleChannel(channel)} className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-[9px] font-bold capitalize ${channels.includes(channel) ? "border-[#dc626a] bg-[#fff3f4] text-[#c93741]" : "border-[#e4e0d9] text-[#8b919b]"}`}>{channelIcon()}{channel}</button>)}</div>
          <label className="mt-3 block text-[10px] font-bold text-[#626a78]" htmlFor="publishing-time">เวลาเผยแพร่</label><input id="publishing-time" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#dedad3] px-3 text-xs" />
          <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => void previewArticle()} disabled={working} className="rounded-xl border border-[#dedad3] py-3 text-[10px] font-bold text-[#4e5664] disabled:opacity-50">Build preview</button><button type="button" onClick={() => void schedule()} disabled={working} className="rounded-xl bg-[#18243a] py-3 text-[10px] font-bold text-white disabled:opacity-50"><CalendarDays className="mr-1.5 inline size-3.5" />Add to queue</button></div>
          <div className="mt-4"><StatusBanner mode={mode} message={mode === "live" ? "เชื่อม D1 แล้ว · การส่งจริงถูกควบคุมด้วย Server flag" : "Demo Preview · ยังไม่มีบทความ Approved ใน D1"} /></div>
        </article>
        <div className="grid gap-3">{previews.map((preview) => <article key={preview.channel} className="flex min-h-[310px] flex-col rounded-[22px] border border-[#e7e4de] bg-white p-4 shadow-[0_10px_30px_rgba(31,41,58,.04)]"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-extrabold capitalize">{channelIcon()}{preview.channel}</div><span className={`rounded-full px-2 py-1 text-[8px] font-bold ${preview.truncated ? "bg-[#fff0e8] text-[#a95e28]" : "bg-[#eaf9f2] text-[#26795f]"}`}>{preview.character_count}/{preview.character_limit}</span></div><div className="mt-4 flex-1 whitespace-pre-wrap rounded-xl bg-[#f7f4ee] p-3 text-[10px] leading-5 text-[#4e5664]">{preview.text}</div><p className="mt-3 text-[9px] text-[#969aa2]">Telegram preview only · ตรวจข้อความก่อนจัดคิว</p></article>)}</div>
      </div>
      <article className="rounded-[22px] border border-[#e7e4de] bg-white p-5 shadow-[0_10px_30px_rgba(31,41,58,.04)]"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#9a9ea7]">Delivery queue</p><h2 className="mt-1 text-lg font-extrabold">Jobs & retry status</h2></div><button type="button" onClick={() => void dispatch()} disabled={working} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ef4b55] px-4 py-2.5 text-[10px] font-bold text-white disabled:opacity-50"><Send className="size-3.5" />Run dispatcher</button></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr className="border-b border-[#e8e4dd] text-[9px] uppercase tracking-[.1em] text-[#959aa3]"><th className="pb-3">Job</th><th className="pb-3">Channel</th><th className="pb-3">Scheduled</th><th className="pb-3">Attempts</th><th className="pb-3">Status</th><th className="pb-3 text-right">Action</th></tr></thead><tbody>{jobs.length ? jobs.map((job) => <tr key={job.id} className="border-b border-[#f0ede7] text-[10px]"><td className="py-3 font-bold">#{job.id} · Article {job.articleId}</td><td className="py-3 capitalize">{job.channel}</td><td className="py-3 text-[#707785]">{job.scheduledAt ? new Date(job.scheduledAt).toLocaleString("th-TH") : "Now"}</td><td className="py-3">{job.attemptCount}/3</td><td className="py-3"><span className={`rounded-full px-2 py-1 text-[8px] font-bold uppercase ${job.status === "sent" ? "bg-[#eaf9f2] text-[#26795f]" : job.status === "failed" ? "bg-[#fff0f1] text-[#b8343d]" : "bg-[#fff5dd] text-[#8d6414]"}`}>{job.status}</span></td><td className="py-3 text-right"><button type="button" onClick={() => void cancelJob(job)} disabled={job.status !== "queued"} className="rounded-lg border border-[#e1ddd6] px-2.5 py-1.5 text-[9px] font-bold text-[#69717e] disabled:opacity-35">Cancel</button></td></tr>) : <tr><td colSpan={6} className="py-10 text-center text-xs text-[#979ba3]"><Clock3 className="mx-auto mb-2 size-5" />ยังไม่มีงานใน Publishing Queue</td></tr>}</tbody></table></div></article>
    </section>
  );
}

export default function EditorialWorkspace({ section, notify, selectedNews = [] }: { section: InteractiveSection; notify: (message: string) => void; selectedNews?: SelectedNewsSource[] }) {
  if (section === "favorites") return <FavoritesWorkspace notify={notify} />;
  if (section === "sources") return <SourcesWorkspace notify={notify} />;
  if (section === "fact-check") return <FactCheckWorkspace notify={notify} />;
  if (section === "articles") return <ArticleWorkspace notify={notify} selectedNews={selectedNews} />;
  return <PublishingWorkspace notify={notify} />;
}
