// 육아휴직 급여 계산 — 고용보험법 제70조·제73조, 시행령 제95조·제95조의3
// 기준: 2025. 1. 1. 개편(사후지급금 폐지, 휴직 중 전액 지급), 2025. 2. 23. 기간 연장(최대 1년 6개월)
// 찾기쉬운 생활법령정보(2026.8.15. 기준)·고용24 제도안내로 2026년 현재 같은 금액임을 확인
const RATES = {
  updated: '2026-09-26',
  floor: 700000,                                   // 모든 구간 하한 월 70만 원
  general: [[3, 1, 2500000], [6, 1, 2000000], [Infinity, 0.8, 1600000]], // [~개월째, 통상임금 비율, 상한]
  single3: 3000000,                                // 한부모 첫 3개월 상한 (4개월째부터는 일반과 같음)
  both: [2500000, 2500000, 3000000, 3500000, 4000000, 4500000], // 6+6 부모 함께 1~6개월째 상한 (통상임금 100%)
};
// in: {wage(월 통상임금), months(내 휴직 개월), mode:'solo'|'both18'|'bothLater'|'single', spouseMonths}
// 6+6 특례는 부모가 공통으로 쓴 기간(짧은 쪽, 최대 6개월)까지만 적용 (시행령 제95조의3 제1항)
function calc(i) {
  const k = i.mode === 'both18' ? Math.min(6, i.months, i.spouseMonths || 0) : 0;
  const rows = [];
  for (let m = 1; m <= i.months; m++) {
    let rate, cap, type = '일반';
    if (m <= k) { rate = 1; cap = RATES.both[m - 1]; type = '6+6'; }
    else {
      [, rate, cap] = RATES.general.find(g => m <= g[0]);
      if (i.mode === 'single' && m <= 3) { cap = RATES.single3; type = '한부모'; }
    }
    const pay = Math.max(Math.min(Math.floor(i.wage * rate), cap), RATES.floor);
    rows.push({ m, rate, cap, pay, type });
  }
  return { rows, special: k, total: rows.reduce((s, r) => s + r.pay, 0) };
}
// 최대 기간: 1년, 부모 각각 3개월 이상 쓰거나 한부모면 1년 6개월 (남녀고용평등법 제19조, 2025.2.23.)
const maxMonths = i => i.mode === 'single' || (i.mode !== 'solo' && i.months >= 3 && (i.spouseMonths || 0) >= 3) ? 18 : 12;

// 육아기 근로시간 단축 급여 — 고용보험법 제73조의2, 시행령 제104조의2 (찾기쉬운 생활법령 2026.8.15. 기준, 2026-09-27 확인)
// 매주 최초 10시간 단축분: 월 통상임금 100%(상한 250만·하한 50만) × 10 ÷ 단축 전 주 소정근로시간
// 나머지 단축분: 월 통상임금 80%(상한 160만·하한 50만) × (단축 전 − 단축 후 − 10) ÷ 단축 전
// 단축 후 근로시간은 주 15~35시간. 대상 자녀: 만 12세 이하 또는 초등학교 6학년 이하(2025. 2. 23.~)
const SHORT = { first: 10, cap1: 2500000, cap2: 1600000, floor: 500000, rate2: 0.8, minAfter: 15, maxAfter: 35 };
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
function shortHours({ wage, before = 40, after }) {
  const cut = Math.max(before - after, 0), h1 = Math.min(cut, SHORT.first), h2 = cut - h1;
  const pay1 = Math.floor(clamp(wage, SHORT.floor, SHORT.cap1) * h1 / before);
  const pay2 = Math.floor(clamp(wage * SHORT.rate2, SHORT.floor, SHORT.cap2) * h2 / before);
  const lost = Math.floor(wage * cut / before);                  // 줄어드는 월급(통상임금 비례)
  return { cut, h1, h2, pay1, pay2, pay: pay1 + pay2, lost, keep: wage - lost };
}
// 배우자 출산휴가 급여 — 남녀고용평등법 제18조의2(20일, 2025. 2. 23.~), 고용보험법 제75조
// 우선지원대상기업 근로자는 20일 전부 고용보험에서 지원, 상한 20일 1,684,210원(고용노동부고시 제2025-124호, 2026. 1. 1. 시행)
// 20일분 통상임금 = 월 통상임금 ÷ 209시간 × 8시간 × 20일 (상한 = 월 220만 기준 계산값과 같다)
const SPOUSE_LEAVE = { days: 20, cap: 1684210 };
function spouseLeave(wage, sme = true) {
  const full = Math.floor(wage * 8 * SPOUSE_LEAVE.days / 209);
  const gov = sme ? Math.min(full, SPOUSE_LEAVE.cap) : 0;
  return { full, gov, employer: full - gov };
}
// 부부 휴직 조합별 총액 (자녀 생후 18개월 안에 부모 모두 쓰는 경우 6+6 특례 반영) — a: 내 통상임금, b: 배우자 통상임금
const COMBOS = [[12, 0], [12, 3], [12, 6], [6, 6], [12, 12], [18, 18]];
function combos(a, b) {
  return COMBOS.map(([m1, m2]) => {
    const mode = m2 ? 'both18' : 'solo', me = calc({ wage: a, months: m1, mode, spouseMonths: m2 }).total;
    const sp = m2 ? calc({ wage: b, months: m2, mode, spouseMonths: m1 }).total : 0;
    return { m1, m2, me, sp, total: me + sp };
  });
}
if (typeof module !== 'undefined') module.exports = { calc, maxMonths, RATES, shortHours, SHORT, spouseLeave, SPOUSE_LEAVE, combos };
