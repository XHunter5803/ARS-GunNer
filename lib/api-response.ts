export function apiJson(data: unknown, init: ResponseInit = {}) {
  const requestId = crypto.randomUUID();
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-request-id", requestId);
  return Response.json({ data, requestId }, { ...init, headers });
}

export function apiError(status: number, code: string, message: string, details?: string[]) {
  const requestId = crypto.randomUUID();
  return Response.json(
    { error: { code, message, details: details ?? [] }, requestId },
    {
      status,
      headers: {
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
        "x-request-id": requestId,
      },
    },
  );
}

export function databaseError(error: unknown) {
  const message = error instanceof Error ? error.message : "Database request failed";
  if (/no such table|D1 binding|database/i.test(message)) {
    return apiError(503, "DATABASE_UNAVAILABLE", "ฐานข้อมูลยังไม่พร้อม กรุณาตรวจ D1 binding และ migration");
  }
  return apiError(500, "INTERNAL_ERROR", "ระบบไม่สามารถดำเนินการได้");
}

export async function readJson<T>(request: Request, maxBytes = 64_000): Promise<T> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > maxBytes) throw new Error("PAYLOAD_TOO_LARGE");
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new Error("PAYLOAD_TOO_LARGE");
  return JSON.parse(text) as T;
}
