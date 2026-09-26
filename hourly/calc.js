// 알바 시급·주휴수당 계산 (2026년 9월 기준). 시간은 모두 '분' 정수로 계산해 10분 단위 오차가 없게 한다.
// 브라우저에서는 /salary/table.js, /salary/calc.js(4대보험·간이세액표 net)를 먼저 불러온다.
const HOURLY = {
  updated: '2026-09-26',
  wage: 10320,          // 2026년 최저임금 시간급 (고용노동부 고시 제2025-47호, 2026.1.1~12.31)
  wage2027: 10700,      // 2027년 최저임금 시간급 (고용노동부 고시 제2026-60호, 2027.1.1 시행)
  weekToMonth: 4.345,   // 한 달 평균 주 수 (365 ÷ 7 ÷ 12)
  juhuMin: 15 * 60,     // 주휴 대상: 1주 소정근로시간 15시간 이상 (근로기준법 제18조제3항)
  weekCap: 40 * 60,     // 법정근로시간 1주 40시간 (제50조제1항) — 주휴 산정 상한
  dayCap: 8 * 60,       // 1일 8시간 (제50조제2항) — 넘는 시간은 연장근로
  plus: 0.5,            // 연장·야간·휴일(8시간 이내) 가산 50%, 휴일 8시간 초과 100% (제56조)
  biz: 0.03, local: 0.1 // 사업소득 원천징수 3% (소득세법 제129조제1항제3호) + 지방소득세 10% = 3.3%
};
const salaryNet = typeof net !== 'undefined' ? net : require('../salary/calc.js').net;
const cut10 = v => Math.floor(Math.round(v * 100) / 1000) * 10; // 10원 미만 절사

// 하루 근무: start·end = 0시부터 분(0~1430), end ≤ start 면 다음 날 종료. brk = 휴게(분).
// 야간(22~06시) 겹침에서 휴게는 야간이 아닌 시간에서 먼저 뺀다고 가정 → night = min(겹침, 실근무)
function dayWork({ start, end, brk = 0 }) {
  if (start === end) return { work: 0, night: 0 };
  const e = end > start ? end : end + 1440, work = Math.max(e - start - brk, 0);
  const ov = (a, b) => Math.max(0, Math.min(e, b) - Math.max(start, a));
  const night = ov(0, 360) + ov(1320, 1800) + ov(2760, 2880);
  return { work, night: Math.min(night, work) };
}

// days: [{start,end,brk}] 한 주 근무일, holiday: 휴일근로(분), five: 5인 이상 사업장, full: 개근
function weekPay({ days, wage = HOURLY.wage, holiday = 0, five = true, full = true }) {
  const d = days.map(dayWork);
  const work = d.reduce((s, x) => s + x.work, 0);
  const reg = d.reduce((s, x) => s + Math.min(x.work, HOURLY.dayCap), 0);   // 하루 8시간까지
  const sched = Math.min(reg, HOURLY.weekCap);                                // 주휴 산정 소정근로시간(40시간 상한)
  const ext = work - sched;                                                   // 일 8시간·주 40시간 초과 = 연장
  const night = d.reduce((s, x) => s + x.night, 0);
  const h8 = Math.min(holiday, HOURLY.dayCap), hOver = holiday - h8;
  const perMin = wage / 60;
  const base = (work + holiday) * perMin;
  const prem = five ? (ext * HOURLY.plus + night * HOURLY.plus + h8 * HOURLY.plus + hOver * 2 * HOURLY.plus) * perMin : 0;
  const juhuOk = sched >= HOURLY.juhuMin && full;
  const juhu = juhuOk ? sched / HOURLY.weekCap * 8 * wage : 0;
  const nDays = d.filter(x => x.work > 0).length;
  const dayNoHol = nDays ? (work * perMin + (five ? (ext + night) * HOURLY.plus * perMin : 0)) / nDays : 0;
  return { work, sched, ext, night, holiday, nDays, base, prem, juhuOk, juhu, day: dayNoHol,
    week: base + prem, weekJ: base + prem + juhu, month: (base + prem + juhu) * HOURLY.weekToMonth };
}

// 기간 계산: 날짜별 기록(days) 또는 총 근무시간(totalMin)을 weeks 주 동안 일한 것으로 본다.
// 주휴는 주 평균 소정근로시간으로 판단(4주 평균 기준과 같은 방식). 총 시간 입력은 하루 단위를 몰라 야간·일 8시간 초과를 알 수 없다.
// ponytail: 주별 연장은 평균으로 나눠 계산, 주마다 편차가 크면 주 단위로 따로 넣어야 정확하다.
function periodPay({ days = null, totalMin = 0, weeks = 1, wage = HOURLY.wage, holiday = 0, five = true, full = true }) {
  const d = days ? days.map(dayWork) : [];
  const work = days ? d.reduce((s, x) => s + x.work, 0) : totalMin;
  const reg = days ? d.reduce((s, x) => s + Math.min(x.work, HOURLY.dayCap), 0) : totalMin;
  const night = d.reduce((s, x) => s + x.night, 0);
  const avgSched = Math.min(reg / weeks, HOURLY.weekCap);                     // 주 평균 소정근로시간
  const ext = Math.max(work - avgSched * weeks, 0);
  const h8 = Math.min(holiday, HOURLY.dayCap * weeks), hOver = holiday - h8;
  const perMin = wage / 60;
  const base = (work + holiday) * perMin;
  const prem = five ? (ext * HOURLY.plus + night * HOURLY.plus + h8 * HOURLY.plus + hOver * 2 * HOURLY.plus) * perMin : 0;
  const juhuOk = avgSched >= HOURLY.juhuMin && full;
  const juhuWeek = juhuOk ? avgSched / HOURLY.weekCap * 8 * wage : 0;
  const nDays = days ? d.filter(x => x.work > 0).length : 0;
  return { work, avgSched, ext, night, holiday, nDays, base, prem, juhuOk, juhuWeek, juhu: juhuWeek * weeks,
    total: base + prem + juhuWeek * weeks, weeks };
}

// 세금: none | biz(3.3%) | ins(4대보험 + 근로소득 간이세액표, 본인 1명)
function deduct(month, mode) {
  const g = Math.round(month);
  if (mode === 'biz') { const income = cut10(g * HOURLY.biz), local = cut10(income * HOURLY.local); return { income, local, total: income + local, net: g - income - local }; }
  if (mode === 'ins') return salaryNet({ gross: g });
  return { total: 0, net: g };
}
const hm = m => (m >= 60 ? Math.floor(m / 60) + '시간' : '') + (m % 60 ? (m >= 60 ? ' ' : '') + m % 60 + '분' : m ? '' : '0시간');

if (typeof module !== 'undefined') module.exports = { HOURLY, dayWork, weekPay, periodPay, deduct, hm };
