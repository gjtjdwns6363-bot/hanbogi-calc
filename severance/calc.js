// 퇴직금·퇴직소득세 계산 (2026년 9월 기준)
// 퇴직금: 근로자퇴직급여 보장법 제8조, 근로기준법 제2조(평균임금), 고용노동부 퇴직금 계산 안내
// 퇴직소득세: 소득세법 제48조(2023.1.1. 시행 근속연수공제)·제55조 세율, 국세청 퇴직소득세 계산방법
const DAY = 86400000;
const utc = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
// 퇴직일(마지막 근무일 다음날) 이전 3개월 = 3개월 전 같은 날 ~ 퇴직일 전날 (고용노동부 계산기 retire_cal.js와 같은 규칙:
// 같은 날이 없으면 그 달 말일, 단 2월이면 3월 1일부터)
function days3m(end) {
  const e = new Date(utc(end)), y = e.getUTCFullYear(), m = e.getUTCMonth() - 3, d = e.getUTCDate();
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const s = d <= last ? Date.UTC(y, m, d) : new Date(Date.UTC(y, m, 1)).getUTCMonth() === 1 ? Date.UTC(y, m + 1, 1) : Date.UTC(y, m, last);
  return (e - s) / DAY;
}
// 근속연수: 1년 미만 끝수는 1년으로 (소득세법 제48조)
function serviceYears(start, end) {
  const a = new Date(utc(start)), b = new Date(utc(end));
  let y = b.getUTCFullYear() - a.getUTCFullYear();
  if (Date.UTC(a.getUTCFullYear() + y, a.getUTCMonth(), a.getUTCDate()) > b) y--;
  return Date.UTC(a.getUTCFullYear() + y, a.getUTCMonth(), a.getUTCDate()) < +b ? y + 1 : Math.max(y, 1);
}
const addYear = st => { const a = new Date(utc(st)); return Date.UTC(a.getUTCFullYear() + 1, a.getUTCMonth(), a.getUTCDate()); };
function tenureDeduct(n) {
  if (n <= 5) return 1000000 * n;
  if (n <= 10) return 5000000 + 2000000 * (n - 5);
  if (n <= 20) return 15000000 + 2500000 * (n - 10);
  return 40000000 + 3000000 * (n - 20);
}
function convDeduct(x) {
  if (x <= 8e6) return x;
  if (x <= 7e7) return 8e6 + (x - 8e6) * 0.6;
  if (x <= 1e8) return 4.52e7 + (x - 7e7) * 0.55;
  if (x <= 3e8) return 6.17e7 + (x - 1e8) * 0.45;
  return 1.517e8 + (x - 3e8) * 0.35;
}
const BRACKETS = [[1.4e7, .06, 0], [5e7, .15, 1.26e6], [8.8e7, .24, 5.76e6], [1.5e8, .35, 1.544e7], [3e8, .38, 1.994e7], [5e8, .40, 2.594e7], [1e9, .42, 3.594e7], [Infinity, .45, 6.594e7]];
function basicTax(t) { const [, r, d] = BRACKETS.find(b => t <= b[0]); return Math.max(t * r - d, 0); }
function retireTax(pay, years) {
  const td = Math.min(tenureDeduct(years), pay);
  const conv = Math.floor((pay - td) / years * 12);
  const cd = Math.floor(convDeduct(conv));
  const base = conv - cd;
  const convTax = Math.floor(basicTax(base));
  const tax = Math.floor(convTax / 12 * years / 10) * 10; // 10원 미만 절사
  const local = Math.floor(tax / 10 / 10) * 10;
  return { years, td, conv, cd, base, convTax, tax, local };
}
// in: {start, end(퇴직일=마지막 근무일 다음날), wage3(3개월 임금총액), bonus(연간 상여), leave(연차수당)}
function calc(i) {
  const workDays = (utc(i.end) - utc(i.start)) / DAY, d3 = days3m(i.end);
  const daily = Math.ceil((i.wage3 + i.bonus * 3 / 12 + i.leave * 3 / 12) / d3 * 100 - 1e-9) / 100; // 노동부 계산기처럼 전(錢) 단위 올림
  const out = { workDays, d3, daily, eligible: addYear(i.start) <= utc(i.end) }; // 계속근로 1년 이상
  if (!out.eligible) return out;
  out.pay = Math.round(daily * 30 * workDays / 365); // 노동부 계산기: 원 단위 반올림
  out.t = retireTax(out.pay, serviceYears(i.start, i.end));
  out.net = out.pay - out.t.tax - out.t.local;
  return out;
}
if (typeof module !== 'undefined') module.exports = { calc, retireTax, serviceYears, days3m };
