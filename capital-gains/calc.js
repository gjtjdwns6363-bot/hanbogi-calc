// 주택 양도소득세 계산
// 근거: 소득세법 제89조(1세대1주택 비과세)·제95조(장기보유특별공제, 고가주택)·제103조(기본공제)·제104조(세율)·제55조(기본세율),
//       소득세법 시행령 제154조(보유·거주 요건)·제156조(고가주택 12억)·제160조(고가주택 양도차익), 지방세법 제103조의3(지방소득세 10%)
const RULES = {
  updated: '2026-09-26',
  highPrice: 1200000000,  // 고가주택 기준 12억 (실거래 양도가액)
  basicCut: 2500000,      // 양도소득 기본공제 연 250만
  short: [0.7, 0.6],      // 주택 보유 1년 미만 70%, 2년 미만 60%
  heavyAdd: { h2: 0.2, h3: 0.3 }, // 조정대상지역 다주택 중과(2026-05-10 이후 양도분, 한시배제 종료)
};
const BRACKETS = [[1.4e7, .06, 0], [5e7, .15, 1.26e6], [8.8e7, .24, 5.76e6], [1.5e8, .35, 1.544e7], [3e8, .38, 1.994e7], [5e8, .40, 2.594e7], [1e9, .42, 3.594e7], [Infinity, .45, 6.594e7]];
const progTax = (t, add = 0) => { const [, r, d] = BRACKETS.find(b => t <= b[0]); return Math.max(t * (r + add) - d, 0); };
const utc = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
// 보유 연수(만): 취득일 + n년 ≤ 양도일인 최대 n
function fullYears(a, b) {
  const [y1, m1, d1] = a.split('-').map(Number); let n = +b.slice(0, 4) - y1;
  while (n > 0 && Date.UTC(y1 + n, m1 - 1, d1) > utc(b)) n--;
  return Math.max(n, 0);
}
// 장기보유특별공제율. 표2: 1세대1주택 + 보유 중 거주 2년 이상 (거주 2년대 8%는 보유 3년 이상일 때만)
function ltRate(hold, reside, table2) {
  if (hold < 3) return 0;
  if (table2) return Math.min(hold, 10) * 0.04 + (reside >= 3 ? Math.min(reside, 10) * 0.04 : 0.08);
  return Math.min(hold, 15) * 0.02;
}
// in: {sale, buy, cost(원), acq, date('YYYY-MM-DD'), reside(년), kind: one|multi|h2|h3, adjBuy(2017.8.3 이후 조정지역에서 취득)}
function calc(i) {
  const hold = fullYears(i.acq, i.date), reside = Math.min(i.reside || 0, hold);
  const gain = i.sale - i.buy - i.cost, heavy = RULES.heavyAdd[i.kind] || 0;
  const one = i.kind === 'one', exempt = one && hold >= 2 && (!i.adjBuy || reside >= 2);
  const out = { hold, reside, gain, exempt, heavy, table2: false, rate: 0, ltcg: 0, tax: 0, local: 0 };
  if (gain <= 0) return { ...out, status: 'loss' };
  if (exempt && i.sale <= RULES.highPrice) return { ...out, status: 'free' };
  const ratio = exempt ? (i.sale - RULES.highPrice) / i.sale : 1;   // 고가주택: 12억 초과분만 과세
  out.taxGain = Math.floor(gain * ratio);
  out.table2 = exempt && reside >= 2 && hold >= 3;
  out.rate = heavy ? 0 : ltRate(hold, reside, out.table2);          // 중과 대상은 장특공 배제
  out.ltcg = Math.floor(gain * out.rate * ratio);
  out.income = out.taxGain - out.ltcg;
  out.base = Math.max(out.income - RULES.basicCut, 0);
  const shortTax = hold < 1 ? out.base * RULES.short[0] : hold < 2 ? out.base * RULES.short[1] : 0;
  const t = heavy ? Math.max(progTax(out.base, heavy), shortTax) : hold < 2 ? shortTax : progTax(out.base);
  out.tax = Math.floor(t); out.local = Math.floor(out.tax / 10);
  out.status = 'tax';
  return out;
}
if (typeof module !== 'undefined') module.exports = { calc, fullYears, ltRate, progTax, RULES };
