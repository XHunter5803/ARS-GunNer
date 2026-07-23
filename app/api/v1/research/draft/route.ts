import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { feedItems, sources } from "../../../../../db/schema";
import { apiError, apiJson, databaseError, readJson } from "../../../../../lib/api-response";
import { generatePerspectiveArticle } from "../../../../../lib/article-generation";
import type { GeneratePerspectiveInput } from "../../../../../lib/article-generation";
import { buildSemanticResearchBrief } from "../../../../../lib/semantic-research";
import type { ResearchCandidate, WorkersAiBinding } from "../../../../../lib/semantic-research";
import type { NewsSourceInput, SourceType } from "../../../../../lib/news-pipeline";

type ResearchRequest = Pick<GeneratePerspectiveInput, "language" | "category" | "signature" | "brand_hashtags"> & {
  keyword: string;
  selected_feed_item_ids?: number[];
};

type RuntimeBindings = {
  AI?: WorkersAiBinding;
  WORKERS_AI_MODEL?: string;
  WORKERS_AI_RERANKER_MODEL?: string;
};

function validSourceType(value: string | null): SourceType {
  return value === "official" || value === "original" || value === "reporter" ? value : "outlet";
}

export async function POST(request: Request) {
  try {
    const input = await readJson<ResearchRequest>(request, 100_000);
    const keyword = input.keyword?.trim() ?? "";
    if (keyword.length < 2 || keyword.length > 240) return apiError(400, "VALIDATION_ERROR", "หัวข้อค้นหาต้องยาว 2–240 ตัวอักษร");
    if (!("th,en,bilingual".split(",") as string[]).includes(input.language)) return apiError(400, "VALIDATION_ERROR", "language ไม่ถูกต้อง");
    if (!input.category?.trim() || !input.signature?.trim()) return apiError(400, "VALIDATION_ERROR", "category และ signature ห้ามว่าง");
    if (!Array.isArray(input.brand_hashtags) || input.brand_hashtags.length < 3 || input.brand_hashtags.length > 8) return apiError(400, "VALIDATION_ERROR", "brand_hashtags ต้องมี 3–8 รายการ");
    const anchorIds = [...new Set(input.selected_feed_item_ids ?? [])];
    if (anchorIds.length !== 1 || !anchorIds.every((id) => Number.isInteger(id) && id > 0)) {
      return apiError(400, "VALIDATION_ERROR", "ต้องเลือกข่าวตั้งต้นจริง 1 รายการจาก News Inbox");
    }

    const { env } = await import("cloudflare:workers") as unknown as { env: RuntimeBindings };
    if (!env.AI) return apiError(503, "AI_BINDING_UNAVAILABLE", "ยังไม่ได้ผูก Workers AI binding ชื่อ AI");

    const db = await getDb();
    const rows = await db
      .select({
        id: feedItems.id,
        headline: feedItems.headline,
        canonicalUrl: feedItems.canonicalUrl,
        reporter: feedItems.reporter,
        language: feedItems.language,
        publishedAt: feedItems.publishedAt,
        cleanText: feedItems.cleanText,
        sourceName: sources.name,
        sourceType: sources.sourceType,
        reliabilityWeight: sources.reliabilityWeight,
      })
      .from(feedItems)
      .leftJoin(sources, eq(feedItems.sourceId, sources.id))
      .orderBy(desc(feedItems.publishedAt), desc(feedItems.createdAt))
      .limit(80);

    const candidates: ResearchCandidate[] = rows
      .map((row) => ({
        id: row.id,
        sourceName: row.sourceName || "Unknown source",
        sourceType: validSourceType(row.sourceType),
        reliabilityWeight: row.reliabilityWeight ?? 50,
        url: row.canonicalUrl,
        headline: row.headline,
        reporter: row.reporter,
        publishedAt: row.publishedAt,
        cleanText: row.cleanText,
        language: row.language,
      }))
      .filter((candidate) => candidate.headline.trim() && candidate.url.trim());

    if (candidates.length < 1) return apiError(422, "INSUFFICIENT_NEWS", "ยังไม่มีข่าวใน D1 กรุณา Sync RSS ก่อนสร้าง Draft");
    if (anchorIds.some((id) => !candidates.some((candidate) => candidate.id === id))) {
      return apiError(404, "SELECTED_NEWS_NOT_FOUND", "ไม่พบข่าวที่เลือกใน D1 กรุณารีเฟรช Dashboard แล้วเลือกใหม่");
    }

    const generationModel = env.WORKERS_AI_MODEL || "@cf/zai-org/glm-4.7-flash";
    const rerankerModel = env.WORKERS_AI_RERANKER_MODEL || "@cf/baai/bge-reranker-base";
    const research = await buildSemanticResearchBrief({ ai: env.AI, generationModel, rerankerModel, keyword, candidates, anchorIds });
    if (research.selected.length < 1) {
      return apiError(422, "INSUFFICIENT_RELATED_SOURCES", "AI ไม่พบข่าวตั้งต้นที่ใช้สร้าง Draft");
    }

    const selectedSources: NewsSourceInput[] = research.selected.map((candidate) => {
      const points = research.brief.main_points.filter((point) => point.source_ids.includes(candidate.id));
      return {
        source_name: candidate.sourceName,
        source_type: candidate.sourceType,
        reporter: candidate.reporter || undefined,
        published_at: candidate.publishedAt || undefined,
        url: candidate.url,
        headline: candidate.headline,
        article_text: candidate.cleanText || candidate.headline,
        confirmed_facts: points.filter((point) => point.evidence_level === "confirmed").map((point) => point.text),
        reported_claims: points.filter((point) => point.evidence_level !== "confirmed").map((point) => point.text),
      };
    });

    const generated = await generatePerspectiveArticle(env.AI, generationModel, {
      language: input.language,
      category: input.category,
      signature: input.signature,
      brand_hashtags: input.brand_hashtags,
      sources: selectedSources,
      research_brief: {
        topic: research.brief.topic,
        overview: research.brief.overview,
        main_points: research.brief.main_points,
        conflicts: research.brief.conflicts,
      },
    });

    return apiJson({
      keyword,
      research: research.brief,
      selected_sources: research.selected.map((candidate) => ({
        id: candidate.id,
        source_name: candidate.sourceName,
        reporter: candidate.reporter,
        published_at: candidate.publishedAt,
        url: candidate.url,
        headline: candidate.headline,
      })),
      article: generated.article,
      validation: generated.validation,
      models: { reranker: rerankerModel, writer: generationModel },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "PAYLOAD_TOO_LARGE") return apiError(413, "PAYLOAD_TOO_LARGE", "ข้อมูลมีขนาดใหญ่เกินกำหนด");
    if (message.includes("RESEARCH_JSON") || message.includes("AI_JSON")) return apiError(502, "AI_INVALID_JSON", "AI ไม่ได้ส่ง Research Brief ในรูปแบบที่ถูกต้อง");
    if (/D1|database|SQL/i.test(message)) return databaseError(error);
    return apiError(500, "RESEARCH_DRAFT_FAILED", "ไม่สามารถรวบรวมข้อมูลและสร้าง Draft ได้ กรุณาลองใหม่");
  }
}
