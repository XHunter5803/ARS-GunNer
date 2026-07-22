"use client";

import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleCheck,
  Clock3,
  Database,
  FileCheck2,
  FileText,
  Globe2,
  Languages,
  Layers3,
  LayoutDashboard,
  ListChecks,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Newspaper,
  PencilLine,
  Plus,
  Radar,
  RadioTower,
  RefreshCw,
  Rss,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  WandSparkles,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import EditorialWorkspace from "./editorial-workspaces";

type NavId =
  | "dashboard"
  | "discovery"
  | "favorites"
  | "sources"
  | "fact-check"
  | "articles"
  | "publishing"
  | "schedule"
  | "settings";

type NavItem = {
  id: NavId;
  label: string;
  labelTh: string;
  icon: LucideIcon;
  badge?: string;
};

type DiscoveryItem = {
  id: number;
  headline: string;
  canonical_url: string;
  reporter: string | null;
  language: "th" | "en" | "other";
  published_at: string | null;
  clean_text: string;
  created_at: string;
  source_name: string | null;
  source_type: string | null;
  reliability_weight: number | null;
};

type DashboardSummary = {
  reports_total: number;
  reports_today: number;
  event_clusters: number;
  ready_articles: number;
  publishing_queue: number;
};

type StatItem = { label: string; value: string; change: string; icon: LucideIcon; tone: string };

const primaryNav: NavItem[] = [
  { id: "dashboard", label: "Dashboard", labelTh: "ภาพรวม", icon: LayoutDashboard },
  { id: "discovery", label: "Discovery", labelTh: "ค้นหาข่าว", icon: Radar },
  { id: "favorites", label: "Favorites", labelTh: "รายการติดตาม", icon: Star },
  { id: "sources", label: "Sources", labelTh: "แหล่งข่าว", icon: RadioTower },
];

const workflowNav: NavItem[] = [
  { id: "fact-check", label: "Fact Check", labelTh: "ตรวจข้อเท็จจริง", icon: ShieldCheck },
  { id: "articles", label: "Articles", labelTh: "บทความ", icon: FileText },
  { id: "publishing", label: "Publishing", labelTh: "เผยแพร่", icon: Send },
  { id: "schedule", label: "Schedule", labelTh: "ตารางเวลา", icon: CalendarDays },
];

const sectionCopy: Record<NavId, { eyebrow: string; title: string; description: string }> = {
  dashboard: {
    eyebrow: "Newsroom intelligence",
    title: "สวัสดีตอนเช้า, Editor",
    description: "ติดตามข่าวที่กำลังขยับ ตรวจหลักฐาน และส่งงานที่พร้อมเผยแพร่จากที่เดียว",
  },
  discovery: {
    eyebrow: "Discovery workspace",
    title: "ค้นหาและรวมข่าวเรื่องเดียวกัน",
    description: "จัดกลุ่ม RSS จาก Keyword, สำนักข่าว และ Reporter ก่อนส่งต่อให้ทีมตรวจสอบ",
  },
  favorites: {
    eyebrow: "Monitoring rules",
    title: "รายการที่ต้องติดตามเป็นพิเศษ",
    description: "กำหนดคำค้น สำนักข่าว และ Reporter ที่ระบบควรให้ความสำคัญ",
  },
  sources: {
    eyebrow: "Source control",
    title: "สุขภาพของแหล่งข่าวและ RSS",
    description: "ตรวจแหล่งต้นทาง เวลาอัปเดต และสถานะการดึงข้อมูลโดยไม่ซ้ำกัน",
  },
  "fact-check": {
    eyebrow: "Verification desk",
    title: "แยกข้อเท็จจริงออกจากข้อกล่าวอ้าง",
    description: "เปรียบเทียบแหล่งข่าว ตรวจความขัดแย้ง และหยุดข่าวที่หลักฐานยังไม่พอ",
  },
  articles: {
    eyebrow: "Perspective editor",
    title: "Article Pattern: มุมมอง/บทวิเคราะห์",
    description: "เขียนไทย อังกฤษ หรือสองภาษา พร้อม Readiness Score และ Revision History",
  },
  publishing: {
    eyebrow: "Delivery queue",
    title: "ตรวจ Preview ก่อนส่ง Telegram",
    description: "ควบคุมคิว Telegram พร้อมบันทึกผลการส่งและ Retry อย่างชัดเจน",
  },
  schedule: {
    eyebrow: "Editorial calendar",
    title: "วางตารางเผยแพร่โดยไม่ชนกัน",
    description: "เห็นงานที่อนุมัติแล้ว งานที่รอคิว และสถานะส่งจริงในปฏิทินเดียว",
  },
  settings: {
    eyebrow: "Workspace settings",
    title: "ตั้งค่าภาษา บทบาท และระบบเชื่อมต่อ",
    description: "จัดการค่าพื้นฐานอย่างปลอดภัย โดยไม่แสดง Secret ในหน้าจอหรือ Log",
  },
};

const emptySummary: DashboardSummary = {
  reports_total: 0,
  reports_today: 0,
  event_clusters: 0,
  ready_articles: 0,
  publishing_queue: 0,
};

const workspaceCards: Record<Exclude<NavId, "dashboard" | "discovery">, { icon: LucideIcon; title: string; text: string; meta: string }[]> = {
  favorites: [
    { icon: Search, title: "Keywords", text: "ตั้งคำค้นไทยและอังกฤษ พร้อมคำยกเว้นเพื่อลดข่าวรบกวน", meta: "12 active rules" },
    { icon: Globe2, title: "News outlets", text: "ให้น้ำหนักแหล่งทางการและสำนักข่าวต้นทางก่อนบทความสรุป", meta: "18 outlets" },
    { icon: UserCheck, title: "Reporters", text: "ติดตาม Reporter โดยตรงและรวมชื่อสะกดหลายรูปแบบ", meta: "9 reporters" },
  ],
  sources: [
    { icon: Rss, title: "RSS health", text: "ตรวจเวลาอัปเดต รูปแบบ Feed และรายการที่อ่านไม่ได้", meta: "16 healthy · 2 review" },
    { icon: Database, title: "Canonical links", text: "เก็บ URL มาตรฐานเพื่อหยุดข่าวซ้ำก่อนเข้าสู่คลัสเตอร์", meta: "99.2% deduplicated" },
    { icon: RefreshCw, title: "Cron cycles", text: "แบ่งรอบดึงข่าวให้เหมาะกับ Free Tier และจำกัดการ Retry", meta: "Every 15 minutes" },
  ],
  "fact-check": [
    { icon: Check, title: "Confirmed facts", text: "ข้อความที่มีหลักฐานตรงจากแหล่งทางการหรือแหล่งต้นทาง", meta: "21 facts confirmed" },
    { icon: MessageCircle, title: "Reported claims", text: "ข้อกล่าวอ้างยังคงระดับถ้อยคำเดิม เช่น สนใจ ติดต่อ หรือเจรจา", meta: "8 claims to review" },
    { icon: FileCheck2, title: "Conflict matrix", text: "แจ้งเมื่อวัน เวลา ตัวเลข หรือสถานะจากแต่ละแหล่งไม่ตรงกัน", meta: "2 active conflicts" },
  ],
  articles: [
    { icon: WandSparkles, title: "Pattern writer", text: "สร้างต้นฉบับ 5–7 ย่อหน้าในโครง มุมมอง/บทวิเคราะห์", meta: "TH · EN · Bilingual" },
    { icon: ListChecks, title: "Readiness gate", text: "ต่ำกว่า 70 คะแนนจะถูกกันออกจาก Auto-publish โดยอัตโนมัติ", meta: "8 ready · 4 review" },
    { icon: PencilLine, title: "Revisions", text: "บันทึก JSON ทุกฉบับเพื่อเปรียบเทียบและย้อนดูเหตุผลการแก้ไข", meta: "Version history on" },
  ],
  publishing: [
    { icon: MessageCircle, title: "Telegram", text: "ตรวจข้อความ เวลา และ Chat ปลายทางก่อนส่ง พร้อมบันทึก Delivery ID และผล Retry", meta: "Only active channel" },
  ],
  schedule: [
    { icon: CalendarDays, title: "Today", text: "14:30 · มุมมองตลาดซื้อขาย — Demo article", meta: "Approved" },
    { icon: Clock3, title: "Tomorrow", text: "09:00 · สรุปข่าวเช้าแบบสองภาษา — Demo article", meta: "Review needed" },
    { icon: Send, title: "Delivery log", text: "แยกผลสำเร็จ ล้มเหลว และงานที่กำลัง Retry ตามช่องทาง", meta: "98% success demo" },
  ],
  settings: [
    { icon: Languages, title: "Language policy", text: "เลือก th, en หรือ bilingual และล้างข้อความหลุดก่อนบันทึก", meta: "Bilingual default" },
    { icon: ShieldCheck, title: "Roles & approvals", text: "แยกสิทธิ์ Viewer, Editor, Approver และ Admin", meta: "Access review required" },
    { icon: Settings, title: "Integrations", text: "เชื่อม Cloudflare และ Social secrets ผ่าน Environment เท่านั้น", meta: "No secrets exposed" },
  ],
};

function LogoMark() {
  return (
    <div className="relative grid size-11 place-items-center rounded-xl bg-[linear-gradient(145deg,#3f6ad8,#794cdb)] text-sm font-black tracking-[-0.08em] text-white shadow-[0_8px_24px_rgba(63,106,216,.24)]">
      ARS
      <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-white bg-[#3ac47d]" />
    </div>
  );
}

function NavButton({ item, active, onSelect }: { item: NavItem; active: boolean; onSelect: (id: NavId) => void }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={`architect-nav-button group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
        active
          ? "architect-nav-button--active font-semibold"
          : "text-[#5f6672] hover:bg-[#f0f3f7] hover:text-[#3f6ad8]"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <Icon className={`size-[18px] ${active ? "text-[#3f6ad8]" : "text-[#9aa3ad] group-hover:text-[#3f6ad8]"}`} />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-[#3f6ad8] text-white" : "bg-[#eef1f5] text-[#7b8490]"}`}>
          {item.badge}
        </span>
      ) : null}
    </button>
  );
}

function Sidebar({ active, mobileOpen, onSelect, onClose }: { active: NavId; mobileOpen: boolean; onSelect: (id: NavId) => void; onClose: () => void }) {
  return (
    <>
      <button
        type="button"
        aria-label="ปิดเมนู"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-[#172033]/45 backdrop-blur-sm transition-opacity lg:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside className={`architect-sidebar fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[#e8ebef] bg-white px-4 py-4 text-[#343a40] shadow-[7px_0_60px_rgba(0,0,0,.05)] transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-5 flex h-12 items-center gap-3 px-1">
          <LogoMark />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-[#2f3440]">GunNer</span>
              <span className="rounded bg-[#e9efff] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[.14em] text-[#3f6ad8]">Pro</span>
            </div>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[.16em] text-[#98a0ab]">Newsroom intelligence</p>
          </div>
          <button type="button" onClick={onClose} aria-label="ปิดเมนู" className="grid size-9 place-items-center rounded-lg text-[#8e96a2] hover:bg-[#f0f3f7] hover:text-[#343a40] lg:hidden">
            <X className="size-5" />
          </button>
        </div>

        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto pr-1">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#3f6ad8]">Main navigation</p>
          <div className="space-y-1">
            {primaryNav.map((item) => <NavButton key={item.id} item={item} active={active === item.id} onSelect={onSelect} />)}
          </div>
          <p className="mt-6 px-3 pb-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#3f6ad8]">Editorial workflow</p>
          <div className="space-y-1">
            {workflowNav.map((item) => <NavButton key={item.id} item={item} active={active === item.id} onSelect={onSelect} />)}
          </div>
        </nav>

        <div className="mt-4 border-t border-[#eceff3] pt-4">
          <NavButton item={{ id: "settings", label: "Settings", labelTh: "ตั้งค่า", icon: Settings }} active={active === "settings"} onSelect={onSelect} />
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#f5f7fa] p-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#3f6ad8] text-xs font-bold text-white">ED</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#343a40]">Demo Editor</p>
              <p className="truncate text-[10px] text-[#8c95a1]">Approver workspace</p>
            </div>
            <MoreHorizontal className="size-4 text-[#9aa2ad]" />
          </div>
        </div>
      </aside>
    </>
  );
}

function StatCard({ item }: { item: StatItem }) {
  const Icon = item.icon;
  return (
    <article className="architect-stat-card rounded-lg border border-[#e6e9ed] bg-white p-5 shadow-[0_4px_18px_rgba(0,0,0,.05)] transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.08em] text-[#8c929f]">{item.label}</p>
          <div className="mt-2 flex items-end gap-2">
            <strong className="text-[30px] font-extrabold leading-none tracking-[-.04em] text-[#343a40]">{item.value}</strong>
            <span className={`stat-change stat-change--${item.tone}`}>{item.change}</span>
          </div>
        </div>
        <div className={`stat-icon stat-icon--${item.tone}`}><Icon className="size-5" /></div>
      </div>
    </article>
  );
}

function formatPublishedAt(value: string | null, fallback: string) {
  const date = new Date(value ?? fallback);
  if (!Number.isFinite(date.getTime())) return "ไม่ทราบเวลา";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function DiscoveryCard({ item }: { item: DiscoveryItem }) {
  const languageLabel = item.language === "th" ? "TH" : item.language === "en" ? "EN" : "OTHER";
  const sourceLabel = item.source_name || "Unknown source";
  const summary = item.clean_text.trim() || "RSS feed นี้มีเฉพาะพาดหัว เปิดลิงก์ต้นฉบับเพื่ออ่านรายละเอียด";
  return (
    <article className="group rounded-2xl border border-[#ebe8e2] bg-[#fffefa] p-4 transition-all hover:border-[#dfd9cf] hover:shadow-[0_12px_30px_rgba(30,42,63,.06)]">
      <div className="flex items-start gap-3">
        <div className="mt-1 grid size-9 shrink-0 place-items-center rounded-xl bg-[#eef4ff] text-[#3f6fc7]">
          <Rss className="size-[17px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#f0eee8] px-2 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-[#6e7480]">{sourceLabel}</span>
            <span className="rounded-md bg-[#eaf9f2] px-2 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-[#228464]">Live RSS</span>
            <span className="rounded-md bg-[#f0ecff] px-2 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-[#7254c5]">{languageLabel}</span>
            <span className="text-[10px] text-[#a1a5ad]">{formatPublishedAt(item.published_at, item.created_at)}</span>
          </div>
          <a href={item.canonical_url} target="_blank" rel="noreferrer" className="text-left text-[14px] font-bold leading-6 text-[#20283a] transition-colors hover:text-[#d7333e]">{item.headline}</a>
          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[#777d88]">{summary}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-medium text-[#868c97]">
            <span className="flex items-center gap-1.5"><Globe2 className="size-3.5" /> {sourceLabel}</span>
            <span className="flex items-center gap-1.5"><UserCheck className="size-3.5" /> {item.reporter || "ไม่ระบุ Reporter"}</span>
            <span className="ml-auto flex items-center gap-1 rounded-full bg-[#eaf9f2] px-2 py-1 font-bold text-[#228464]"><Check className="size-3" /> Imported</span>
          </div>
        </div>
        <a href={item.canonical_url} target="_blank" rel="noreferrer" aria-label={`เปิดต้นฉบับ ${item.headline}`} className="grid size-8 shrink-0 place-items-center rounded-lg text-[#a5a9b1] transition-colors hover:bg-[#f1eee8] hover:text-[#252d3d]">
          <ChevronRight className="size-4" />
        </a>
      </div>
    </article>
  );
}

function ReadinessCard({ onReview }: { onReview: () => void }) {
  return (
    <article className="rounded-lg border border-[#e4e8ed] bg-white p-5 shadow-[0_4px_18px_rgba(0,0,0,.05)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#9a9ea7]">Article readiness</p>
          <h2 className="mt-1 text-base font-extrabold text-[#1b2436]">พร้อมเผยแพร่</h2>
        </div>
        <button type="button" onClick={onReview} aria-label="เปิดบทความ" className="grid size-9 place-items-center rounded-xl border border-[#ebe8e2] text-[#8a909b] hover:bg-[#f6f3ed] hover:text-[#273044]"><ArrowUpRight className="size-4" /></button>
      </div>
      <div className="mt-5 flex items-center gap-5">
        <div className="readiness-ring" aria-label="Readiness score 88 out of 100">
          <div><strong>88</strong><span>/100</span></div>
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          {[
            ["Sources", "100%"],
            ["Facts", "92%"],
            ["Language", "85%"],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="mb-1 flex justify-between text-[10px] font-semibold text-[#767c87]"><span>{label}</span><span>{value}</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#efede8]"><div className="h-full rounded-full bg-[linear-gradient(90deg,#e53c47,#ff737b)]" style={{ width: value }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 flex items-center gap-2 rounded-md bg-[#effaf5] px-3 py-2.5 text-[10px] font-semibold text-[#27795f]">
        <CircleCheck className="size-4" /> ผ่านเกณฑ์ 85 คะแนน · รอ Approver
      </div>
    </article>
  );
}

function PublishingCard({ onOpen, queueCount }: { onOpen: () => void; queueCount: number }) {
  const channels = [
    { label: "Telegram", icon: MessageCircle, time: `${queueCount}`, status: queueCount ? "Queued" : "Queue empty", color: "#2c98d8" },
  ];
  return (
    <article className="rounded-lg border border-[#e4e8ed] bg-white p-5 shadow-[0_4px_18px_rgba(0,0,0,.05)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#9a9ea7]">Publishing queue</p>
          <h2 className="mt-1 text-base font-extrabold text-[#1b2436]">ส่งวันนี้</h2>
        </div>
        <span className="rounded-full bg-[#fff0f1] px-2.5 py-1 text-[9px] font-bold text-[#d83943]">{queueCount} items</span>
      </div>
      <div className="mt-4 space-y-2">
        {channels.map((item) => {
          const Icon = item.icon;
          return (
            <button type="button" key={item.label} onClick={onOpen} className="flex w-full items-center gap-3 rounded-xl border border-transparent px-2 py-2 text-left hover:border-[#ebe8e2] hover:bg-[#faf8f4]">
              <div className="grid size-9 place-items-center rounded-xl bg-[#f4f2ed]" style={{ color: item.color }}><Icon className="size-4" /></div>
              <div className="min-w-0 flex-1"><p className="text-xs font-bold text-[#283143]">{item.label}</p><p className="text-[10px] text-[#9297a0]">{item.status}</p></div>
              <span className="font-mono text-[11px] font-bold text-[#545c69]">{item.time}</span>
            </button>
          );
        })}
      </div>
      <button type="button" onClick={onOpen} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#e8e4dd] py-2.5 text-[11px] font-bold text-[#4b5360] hover:bg-[#f7f4ee]">
        Review queue <ArrowRight className="size-3.5" />
      </button>
    </article>
  );
}

function WorkspacePanel({ section, onAction }: { section: Exclude<NavId, "dashboard" | "discovery">; onAction: (message: string) => void }) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {workspaceCards[section].map((item, index) => {
        const Icon = item.icon;
        return (
          <article key={item.title} className="group rounded-[22px] border border-[#e7e4de] bg-white p-5 shadow-[0_10px_30px_rgba(31,41,58,.04)]">
            <div className="flex items-start justify-between">
            <div className={`grid size-11 place-items-center rounded-full ${index === 0 ? "bg-[#fff0f1] text-[#dc3e48]" : index === 1 ? "bg-[#eef4ff] text-[#3e6cc2]" : "bg-[#edf9f4] text-[#238465]"}`}><Icon className="size-5" /></div>
              <span className="rounded-full bg-[#f4f1eb] px-2.5 py-1 text-[9px] font-bold text-[#777d88]">Demo</span>
            </div>
            <h2 className="mt-5 text-base font-extrabold text-[#1c2537]">{item.title}</h2>
            <p className="mt-2 min-h-12 text-xs leading-5 text-[#777d88]">{item.text}</p>
            <div className="mt-5 flex items-center justify-between border-t border-[#eeeae4] pt-4">
              <span className="text-[10px] font-semibold text-[#8e939c]">{item.meta}</span>
              <button type="button" onClick={() => onAction(`${item.title}: เปิดมุมมองตัวอย่างแล้ว`)} className="grid size-8 place-items-center rounded-lg text-[#9a9fa8] hover:bg-[#f1eee8] hover:text-[#273044]" aria-label={`เปิด ${item.title}`}><ArrowUpRight className="size-4" /></button>
            </div>
          </article>
        );
      })}
      <article className="md:col-span-3 rounded-[22px] border border-dashed border-[#d9d4cc] bg-[#f4f1eb]/60 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold text-[#374052]">Phase 1 workspace</p>
            <p className="mt-1 text-[11px] leading-5 text-[#7b818b]">โครงข้อมูลและหน้าจอพร้อมแล้ว การเชื่อม RSS, Workers AI และ Social API จริงจะเปิดหลังเพิ่ม Environment secrets</p>
          </div>
          <button type="button" onClick={() => onAction("บันทึกการตั้งค่าตัวอย่างแล้ว")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#18243a] px-4 py-2.5 text-[11px] font-bold text-white hover:bg-[#22314d]">
            <Check className="size-4" /> Save demo settings
          </button>
        </div>
      </article>
    </section>
  );
}

export default function NewsroomDashboard() {
  const [active, setActive] = useState<NavId>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [feedFilter, setFeedFilter] = useState<"All" | "th" | "en">("All");
  const [unread, setUnread] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState("");
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [discoveryItems, setDiscoveryItems] = useState<DiscoveryItem[]>([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(true);
  const [discoveryError, setDiscoveryError] = useState("");

  const current = sectionCopy[active];
  const currentNavItem = primaryNav.concat(workflowNav).find((item) => item.id === active);
  const PageIcon = currentNavItem?.icon ?? Settings;
  const dashboardStats = useMemo<StatItem[]>(() => [
    { label: "Reports imported", value: String(summary.reports_total), change: `${summary.reports_today} today`, icon: Newspaper, tone: "blue" },
    { label: "Event clusters", value: String(summary.event_clusters), change: summary.event_clusters ? "Active" : "Not grouped", icon: Layers3, tone: "violet" },
    { label: "Ready articles", value: String(summary.ready_articles), change: "Score ≥ 85", icon: CircleCheck, tone: "green" },
    { label: "Publishing queue", value: String(summary.publishing_queue), change: "Telegram", icon: Clock3, tone: "orange" },
  ], [summary]);

  const visibleDiscoveryItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return discoveryItems.filter((item) => {
      const matchesFilter = feedFilter === "All" || item.language === feedFilter;
      const matchesQuery = !normalized || `${item.headline} ${item.clean_text} ${item.source_name ?? ""} ${item.reporter ?? ""}`.toLowerCase().includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [discoveryItems, feedFilter, query]);

  const loadDiscovery = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/discovery?limit=25", { headers: { accept: "application/json" } });
      const payload = await response.json() as { data?: { summary?: DashboardSummary; items?: DiscoveryItem[] }; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message || "โหลดข่าวไม่สำเร็จ");
      setSummary(payload.data?.summary ?? emptySummary);
      setDiscoveryItems(payload.data?.items ?? []);
      setDiscoveryError("");
    } catch (error) {
      setDiscoveryError(error instanceof Error ? error.message : "โหลดข่าวไม่สำเร็จ");
    } finally {
      setDiscoveryLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadDiscovery(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadDiscovery]);

  const refreshDiscovery = () => {
    setDiscoveryLoading(true);
    setDiscoveryError("");
    void loadDiscovery();
  };

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const navigate = (id: NavId) => {
    setActive(id);
    setMobileOpen(false);
    window.history.replaceState(null, "", id === "dashboard" ? "/" : `/?view=${id}`);
  };

  const syncFeeds = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/v1/rss/ingest", { method: "POST", headers: { accept: "application/json" } });
      const payload = await response.json() as { data?: { sources_checked?: number; items_inserted?: number }; error?: { message?: string } };
      if (!response.ok) {
        setToast(response.status === 401 ? "Manual Sync ต้องใช้ Access · Cron ยังดึงข่าวทุก 15 นาที" : payload.error?.message || "ซิงก์ RSS ไม่สำเร็จ");
        return;
      }
      await loadDiscovery();
      setToast(`ซิงก์ RSS แล้ว · ${payload.data?.sources_checked ?? 0} แหล่ง · เพิ่ม ${payload.data?.items_inserted ?? 0} ข่าว`);
    } catch {
      setToast("เชื่อมต่อ RSS API ไม่สำเร็จ");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="architect-shell min-h-screen bg-[#f1f4f6] text-[#343a40]">
      <Sidebar active={active} mobileOpen={mobileOpen} onSelect={navigate} onClose={() => setMobileOpen(false)} />

      <main className="min-h-screen lg:pl-[280px]">
        <header className="architect-header sticky top-0 z-30 border-b border-[#e6e9ed] bg-white px-4 py-2.5 shadow-[0_2px_12px_rgba(0,0,0,.035)] sm:px-6 lg:px-8">
          <div className="mx-auto flex min-h-10 max-w-[1500px] items-center gap-3">
            <button type="button" onClick={() => setMobileOpen(true)} aria-label="เปิดเมนู" className="grid size-10 place-items-center rounded-lg border border-[#e1e5ea] bg-white text-[#596170] lg:hidden"><Menu className="size-5" /></button>
            <div className="hidden min-w-0 sm:block">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.12em] text-[#9a9da4]"><span>ARS GunNer</span><ChevronRight className="size-3" /><span className="text-[#555d6b]">{primaryNav.concat(workflowNav).find((item) => item.id === active)?.label ?? "Settings"}</span></div>
            </div>
            <div className="relative ml-auto w-full max-w-[340px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9da1aa]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="ค้นหาข่าว" placeholder="Search stories, sources..." className="h-10 w-full rounded-full border border-[#e1e5ea] bg-[#f7f8fa] pl-9 pr-3 text-xs text-[#263044] outline-none transition focus:border-[#7e9ee7] focus:bg-white focus:ring-4 focus:ring-[#3f6ad8]/10" />
            </div>
            <button type="button" onClick={() => { setUnread(false); setToast("อ่านการแจ้งเตือนแล้ว"); }} aria-label="การแจ้งเตือน" className="relative grid size-10 shrink-0 place-items-center rounded-full bg-[#f4f6f8] text-[#667080] hover:bg-[#e9efff] hover:text-[#3f6ad8]">
              <Bell className="size-[18px]" />{unread ? <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-[#d92550]" /> : null}
            </button>
            <button type="button" onClick={() => navigate("settings")} aria-label="เปิดโปรไฟล์และการตั้งค่า" className="grid size-10 shrink-0 place-items-center rounded-full bg-[#3f6ad8] text-[10px] font-extrabold text-white shadow-[0_4px_12px_rgba(63,106,216,.25)]">ED</button>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10">
          <section className="architect-page-title -mx-4 -mt-5 mb-5 border-b border-[#e2e6eb] bg-[#f6f8fa] px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div className="mx-auto flex max-w-[1500px] flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="grid size-[60px] shrink-0 place-items-center rounded-lg bg-white text-[#3f6ad8] shadow-[0_4px_16px_rgba(0,0,0,.08)]">
                  <PageIcon className="size-7" />
                </div>
                <div className="min-w-0">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#3f6ad8]">{current.eyebrow}</div>
                  <h1 className="text-xl font-semibold tracking-[-.02em] text-[#343a40] sm:text-2xl">{current.title}</h1>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-[#7d8590] sm:text-[13px]">{current.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void syncFeeds()} disabled={syncing} className="inline-flex items-center gap-2 rounded-full border border-[#dfe4ea] bg-white px-4 py-2.5 text-[11px] font-bold text-[#545d6b] shadow-sm hover:bg-[#f5f7fa] disabled:cursor-wait disabled:opacity-70"><RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} />{syncing ? "Syncing..." : "Sync RSS"}</button>
                <button type="button" onClick={() => { navigate("articles"); setToast("เปิด Article Pattern workspace แล้ว"); }} className="inline-flex items-center gap-2 rounded-full bg-[#3ac47d] px-5 py-2.5 text-[11px] font-bold text-white shadow-[0_6px_16px_rgba(58,196,125,.25)] hover:bg-[#31ad6e]"><Plus className="size-4" />Create article</button>
              </div>
            </div>
          </section>

          <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {dashboardStats.map((item) => <StatCard key={item.label} item={item} />)}
          </div>

          {active === "dashboard" || active === "discovery" ? (
            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,.75fr)]">
              <section className="rounded-lg border border-[#e4e8ed] bg-white shadow-[0_4px_18px_rgba(0,0,0,.05)]">
                <div className="flex flex-col gap-3 border-b border-[#e8ebef] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div>
                    <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#3f6ad8] shadow-[0_0_0_4px_rgba(63,106,216,.1)]" /><h2 className="text-base font-bold text-[#343a40]">Live discovery feed</h2></div>
                    <p className="mt-1 text-[10px] text-[#9a9fa8]">ข้อมูล RSS จริงจาก D1 · เปิดพาดหัวเพื่อดูแหล่งต้นฉบับ</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-[#f1f3f6] p-1">
                    {(["All", "th", "en"] as const).map((filter) => (
                      <button type="button" key={filter} onClick={() => setFeedFilter(filter)} className={`rounded-lg px-2.5 py-1.5 text-[9px] font-bold uppercase transition ${feedFilter === filter ? "bg-white text-[#202a3c] shadow-sm" : "text-[#8a909b] hover:text-[#4e5664]"}`}>{filter}</button>
                    ))}
                    <button type="button" onClick={refreshDiscovery} aria-label="รีเฟรช Discovery" className="grid size-7 place-items-center rounded-lg text-[#89909a] hover:bg-white"><RefreshCw className={`size-3.5 ${discoveryLoading ? "animate-spin" : ""}`} /></button>
                  </div>
                </div>
                <div className="space-y-2.5 p-4 sm:p-5">
                  {discoveryLoading ? (
                    <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-[#ddd8cf] bg-[#faf8f4] text-center"><div><RefreshCw className="mx-auto size-6 animate-spin text-[#a4a8af]" /><p className="mt-3 text-xs font-bold text-[#535b68]">กำลังโหลดข่าวจาก D1</p></div></div>
                  ) : discoveryError ? (
                    <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-[#efc9cc] bg-[#fff7f7] text-center"><div><ShieldCheck className="mx-auto size-6 text-[#d04a54]" /><p className="mt-3 text-xs font-bold text-[#535b68]">{discoveryError}</p><button type="button" onClick={refreshDiscovery} className="mt-2 text-[10px] font-bold text-[#df3d48]">ลองใหม่</button></div></div>
                  ) : visibleDiscoveryItems.length ? visibleDiscoveryItems.map((item) => <DiscoveryCard key={item.id} item={item} />) : (
                    <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-[#ddd8cf] bg-[#faf8f4] text-center"><div><Search className="mx-auto size-6 text-[#a4a8af]" /><p className="mt-3 text-xs font-bold text-[#535b68]">ไม่พบข่าวที่ตรงกับตัวกรอง</p><button type="button" onClick={() => { setQuery(""); setFeedFilter("All"); }} className="mt-2 text-[10px] font-bold text-[#df3d48]">ล้างตัวกรอง</button></div></div>
                  )}
                </div>
                <div className="border-t border-[#e8ebef] p-4 text-center"><button type="button" onClick={() => navigate("discovery")} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3f6ad8] px-5 py-2.5 text-[11px] font-bold text-white shadow-[0_5px_14px_rgba(63,106,216,.22)] hover:bg-[#345cc3]">Showing {visibleDiscoveryItems.length} of {summary.reports_total} reports <ArrowRight className="size-3.5" /></button></div>
              </section>
              <aside className="space-y-4">
                <ReadinessCard onReview={() => navigate("articles")} />
                <PublishingCard onOpen={() => navigate("publishing")} queueCount={summary.publishing_queue} />
              </aside>
            </div>
          ) : active === "favorites" || active === "sources" || active === "fact-check" || active === "articles" || active === "publishing" ? (
            <div className="mt-4"><EditorialWorkspace section={active} notify={setToast} /></div>
          ) : (
            <div className="mt-4"><WorkspacePanel section={active} onAction={setToast} /></div>
          )}

          <footer className="mt-6 flex flex-col gap-2 border-t border-[#ddd8d0] pt-4 text-[9px] font-medium text-[#979ba3] sm:flex-row sm:items-center sm:justify-between">
            <p>ARS GunNer v0.5.3 · ArchitectUI-inspired newsroom · Live D1 discovery</p>
            <p className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#56bc91]" /> Cloudflare-ready architecture</p>
          </footer>
        </div>
      </main>

      <nav aria-label="Mobile navigation" className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 rounded-xl border border-[#e1e5ea] bg-white/95 p-1.5 shadow-[0_14px_36px_rgba(24,35,55,.16)] backdrop-blur-xl lg:hidden">
        {[primaryNav[0], primaryNav[1], workflowNav[1], workflowNav[2]].map((item) => {
          const Icon = item.icon;
          return <button type="button" key={item.id} onClick={() => navigate(item.id)} className={`flex flex-col items-center gap-1 rounded-lg py-2 text-[8px] font-bold ${active === item.id ? "bg-[#e9efff] text-[#3f6ad8]" : "text-[#88919d]"}`}><Icon className={`size-4 ${active === item.id ? "text-[#3f6ad8]" : ""}`} />{item.label}</button>;
        })}
      </nav>

      <div role="status" aria-live="polite" className={`fixed bottom-24 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-xl bg-[#17243a] px-4 py-3 text-[10px] font-semibold text-white shadow-2xl transition-all lg:bottom-7 ${toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}>
        <Sparkles className="size-4 text-[#ff737b]" />{toast}
      </div>
    </div>
  );
}
