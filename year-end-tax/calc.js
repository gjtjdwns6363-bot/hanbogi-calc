// 연말정산 환급 예상 (간편형) — 2026년 귀속(2027년 1월 연말정산) 기준
// 근거: 소득세법 [시행 2026.1.1. 법률 제21221호] 제47·50·51조의3·52·55·59·59조의2~4·61조,
//       소득세법 법률 제21548호(2026.4.21.) 부칙 제2조(2026년 자녀세액공제 9세 이상),
//       조세특례제한법 [시행 2026.9.18.] 제95조의2(월세)·제126조의2(신용카드, 2025.12.23. 개정 자녀 한도 가산)
// 세법이 바뀌면 R만 고친다.
const R = {
  updated: '2026-09-26',
  person: 1500000,                                   // 기본공제 1명당
  brackets: [[1.4e7, .06, 0], [5e7, .15, 1.26e6], [8.8e7, .24, 5.76e6], [1.5e8, .35, 1.544e7], [3e8, .38, 1.994e7], [5e8, .40, 2.594e7], [1e9, .42, 3.594e7], [Infinity, .45, 6.594e7]],
  // 4대보험 근로자 부담 추정 (2026년): 국민연금 4.75%(기준소득월액 상한 1~6월 637만·7~12월 659만), 건강 3.595%, 장기요양 = 건강 × 0.9448/7.19, 고용 0.9%
  ins: { pension: .0475, pCap1: 6370000, pCap2: 6590000, health: .03595, care: .9448 / 7.19, employ: .009 },
  card: { minRate: .25, credit: .15, debit: .30, cap: [3e6, 2.5e6], kidAdd: [5e5, 2.5e5], kidMax: 2 }, // [7천 이하, 7천 초과]
  child: n => n <= 0 ? 0 : n === 1 ? 250000 : 550000 + (n - 2) * 400000,
  pensionAcct: { savingCap: 6e6, totalCap: 9e6, lowRate: .15, rate: .12, lowGross: 5.5e7 },
  insurance: { cap: 1e6, rate: .12 },
  medical: { floor: .03, cap: 7e6, rate: .15 },     // ponytail: 본인·65세 이상 등 한도 없는 의료비도 700만 한도로 계산(보수적)
  edu: .15, donation: { rate: .15, hiRate: .30, hi: 1e7 },
  rent: { cap: 1e7, lowRate: .17, rate: .15, lowGross: 5.5e7, maxGross: 8e7 },
  standard: 130000,
};
const fl = v => Math.floor(Math.round(v * 100) / 100); // 부동소수 오차 제거 후 원 미만 버림
function earnedDeduct(g) {
  const d = g <= 5e6 ? g * .7 : g <= 1.5e7 ? 3.5e6 + (g - 5e6) * .4 : g <= 4.5e7 ? 7.5e6 + (g - 1.5e7) * .15 : g <= 1e8 ? 1.2e7 + (g - 4.5e7) * .05 : 1.475e7 + (g - 1e8) * .02;
  return fl(Math.min(d, 2e7, g));
}
const basicTax = t => { const [, r, d] = R.brackets.find(b => t <= b[0]); return fl(Math.max(t * r - d, 0)); };
function earnedCredit(tax, g) {
  const c = tax <= 1.3e6 ? tax * .55 : 715000 + (tax - 1.3e6) * .3;
  const lim = g <= 3.3e7 ? 740000 : g <= 7e7 ? Math.max(740000 - (g - 3.3e7) * 8 / 1000, 660000)
    : g <= 1.2e8 ? Math.max(660000 - (g - 7e7) / 2, 500000) : Math.max(500000 - (g - 1.2e8) / 2, 200000);
  return fl(Math.min(c, lim));
}
function insEstimate(g) {
  const m = g / 12, I = R.ins;
  const pension = fl((Math.min(m, I.pCap1) * 6 + Math.min(m, I.pCap2) * 6) * I.pension);
  const health = fl(g * I.health), care = fl(health * I.care), employ = fl(g * I.employ);
  return { pension, health: health + care + employ };
}
// 신용카드 등 소득공제 (조특법 제126조의2 제2항·제10항): 최저사용금액(총급여 25%)은 신용카드분부터 채운다
function cardDeduct(g, credit, debit, kids) {
  const C = R.card, min = g * C.minRate, hi = g > 7e7 ? 1 : 0;
  const gross = credit * C.credit + debit * C.debit;
  const cut = min <= credit ? min * C.credit : credit * C.credit + Math.min(min - credit, debit) * C.debit;
  const cap = C.cap[hi] + C.kidAdd[hi] * Math.min(kids, C.kidMax);
  const d = Math.max(gross - cut, 0);
  return { used: credit + debit, min: fl(min), before: fl(d), cap, amount: fl(Math.min(d, cap)) };
}
// i: {gross 총급여, paid 기납부 소득세, deps 기본공제 인원(본인 포함), kids 기본공제 자녀·손자녀, kidsCredit 자녀세액공제 대상,
//     credit 신용카드, debit 체크카드·현금영수증, insurance 보장성보험료, medical, edu, donation, rent 월세, saving 연금저축, irp}
function calc(i) {
  const g = i.gross, z = k => i[k] || 0;
  const wd = earnedDeduct(g), income = g - wd;
  const person = R.person * Math.max(z('deps'), 1);
  const ins = insEstimate(g), card = cardDeduct(g, z('credit'), z('debit'), z('kids'));
  const earnedIncomeTaxed = (withHealth) => {
    const base = Math.max(income - person - ins.pension - (withHealth ? ins.health : 0) - card.amount, 0);
    return { base, tax: basicTax(base) };
  };
  const P = R.pensionAcct, acct = Math.min(Math.min(z('saving'), P.savingCap) + z('irp'), P.totalCap);
  const common = { child: R.child(z('kidsCredit')), pensionAcct: fl(acct * (g <= P.lowGross ? P.lowRate : P.rate)) };
  const med = Math.min(Math.max(z('medical') - g * R.medical.floor, 0), R.medical.cap);
  const don = z('donation'), D = R.donation;
  const rentOk = g <= R.rent.maxGross;
  const special = {
    insurance: fl(Math.min(z('insurance'), R.insurance.cap) * R.insurance.rate),
    medical: fl(med * R.medical.rate),
    edu: fl(z('edu') * R.edu),
    donation: fl(Math.min(don, D.hi) * D.rate + Math.max(don - D.hi, 0) * D.hiRate),
    rent: rentOk ? fl(Math.min(z('rent'), R.rent.cap) * (g <= R.rent.lowGross ? R.rent.lowRate : R.rent.rate)) : 0,
  };
  const option = (itemized) => {
    const t = earnedIncomeTaxed(itemized), earned = earnedCredit(t.tax, g);
    const other = itemized ? Object.values(special).reduce((a, b) => a + b, 0) : R.standard;
    const credits = earned + common.child + common.pensionAcct + other;
    return { ...t, earned, other, credits, final: Math.max(t.tax - credits, 0) };
  };
  const A = option(true), B = option(false), best = B.final < A.final ? B : A;
  const final = best.final, local = fl(final * .1), refund = z('paid') - final;
  return { wd, income, person, ins, card, common, special, itemized: A, standard: B, useStandard: best === B, ...best, local, refund, refundLocal: fl(z('paid') * .1) - local, rentOk };
}
if (typeof module !== 'undefined') module.exports = { calc, earnedDeduct, earnedCredit, basicTax, cardDeduct, insEstimate, R };
