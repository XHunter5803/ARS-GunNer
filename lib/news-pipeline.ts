export type Language = "th" | "en" | "bilingual";
export type SourceType = "official" | "original" | "reporter" | "outlet";

export type NewsSourceInput = {
  source_name: string;
  reporter?: string;
  published_at?: string;
  url: string;
  headline: string;
  article_text: string;
  source_type?: SourceType;
  confirmed_facts?: string[];
  reported_claims?: string[];
};

export type CleanNewsSource = NewsSourceInput & {
  canonical_url: string;
  clean_text: string;
  origin: string;
  source_type: SourceType;
};

export type PerspectiveArticle = {
  language: Language;
  pattern: "perspective";
  category: string;
  label: string;
  headline: string;
  paragraphs: string[];
  closing_question: string;
  signature: string;
  hashtags: string[];
  main_source: {
    source_name: string;
    reporter?: string;
    published_at?: string;
    url: string;
  };
  supporting_sources: Array<{
    source_name: string;
    reporter?: string;
    published_at?: string;
    url: string;
  }>;
  confirmed_facts: string[];
  reported_claims: string[];
  conflicts: string[];
};

const residueLine = /^(source|outlet|headline|content|json|undefined|not found|prompt|navigation|advertisement|subscription|cookie notice|sign in|log in|subscribe|menu)$/i;
const residueInside = /\b(undefined|cookie notice|advertisement|subscription required|prompt residue)\b/i;
const trackingParams = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "ref_src",
]);

function compact(value: string) {
  return value.replace(/\u0000/g, "").replace(/[\t\f\v]+/g, " ").replace(/ {2,}/g, " ").trim();
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

export function cleanArticleText(input: string) {
  const withoutMarkup = decodeEntities(
    input
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  );

  return withoutMarkup
    .split(/\r?\n/)
    .map(compact)
    .filter(Boolean)
    .filter((line) => !residueLine.test(line))
    .filter((line) => !/^(home|news|sport|football|privacy|terms)(\s*[|›»]\s*.*)?$/i.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, 20_000)
    .trim();
}

export function canonicalizeUrl(input: string) {
  const url = new URL(input);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Only HTTP or HTTPS source URLs are allowed");
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  url.pathname = url.pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith("utm_") || trackingParams.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();
  return url.toString();
}

function safeCanonicalUrl(input: string) {
  try {
    return canonicalizeUrl(input);
  } catch {
    return input.trim();
  }
}

function getOrigin(input: string) {
  try {
    return new URL(input).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "unknown";
  }
}

function sourcePriority(type: SourceType) {
  return { official: 0, original: 1, reporter: 2, outlet: 3 }[type];
}

function sourceCompleteness(source: CleanNewsSource) {
  return [source.reporter, source.published_at, source.url, source.clean_text].filter(Boolean).length;
}

export function prepareSources(input: NewsSourceInput[]) {
  const unique = new Map<string, CleanNewsSource>();
  for (const source of input.slice(0, 30)) {
    const canonicalUrl = safeCanonicalUrl(source.url);
    const clean: CleanNewsSource = {
      ...source,
      source_name: compact(source.source_name).slice(0, 160),
      reporter: source.reporter ? compact(source.reporter).slice(0, 160) : undefined,
      headline: compact(source.headline).slice(0, 500),
      article_text: source.article_text.slice(0, 30_000),
      clean_text: cleanArticleText(source.article_text),
      canonical_url: canonicalUrl,
      origin: getOrigin(canonicalUrl),
      source_type: source.source_type ?? (source.reporter ? "reporter" : "outlet"),
      confirmed_facts: (source.confirmed_facts ?? []).map(compact).filter(Boolean).slice(0, 30),
      reported_claims: (source.reported_claims ?? []).map(compact).filter(Boolean).slice(0, 30),
    };
    const key = canonicalUrl.toLowerCase();
    const existing = unique.get(key);
    if (!existing || sourceCompleteness(clean) > sourceCompleteness(existing)) unique.set(key, clean);
  }
  return [...unique.values()];
}

export function selectMainSource(sources: CleanNewsSource[]) {
  return [...sources].sort((a, b) => {
    const rank = sourcePriority(a.source_type) - sourcePriority(b.source_type);
    if (rank !== 0) return rank;
    const detail = sourceCompleteness(b) - sourceCompleteness(a);
    if (detail !== 0) return detail;
    const aDate = a.published_at ? Date.parse(a.published_at) : Number.MAX_SAFE_INTEGER;
    const bDate = b.published_at ? Date.parse(b.published_at) : Number.MAX_SAFE_INTEGER;
    return aDate - bDate;
  })[0] ?? null;
}

function normalizeStatement(value: string) {
  return compact(value).toLocaleLowerCase("en-US");
}

function collectConfirmedFacts(sources: CleanNewsSource[]) {
  const officialFacts = new Map<string, string>();
  const factOrigins = new Map<string, Set<string>>();
  const display = new Map<string, string>();

  for (const source of sources) {
    for (const fact of source.confirmed_facts ?? []) {
      const key = normalizeStatement(fact);
      display.set(key, fact);
      if (source.source_type === "official") officialFacts.set(key, fact);
      const origins = factOrigins.get(key) ?? new Set<string>();
      origins.add(source.origin);
      factOrigins.set(key, origins);
    }
  }

  return [...display.entries()]
    .filter(([key]) => officialFacts.has(key) || (factOrigins.get(key)?.size ?? 0) >= 2)
    .map(([, fact]) => fact);
}

function collectReportedClaims(sources: CleanNewsSource[], confirmedFacts: string[]) {
  const confirmed = new Set(confirmedFacts.map(normalizeStatement));
  const claims = new Map<string, string>();
  for (const source of sources) {
    for (const claim of [...(source.reported_claims ?? []), ...(source.confirmed_facts ?? [])]) {
      const key = normalizeStatement(claim);
      if (!confirmed.has(key)) claims.set(key, claim);
    }
  }
  return [...claims.values()];
}

export function calculateViralScore(sources: CleanNewsSource[]) {
  if (!sources.length) return 0;
  const origins = new Set(sources.map((source) => source.origin)).size;
  const reporters = new Set(sources.map((source) => source.reporter).filter(Boolean)).size;
  const validTimes = sources
    .map((source) => (source.published_at ? Date.parse(source.published_at) : Number.NaN))
    .filter(Number.isFinite);
  const latest = validTimes.length ? Math.max(...validTimes) : Number.NaN;
  const ageHours = Number.isFinite(latest) ? Math.max(0, (Date.now() - latest) / 3_600_000) : 48;
  const recency = Math.max(0, 24 - Math.min(24, ageHours));
  return Math.min(100, Math.round(sources.length * 7 + origins * 8 + reporters * 5 + recency));
}

export function analyzeSources(input: NewsSourceInput[]) {
  const sources = prepareSources(input);
  const mainSource = selectMainSource(sources);
  const confirmedFacts = collectConfirmedFacts(sources);
  const reportedClaims = collectReportedClaims(sources, confirmedFacts);
  const independentOrigins = new Set(sources.map((source) => source.origin)).size;
  const warnings: string[] = [];

  if (!mainSource) warnings.push("ยังไม่มี Main Source");
  if (independentOrigins < 2) warnings.push("ยังไม่มีแหล่งสนับสนุนอิสระ");
  if (!confirmedFacts.length) warnings.push("ยังไม่มีข้อเท็จจริงที่ยืนยันจากแหล่งทางการหรืออย่างน้อยสองต้นทาง");
  if (sources.some((source) => !source.published_at)) warnings.push("บางแหล่งไม่มีวันที่เผยแพร่");

  return {
    source_count: sources.length,
    independent_origin_count: independentOrigins,
    duplicate_count: Math.max(0, input.length - sources.length),
    viral_score: calculateViralScore(sources),
    main_source: mainSource,
    supporting_sources: sources.filter((source) => source !== mainSource),
    confirmed_facts: confirmedFacts,
    reported_claims: reportedClaims,
    conflicts: [] as string[],
    warnings,
    sources,
  };
}

function containsThai(value: string) {
  return /[ก-๙]/.test(value);
}

function containsLatinSentence(value: string) {
  return /\b(?:[A-Za-z]{2,}\s+){5,}[A-Za-z]{2,}\b/.test(value);
}

function allArticleText(article: PerspectiveArticle) {
  return [article.headline, ...article.paragraphs, article.closing_question, article.signature].join("\n");
}

export function validatePerspectiveArticle(article: PerspectiveArticle) {
  const errors: string[] = [];
  const notes: string[] = [];
  const text = allArticleText(article);
  const languageIsValid =
    article.language === "bilingual" ||
    (article.language === "th" && containsThai(text) && !containsLatinSentence(text)) ||
    (article.language === "en" && !containsThai(text));
  const residueFree = !residueInside.test(text) && !article.paragraphs.some((paragraph) => residueLine.test(compact(paragraph)));

  if (!(["th", "en", "bilingual"] as string[]).includes(article.language)) errors.push("language ต้องเป็น th, en หรือ bilingual");
  if (article.pattern !== "perspective") errors.push("pattern ต้องเป็น perspective");
  if (!article.category.trim()) errors.push("category ห้ามว่าง");
  if (article.label !== "มุมมอง") errors.push("label ต้องเป็น มุมมอง");
  if (!article.headline.trim()) errors.push("headline ห้ามว่าง");
  if (article.paragraphs.length < 5 || article.paragraphs.length > 7) errors.push("paragraphs ต้องมี 5–7 ย่อหน้า");
  if (article.paragraphs.some((paragraph) => !paragraph.trim())) errors.push("paragraphs ห้ามมีย่อหน้าว่าง");
  if (!article.closing_question.trim()) errors.push("closing_question ห้ามว่าง");
  if (!article.signature.trim()) errors.push("signature ห้ามว่าง");
  if (article.hashtags.length < 3 || article.hashtags.length > 8) errors.push("hashtags ต้องมี 3–8 รายการ");
  if (!languageIsValid) errors.push("ภาษาในบทความไม่ตรงกับค่าที่เลือก");
  if (!residueFree) errors.push("พบข้อความหลุดหรือข้อความจากหน้าเว็บไซต์");

  let score = 0;
  if (article.main_source?.source_name && article.main_source?.url) score += 20;
  if (article.main_source?.reporter || article.reported_claims.length > 0) score += 10;
  if (article.supporting_sources.some((source) => getOrigin(source.url) !== getOrigin(article.main_source.url))) score += 15;
  if (
    article.main_source?.published_at &&
    article.main_source?.url &&
    article.supporting_sources.every((source) => source.published_at && source.url)
  ) score += 10;
  if (!article.conflicts.length) score += 15;
  if (article.confirmed_facts.length || article.reported_claims.length) score += 15;
  if (languageIsValid && residueFree) score += 15;

  if (score < 70) notes.push("คะแนนต่ำกว่า 70: ห้ามส่งอัตโนมัติและต้องตรวจแหล่งข่าวเพิ่มเติม");
  if (!article.supporting_sources.length) notes.push("ยังไม่มีแหล่งสนับสนุน");
  if (article.conflicts.length) notes.push("รายงานจากแต่ละแหล่งยังให้ข้อมูลไม่ตรงกัน");
  notes.push(...errors);

  return {
    valid: errors.length === 0,
    readiness_score: Math.min(100, score),
    status: score >= 85 ? "ready" : score >= 70 ? "review" : score >= 50 ? "needs_sources" : "blocked",
    errors,
    readiness_notes: [...new Set(notes)],
  };
}

export function isNewsSourceInput(value: unknown): value is NewsSourceInput {
  if (!value || typeof value !== "object") return false;
  const source = value as Partial<NewsSourceInput>;
  return [source.source_name, source.url, source.headline, source.article_text].every(
    (item) => typeof item === "string" && item.trim().length > 0,
  );
}
