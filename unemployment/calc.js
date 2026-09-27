// 실업급여(구직급여) 계산 — 고용보험법 제45조·제46조·제50조 별표1, 시행령 제68조
// 기준: 2026. 1. 1. 이후 이직자 (고용노동부 2025.12.16. 시행령 개정 보도자료, 찾기쉬운 생활법령정보 2026.8.31. 기준)
const RATES = {
  updated: '2026-09-26',
  minWage: 10320,   // 2026년 최저임금 시급 (2026년 적용 최저임금 고시)
  baseCap: 113500,  // 기초일액 상한 (시행령 제68조 제1항)
  dailyCap: 68100,  // 구직급여일액 상한 = 113,500 × 60%
  rate: 0.6,        // 기초일액 × 60%
  floorRate: 0.8,   // 최저기초일액 × 80% = 하한
};
// 소정급여일수 (고용보험법 별표1) — 피보험기간 [1년 미만, 1~3년, 3~5년, 5~10년, 10년 이상]
const DAYS = { under50: [120, 150, 180, 210, 240], over50: [120, 180, 210, 240, 270] };
const DAY = 86400000;
const utc = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
// 산정사유 발생일(이직 다음날) 전 3개월의 총일수 — 퇴직금 계산기와 같은 규칙
function days3m(endMs) {
  const e = new Date(endMs), y = e.getUTCFullYear(), m = e.getUTCMonth() - 3, d = e.getUTCDate();
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const s = d <= last ? Date.UTC(y, m, d) : new Date(Date.UTC(y, m, 1)).getUTCMonth() === 1 ? Date.UTC(y, m + 1, 1) : Date.UTC(y, m, last);
  return (e - s) / DAY;
}
// in: {lastDay(마지막 근무일 YYYY-MM-DD), wage3(3개월 임금총액), over50(50세 이상·장애인), ins(피보험기간 구간 0~4), hours(1일 소정근로시간 1~8)}
function calc(i) {
  const d3 = days3m(utc(i.lastDay) + DAY);
  const avg = i.wage3 / d3;                                       // 1일 평균임금
  const minBase = Math.min(i.hours, 8) * RATES.minWage;           // 최저기초일액
  const floor = Math.floor(minBase * RATES.floorRate);            // 최저구직급여일액(하한)
  const byAvg = Math.floor(Math.min(avg, RATES.baseCap) * RATES.rate);
  const daily = Math.max(byAvg, floor);
  const kind = daily === floor ? 'floor' : avg >= RATES.baseCap ? 'cap' : 'normal';
  const days = (i.over50 ? DAYS.over50 : DAYS.under50)[i.ins];
  return { d3, avg, minBase, floor, byAvg, daily, kind, days, total: daily * days };
}

// 조기재취업수당 — 고용보험법 제64조, 시행령 제84조 (찾기쉬운 생활법령 「조기재취업 수당」, 2026-09-27 확인)
// 실업 신고일부터 14일이 지난 뒤, 소정급여일수를 1/2 이상 남기고 재취업해 12개월 이상 계속 고용(65세 이상 이직자는 6개월)되면
// 남은 일수 × 구직급여일액 × 1/2. 최근 2년 안에 받았거나, 이직 전 사업주에 재고용되면 제외.
function earlyReemp({ daily, days, paid }) {
  const left = days - paid;
  return left * 2 >= days ? { left, ok: true, pay: Math.floor(daily * left / 2) } : { left, ok: false, pay: 0 };
}
// 수급 일정 — 제48조(수급기간: 이직일 다음 날부터 12개월), 제49조(실업 신고일부터 7일 대기기간)
// 구직급여는 달력 날짜로 매일 쳐서 준다. 12개월을 넘는 날수는 받지 못한다.
const ymd = ms => new Date(ms).toISOString().slice(0, 10);
function addMonthsMinus1(ms, n) { const d = new Date(ms); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, d.getUTCDate()) - DAY; }
function schedule({ lastDay, applyDay, days }) {
  const start = utc(applyDay) + 7 * DAY;                  // 대기 7일 뒤 첫 지급 대상일
  const end = start + (days - 1) * DAY;                   // 소정급여일수를 다 받는 날
  const limit = addMonthsMinus1(utc(lastDay) + DAY, 12);  // 수급기간 끝
  const lost = Math.max(0, Math.round((end - limit) / DAY));
  return { waitEnd: ymd(start - DAY), start: ymd(start), end: ymd(Math.min(end, limit)), limit: ymd(limit), lost, earlyFrom: ymd(utc(applyDay) + 14 * DAY) };
}
if (typeof module !== 'undefined') module.exports = { calc, days3m, RATES, DAYS, earlyReemp, schedule };
