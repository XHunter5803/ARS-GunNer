export type FootballReportInput = {
  headline: string;
  summary?: string | null;
  sourceName?: string | null;
  url?: string | null;
};

const dedicatedFootballSource = /\b(?:football|soccer|premier[\s-]?league|champions[\s-]?league)\b|ฟุตบอล|พรีเมียร์ลีก/i;

const strongFootballSignal =
  /\b(?:association football|soccer|premier[\s-]?league|champions[\s-]?league|europa[\s-]?league|conference[\s-]?league|fa cup|efl|uefa|fifa|serie a|la liga|bundesliga|ligue 1|eredivisie|major league soccer|mls|women'?s super league|wsl|world cup qualifier|football club|afc|fc)\b|ฟุตบอล|พรีเมียร์ลีก|แชมเปียนส์ลีก|ยูฟ่า|ฟีฟ่า|ลาลีกา|บุนเดสลีกา|เซเรียอา|ลีกเอิง|ฟุตบอลหญิง/i;

const footballContext =
  /\b(?:football|transfer|signing|signed|loan move|striker|midfielder|goalkeeper|centre[- ]back|full[- ]back|winger|head coach|manager|kick[- ]off|fixture|penalty|goal|clean sheet|relegation|promotion|title race|squad|club|match)\b|ย้ายทีม|ตลาดซื้อขาย|เซ็นสัญญา|ยืมตัว|กองหน้า|กองกลาง|กองหลัง|ผู้รักษาประตู|ผู้จัดการทีม|เฮดโค้ช|ประตู|จุดโทษ|โปรแกรมการแข่งขัน|ตกชั้น|เลื่อนชั้น|สโมสร/i;

const footballTeams =
  /\b(?:arsenal|aston villa|bournemouth|brentford|brighton|burnley|chelsea|crystal palace|everton|fulham|leeds united|liverpool|manchester city|manchester united|newcastle united|nottingham forest|sunderland|tottenham|spurs|west ham|wolves|barcelona|real madrid|atletico madrid|bayern munich|borussia dortmund|paris saint[- ]germain|psg|inter milan|ac milan|juventus|napoli|roma|celtic|rangers)\b/i;

const nonFootballSport =
  /\b(?:american football|nfl|super bowl|quarterback|touchdown|nba|wnba|basketball|cricket|ashes|wicket|rugby|six nations|formula 1|formula one|f1|motogp|nascar|tennis|wimbledon|atp|wta|golf|pga|boxing|ufc|mma|baseball|mlb|nhl|ice hockey|horse racing|darts|snooker|cycling|athletics|olympic swimming)\b|อเมริกันฟุตบอล|บาสเกตบอล|คริกเก็ต|รักบี้|ฟอร์มูล่าวัน|เทนนิส|กอล์ฟ|มวย|เบสบอล|ฮอกกี้|แข่งม้า|สนุกเกอร์|จักรยาน|ว่ายน้ำ/i;

const promotionalContent =
  /\b(?:betting|bet now|odds boost|casino|poker|free bets?|ticket and hotel packages?|hospitality packages?|buy tickets?|shop now|discount code|voucher code|subscribe now)\b|เดิมพัน|คาสิโน|ราคาต่อรอง|แทงบอล|แพ็กเกจตั๋ว|ซื้อบัตร|โค้ดส่วนลด/i;

export function isFootballReport(input: FootballReportInput) {
  const headline = input.headline.trim();
  if (!headline) return false;

  const articleText = `${headline}\n${input.summary ?? ""}`;
  const sourceText = `${input.sourceName ?? ""}\n${input.url ?? ""}`;

  if (promotionalContent.test(articleText)) return false;
  if (nonFootballSport.test(articleText)) return false;
  if (strongFootballSignal.test(articleText) || footballTeams.test(articleText)) return true;
  if (dedicatedFootballSource.test(sourceText)) return true;

  const contextMatches = articleText.match(new RegExp(footballContext.source, "gi"))?.length ?? 0;
  return contextMatches >= 2;
}
