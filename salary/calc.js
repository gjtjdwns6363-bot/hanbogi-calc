// 월급 실수령액 계산 (2026년 9월 기준). 브라우저에서는 table.js를 먼저 불러온다.
const T = typeof TAX_TABLE !== 'undefined' ? TAX_TABLE : require('./table.js');
const RATE = {
  pension: 0.0475, pMin: 410000, pMax: 6590000, // 국민연금 9.5%의 절반, 기준소득월액 하·상한 (2026.7~2027.6)
  health: 0.03595,                               // 건강보험 7.19%의 절반
  care: 0.9448 / 7.19,                           // 장기요양 = 건강보험료 × (0.9448% ÷ 7.19%)
  employ: 0.009,                                 // 고용보험(실업급여) 근로자 0.9%
};
const floor10 = v => Math.floor(Math.round(v * 100) / 1000) * 10; // 부동소수 오차 제거 후 10원 미만 절사

// 간이세액표 세액 (월급여 w원: 비과세 제외, fam: 공제대상가족 수 1~11)
function tableTax(w, fam) {
  const col = Math.min(fam, 11), k = Math.floor(w / 1000); // 천원 단위
  const at = v => (v[col] || 0) * 10;
  if (k >= 10000) {
    const base = T.t10000[col - 1] * 10, x = w - 10000000;
    if (k === 10000 && x < 1000) return base;
    if (w <= 14000000) return floor10(base + x * 0.98 * 0.35 + 25000);
    if (w <= 28000000) return floor10(base + 1397000 + (w - 14000000) * 0.98 * 0.38);
    if (w <= 30000000) return floor10(base + 6610600 + (w - 28000000) * 0.98 * 0.40);
    if (w <= 45000000) return floor10(base + 7394600 + (w - 30000000) * 0.40);
    if (w <= 87000000) return floor10(base + 13394600 + (w - 45000000) * 0.42);
    return floor10(base + 31034600 + (w - 87000000) * 0.45);
  }
  let row = null;
  for (const r of T.rows) { if (r[0] > k) break; row = r; }
  return row ? at(row) : 0;
}
// 별표2 제3호: 8세 이상 20세 이하 자녀 공제
const childCut = n => n <= 0 ? 0 : n === 1 ? 20830 : 45830 + (n - 2) * 33330;
// 별표2 제4호: 가족 11명 초과
function familyTax(w, fam) {
  if (fam <= 11) return tableTax(w, fam);
  const t11 = tableTax(w, 11), t10 = tableTax(w, 10);
  return Math.max(t11 - (t10 - t11) * (fam - 11), 0);
}

// gross: 월 급여(원, 비과세 포함), nontax: 월 비과세(원), fam: 공제대상가족 수(본인 포함), kids: 8~20세 자녀 수
function net({ gross, nontax = 0, fam = 1, kids = 0 }) {
  const w = Math.max(gross - Math.min(nontax, gross), 0);
  const pBase = Math.min(Math.max(Math.floor(w / 1000) * 1000, RATE.pMin), RATE.pMax);
  const pension = floor10(pBase * RATE.pension);
  const health = floor10(w * RATE.health);
  const care = floor10(health * RATE.care);
  const employ = floor10(w * RATE.employ);
  const income = floor10(Math.max(familyTax(w, fam) - childCut(kids), 0));
  const local = floor10(income * 0.1);
  const total = pension + health + care + employ + income + local;
  return { taxable: w, pension, health, care, employ, income, local, total, net: gross - total };
}
if (typeof module !== 'undefined') module.exports = { net, tableTax, childCut, RATE };
