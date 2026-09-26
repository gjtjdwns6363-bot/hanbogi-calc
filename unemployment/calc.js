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
if (typeof module !== 'undefined') module.exports = { calc, days3m, RATES, DAYS };
