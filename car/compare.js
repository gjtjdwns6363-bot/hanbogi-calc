// 자동차 할부·운용리스·장기렌트 비교 (예상치). 금액은 원 단위. 브라우저에선 /loan/amort.js를 먼저 불러온다.
// 리스·렌트는 회사마다 잔존가치·수수료·보험 조건이 달라 실제 견적과 다르다. 가정값은 화면에서 바꿀 수 있다.
var _schedule = typeof schedule === 'function' ? schedule : require('../loan/amort.js').schedule;

// 운용리스 잔존가치 기본 가정(차값 대비 %, 계약 기간별). 회사·차종마다 다르다.
var RESIDUAL = { 12: 65, 24: 55, 36: 45, 48: 38, 60: 30, 72: 25 }; // 여신금융협회 공시 주석: 무보증잔존가치 평균 30~50%

// 취득세: 비영업용 승용 7%(경차 4%, 픽업 등 화물 5%), 영업용(렌트) 4%. 경차 최대 75만(비영업용, 2027-12-31), 전기차 최대 140만(2026-12-31) 감면.
// 신차는 부가세를 뺀 공급가액(가격 ÷ 1.1), 중고차는 거래가격이 과세표준. 근거: 지방세법 제12조, 지방세특례제한법 제66·67조.
function acqTax(price, kind, o) {
  o = o || {};
  const base = o.used ? price : price / 1.1;
  const t = Math.floor(base * (o.biz || kind === 'light' ? 0.04 : o.truck ? 0.05 : 0.07) / 10) * 10;
  const cut = kind === 'ev' ? Math.min(t, 1400000) : kind === 'light' && !o.biz ? Math.min(t, 750000) : 0;
  return { tax: t, cut, net: t - cut };
}

// 할부: price 차값, subsidy 보조금, down 선수금, balloon 유예금(만기 일시)
function installment({ price, subsidy = 0, down = 0, rate, months, balloon = 0, kind, used, truck }) {
  const loan = Math.max(price - subsidy - down, 0), s = _schedule(loan, rate, months, 'equalPay', 0, Math.min(balloon, loan));
  const tax = acqTax(price, kind, { used, truck }).net;
  return { loan, pay: s.firstPay, last: s.lastPay, totalInt: s.totalInt, tax, outlay: down + loan + s.totalInt + tax };
}

// 운용리스(biz=false)·장기렌트(biz=true): 취득세를 포함한 취득원가를 회사가 사고, 보증금을 뺀 금액을 잔존가치까지만 나눠 낸다.
// 월 리스료 = 원금 (취득원가 - 보증금), 만기 잔액 (잔존가치 - 보증금)인 원리금균등. 만기에 차를 반납하면 보증금과 잔존가치가 상계된다.
// extra: 렌트료에 포함되는 보험·자동차세·정비비(월). 반납 기준 총비용 = 월 납입 × 개월 수.
function lease({ price, subsidy = 0, kind, months, rate, depositPct = 0, residualPct = RESIDUAL[months] || 40, extra = 0, biz = false, truck }) {
  const cost = price - subsidy + acqTax(price, kind, { biz, truck }).net;
  const deposit = Math.round(price * depositPct / 100), residual = Math.round(price * residualPct / 100);
  const s = _schedule(cost - deposit, rate, months, 'equalPay', 0, residual - deposit);
  const pay = s.firstPay + extra;
  return { cost, deposit, residual, pay, outlay: pay * months };
}

if (typeof module !== 'undefined') module.exports = { RESIDUAL, acqTax, installment, lease };
