import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
const workerPromise = import(workerUrl.href).then((module) => module.default);

const env = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};

const ctx = {
  waitUntil() {},
  passThroughOnException() {},
};

test("renders development preview metadata", async () => {
  const worker = await workerPromise;
  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    env,
    ctx,
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.match(await response.text(), developmentPreviewMeta);
});

test("renders the ARS GunNer newsroom shell with live discovery disclosure", async () => {
  const worker = await workerPromise;
  const response = await worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    env,
    ctx,
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Newsroom intelligence/i);
  assert.match(html, /Live discovery feed/i);
  assert.match(html, /ข้อมูล RSS จริงจาก D1/i);
  assert.match(html, /Article readiness/i);
});

test("health endpoint returns a structured service response", async () => {
  const worker = await workerPromise;
  const response = await worker.fetch(
    new Request("http://localhost/api/v1/health"),
    env,
    ctx,
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.data.status, "ok");
  assert.equal(payload.data.service, "ARS GunNer API");
  assert.equal(payload.data.version, "0.5.3");
  assert.equal(typeof payload.requestId, "string");
  assert.equal(response.headers.get("x-request-id"), payload.requestId);
});

test("pipeline cleans residue, deduplicates links, and prioritizes an official source", async () => {
  const worker = await workerPromise;
  const response = await worker.fetch(
    new Request("http://localhost/api/v1/pipeline/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sources: [
          {
            source_name: "Official Club",
            source_type: "official",
            reporter: "Club Media",
            published_at: "2026-07-22T09:00:00+07:00",
            url: "https://club.example/update?utm_source=social",
            headline: "Club confirms a staff update",
            article_text: "navigation\n<p>สโมสรยืนยันการเปลี่ยนบทบาททีมงาน</p>\nadvertisement",
            confirmed_facts: ["สโมสรยืนยันการเปลี่ยนบทบาททีมงาน"],
          },
          {
            source_name: "Official Club duplicate",
            source_type: "outlet",
            published_at: "2026-07-22T09:01:00+07:00",
            url: "https://club.example/update",
            headline: "Duplicate",
            article_text: "Duplicate summary",
          },
          {
            source_name: "Independent Wire",
            source_type: "original",
            reporter: "Demo Reporter",
            published_at: "2026-07-22T09:20:00+07:00",
            url: "https://wire.example/report",
            headline: "Independent report",
            article_text: "มีรายงานว่าสโมสรกำลังสำรวจทางเลือกใหม่",
            reported_claims: ["สโมสรสนใจทางเลือกใหม่"],
          },
        ],
      }),
    }),
    env,
    ctx,
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.data.source_count, 2);
  assert.equal(payload.data.duplicate_count, 1);
  assert.equal(payload.data.main_source.source_name, "Official Club");
  assert.equal(payload.data.main_source.clean_text, "สโมสรยืนยันการเปลี่ยนบทบาททีมงาน");
  assert.deepEqual(payload.data.confirmed_facts, ["สโมสรยืนยันการเปลี่ยนบทบาททีมงาน"]);
  assert.deepEqual(payload.data.reported_claims, ["สโมสรสนใจทางเลือกใหม่"]);
});

test("article validator returns the readiness gate as JSON", async () => {
  const worker = await workerPromise;
  const response = await worker.fetch(
    new Request("http://localhost/api/v1/articles/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        article: {
          language: "th",
          pattern: "perspective",
          category: "ฟุตบอล",
          label: "มุมมอง",
          headline: "เมื่อแผนเดิมยังไม่ชัดเจน สโมสรจึงอาจต้องเปิดทางเลือกใหม่",
          paragraphs: ["สถานการณ์ตั้งต้นมีข้อมูลยืนยันบางส่วน", "กระแสเดิมยังถูกพูดถึง", "แม้จะมีกระแสว่าเป็นทางเลือกหลัก แต่หลักฐานยังไม่พอ", "รายละเอียดและข้อจำกัดยังต้องตรวจเพิ่ม", "จากข้อมูลปัจจุบันมีแนวโน้มว่าจะเปิดหลายทางเลือก"],
          closing_question: "สุดท้ายจะจบที่ทางเลือกเดิมหรือแผนใหม่กันแน่",
          signature: "— ตลาดไม่ปิด ข่าวก็ยังไม่จบ",
          hashtags: ["#DemoClub", "#TransferNews", "#Football"],
          main_source: { source_name: "Official Club", reporter: "Club Media", published_at: "2026-07-22T09:00:00+07:00", url: "https://club.example/update" },
          supporting_sources: [{ source_name: "Independent Wire", reporter: "Demo Reporter", published_at: "2026-07-22T09:20:00+07:00", url: "https://wire.example/report" }],
          confirmed_facts: ["สโมสรเผยแพร่ประกาศทางการ"],
          reported_claims: ["มีรายงานว่าสโมสรสนใจทางเลือกใหม่"],
          conflicts: [],
        },
      }),
    }),
    env,
    ctx,
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.data.valid, true);
  assert.equal(payload.data.readiness_score, 100);
  assert.equal(payload.data.status, "ready");
});

test("RSS parser reads RSS 2.0, removes markup, and canonicalizes links", async () => {
  const worker = await workerPromise;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0"><channel><title>Demo Feed</title>
      <item>
        <title>Demo transfer update</title>
        <link>https://news.example/story?utm_source=rss&amp;id=7</link>
        <dc:creator>Demo Reporter</dc:creator>
        <pubDate>Wed, 22 Jul 2026 03:00:00 GMT</pubDate>
        <description><![CDATA[<p>มีรายงานว่ากำลังติดตามสถานการณ์</p><br>advertisement]]></description>
      </item>
    </channel></rss>`;
  const response = await worker.fetch(
    new Request("http://localhost/api/v1/rss/parse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ xml, feed_url: "https://news.example/rss" }),
    }),
    env,
    ctx,
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.data.item_count, 1);
  assert.equal(payload.data.items[0].title, "Demo transfer update");
  assert.equal(payload.data.items[0].url, "https://news.example/story?id=7");
  assert.match(payload.data.items[0].cleanText, /ติดตามสถานการณ์/);
  assert.doesNotMatch(payload.data.items[0].cleanText, /advertisement/i);
});

test("publishing preview creates a bounded Telegram payload", async () => {
  const worker = await workerPromise;
  const response = await worker.fetch(
    new Request("http://localhost/api/v1/publishing/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        article: {
          language: "th",
          pattern: "perspective",
          category: "ฟุตบอล",
          label: "มุมมอง",
          headline: "เมื่อแผนเดิมยังไม่ชัดเจน สโมสรจึงอาจต้องเปิดทางเลือกใหม่",
          paragraphs: [
            "สถานการณ์ตั้งต้นมีข้อมูลยืนยันบางส่วน",
            "กระแสเดิมยังถูกพูดถึง",
            "แม้จะมีกระแสว่าเป็นทางเลือกหลัก แต่หลักฐานยังไม่พอ",
            "รายละเอียดและข้อจำกัดยังต้องตรวจเพิ่ม",
            "จากข้อมูลปัจจุบันมีแนวโน้มว่าจะเปิดหลายทางเลือก",
          ],
          closing_question: "สุดท้ายจะจบที่ทางเลือกเดิมหรือแผนใหม่กันแน่",
          signature: "— ตลาดไม่ปิด ข่าวก็ยังไม่จบ",
          hashtags: ["#DemoClub", "#TransferNews", "#Football"],
          main_source: {
            source_name: "Official Club",
            reporter: "Club Media",
            published_at: "2026-07-22T09:00:00+07:00",
            url: "https://club.example/update",
          },
          supporting_sources: [
            {
              source_name: "Independent Wire",
              reporter: "Demo Reporter",
              published_at: "2026-07-22T09:20:00+07:00",
              url: "https://wire.example/report",
            },
          ],
          confirmed_facts: ["สโมสรเผยแพร่ประกาศทางการ"],
          reported_claims: ["มีรายงานว่าสโมสรสนใจทางเลือกใหม่"],
          conflicts: [],
        },
      }),
    }),
    env,
    ctx,
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload.data.previews.map((preview) => preview.channel), ["telegram"]);
  for (const preview of payload.data.previews) {
    assert.ok(preview.character_count <= preview.character_limit);
    assert.equal(preview.character_count, preview.text.length);
  }
  assert.ok(payload.data.previews.find((preview) => preview.channel === "telegram").character_limit === 4096);
});
