"use client";

import {
  BookOpenText,
  Bookmark,
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
  ShieldCheck,
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
type PremierLeagueTeam = {
  id: string;
  short: string;
  name: string;
  aliases: string[];
};

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
  { id: "dashboard", label: "Discover", icon: Home },
  { id: "discovery", label: "News Inbox", icon: Inbox },
  { id: "favorites", label: "Favorites", icon: Star },
  { id: "sources", label: "RSS Sources", icon: RadioTower },
  { id: "articles", label: "Article Editor", icon: FileText },
  { id: "publishing", label: "Telegram", icon: MessageCircle },
  { id: "settings", label: "Settings", icon: Settings },
];

const premierLeagueTeams: PremierLeagueTeam[] = [
  { id: "arsenal", short: "ARS", name: "Arsenal", aliases: ["arsenal"] },
  { id: "aston-villa", short: "AVL", name: "Aston Villa", aliases: ["aston villa", "villa"] },
  { id: "bournemouth", short: "BOU", name: "Bournemouth", aliases: ["bournemouth", "afc bournemouth"] },
  { id: "brentford", short: "BRE", name: "Brentford", aliases: ["brentford"] },
  { id: "brighton", short: "BHA", name: "Brighton", aliases: ["brighton", "brighton & hove albion", "brighton and hove albion"] },
  { id: "chelsea", short: "CHE", name: "Chelsea", aliases: ["chelsea"] },
  { id: "coventry", short: "COV", name: "Coventry", aliases: ["coventry", "coventry city"] },
  { id: "crystal-palace", short: "CRY", name: "Crystal Palace", aliases: ["crystal palace", "palace"] },
  { id: "everton", short: "EVE", name: "Everton", aliases: ["everton"] },
  { id: "fulham", short: "FUL", name: "Fulham", aliases: ["fulham"] },
  { id: "hull", short: "HUL", name: "Hull City", aliases: ["hull", "hull city"] },
  { id: "ipswich", short: "IPS", name: "Ipswich", aliases: ["ipswich", "ipswich town"] },
  { id: "leeds", short: "LEE", name: "Leeds", aliases: ["leeds", "leeds united"] },
  { id: "liverpool", short: "LIV", name: "Liverpool", aliases: ["liverpool"] },
  { id: "man-city", short: "MCI", name: "Man City", aliases: ["manchester city", "man city"] },
  { id: "man-utd", short: "MUN", name: "Man Utd", aliases: ["manchester united", "man utd", "man united"] },
  { id: "newcastle", short: "NEW", name: "Newcastle", aliases: ["newcastle", "newcastle united"] },
  { id: "nottingham-forest", short: "NFO", name: "Nott'm Forest", aliases: ["nottingham forest", "nott'm forest", "nottm forest"] },
  { id: "sunderland", short: "SUN", name: "Sunderland", aliases: ["sunderland"] },
  { id: "tottenham", short: "TOT", name: "Tottenham", aliases: ["tottenham", "tottenham hotspur", "spurs"] },
];

function formatDate(value: string | null, fallback: string) {
  const date = new Date(value || fallback);
  if (Number.isNaN(date.getTime())) return "ไม่ระบุเวลา";
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function sourceInitial(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "RSS";
}

function sourceBadge(item: FeedItem) {
  if (item.sourceType === "official") return { label: "CONFIRMED", className: "bg-[#26b968] text-white" };
  if (item.sourceType === "reporter") return { label: "REPORTER", className: "bg-[#2f8fdc] text-white" };
  if (item.sourceType === "original") return { label: "ORIGINAL", className: "bg-[#7055c7] text-white" };
  return { label: "NEWS", className: "bg-[#eaf3fb] text-[#1774b8]" };
}

function NewsCard({ item, selected, onSelect }: { item: FeedItem; selected: boolean; onSelect: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  const badge = sourceBadge(item);

  return (
    <article className={`group relative min-h-[176px] overflow-hidden border bg-white transition ${selected ? "border-[#2b83d5] shadow-[0_0_0_3px_rgba(43,131,213,.18)]" : "border-[#cdd5df] hover:border-[#7eaed7] hover:shadow-lg"}`}>
      <button type="button" onClick={onSelect} aria-pressed={selected} aria-label={`${selected ? "ยกเลิกเลือก" : "เลือก"} ${item.headline}`} className="flex h-full w-full items-stretch text-left">
        <div className="relative grid w-[116px] shrink-0 place-items-center overflow-hidden bg-[#e8edf3] sm:w-[138px]">
          {item.imageUrl && !imageFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} className="absolute inset-0 size-full object-cover" />
          ) : (
            <div className="grid size-16 place-items-center rounded-full border-4 border-white bg-[#0b2347] text-sm font-black text-white shadow">{sourceInitial(item.sourceName)}</div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#071a35]/75 to-transparent px-2 pb-2 pt-8 text-center text-[8px] font-black uppercase tracking-[.08em] text-white">
            {item.sourceName}
          </div>
        </div>
        <div className="min-w-0 flex-1 p-3.5 sm:p-4">
          <div className="flex items-center gap-2 pr-10 text-[9px] font-bold text-[#465467]">
            <span className={`px-2 py-1 text-[8px] font-black tracking-[.04em] ${badge.className}`}>{badge.label}</span>
            <span className="truncate">{formatDate(item.publishedAt, item.importedAt)}</span>
          </div>
          <p className="mt-2 text-[10px] font-extrabold text-[#2f8fdc]">{item.reporter || item.sourceName}</p>
          <h2 className="mt-1 line-clamp-3 text-[15px] font-black leading-[1.32] tracking-[-.02em] text-[#111c2c] sm:text-[17px]">{item.headline}</h2>
          <div className="mt-3 flex items-center gap-2 text-[9px] font-bold text-[#718096]">
            <span>{item.category}</span><span>•</span><span>Source weight {item.reliabilityWeight}</span>
          </div>
        </div>
        <div className={`absolute right-3 top-3 grid size-8 place-items-center border ${selected ? "border-[#2b83d5] bg-[#2b83d5] text-white" : "border-[#dce2e9] bg-[#f8fafc] text-[#7c8a9c]"}`}>
          {selected ? <Check className="size-4" /> : <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />}
        </div>
      </button>
    </article>
  );
}

function CompactNews({ item, onSelect }: { item: FeedItem; onSelect: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <button type="button" onClick={onSelect} className="group flex w-full gap-3 border-b border-[#dce2e8] py-3 text-left last:border-b-0">
      <div className="relative grid size-[72px] shrink-0 place-items-center overflow-hidden bg-[#e9eef4]">
        {item.imageUrl && !imageFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} className="absolute inset-0 size-full object-cover" />
        ) : <span className="text-xs font-black text-[#0b2347]">{sourceInitial(item.sourceName)}</span>}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black text-[#2f8fdc]">{item.category} · {item.reliabilityWeight}</p>
        <p className="mt-1 line-clamp-3 text-[12px] font-extrabold leading-4 text-[#182436] group-hover:text-[#2578bd]">{item.headline}</p>
      </div>
    </button>
  );
}

function SuggestionsPanel({ suggestions, onFollow }: { suggestions: Suggestion[]; onFollow: (item: Suggestion) => void }) {
  return (
    <section className="border border-[#cdd5df] bg-white">
      <div className="flex items-center justify-between bg-[#0b2347] px-4 py-3 text-white">
        <h2 className="text-sm font-black uppercase tracking-[-.02em]">Daily Discovery</h2>
        <UserCheck className="size-4 text-[#79bfff]" />
      </div>
      <div className="p-3">
        <p className="mb-2 text-[9px] font-bold uppercase tracking-[.12em] text-[#8190a3]">Reporter & สำนักข่าวแนะนำวันนี้</p>
        {suggestions.length ? suggestions.slice(0, 7).map((item) => (
          <div key={`${item.kind}-${item.value}`} className="flex items-center gap-2 border-b border-[#e4e8ee] py-2.5 last:border-b-0">
            <div className={`grid size-9 shrink-0 place-items-center ${item.kind === "reporter" ? "bg-[#e5f2ff] text-[#2a80c7]" : "bg-[#edf0f4] text-[#33465e]"}`}>
              {item.kind === "reporter" ? <CircleUserRound className="size-4" /> : <Globe2 className="size-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-extrabold text-[#172235]">{item.label}</p>
              <p className="text-[8px] text-[#8190a3]">{item.article_count} reports · score {item.score}</p>
            </div>
            <button type="button" onClick={() => onFollow(item)} aria-label={`เพิ่ม ${item.label} ใน Favorites`} className="grid size-8 place-items-center border border-[#ccd5df] text-[#2b80c5] hover:bg-[#eaf4fc]">
              <Plus className="size-3.5" />
            </button>
          </div>
        )) : <p className="py-6 text-center text-[10px] leading-5 text-[#8190a3]">ยังไม่มีรายการแนะนำ<br />Sync RSS เพื่อวิเคราะห์รายวัน</p>}
      </div>
    </section>
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
  const [leagueTeam, setLeagueTeam] = useState("all");
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
    const selectedTeam = premierLeagueTeams.find((team) => team.id === leagueTeam);
    return items.filter((item) => {
      const searchable = `${item.headline} ${item.summary} ${item.sourceName} ${item.reporter || ""}`.toLocaleLowerCase("en-US");
      const categoryMatches = category === "League" && selectedTeam ? true : category === "All" || item.category === category;
      const queryMatches = !term || searchable.includes(term);
      const teamMatches = category !== "League" || !selectedTeam || selectedTeam.aliases.some((alias) => searchable.includes(alias));
      return categoryMatches && queryMatches && teamMatches;
    });
  }, [category, items, leagueTeam, query]);

  const selectedItem = items.find((item) => item.id === selectedFeedItemId) ?? null;
  const topVerified = useMemo(
    () => [...items].sort((a, b) => b.reliabilityWeight - a.reliabilityWeight || b.id - a.id).slice(0, 5),
    [items],
  );

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
    <div className="min-h-screen bg-[#edf0f3] text-[#162236]">
      <header className="sticky top-0 z-40 shadow-[0_2px_12px_rgba(9,35,70,.16)]">
        <div className="bg-white">
          <div className="mx-auto flex h-[74px] max-w-[1580px] items-center gap-3 px-3 sm:px-5">
            <button type="button" onClick={() => setMobileOpen((current) => !current)} aria-label="เปิดเมนู" className="grid size-11 shrink-0 place-items-center border border-[#d8dfe7] text-[#0b2347] lg:hidden">
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <button type="button" onClick={() => navigate("discovery")} className="shrink-0 border-l-4 border-[#e43d48] pl-3 text-left">
              <p className="text-[18px] font-black italic tracking-[-.06em] text-[#0b2347] sm:text-[22px]">ARS GunNer</p>
              <p className="text-[8px] font-black uppercase tracking-[.18em] text-[#2f8fdc]">News Intelligence</p>
            </button>
            <div className="hidden items-center gap-1 bg-[#0b2347] px-2 py-1 text-[9px] font-black text-white sm:flex">
              LIVE <span className="bg-[#df3645] px-1.5 py-0.5">{total}</span>
            </div>
            <div className="relative ml-auto w-full max-w-[680px]">
              <Search className="absolute right-4 top-1/2 size-5 -translate-y-1/2 text-[#0b2347]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาข่าว ทีม สำนักข่าว หรือ Reporter" className="h-12 w-full rounded-md border border-[#d9e0e7] bg-[#f8fafc] px-4 pr-12 text-[12px] font-semibold text-[#172235] placeholder:text-[#93a0b1]" />
            </div>
            <button type="button" onClick={() => navigate("favorites")} aria-label="Favorites" className="hidden size-12 place-items-center border border-[#d9e0e7] text-[#0b2347] sm:grid"><Bookmark className="size-5" /></button>
            <button type="button" onClick={() => navigate("articles")} className="hidden h-12 items-center gap-2 bg-[#68aaf3] px-4 text-[11px] font-black text-white sm:flex"><CircleUserRound className="size-5" />EDITOR</button>
          </div>
        </div>
        <nav className={`${mobileOpen ? "block" : "hidden"} bg-[#0b2347] lg:block`} aria-label="เมนูหลัก">
          <div className="mx-auto flex max-w-[1580px] flex-col lg:flex-row lg:items-center lg:overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const selected = active === item.id || (item.id === "discovery" && active === "dashboard");
              return (
                <button key={item.id} type="button" onClick={() => navigate(item.id)} className={`flex h-14 shrink-0 items-center gap-2 border-l-4 px-5 text-left text-[11px] font-black uppercase tracking-[.02em] transition lg:border-b-4 lg:border-l-0 ${selected ? "border-[#68aaf3] bg-white/[.08] text-[#79bfff]" : "border-transparent text-white hover:bg-white/[.07]"}`}>
                  <Icon className="size-4" />{item.label}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {inboxVisible ? (
        <main className="mx-auto max-w-[1580px] px-3 pb-32 pt-8 sm:px-5">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#2f8fdc]">Real RSS / D1 newsroom</p>
              <h1 className="mt-1 text-[26px] font-black uppercase tracking-[-.055em] text-[#111b29] sm:text-[34px]">News Inbox</h1>
            </div>
            <button type="button" onClick={() => void syncFeeds()} disabled={syncing} className="inline-flex h-11 items-center gap-2 bg-[#0b2347] px-4 text-[10px] font-black text-white disabled:opacity-60">
              <RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} />SYNC RSS
            </button>
          </div>

          <div className="mb-4 flex overflow-x-auto border border-[#cdd5df] bg-white">
            {(["All", "Transfer", "Club", "League"] as Category[]).map((item) => (
              <button type="button" key={item} onClick={() => { setCategory(item); if (item !== "League") setLeagueTeam("all"); }} className={`h-12 shrink-0 border-r border-[#dce2e8] px-5 text-[10px] font-black uppercase ${category === item ? "bg-[#2f8fdc] text-white" : "text-[#536277] hover:bg-[#f1f6fb]"}`}>
                {item === "All" ? `All News · ${total}` : item}
              </button>
            ))}
          </div>

          {category === "League" ? (
            <div className="mb-5 overflow-x-auto border border-[#cdd5df] bg-white p-2">
              <div className="flex min-w-max items-center gap-1.5" aria-label="ทีม Premier League ฤดูกาล 2026/27">
                <button type="button" onClick={() => setLeagueTeam("all")} className={`h-9 border px-3 text-[9px] font-black ${leagueTeam === "all" ? "border-[#0b2347] bg-[#0b2347] text-white" : "border-[#d8dfe7] text-[#526174]"}`}>ALL</button>
                {premierLeagueTeams.map((team) => (
                  <button key={team.id} type="button" title={team.name} aria-label={`กรองข่าว ${team.name}`} onClick={() => setLeagueTeam(team.id)} className={`flex h-9 items-center gap-2 border px-2.5 text-[9px] font-black transition ${leagueTeam === team.id ? "border-[#2f8fdc] bg-[#2f8fdc] text-white" : "border-[#d8dfe7] bg-white text-[#526174] hover:border-[#7fb0d9]"}`}>
                    <span className={`grid size-5 place-items-center text-[7px] ${leagueTeam === team.id ? "bg-white/20" : "bg-[#eaf0f6] text-[#0b2347]"}`}>{team.short.slice(0, 2)}</span>
                    {team.short}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="min-w-0">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[22px] font-black uppercase tracking-[-.05em] text-[#111b29]">News Ticker</h2>
                <p className="text-[9px] font-bold text-[#758397]">เลือก 1 ข่าวเพื่อเริ่ม Research Brief</p>
              </div>
              {loading ? (
                <div className="grid min-h-80 place-items-center border border-[#cdd5df] bg-white"><div className="text-center"><LoaderCircle className="mx-auto size-7 animate-spin text-[#2f8fdc]" /><p className="mt-3 text-[11px] text-[#718096]">กำลังโหลดข่าวจริงจาก D1</p></div></div>
              ) : error ? (
                <div className="grid min-h-80 place-items-center border border-[#dfacb2] bg-white"><div className="text-center"><p className="text-xs font-bold text-[#9a2635]">{error}</p><button type="button" onClick={() => void loadFeed()} className="mt-3 bg-[#0b2347] px-4 py-2 text-[10px] font-bold text-white">ลองใหม่</button></div></div>
              ) : visibleItems.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {visibleItems.map((item) => <NewsCard key={item.id} item={item} selected={selectedFeedItemId === item.id} onSelect={() => setSelectedFeedItemId((current) => current === item.id ? null : item.id)} />)}
                </div>
              ) : (
                <div className="grid min-h-80 place-items-center border border-dashed border-[#aeb9c7] bg-white"><div className="text-center"><Newspaper className="mx-auto size-7 text-[#7c8999]" /><p className="mt-3 text-xs font-bold">ยังไม่มีข่าวที่ตรงกับตัวกรอง</p><p className="mt-1 text-[10px] text-[#7c8999]">เพิ่ม RSS Source หรือกด Sync RSS</p></div></div>
              )}
            </section>

            <aside className="space-y-5">
              <section className="border border-[#cdd5df] bg-white">
                <div className="flex items-center justify-between bg-[#0b2347] px-4 py-3 text-white">
                  <h2 className="text-sm font-black uppercase tracking-[-.02em]">Top Verified News</h2>
                  <ShieldCheck className="size-4 text-[#79bfff]" />
                </div>
                <div className="px-3">{topVerified.length ? topVerified.map((item) => <CompactNews key={item.id} item={item} onSelect={() => setSelectedFeedItemId(item.id)} />) : <p className="py-8 text-center text-[10px] text-[#8190a3]">ยังไม่มีข่าว</p>}</div>
              </section>
              <SuggestionsPanel suggestions={suggestions} onFollow={(item) => void followSuggestion(item)} />
            </aside>
          </div>
        </main>
      ) : active === "settings" ? (
        <main className="mx-auto max-w-4xl p-6"><div className="border border-[#cdd5df] bg-white p-6"><Settings className="size-6 text-[#2f8fdc]" /><h2 className="mt-4 text-lg font-black">Workspace Settings</h2><p className="mt-2 text-xs leading-6 text-[#718096]">ตั้งค่าภาษาเริ่มต้น บทบาท และ Environment secrets โดยไม่แสดง Token บนหน้าเว็บ</p></div></main>
      ) : (
        <main className="min-h-[calc(100vh-128px)] bg-[#f2eff5] p-4 text-[#1c2537] sm:p-6"><div className="mx-auto max-w-[1500px]"><EditorialWorkspace section={active} notify={setToast} autoDraft={autoDraft} onAutoDraftConsumed={() => setAutoDraft(null)} /></div></main>
      )}

      {inboxVisible && selectedItem ? (
        <div className="fixed inset-x-3 bottom-3 z-50">
          <div className="mx-auto flex max-w-[1050px] items-center gap-3 border border-[#2f8fdc] bg-[#0b2347]/95 p-3 text-white shadow-2xl backdrop-blur-xl">
            <div className="grid size-11 shrink-0 place-items-center bg-[#2f8fdc] text-xs font-black">{sourceInitial(selectedItem.sourceName)}</div>
            <div className="min-w-0 flex-1"><p className="text-[8px] font-black uppercase tracking-[.12em] text-[#79bfff]">Selected real source</p><p className="truncate text-[11px] font-bold">{selectedItem.headline}</p></div>
            <button type="button" onClick={() => window.open(selectedItem.url, "_blank", "noopener,noreferrer")} className="hidden border border-white/25 px-3 py-2 text-[9px] font-bold text-white sm:block">เปิดต้นฉบับ</button>
            <button type="button" onClick={confirmSelection} className="inline-flex items-center gap-2 bg-[#63aff4] px-4 py-3 text-[10px] font-black text-[#071a35] sm:px-6">ยืนยันและสร้าง Draft <BookOpenText className="size-4" /></button>
          </div>
        </div>
      ) : null}

      <div role="status" aria-live="polite" className={`fixed right-5 top-36 z-[80] bg-[#0b2347] px-4 py-3 text-[10px] font-bold text-white shadow-2xl transition ${toast ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"}`}>{toast}</div>
    </div>
  );
}
