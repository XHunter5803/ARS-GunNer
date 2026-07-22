import { apiError, apiJson } from "../../../../../lib/api-response";
import { safeEqual } from "../../../../../lib/security";
import { processPublicationQueue } from "../../../../../lib/social-publishing";
import type { PublishingBindings } from "../../../../../lib/social-publishing";

type RuntimeBindings = PublishingBindings & { CRON_SECRET?: string };

export async function POST(request: Request) {
  try {
    const { env } = await import("cloudflare:workers") as unknown as { env: RuntimeBindings };
    const authenticatedEmail = request.headers.get("oai-authenticated-user-email");
    const providedSecret = request.headers.get("x-cron-secret") ?? "";
    const secretAllowed = Boolean(env.CRON_SECRET && providedSecret && safeEqual(providedSecret, env.CRON_SECRET));
    if (!authenticatedEmail && !secretAllowed) return apiError(401, "UNAUTHORIZED", "ต้องยืนยันตัวตนผ่าน Sites หรือส่ง Cron secret ที่ถูกต้อง");
    if (!env.DB) return apiError(503, "DATABASE_UNAVAILABLE", "ไม่พบ D1 binding DB");
    const result = await processPublicationQueue(env);
    return apiJson(result);
  } catch {
    return apiError(500, "DISPATCH_FAILED", "ประมวลผล Publishing Queue ไม่สำเร็จ");
  }
}
