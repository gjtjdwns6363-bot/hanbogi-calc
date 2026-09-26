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
if (typeof module !== 'undefined') module.exports = { calc, maxMonths, RATES };
