"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Check,
  ChevronRight,
  CircleUserRound,
  FileText,
  Globe2,
  Home,
  Inbox,
  LoaderCircle,
  Menu,
  MessageCircle,
  Newspaper,
  Plus,
  RadioTower,
  RefreshCw,
  Search,
  Settings,
  Star,
  UserCheck,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import EditorialWorkspace from "./editorial-workspaces";
import type { AutoDraftRequest } from "./editorial-workspaces";

type NavId = "dashboard" | "discovery" | "favorites" | "sources" | "articles" | "publishing" | "settings";
type Category = "All" | "Transfer" | "Club" | "League";

type FeedItem = {
  id: number;
  category: Exclude<Category, "All">;
  headline: string;
  summary: string;
  imageUrl: string | null;
  sourceName: string;
  sourceType: "official" | "original" | "reporter" | "outlet";
  reporter: string | null;
  publishedAt: string | null;
  importedAt: string;
  url: string;
  reliabilityWeight: number;
};

type FeedApiReport = {
  id: number;
  category: FeedItem["category"];
  headline: string;
  summary: string;
  image_url: string | null;
  source_name: string;
  source_type: FeedItem["sourceType"];
  reporter: string | null;
  published_at: string | null;
  imported_at: string;
  url: string;
  reliability_weight: number;
};

type Suggestion = {
  kind: "outlet" | "reporter";
  value: string;
  label: string;
  article_count: number;
  score: number;
  reason: string;
};

type NavItem = { id: NavId; label: string; icon: LucideIcon };

const navItems: NavItem[] = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "discovery", label: "News Inbox", icon: Inbox },
  { id: "favorites", label: "Favorites", icon: Star },
  { id: "sources", label: "RSS Sources", icon: RadioTower },
  { id: "articles", label: "Article Editor", icon: FileText },
  { id: "publishing", label: "Telegram", icon: MessageCircle },
  { id: "settings", label: "Settings", icon: Settings },
];

function formatDate(value: string | null, fallback: string) {
  const date = new Date(value || fallback);
  if (Number.isNaN(date.getTime())) return "ไม่ระบุเวลา";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function sourceInitial(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "RSS";
}

function Sidebar({ active, open, onSelect, onClose }: { active: NavId; open: boolean; onSelect: (id: NavId) => void; onClose: () => void }) {
  return (
    <>
      <button type="button" aria-label="ปิดเมนู" onClick={onClose} className={`fixed inset-0 z-40 bg-black/65 lg:hidden ${open ? "block" : "hidden"}`} />
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[184px] flex-col border-r border-white/10 bg-[#0b0714] text-white shadow-2xl transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div><p className="text-sm font-black tracking-tight">ARS GunNer</p><p className="text-[8px] font-bold uppercase tracking-[.2em] text-[#8c7aa5]">News intelligence</p></div>
          <button type="button" onClick={onClose} aria-label="ปิดเมนู" className="text-[#9485a7] lg:hidden"><X className="size-5" /></button>
        </div>
        <nav className="flex-1 space-y-1 p-2.5" aria-label="เมนูหลัก">
          {navItems.map((item) => {
            const Icon = item.icon;
            const selected = active === item.id || (item.id === "discovery" && active === "dashboard");
            return (
              <button key={item.id} type="button" onClick={() => onSelect(item.id)} className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[11px] font-bold transition ${selected ? "bg-[#f5f2f8] text-[#21142f]" : "text-[#b1a5bf] hover:bg-white/[.06] hover:text-white"}`}>
                <Icon className="size-4" />{item.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2 rounded-lg bg-white/[.05] p-2.5"><div className="grid size-8 place-items-center rounded-md bg-[#3f2757] text-[10px] font-black">ED</div><div><p className="text-[10px] font-bold">Editor</p><p className="text-[8px] text-[#81738f]">Approver</p></div></div>
        </div>
      </aside>
    </>
  );
}

function NewsRow({ item, selected, onSelect }: { item: FeedItem; selected: boolean; onSelect: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <article className={`group relative overflow-hidden border-l-4 transition ${selected ? "border-[#54d4be] bg-[#3a2450] shadow-[0_0_0_1px_rgba(84,212,190,.42),0_15px_35px_rgba(0,0,0,.25)]" : "border-[#2b9e91] bg-[#251733] hover:bg-[#2c1b3d]"}`}>
      <button type="button" onClick={onSelect} aria-pressed={selected} aria-label={`${selected ? "ยกเลิกเลือก" : "เลือก"} ${item.headline}`} className="flex w-full items-stretch text-left">
        <div className={`relative grid w-28 shrink-0 place-items-center overflow-hidden sm:w-32 ${selected ? "bg-[#d8fff1]" : "bg-[#e5f5bc]"}`}>
          {item.imageUrl && !imageFailed ? <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} className="absolute inset-0 size-full object-cover" />
          </> : <div className="grid size-14 place-items-center rounded-full border border-black/10 bg-white/70 text-sm font-black text-[#3c4e4a] shadow-inner">{sourceInitial(item.sourceName)}</div>}
          {item.imageUrl && !imageFailed ? <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" /> : null}
        </div>
        <div className="min-w-0 flex-1 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-[8px] font-bold uppercase tracking-[.08em] text-[#a89bb7]">
            <span>{item.sourceName}</span><span>·</span><span>{formatDate(item.publishedAt, item.importedAt)}</span>
            <span className="ml-auto rounded bg-[#168f82]/35 px-2 py-0.5 text-[#72e2d1]">{item.category}</span>
          </div>
          <h2 className="mt-2 line-clamp-2 text-[13px] font-extrabold leading-5 text-white">{item.headline}</h2>
          <p className="mt-1 line-clamp-1 text-[10px] text-[#b8adc4]">{item.summary || "RSS รายการนี้มีเฉพาะพาดหัวข่าว"}</p>
          <div className="mt-2 flex items-center gap-3 text-[9px] text-[#8f829c]"><span>{item.reporter || "ไม่ระบุ Reporter"}</span><span>Weight {item.reliabilityWeight}</span></div>
        </div>
        <div className="grid w-12 place-items-center border-l border-white/[.05] text-[#9686a6]">
          {selected ? <Check className="size-5 text-[#64e1cf]" /> : <ChevronRight className="size-5 transition-transform group-hover:translate-x-1" />}
        </div>
      </button>
    </article>
  );
}

function SuggestionsPanel({ suggestions, onFollow }: { suggestions: Suggestion[]; onFollow: (item: Suggestion) => void }) {
  return (
    <aside className="rounded-lg border border-white/10 bg-[#21142f]/95 p-4 shadow-xl">
      <div className="flex items-start justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.14em] text-[#8a78a0]">Daily discovery</p><h2 className="mt-1 text-xs font-extrabold text-white">Reporter & สำนักข่าว</h2></div><UserCheck className="size-4 text-[#61d9c8]" /></div>
      <div className="relative mt-4"><Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#776987]" /><input aria-label="ค้นหารายการแนะนำ" placeholder="Search" className="h-9 w-full rounded border border-white/10 bg-[#392449] pl-9 pr-3 text-[10px] text-white placeholder:text-[#796b87]" /></div>
      <div className="mt-3 max-h-[620px] space-y-1 overflow-y-auto pr-1">
        {suggestions.length ? suggestions.map((item) => (
          <div key={`${item.kind}-${item.value}`} className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-white/[.05]">
            <div className={`grid size-8 shrink-0 place-items-center rounded ${item.kind === "reporter" ? "bg-[#174f4b] text-[#75e1d2]" : "bg-[#4c2d63] text-[#d1b5e5]"}`}>{item.kind === "reporter" ? <CircleUserRound className="size-4" /> : <Globe2 className="size-4" />}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-[10px] font-bold text-white">{item.label}</p><p className="text-[8px] text-[#8f819e]">{item.article_count} reports · score {item.score}</p></div>
            <button type="button" onClick={() => onFollow(item)} aria-label={`เพิ่ม ${item.label} ใน Favorites`} className="grid size-7 place-items-center rounded border border-[#766287] text-[#bda9cc] hover:border-[#62dac9] hover:text-[#62dac9]"><Plus className="size-3.5" /></button>
          </div>
        )) : <p className="py-8 text-center text-[10px] leading-5 text-[#8f819e]">ยังไม่มีรายการแนะนำ<br />Sync RSS เพิ่มเพื่อวิเคราะห์รายวัน</p>}
      </div>
    </aside>
  );
}

export default function NewsroomDashboard() {
  const [active, setActive] = useState<NavId>("discovery");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [selectedFeedItemId, setSelectedFeedItemId] = useState<number | null>(null);
  const [autoDraft, setAutoDraft] = useState<AutoDraftRequest | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [toast, setToast] = useState("");

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/v1/feed?limit=80");
      const payload = await response.json() as { data?: { reports?: FeedApiReport[]; total?: number }; error?: { message?: string } };
      if (!response.ok || !payload.data) throw new Error(payload.error?.message || "โหลดข่าวจาก D1 ไม่สำเร็จ");
      const reports = (payload.data.reports ?? []).map((item) => ({
        id: item.id,
        category: item.category,
        headline: item.headline,
        summary: item.summary,
        imageUrl: item.image_url,
        sourceName: item.source_name,
        sourceType: item.source_type,
        reporter: item.reporter,
        publishedAt: item.published_at,
        importedAt: item.imported_at,
        url: item.url,
        reliabilityWeight: item.reliability_weight,
      } satisfies FeedItem));
      setItems(reports);
      setTotal(payload.data.total ?? reports.length);
      setSelectedFeedItemId((current) => reports.some((report) => report.id === current) ? current : null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "โหลดข่าวจาก D1 ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadFeed(), 0);
    return () => window.clearTimeout(timer);
  }, [loadFeed]);

  useEffect(() => {
    let activeRequest = true;
    fetch("/api/v1/suggestions")
      .then(async (response) => {
        const payload = await response.json() as { data?: { suggestions?: { reporters?: Suggestion[]; outlets?: Suggestion[] } } };
        if (!activeRequest || !response.ok) return;
        setSuggestions([...(payload.data?.suggestions?.reporters ?? []), ...(payload.data?.suggestions?.outlets ?? [])].slice(0, 18));
      })
      .catch(() => undefined);
    return () => { activeRequest = false; };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visibleItems = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("en-US");
    return items.filter((item) => (category === "All" || item.category === category) && (!term || `${item.headline} ${item.summary} ${item.sourceName} ${item.reporter || ""}`.toLocaleLowerCase("en-US").includes(term)));
  }, [category, items, query]);

  const selectedItem = items.find((item) => item.id === selectedFeedItemId) ?? null;

  const navigate = (id: NavId) => {
    setActive(id);
    setMobileOpen(false);
    window.history.replaceState(null, "", id === "discovery" ? "/" : `/?view=${id}`);
  };

  const syncFeeds = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/v1/rss/ingest", { method: "POST" });
      const payload = await response.json() as { data?: { items_inserted?: number }; error?: { message?: string } };
      if (!response.ok) return setToast(payload.error?.message || "Sync RSS ไม่สำเร็จ");
      await loadFeed();
      setToast(`Sync สำเร็จ · เพิ่ม ${payload.data?.items_inserted ?? 0} ข่าว`);
    } catch {
      setToast("เชื่อมต่อ RSS ไม่สำเร็จ");
    } finally {
      setSyncing(false);
    }
  };

  const confirmSelection = () => {
    if (!selectedItem) return setToast("เลือกข่าวตั้งต้นก่อนกดยืนยัน");
    setAutoDraft({
      id: selectedItem.id,
      topic: `${selectedItem.headline}. ${selectedItem.summary.slice(0, 120)}`.slice(0, 240),
      selectedHeadlines: [selectedItem.headline],
      selectedFeedItemIds: [selectedItem.id],
    });
    navigate("articles");
  };

  const followSuggestion = async (item: Suggestion) => {
    const response = await fetch("/api/v1/favorites", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: item.kind, value: item.value, label: item.label }) });
    if (!response.ok) return setToast("เพิ่ม Favorites ไม่สำเร็จ หรือมีรายการนี้แล้ว");
    setSuggestions((current) => current.filter((suggestion) => !(suggestion.kind === item.kind && suggestion.value === item.value)));
    setToast(`เพิ่ม ${item.label} ใน Favorites แล้ว`);
  };

  const inboxVisible = active === "dashboard" || active === "discovery";

  return (
    <div className="min-h-screen bg-[#12091f] text-white">
      <Sidebar active={active} open={mobileOpen} onSelect={navigate} onClose={() => setMobileOpen(false)} />
      <main className="min-h-screen lg:pl-[184px]">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#170b26]/95 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex max-w-[1500px] items-center gap-3">
            <button type="button" onClick={() => setMobileOpen(true)} aria-label="เปิดเมนู" className="grid size-9 place-items-center rounded border border-white/10 text-[#c1b4cd] lg:hidden"><Menu className="size-4" /></button>
            <ArrowLeft className="hidden size-4 text-[#71627f] sm:block" /><ArrowRight className="hidden size-4 text-[#71627f] sm:block" />
            <div><p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#8f7da1]">ARS GunNer</p><h1 className="text-sm font-black">{inboxVisible ? "NEWS INBOX" : navItems.find((item) => item.id === active)?.label}</h1></div>
            <div className="relative ml-auto w-full max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7e6c90]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search news, outlet, reporter..." className="h-10 w-full rounded-md border border-white/10 bg-[#2a1839] pl-10 pr-3 text-[11px] text-white placeholder:text-[#756681]" /></div>
            <button type="button" onClick={() => void syncFeeds()} disabled={syncing} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-[#efeaf4] px-3 text-[10px] font-black text-[#251532] disabled:opacity-60"><RefreshCw className={`size-3.5 ${syncing ? "animate-spin" : ""}`} /><span className="hidden sm:inline">Sync RSS</span></button>
          </div>
        </header>

        {inboxVisible ? (
          <div className="mx-auto max-w-[1500px] px-4 pb-28 pt-4 sm:px-6">
            <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
              {(["All", "Transfer", "Club", "League"] as Category[]).map((item) => <button type="button" key={item} onClick={() => setCategory(item)} className={`rounded px-3 py-2 text-[10px] font-bold ${category === item ? "bg-[#f3eef6] text-[#251532]" : "text-[#9585a5] hover:bg-white/[.05] hover:text-white"}`}>{item === "All" ? `All News · ${total}` : item}</button>)}
            </div>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
              <section className="min-w-0 space-y-2">
                {loading ? <div className="grid min-h-80 place-items-center rounded-lg border border-white/10 bg-[#21142f]"><div className="text-center"><LoaderCircle className="mx-auto size-7 animate-spin text-[#60d7c6]" /><p className="mt-3 text-[11px] text-[#9e90aa]">กำลังโหลดข่าวจริงจาก D1</p></div></div> : error ? <div className="grid min-h-80 place-items-center rounded-lg border border-[#8e435e] bg-[#291526]"><div className="text-center"><p className="text-xs font-bold">{error}</p><button type="button" onClick={() => void loadFeed()} className="mt-3 rounded bg-white px-4 py-2 text-[10px] font-bold text-[#291526]">ลองใหม่</button></div></div> : visibleItems.length ? visibleItems.map((item) => <NewsRow key={item.id} item={item} selected={selectedFeedItemId === item.id} onSelect={() => setSelectedFeedItemId((current) => current === item.id ? null : item.id)} />) : <div className="grid min-h-80 place-items-center rounded-lg border border-dashed border-white/15 bg-[#21142f]"><div className="text-center"><Newspaper className="mx-auto size-7 text-[#786989]" /><p className="mt-3 text-xs font-bold">ยังไม่มีข่าวที่ตรงกับตัวกรอง</p><p className="mt-1 text-[10px] text-[#8d7f9a]">เพิ่ม RSS Source หรือกด Sync RSS</p></div></div>}
              </section>
              <SuggestionsPanel suggestions={suggestions} onFollow={(item) => void followSuggestion(item)} />
            </div>
          </div>
        ) : active === "settings" ? (
          <div className="mx-auto max-w-4xl p-6"><div className="rounded-xl border border-white/10 bg-[#21142f] p-6"><Settings className="size-6 text-[#63dac8]" /><h2 className="mt-4 text-lg font-black">Workspace Settings</h2><p className="mt-2 text-xs leading-6 text-[#9e90aa]">ตั้งค่าภาษาเริ่มต้น บทบาท และ Environment secrets โดยไม่แสดง Token บนหน้าเว็บ</p></div></div>
        ) : (
          <div className="min-h-[calc(100vh-65px)] bg-[#f2eff5] p-4 text-[#1c2537] sm:p-6"><div className="mx-auto max-w-[1500px]"><EditorialWorkspace section={active} notify={setToast} autoDraft={autoDraft} onAutoDraftConsumed={() => setAutoDraft(null)} /></div></div>
        )}
      </main>

      {inboxVisible && selectedItem ? (
        <div className="fixed inset-x-3 bottom-3 z-40 lg:left-[196px]">
          <div className="mx-auto flex max-w-[980px] items-center gap-3 rounded-lg border border-[#64ddca]/40 bg-[#20112f]/95 p-3 shadow-2xl backdrop-blur-xl">
            <div className="grid size-10 shrink-0 place-items-center rounded bg-[#dffbef] text-xs font-black text-[#22483f]">{sourceInitial(selectedItem.sourceName)}</div>
            <div className="min-w-0 flex-1"><p className="text-[8px] font-bold uppercase tracking-[.1em] text-[#68daca]">Selected source</p><p className="truncate text-[11px] font-bold text-white">{selectedItem.headline}</p></div>
            <button type="button" onClick={() => window.open(selectedItem.url, "_blank", "noopener,noreferrer")} className="hidden rounded border border-white/15 px-3 py-2 text-[9px] font-bold text-[#b9adca] sm:block">เปิดต้นฉบับ</button>
            <button type="button" onClick={confirmSelection} className="inline-flex items-center gap-2 rounded bg-[#69ddcb] px-5 py-3 text-[10px] font-black text-[#172a28]">ยืนยันและสร้าง Draft <BookOpenText className="size-4" /></button>
          </div>
        </div>
      ) : null}

      <div role="status" aria-live="polite" className={`fixed right-5 top-20 z-[80] rounded-lg bg-[#f3eef6] px-4 py-3 text-[10px] font-bold text-[#291736] shadow-2xl transition ${toast ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"}`}>{toast}</div>
    </div>
  );
}
