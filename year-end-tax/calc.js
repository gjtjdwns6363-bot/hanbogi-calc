// 연말정산 환급 예상 — 2026년 귀속(2027년 1월 연말정산) 기준
// 근거(법제처 국가법령정보센터 원문 확인 2026-09-27):
//   소득세법 [시행 2026.7.1.] 제47·50·51(추가공제)·52④(주택임차차입금)·55·59·59조의2(자녀·출산입양)·59조의3(연금계좌)·59조의4(보험·의료·교육·기부·표준)·61조,
//   소득세법 법률 제21548호(2026.4.21.) 부칙 제2조(2026년 자녀세액공제 9세 이상),
//   조세특례제한법 [시행 2026.9.18.] 제87조②⑤(주택청약종합저축 40%·연 300만·400만 합산 한도)·제92조(혼인 50만, 2026.12.31.까지 혼인신고)·
//   제95조의2(월세)·제126조의2(신용카드 등: 전통시장·대중교통 40%, 문화체육 30%(총급여 7천 이하), 자녀 한도 가산, ⑪ 추가 한도)
// 세법이 바뀌면 R만 고친다.
const R = {
  updated: '2026-09-27',
  person: 1500000,                                   // 기본공제 1명당
  extra: { senior: 1e6, disabled: 2e6, woman: 5e5, single: 1e6, womanIncome: 3e7 }, // 제51조 추가공제
  brackets: [[1.4e7, .06, 0], [5e7, .15, 1.26e6], [8.8e7, .24, 5.76e6], [1.5e8, .35, 1.544e7], [3e8, .38, 1.994e7], [5e8, .40, 2.594e7], [1e9, .42, 3.594e7], [Infinity, .45, 6.594e7]],
  // 4대보험 근로자 부담 추정 (2026년): 국민연금 4.75%(기준소득월액 상한 1~6월 637만·7~12월 659만), 건강 3.595%, 장기요양 = 건강 × 0.9448/7.19, 고용 0.9%
  ins: { pension: .0475, pCap1: 6370000, pCap2: 6590000, health: .03595, care: .9448 / 7.19, employ: .009 },
  // 조특법 제126조의2: [7천 이하, 7천 초과]. extraCap = ⑪ 전통시장·대중교통(·문화체육) 추가 한도
  card: { minRate: .25, credit: .15, debit: .30, market: .40, transit: .40, culture: .30, cap: [3e6, 2.5e6], kidAdd: [5e5, 2.5e5], kidMax: 2, extraCap: [3e6, 2e6], lowGross: 7e7 },
  child: n => n <= 0 ? 0 : n === 1 ? 250000 : 550000 + (n - 2) * 400000,
  birth: [0, 300000, 500000, 700000],                // 제59조의2③ 출산·입양 첫째·둘째·셋째 이상
  marriage: 500000,                                  // 조특법 제92조
  pensionAcct: { savingCap: 6e6, totalCap: 9e6, lowRate: .15, rate: .12, lowGross: 5.5e7 },
  insurance: { cap: 1e6, rate: .12 },
  medical: { floor: .03, cap: 7e6, rate: .15, preemie: .20, ivf: .30 },
  edu: { rate: .15, school: 3e6, uni: 9e6 },         // 1명당 한도: 미취학·초중고 300만, 대학 900만, 본인 한도 없음
  donation: { rate: .15, hiRate: .30, hi: 1e7 },
  rent: { cap: 1e7, lowRate: .17, rate: .15, lowGross: 5.5e7, maxGross: 8e7 },
  housing: { saveCap: 3e6, saveRate: .40, saveMaxGross: 7e7, leaseRate: .40, cap: 4e6 },
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
// 신용카드 등 소득공제 (조특법 제126조의2 ②·⑩·⑪)
// u: {credit 신용카드, debit 체크·현금영수증, market 전통시장, transit 대중교통, culture 도서·신문·공연·박물관·미술관·영화·체육시설}
// 최저사용금액(총급여 25%)은 신용카드분 → 체크·현금(+문화체육, 7천 이하) → 전통시장·대중교통 순으로 채운다(제2항제6호).
// 총급여 7천 초과면 문화체육 30%가 없어 결제수단 공제율을 받는다 → 보수적으로 신용카드분(15%)에 넣는다.
function cardDeduct(g, u, kids = 0) {
  const C = R.card, lo = g <= C.lowGross, hi = lo ? 0 : 1, z = k => u[k] || 0;
  const credit = z('credit') + (lo ? 0 : z('culture')), debit = z('debit'), cult = lo ? z('culture') : 0;
  const mk = z('market') * C.market, tr = z('transit') * C.transit, cu = cult * C.culture;
  const gross = credit * C.credit + debit * C.debit + mk + tr + cu;
  const min = g * C.minRate, mid = debit + cult;
  const cut = min <= credit ? min * C.credit
    : min <= credit + mid ? credit * C.credit + (min - credit) * C.debit
    : credit * C.credit + mid * C.debit + (min - credit - mid) * C.market;
  const cap = C.cap[hi] + C.kidAdd[hi] * Math.min(kids, C.kidMax);
  const d = Math.max(gross - cut, 0);
  const add = d > cap ? Math.min(d - cap, mk + tr + cu, C.extraCap[hi]) : 0; // ⑪ 한도 초과분 중 전통시장·대중교통(·문화체육) 몫
  const used = credit + debit + cult + z('market') + z('transit');
  return { used, min: fl(min), before: fl(d), cap, add: fl(add), extraCap: C.extraCap[hi], amount: fl(Math.min(d, cap) + add) };
}
// 의료비 세액공제 (제59조의4②): 총급여 3%는 일반 → 본인·6세 이하·65세 이상·장애인 → 미숙아·선천성이상아 → 난임 순으로 뺀다
function medicalCredit(g, { general = 0, special = 0, preemie = 0, ivf = 0 }) {
  const M = R.medical; let short = g * M.floor;
  const take = v => { const t = Math.max(v - short, 0); short = Math.max(short - v, 0); return t; };
  const n1 = Math.min(take(general), M.cap), n2 = take(special), n3 = take(preemie), n4 = take(ivf);
  return { base: n1 + n2 + n3 + n4, credit: fl((n1 + n2) * M.rate + n3 * M.preemie + n4 * M.ivf) };
}
// 교육비 (제59조의4③): 본인 한도 없음, 미취학·초중고 1명당 300만, 대학생 1명당 900만
function eduBase(i) {
  const z = k => i[k] || 0, E = R.edu;
  return z('eduSelf') + z('edu') + Math.min(z('eduSchool'), Math.max(z('eduSchoolN'), 1) * E.school) + Math.min(z('eduUni'), Math.max(z('eduUniN'), 1) * E.uni);
}
// i: {gross 총급여, paid 기납부 소득세, deps 기본공제 인원(본인 포함), kids 기본공제 자녀·손자녀, kidsCredit 자녀세액공제 대상, birth 올해 출산·입양 순위(1·2·3),
//     senior 70세 이상, disabled 장애인, woman 부녀자, single 한부모, marriage 올해 혼인신고(2024~2026),
//     credit·debit·market·transit·culture 카드, insurance 보장성보험료, medical(일반)·medSpecial·medPreemie·medIvf,
//     eduSelf·eduSchool·eduSchoolN·eduUni·eduUniN, donation, rent 월세, saving 연금저축, irp, housingSave 주택청약종합저축, leaseLoan 주택임차차입금 원리금}
function calc(i) {
  const g = i.gross, z = k => i[k] || 0, X = R.extra;
  const wd = earnedDeduct(g), income = g - wd;
  const addl = z('senior') * X.senior + z('disabled') * X.disabled + (i.single ? X.single : i.woman && income <= X.womanIncome ? X.woman : 0);
  const person = R.person * Math.max(z('deps'), 1) + addl;
  const ins = insEstimate(g), card = cardDeduct(g, i, z('kids'));
  const H = R.housing, save = g <= H.saveMaxGross ? fl(Math.min(z('housingSave'), H.saveCap) * H.saveRate) : 0;
  const housing = withSpecial => { const lease = withSpecial ? fl(z('leaseLoan') * H.leaseRate) : 0; const t = Math.min(save + lease, H.cap); return { save: Math.min(save, t), lease: t - Math.min(save, t), total: t }; };
  const taxed = withSpecial => { // 표준세액공제를 고르면 특별소득공제(건강·고용보험료, 주택임차차입금)를 못 받는다
    const h = housing(withSpecial);
    const base = Math.max(income - person - ins.pension - (withSpecial ? ins.health : 0) - h.total - card.amount, 0);
    return { base, tax: basicTax(base), housing: h };
  };
  const P = R.pensionAcct, acct = Math.min(Math.min(z('saving'), P.savingCap) + z('irp'), P.totalCap);
  const common = { child: R.child(z('kidsCredit')), birth: R.birth[Math.min(z('birth'), 3)] || 0, marriage: i.marriage ? R.marriage : 0,
    pensionAcct: fl(acct * (g <= P.lowGross ? P.lowRate : P.rate)), acctBase: acct };
  const med = medicalCredit(g, { general: z('medical'), special: z('medSpecial'), preemie: z('medPreemie'), ivf: z('medIvf') });
  const don = z('donation'), D = R.donation;
  const rentOk = g <= R.rent.maxGross;
  const special = {
    insurance: fl(Math.min(z('insurance'), R.insurance.cap) * R.insurance.rate),
    medical: med.credit,
    edu: fl(eduBase(i) * R.edu.rate),
    donation: fl(Math.min(don, D.hi) * D.rate + Math.max(don - D.hi, 0) * D.hiRate),
    rent: rentOk ? fl(Math.min(z('rent'), R.rent.cap) * (g <= R.rent.lowGross ? R.rent.lowRate : R.rent.rate)) : 0,
  };
  const commonSum = common.child + common.birth + common.marriage + common.pensionAcct;
  const option = itemized => {
    const t = taxed(itemized), earned = earnedCredit(t.tax, g);
    const other = itemized ? Object.values(special).reduce((a, b) => a + b, 0) : R.standard;
    const credits = earned + commonSum + other;
    return { ...t, earned, other, credits, final: Math.max(t.tax - credits, 0) };
  };
  const A = option(true), B = option(false), best = B.final < A.final ? B : A;
  const final = best.final, local = fl(final * .1), refund = z('paid') - final;
  return { wd, income, person, addl, ins, card, common, special, itemized: A, standard: B, useStandard: best === B, ...best, local, refund, refundLocal: fl(z('paid') * .1) - local, rentOk, saveOk: g <= H.saveMaxGross };
}
// 더 받을 수 있는 여지 (결정세액이 남아 있을 때만 의미 있음)
function tips(i, r) {
  const out = [], P = R.pensionAcct, g = i.gross;
  if (r.final <= 0) return out;
  const room = P.totalCap - r.common.acctBase, rate = g <= P.lowGross ? P.lowRate : P.rate;
  if (room > 0) out.push({ k: 'pension', room, gain: Math.min(fl(room * rate), r.final) });
  const H = R.housing, left = H.saveCap - Math.min(i.housingSave || 0, H.saveCap);
  if (g <= H.saveMaxGross && left > 0) out.push({ k: 'housing', room: left });
  const c = r.card; if (c.used >= c.min && c.before < c.cap) out.push({ k: 'card', room: Math.ceil((c.cap - c.before) / R.card.debit / 1e4) * 1e4 });
  if (c.used < c.min) out.push({ k: 'cardMin', room: c.min - c.used });
  return out;
}
// 맞벌이: 자녀 묶음과 부모 묶음을 각각 누구에게 넣을지 4가지를 계산해 부부 합계 결정세액이 가장 적은 쪽을 고른다.
// a, b: 각자 calc 입력(본인 몫 카드·보험 등). kids: {n, credit, birth, medical, edu, eduN}, parents: {n, senior, medical}
// 부양가족의 의료비·교육비는 그 사람을 기본공제 받는 쪽만 공제할 수 있다(소득세법 제59조의4②③ '기본공제대상자를 위하여').
function couple(a, b, kids, parents) {
  const add = (p, withK, withP) => ({ ...p,
    deps: 1 + (withK ? kids.n : 0) + (withP ? parents.n : 0),
    kids: withK ? kids.n : 0, kidsCredit: withK ? kids.credit : 0, birth: withK ? kids.birth : 0,
    senior: withP ? parents.senior : 0,
    medical: (p.medical || 0) + (withK ? kids.medical || 0 : 0) + (withP ? parents.medical || 0 : 0),
    eduSchool: withK ? kids.edu || 0 : 0, eduSchoolN: withK ? kids.eduN || kids.n : 0 });
  const opts = [];
  for (const kA of [true, false]) for (const pA of [true, false]) {
    if (!kids.n && !kA) continue; if (!parents.n && !pA) continue;
    const ra = calc(add(a, kA, pA)), rb = calc(add(b, !kA, !pA));
    opts.push({ kidsTo: kids.n ? (kA ? 'a' : 'b') : '', parentsTo: parents.n ? (pA ? 'a' : 'b') : '', a: ra.final, b: rb.final, total: ra.final + rb.final });
  }
  return opts.sort((x, y) => x.total - y.total);
}
if (typeof module !== 'undefined') module.exports = { calc, earnedDeduct, earnedCredit, basicTax, cardDeduct, medicalCredit, insEstimate, tips, couple, R };
