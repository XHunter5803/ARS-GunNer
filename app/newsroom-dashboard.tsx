"use client";

import {
  ArrowRight,
  ArrowUpRight,
  AtSign,
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
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  TrendingUp,
  UserCheck,
  WandSparkles,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

type FeedCluster = {
  id: number;
  category: "Transfer" | "Club" | "League";
  headline: string;
  summary: string;
  sources: number;
  reporters: number;
  viral: number;
  updated: string;
  confidence: "High" | "Review";
};

const primaryNav: NavItem[] = [
  { id: "dashboard", label: "Dashboard", labelTh: "ภาพรวม", icon: LayoutDashboard },
  { id: "discovery", label: "Discovery", labelTh: "ค้นหาข่าว", icon: Radar, badge: "36" },
  { id: "favorites", label: "Favorites", labelTh: "รายการติดตาม", icon: Star },
  { id: "sources", label: "Sources", labelTh: "แหล่งข่าว", icon: RadioTower },
];

const workflowNav: NavItem[] = [
  { id: "fact-check", label: "Fact Check", labelTh: "ตรวจข้อเท็จจริง", icon: ShieldCheck, badge: "5" },
  { id: "articles", label: "Articles", labelTh: "บทความ", icon: FileText, badge: "8" },
  { id: "publishing", label: "Publishing", labelTh: "เผยแพร่", icon: Send, badge: "3" },
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
    title: "ตรวจ Preview ก่อนส่งทุกช่องทาง",
    description: "ควบคุม Facebook, X และ Telegram พร้อมบันทึกผลการส่งอย่างชัดเจน",
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

const clusters: FeedCluster[] = [
  {
    id: 1,
    category: "Transfer",
    headline: "Demo: Northbridge FC สำรวจทางเลือกกองหน้ารายใหม่ หลังแผนเดิมยังไม่ชัดเจน",
    summary: "หลายรายงานพูดถึงเหตุการณ์เดียวกัน แต่ระดับข้อมูลยังอยู่ที่ “สนใจ” และต้องตรวจต้นทางเพิ่ม",
    sources: 7,
    reporters: 3,
    viral: 92,
    updated: "6 นาทีที่แล้ว",
    confidence: "High",
  },
  {
    id: 2,
    category: "Club",
    headline: "Demo: Harbor United ปรับโครงทีมงาน จึงอาจเปลี่ยนลำดับความสำคัญในตลาด",
    summary: "ข้อมูลทางการยืนยันการเปลี่ยนบทบาทหนึ่งตำแหน่ง ส่วนผลต่อแผนซื้อขายยังเป็นการวิเคราะห์",
    sources: 5,
    reporters: 2,
    viral: 78,
    updated: "18 นาทีที่แล้ว",
    confidence: "High",
  },
  {
    id: 3,
    category: "League",
    headline: "Demo: กฎลงทะเบียนฉบับใหม่อาจทำให้หลายสโมสรต้องทบทวนขนาดทีม",
    summary: "เอกสารร่างและรายงานจากสื่อให้รายละเอียดบางจุดไม่ตรงกัน จึงยังไม่ควรฟันธงผลกระทบ",
    sources: 4,
    reporters: 1,
    viral: 64,
    updated: "31 นาทีที่แล้ว",
    confidence: "Review",
  },
];

const stats: { label: string; value: string; change: string; icon: LucideIcon; tone: string }[] = [
  { label: "Reports today", value: "128", change: "+18%", icon: Newspaper, tone: "blue" },
  { label: "Event clusters", value: "36", change: "11 new", icon: Layers3, tone: "violet" },
  { label: "Ready articles", value: "8", change: "Score ≥ 85", icon: CircleCheck, tone: "green" },
  { label: "Publishing queue", value: "3", change: "Next 14:30", icon: Clock3, tone: "orange" },
];

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
    { icon: Share2, title: "Facebook", text: "ตรวจข้อความ ภาพตัวอย่าง และเวลาส่งก่อนเข้าสู่คิว", meta: "1 queued" },
    { icon: AtSign, title: "X", text: "ย่อข้อความโดยไม่เปลี่ยนระดับข่าวและคงลิงก์แหล่งอ้างอิง", meta: "1 needs review" },
    { icon: MessageCircle, title: "Telegram", text: "ส่งบทความพร้อมบันทึก Delivery ID และผล Retry", meta: "1 scheduled" },
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
    <div className="relative grid size-11 place-items-center rounded-2xl bg-[linear-gradient(145deg,#ff5b62,#c9232c)] text-sm font-black tracking-[-0.08em] text-white shadow-[0_10px_30px_rgba(232,55,65,.3)]">
      ARS
      <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-[#101b2d] bg-[#56d6aa]" />
    </div>
  );
}

function NavButton({ item, active, onSelect }: { item: NavItem; active: boolean; onSelect: (id: NavId) => void }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
        active
          ? "bg-white/[.09] font-semibold text-white shadow-[inset_3px_0_0_#ef4b55]"
          : "text-slate-400 hover:bg-white/[.05] hover:text-white"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <Icon className={`size-[18px] ${active ? "text-[#ff646d]" : "text-slate-500 group-hover:text-slate-300"}`} />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-[#ef4b55] text-white" : "bg-white/[.08] text-slate-400"}`}>
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
        className={`fixed inset-0 z-40 bg-[#07101e]/70 backdrop-blur-sm transition-opacity lg:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[#101b2d] px-4 py-5 text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-7 flex items-center gap-3 px-1">
          <LogoMark />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight">GunNer</span>
              <span className="rounded bg-[#ef4b55]/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[.14em] text-[#ff747c]">Beta</span>
            </div>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[.16em] text-slate-500">Newsroom intelligence</p>
          </div>
          <button type="button" onClick={onClose} aria-label="ปิดเมนู" className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white lg:hidden">
            <X className="size-5" />
          </button>
        </div>

        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto pr-1">
          <p className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[.2em] text-slate-600">Monitor</p>
          <div className="space-y-1">
            {primaryNav.map((item) => <NavButton key={item.id} item={item} active={active === item.id} onSelect={onSelect} />)}
          </div>
          <p className="mt-7 px-3 pb-2 text-[9px] font-bold uppercase tracking-[.2em] text-slate-600">Editorial workflow</p>
          <div className="space-y-1">
            {workflowNav.map((item) => <NavButton key={item.id} item={item} active={active === item.id} onSelect={onSelect} />)}
          </div>
        </nav>

        <div className="mt-4 border-t border-white/[.07] pt-4">
          <NavButton item={{ id: "settings", label: "Settings", labelTh: "ตั้งค่า", icon: Settings }} active={active === "settings"} onSelect={onSelect} />
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/[.04] p-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#263957] text-xs font-bold text-white">ED</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">Demo Editor</p>
              <p className="truncate text-[10px] text-slate-500">Approver workspace</p>
            </div>
            <MoreHorizontal className="size-4 text-slate-500" />
          </div>
        </div>
      </aside>
    </>
  );
}

function StatCard({ item }: { item: (typeof stats)[number] }) {
  const Icon = item.icon;
  return (
    <article className="rounded-[20px] border border-[#e7e4de] bg-white p-4 shadow-[0_8px_26px_rgba(36,45,64,.04)] transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.1em] text-[#8c929f]">{item.label}</p>
          <div className="mt-2 flex items-end gap-2">
            <strong className="text-[28px] font-extrabold leading-none tracking-[-.04em] text-[#172033]">{item.value}</strong>
            <span className={`stat-change stat-change--${item.tone}`}>{item.change}</span>
          </div>
        </div>
        <div className={`stat-icon stat-icon--${item.tone}`}><Icon className="size-[18px]" /></div>
      </div>
    </article>
  );
}

function FeedCard({ cluster, onOpen }: { cluster: FeedCluster; onOpen: () => void }) {
  return (
    <article className="group rounded-2xl border border-[#ebe8e2] bg-[#fffefa] p-4 transition-all hover:border-[#dfd9cf] hover:shadow-[0_12px_30px_rgba(30,42,63,.06)]">
      <div className="flex items-start gap-3">
        <div className={`mt-1 grid size-9 shrink-0 place-items-center rounded-xl ${cluster.category === "Transfer" ? "bg-[#fff0f1] text-[#e23d47]" : cluster.category === "Club" ? "bg-[#eef4ff] text-[#3f6fc7]" : "bg-[#f0ecff] text-[#7254c5]"}`}>
          {cluster.category === "Transfer" ? <TrendingUp className="size-[17px]" /> : cluster.category === "Club" ? <ShieldCheck className="size-[17px]" /> : <Globe2 className="size-[17px]" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#f0eee8] px-2 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-[#6e7480]">{cluster.category}</span>
            <span className="rounded-md bg-[#fff4d8] px-2 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-[#9a6d0e]">Demo data</span>
            <span className="text-[10px] text-[#a1a5ad]">{cluster.updated}</span>
          </div>
          <button type="button" onClick={onOpen} className="text-left text-[14px] font-bold leading-6 text-[#20283a] transition-colors hover:text-[#d7333e]">
            {cluster.headline}
          </button>
          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[#777d88]">{cluster.summary}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-medium text-[#868c97]">
            <span className="flex items-center gap-1.5"><Globe2 className="size-3.5" /> {cluster.sources} sources</span>
            <span className="flex items-center gap-1.5"><UserCheck className="size-3.5" /> {cluster.reporters} reporters</span>
            <span className="flex items-center gap-1.5"><TrendingUp className="size-3.5 text-[#ef4b55]" /> Viral {cluster.viral}</span>
            <span className={`ml-auto flex items-center gap-1 rounded-full px-2 py-1 font-bold ${cluster.confidence === "High" ? "bg-[#eaf9f2] text-[#228464]" : "bg-[#fff1e7] text-[#aa5e22]"}`}>
              {cluster.confidence === "High" ? <Check className="size-3" /> : <Clock3 className="size-3" />}{cluster.confidence}
            </span>
          </div>
        </div>
        <button type="button" onClick={onOpen} aria-label={`เปิด ${cluster.headline}`} className="grid size-8 shrink-0 place-items-center rounded-lg text-[#a5a9b1] transition-colors hover:bg-[#f1eee8] hover:text-[#252d3d]">
          <ChevronRight className="size-4" />
        </button>
      </div>
    </article>
  );
}

function ReadinessCard({ onReview }: { onReview: () => void }) {
  return (
    <article className="rounded-[22px] border border-[#e7e4de] bg-white p-5 shadow-[0_10px_30px_rgba(31,41,58,.05)]">
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
      <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#effaf5] px-3 py-2.5 text-[10px] font-semibold text-[#27795f]">
        <CircleCheck className="size-4" /> ผ่านเกณฑ์ 85 คะแนน · รอ Approver
      </div>
    </article>
  );
}

function PublishingCard({ onOpen }: { onOpen: () => void }) {
  const channels = [
    { label: "Facebook", icon: Share2, time: "14:30", status: "Queued", color: "#376fd0" },
    { label: "X", icon: AtSign, time: "15:00", status: "Review", color: "#172033" },
    { label: "Telegram", icon: MessageCircle, time: "16:15", status: "Scheduled", color: "#2c98d8" },
  ];
  return (
    <article className="rounded-[22px] border border-[#e7e4de] bg-white p-5 shadow-[0_10px_30px_rgba(31,41,58,.05)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#9a9ea7]">Publishing queue</p>
          <h2 className="mt-1 text-base font-extrabold text-[#1b2436]">ส่งวันนี้</h2>
        </div>
        <span className="rounded-full bg-[#fff0f1] px-2.5 py-1 text-[9px] font-bold text-[#d83943]">3 items</span>
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
              <div className={`grid size-11 place-items-center rounded-2xl ${index === 0 ? "bg-[#fff0f1] text-[#dc3e48]" : index === 1 ? "bg-[#eef4ff] text-[#3e6cc2]" : "bg-[#edf9f4] text-[#238465]"}`}><Icon className="size-5" /></div>
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
  const [feedFilter, setFeedFilter] = useState<"All" | FeedCluster["category"]>("All");
  const [unread, setUnread] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState("");

  const current = sectionCopy[active];
  const visibleClusters = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return clusters.filter((item) => {
      const matchesFilter = feedFilter === "All" || item.category === feedFilter;
      const matchesQuery = !normalized || `${item.headline} ${item.summary}`.toLowerCase().includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [feedFilter, query]);

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
        setToast(payload.error?.message || "ซิงก์ RSS ไม่สำเร็จ");
        return;
      }
      setToast(`ซิงก์ RSS แล้ว · ${payload.data?.sources_checked ?? 0} แหล่ง · เพิ่ม ${payload.data?.items_inserted ?? 0} ข่าว`);
    } catch {
      setToast("เชื่อมต่อ RSS API ไม่สำเร็จ");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f0ea] text-[#1c2537]">
      <Sidebar active={active} mobileOpen={mobileOpen} onSelect={navigate} onClose={() => setMobileOpen(false)} />

      <main className="min-h-screen lg:pl-[260px]">
        <header className="sticky top-0 z-30 border-b border-[#e3dfd8]/80 bg-[#f3f0ea]/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1500px] items-center gap-3">
            <button type="button" onClick={() => setMobileOpen(true)} aria-label="เปิดเมนู" className="grid size-10 place-items-center rounded-xl border border-[#ded9d1] bg-white text-[#495160] lg:hidden"><Menu className="size-5" /></button>
            <div className="hidden min-w-0 sm:block">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.12em] text-[#9a9da4]"><span>ARS GunNer</span><ChevronRight className="size-3" /><span className="text-[#555d6b]">{primaryNav.concat(workflowNav).find((item) => item.id === active)?.label ?? "Settings"}</span></div>
            </div>
            <div className="relative ml-auto w-full max-w-[300px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9da1aa]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="ค้นหาข่าว" placeholder="Search stories, sources..." className="h-10 w-full rounded-xl border border-[#dedad3] bg-white/85 pl-9 pr-3 text-xs text-[#263044] outline-none transition focus:border-[#d9666d] focus:ring-4 focus:ring-[#ef4b55]/10" />
            </div>
            <button type="button" onClick={() => { setUnread(false); setToast("อ่านการแจ้งเตือนแล้ว"); }} aria-label="การแจ้งเตือน" className="relative grid size-10 shrink-0 place-items-center rounded-xl border border-[#dedad3] bg-white text-[#667080] hover:text-[#202a3d]">
              <Bell className="size-[18px]" />{unread ? <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-[#ef4b55]" /> : null}
            </button>
            <button type="button" onClick={() => navigate("settings")} aria-label="เปิดโปรไฟล์และการตั้งค่า" className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#1a2840] text-[10px] font-extrabold text-white shadow-sm">ED</button>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          <section className="relative overflow-hidden rounded-[26px] bg-[#16243a] px-5 py-6 text-white shadow-[0_18px_55px_rgba(24,35,55,.14)] sm:px-7 sm:py-7">
            <div className="pointer-events-none absolute -right-16 -top-28 size-72 rounded-full border-[45px] border-white/[.025]" />
            <div className="pointer-events-none absolute bottom-[-90px] right-[20%] size-44 rounded-full bg-[#ef4b55]/10 blur-2xl" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.22em] text-[#ff7b82]"><span className="size-1.5 rounded-full bg-[#ff646d] shadow-[0_0_0_4px_rgba(239,75,85,.12)]" />{current.eyebrow}</div>
                <h1 className="text-2xl font-extrabold tracking-[-.03em] sm:text-[30px]">{current.title}</h1>
                <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-300 sm:text-[13px]">{current.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void syncFeeds()} disabled={syncing} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[.06] px-4 py-2.5 text-[11px] font-bold text-white hover:bg-white/10 disabled:cursor-wait disabled:opacity-70"><RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} />{syncing ? "Syncing..." : "Sync RSS"}</button>
                <button type="button" onClick={() => { navigate("articles"); setToast("เปิด Article Pattern workspace แล้ว"); }} className="inline-flex items-center gap-2 rounded-xl bg-[#ef4b55] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_9px_22px_rgba(239,75,85,.25)] hover:bg-[#df3d48]"><Plus className="size-4" />Create article</button>
              </div>
            </div>
          </section>

          <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {stats.map((item) => <StatCard key={item.label} item={item} />)}
          </div>

          {active === "dashboard" || active === "discovery" ? (
            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,.75fr)]">
              <section className="rounded-[22px] border border-[#e7e4de] bg-white p-4 shadow-[0_10px_30px_rgba(31,41,58,.05)] sm:p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#ef4b55] shadow-[0_0_0_4px_rgba(239,75,85,.1)]" /><h2 className="text-base font-extrabold text-[#1b2436]">Live discovery feed</h2></div>
                    <p className="mt-1 text-[10px] text-[#9a9fa8]">รวมข่าวซ้ำเป็น Event Cluster · แสดงข้อมูลตัวอย่างเท่านั้น</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-xl bg-[#f3f0ea] p-1">
                    {(["All", "Transfer", "Club", "League"] as const).map((filter) => (
                      <button type="button" key={filter} onClick={() => setFeedFilter(filter)} className={`rounded-lg px-2.5 py-1.5 text-[9px] font-bold transition ${feedFilter === filter ? "bg-white text-[#202a3c] shadow-sm" : "text-[#8a909b] hover:text-[#4e5664]"}`}>{filter}</button>
                    ))}
                    <button type="button" onClick={() => setToast("ตัวกรองขั้นสูงจะเชื่อมกับ Favorites ใน Phase ถัดไป")} aria-label="ตัวกรองขั้นสูง" className="grid size-7 place-items-center rounded-lg text-[#89909a] hover:bg-white"><SlidersHorizontal className="size-3.5" /></button>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {visibleClusters.length ? visibleClusters.map((cluster) => <FeedCard key={cluster.id} cluster={cluster} onOpen={() => { navigate("fact-check"); setToast(`เปิด Cluster #${cluster.id} สำหรับตรวจสอบแล้ว`); }} />) : (
                    <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-[#ddd8cf] bg-[#faf8f4] text-center"><div><Search className="mx-auto size-6 text-[#a4a8af]" /><p className="mt-3 text-xs font-bold text-[#535b68]">ไม่พบข่าวตัวอย่าง</p><button type="button" onClick={() => { setQuery(""); setFeedFilter("All"); }} className="mt-2 text-[10px] font-bold text-[#df3d48]">ล้างตัวกรอง</button></div></div>
                  )}
                </div>
                <button type="button" onClick={() => navigate("discovery")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#e8e4dd] py-2.5 text-[11px] font-bold text-[#535b69] hover:bg-[#f8f5ef]">View all 36 clusters <ArrowRight className="size-3.5" /></button>
              </section>
              <aside className="space-y-4">
                <ReadinessCard onReview={() => navigate("articles")} />
                <PublishingCard onOpen={() => navigate("publishing")} />
              </aside>
            </div>
          ) : active === "favorites" || active === "sources" || active === "fact-check" || active === "articles" || active === "publishing" ? (
            <div className="mt-4"><EditorialWorkspace section={active} notify={setToast} /></div>
          ) : (
            <div className="mt-4"><WorkspacePanel section={active} onAction={setToast} /></div>
          )}

          <footer className="mt-6 flex flex-col gap-2 border-t border-[#ddd8d0] pt-4 text-[9px] font-medium text-[#979ba3] sm:flex-row sm:items-center sm:justify-between">
            <p>ARS GunNer v0.5.1 · Cloudflare-ready · Telegram delivery disabled by default</p>
            <p className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#56bc91]" /> Cloudflare-ready architecture</p>
          </footer>
        </div>
      </main>

      <nav aria-label="Mobile navigation" className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 rounded-2xl border border-white/10 bg-[#111d30]/95 p-1.5 shadow-[0_16px_40px_rgba(10,18,31,.3)] backdrop-blur-xl lg:hidden">
        {[primaryNav[0], primaryNav[1], workflowNav[1], workflowNav[2]].map((item) => {
          const Icon = item.icon;
          return <button type="button" key={item.id} onClick={() => navigate(item.id)} className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[8px] font-bold ${active === item.id ? "bg-white/10 text-white" : "text-slate-500"}`}><Icon className={`size-4 ${active === item.id ? "text-[#ff646d]" : ""}`} />{item.label}</button>;
        })}
      </nav>

      <div role="status" aria-live="polite" className={`fixed bottom-24 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-xl bg-[#17243a] px-4 py-3 text-[10px] font-semibold text-white shadow-2xl transition-all lg:bottom-7 ${toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}>
        <Sparkles className="size-4 text-[#ff737b]" />{toast}
      </div>
    </div>
  );
}
