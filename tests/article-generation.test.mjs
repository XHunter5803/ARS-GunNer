import assert from "node:assert/strict";
import test from "node:test";
import { generatePerspectiveArticle } from "../lib/article-generation.ts";

const input = {
  language: "th",
  category: "ฟุตบอล",
  signature: "— ตลาดไม่ปิด ข่าวก็ยังไม่จบ",
  brand_hashtags: ["#Football", "#NewsAnalysis", "#TransferTruth"],
  sources: [
    {
      source_name: "Official Club",
      source_type: "official",
      reporter: "Club Media",
      published_at: "2026-07-22T09:00:00+07:00",
      url: "https://club.example/update",
      headline: "Club confirms an update",
      article_text: "สโมสรยืนยันการเปลี่ยนแปลงผ่านประกาศทางการ",
      confirmed_facts: ["สโมสรยืนยันการเปลี่ยนแปลงผ่านประกาศทางการ"],
    },
    {
      source_name: "Independent Wire",
      source_type: "original",
      reporter: "Demo Reporter",
      published_at: "2026-07-22T09:20:00+07:00",
      url: "https://wire.example/report",
      headline: "Independent report",
      article_text: "มีรายงานว่าสโมสรกำลังประเมินทางเลือกเพิ่มเติม",
      reported_claims: ["สโมสรกำลังประเมินทางเลือกเพิ่มเติม"],
    },
  ],
};

const completeDraft = {
  headline: "เมื่อแผนเดิมยังไม่ชัดเจน สโมสรจึงอาจต้องเปิดทางเลือกใหม่",
  paragraphs: [
    "สถานการณ์ตั้งต้นมีข้อมูลยืนยันจากประกาศทางการ",
    "กระแสเดิมยังถูกพูดถึงจากรายงานอีกแหล่งหนึ่ง",
    "แม้จะมีกระแสว่าเป็นทางเลือกหลัก แต่หลักฐานยังไม่เพียงพอ",
    "รายละเอียดและข้อจำกัดยังต้องติดตามจากแหล่งข้อมูลที่ระบุไว้",
    "จากข้อมูลปัจจุบัน สโมสรน่าจะยังประเมินมากกว่าหนึ่งทางเลือก",
  ],
  closing_question: "สุดท้ายจะจบที่ทางเลือกเดิมหรือแผนใหม่กันแน่",
};

test("retries malformed Draft JSON and requires the article schema", async () => {
  let calls = 0;
  const aiInputs = [];
  const ai = {
    async run(_model, request) {
      calls += 1;
      aiInputs.push(request);
      if (calls === 1) return { response: "Draft follows: {not valid JSON" };
      return { response: completeDraft };
    },
  };

  const result = await generatePerspectiveArticle(ai, "@cf/test/writer", input);

  assert.equal(calls, 2);
  assert.equal(aiInputs[0].response_format?.type, "json_schema");
  assert.deepEqual(aiInputs[0].response_format?.json_schema?.required, ["headline", "paragraphs", "closing_question"]);
  assert.equal(result.article.paragraphs.length, 5);
  assert.equal(result.model, "@cf/test/writer");
});

test("extracts one balanced JSON object when the model adds prose", async () => {
  const ai = {
    async run() {
      return { response: `Result follows.\n${JSON.stringify(completeDraft)}\nEnd.` };
    },
  };

  const result = await generatePerspectiveArticle(ai, "@cf/test/writer", input);

  assert.equal(result.article.headline, completeDraft.headline);
  assert.equal(result.article.closing_question, completeDraft.closing_question);
});
