// 전세(임대보증금)대출 + 월 임대료 = 월 부담. 금액은 원 단위. 일반 전세는 rent=0.
// 상환 계산은 ../loan/amort.js 의 schedule()을 그대로 쓴다(브라우저에서는 전역, node에서는 require).
const _sched = typeof require !== 'undefined' ? require('../loan/amort.js').schedule : schedule;
// 대출금 = min(보증금 × 비율, 상품 한도, 보증금). ratio는 %, cap은 원(0이면 한도 없음)
const loanAmount = (deposit, ratioPct, cap) => Math.max(0, Math.min(deposit, Math.round(deposit * ratioPct / 100), cap > 0 ? cap : Infinity));
// i: {deposit, rent, ratio, cap, rate, years, method, grace}
function calc(i) {
  const loan = loanAmount(i.deposit, i.ratio, i.cap), n = Math.round(i.years * 12);
  const s = loan > 0 ? _sched(loan, i.rate, n, i.method, i.grace || 0) : { rows: [], totalInt: 0, firstPay: 0, lastPay: 0, gracePay: 0 };
  const first = s.gracePay || s.firstPay;
  const bullet = i.method === 'bullet';
  return {
    loan, own: i.deposit - loan, rent: i.rent, firstPay: first, lastPay: s.lastPay, totalInt: s.totalInt,
    monthly: i.rent + first, monthlyLater: i.rent + s.firstPay, yearly: (i.rent + first) * 12,
    bullet, balloon: bullet ? loan : 0, grace: i.grace || 0
  };
}
if (typeof module !== 'undefined') module.exports = { loanAmount, calc };
