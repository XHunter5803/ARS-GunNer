import { apiError, apiJson, readJson } from "../../../../../lib/api-response";
import { parseRssXml } from "../../../../../lib/rss-ingestion";
import { isSafePublicHttpsUrl } from "../../../../../lib/security";

export async function POST(request: Request) {
  try {
    const payload = await readJson<{ xml?: string; feed_url?: string }>(request, 1_050_000);
    if (!payload.xml || !payload.feed_url || !isSafePublicHttpsUrl(payload.feed_url)) {
      return apiError(400, "VALIDATION_ERROR", "ต้องระบุ xml และ HTTPS feed_url สาธารณะ");
    }
    const items = parseRssXml(payload.xml, payload.feed_url);
    return apiJson({ item_count: items.length, items: items.slice(0, 10) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "RSS_PARSE_FAILED";
    if (message === "PAYLOAD_TOO_LARGE" || message === "RSS_XML_SIZE_INVALID") {
      return apiError(413, "PAYLOAD_TOO_LARGE", "RSS XML มีขนาดใหญ่เกินกำหนด");
    }
    return apiError(400, "RSS_PARSE_FAILED", "ไม่สามารถอ่าน RSS/Atom XML ได้");
  }
}
