import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { favoriteFilters } from "../../../../db/schema";
import { apiError, apiJson, databaseError, readJson } from "../../../../lib/api-response";

const allowedKinds = new Set(["keyword", "outlet", "reporter"]);

function normalizeValue(kind: string, value: string) {
  const compact = value.trim().replace(/\s{2,}/g, " ");
  return kind === "keyword" ? compact.toLocaleLowerCase("en-US") : compact;
}

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db
      .select()
      .from(favoriteFilters)
      .orderBy(desc(favoriteFilters.isActive), desc(favoriteFilters.updatedAt));
    return apiJson({ favorites: rows });
  } catch (error) {
    return databaseError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await readJson<{ kind?: string; value?: string; label?: string }>(request);
    const kind = payload.kind?.trim() ?? "";
    const rawValue = payload.value?.trim() ?? "";
    const label = payload.label?.trim() || rawValue;
    if (!allowedKinds.has(kind)) return apiError(400, "VALIDATION_ERROR", "kind ต้องเป็น keyword, outlet หรือ reporter");
    if (rawValue.length < 2 || rawValue.length > 180) return apiError(400, "VALIDATION_ERROR", "value ต้องยาว 2–180 ตัวอักษร");
    if (label.length > 180) return apiError(400, "VALIDATION_ERROR", "label ยาวเกินกำหนด");

    const db = await getDb();
    const [favorite] = await db
      .insert(favoriteFilters)
      .values({ kind: kind as "keyword" | "outlet" | "reporter", value: normalizeValue(kind, rawValue), label })
      .returning();
    return apiJson({ favorite }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "PAYLOAD_TOO_LARGE") return apiError(413, "PAYLOAD_TOO_LARGE", "ข้อมูลมีขนาดใหญ่เกินกำหนด");
    if (/unique/i.test(message)) return apiError(409, "DUPLICATE_FAVORITE", "รายการนี้มีอยู่แล้ว");
    if (/JSON/i.test(message)) return apiError(400, "INVALID_JSON", "รูปแบบ JSON ไม่ถูกต้อง");
    return databaseError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = await readJson<{ id?: number; is_active?: boolean }>(request);
    if (!Number.isInteger(payload.id) || typeof payload.is_active !== "boolean") {
      return apiError(400, "VALIDATION_ERROR", "ต้องระบุ id และ is_active");
    }
    const db = await getDb();
    const [favorite] = await db
      .update(favoriteFilters)
      .set({ isActive: payload.is_active, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(favoriteFilters.id, payload.id as number))
      .returning();
    if (!favorite) return apiError(404, "NOT_FOUND", "ไม่พบรายการติดตาม");
    return apiJson({ favorite });
  } catch (error) {
    return databaseError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) return apiError(400, "VALIDATION_ERROR", "id ไม่ถูกต้อง");
    const db = await getDb();
    const [favorite] = await db.delete(favoriteFilters).where(eq(favoriteFilters.id, id)).returning();
    if (!favorite) return apiError(404, "NOT_FOUND", "ไม่พบรายการติดตาม");
    return apiJson({ deleted_id: id });
  } catch (error) {
    return databaseError(error);
  }
}
