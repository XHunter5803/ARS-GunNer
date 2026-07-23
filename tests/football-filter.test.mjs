import assert from "node:assert/strict";
import test from "node:test";
import { isFootballReport } from "../lib/football-filter.ts";

test("keeps football reports from dedicated and mixed-sport feeds", () => {
  assert.equal(isFootballReport({
    headline: "Arteta gives Saka injury update",
    sourceName: "The Guardian Football",
    url: "https://example.com/football/saka-update",
  }), true);

  assert.equal(isFootballReport({
    headline: "Arsenal agree transfer for new midfielder",
    sourceName: "General Sport",
    url: "https://example.com/sport/arsenal-transfer",
  }), true);

  assert.equal(isFootballReport({
    headline: "พรีเมียร์ลีกยืนยันโปรแกรมการแข่งขันฤดูกาลใหม่",
    sourceName: "ข่าวกีฬา",
    url: "https://example.com/sport/story",
  }), true);
});

test("rejects other sports, American football, gambling, and promotions", () => {
  assert.equal(isFootballReport({
    headline: "England name squad for cricket Test series",
    sourceName: "General Sport",
  }), false);

  assert.equal(isFootballReport({
    headline: "NFL football quarterback prepares for Super Bowl",
    sourceName: "General Sport",
  }), false);

  assert.equal(isFootballReport({
    headline: "Premier League odds boost and free bets",
    sourceName: "Football News",
  }), false);

  assert.equal(isFootballReport({
    headline: "Barcelona ticket and hotel packages available now",
    sourceName: "Football News",
  }), false);
});
