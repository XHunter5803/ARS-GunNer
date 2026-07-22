import type { PerspectiveArticle } from "./news-pipeline";

export type SocialChannel = "telegram";

export type SocialPreview = {
  channel: SocialChannel;
  text: string;
  character_count: number;
  character_limit: number;
  truncated: boolean;
};

export type PublishingBindings = {
  DB: D1Database;
  SOCIAL_PUBLISHING_ENABLED?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
};

export const ACTIVE_SOCIAL_CHANNELS = ["telegram"] as const;

type JobRow = {
  id: number;
  channel: SocialChannel;
  payload_json: string;
  attempt_count: number;
};

type DeliveryResult = {
  ok: boolean;
  status: number;
  externalId: string | null;
  message: string;
};

function hashtags(article: PerspectiveArticle) {
  return article.hashtags.filter((tag) => /^#[\p{L}\p{N}_-]+$/u.test(tag)).join(" ");
}

function truncate(value: string, max: number) {
  if (value.length <= max) return { text: value, truncated: false };
  return { text: `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`, truncated: true };
}

export function createSocialPreviews(article: PerspectiveArticle): SocialPreview[] {
  const tagLine = hashtags(article);
  const telegramRaw = [`${article.label}\n${article.headline}`, ...article.paragraphs.slice(0, 2), article.closing_question, article.signature, tagLine].filter(Boolean).join("\n\n");
  const values: Array<[SocialChannel, string, number]> = [
    ["telegram", telegramRaw, 4_096],
  ];
  return values.map(([channel, raw, limit]) => {
    const result = truncate(raw, limit);
    return { channel, text: result.text, character_count: result.text.length, character_limit: limit, truncated: result.truncated };
  });
}

async function responseResult(response: Response, idPaths: string[][]): Promise<DeliveryResult> {
  const text = (await response.text()).slice(0, 2_000);
  let payload: unknown = null;
  try { payload = JSON.parse(text); } catch { payload = null; }
  const root = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  let externalId: string | null = null;
  for (const path of idPaths) {
    let value: unknown = root;
    for (const segment of path) value = value && typeof value === "object" ? (value as Record<string, unknown>)[segment] : undefined;
    if (typeof value === "string" || typeof value === "number") { externalId = String(value); break; }
  }
  return { ok: response.ok, status: response.status, externalId, message: response.ok ? "Delivered" : `Provider returned HTTP ${response.status}: ${text.slice(0, 500)}` };
}

async function sendTelegram(text: string, env: PublishingBindings) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) throw new Error("TELEGRAM_CONFIG_MISSING");
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: false }), signal: AbortSignal.timeout(15_000) });
  return responseResult(response, [["result", "message_id"]]);
}

async function deliver(text: string, env: PublishingBindings) {
  return sendTelegram(text, env);
}

export async function processPublicationQueue(env: PublishingBindings, limit = 5) {
  if (env.SOCIAL_PUBLISHING_ENABLED !== "true") {
    return { enabled: false, checked: 0, sent: 0, failed: 0, message: "External publishing is disabled" };
  }
  const jobs = await env.DB.prepare("SELECT id, channel, payload_json, attempt_count FROM publication_jobs WHERE status = 'queued' AND channel = 'telegram' AND (scheduled_at IS NULL OR scheduled_at <= CURRENT_TIMESTAMP) ORDER BY scheduled_at ASC, id ASC LIMIT ?")
    .bind(Math.min(Math.max(limit, 1), 10))
    .all<JobRow>();
  const result = { enabled: true, checked: 0, sent: 0, failed: 0, message: "Queue processed" };

  for (const job of jobs.results ?? []) {
    result.checked += 1;
    const claimed = await env.DB.prepare("UPDATE publication_jobs SET status = 'sending', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'queued'").bind(job.id).run();
    if (!claimed.meta.changes) continue;
    const attemptNo = job.attempt_count + 1;
    try {
      const payload = JSON.parse(job.payload_json) as { text?: string };
      if (!payload.text) throw new Error("PUBLISHING_PAYLOAD_INVALID");
      const delivery = await deliver(payload.text, env);
      if (!delivery.ok) throw Object.assign(new Error(delivery.message), { status: delivery.status });
      await env.DB.batch([
        env.DB.prepare("INSERT INTO delivery_attempts (job_id, attempt_no, status, response_code, response_message) VALUES (?, ?, 'sent', ?, ?)").bind(job.id, attemptNo, delivery.status, delivery.message),
        env.DB.prepare("UPDATE publication_jobs SET status = 'sent', external_post_id = ?, attempt_count = ?, last_attempt_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(delivery.externalId, attemptNo, job.id),
      ]);
      result.sent += 1;
    } catch (error) {
      const message = (error instanceof Error ? error.message : "DELIVERY_FAILED").slice(0, 600);
      const status = typeof (error as { status?: unknown })?.status === "number" ? (error as { status: number }).status : null;
      const nextStatus = attemptNo >= 3 ? "failed" : "queued";
      await env.DB.batch([
        env.DB.prepare("INSERT INTO delivery_attempts (job_id, attempt_no, status, response_code, response_message) VALUES (?, ?, 'failed', ?, ?)").bind(job.id, attemptNo, status, message),
        env.DB.prepare("UPDATE publication_jobs SET status = ?, attempt_count = ?, last_attempt_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(nextStatus, attemptNo, job.id),
      ]);
      result.failed += 1;
    }
  }
  return result;
}
