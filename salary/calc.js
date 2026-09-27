// 월급 실수령액 계산 (2026년 9월 기준). 브라우저에서는 table.js를 먼저 불러온다.
const T = typeof TAX_TABLE !== 'undefined' ? TAX_TABLE : require('./table.js');
const RATE = {
  updated: '2026-09-26',
  pension: 0.0475, pMin: 410000, pMax: 6590000, // 국민연금 9.5%의 절반, 기준소득월액 하·상한 (2026.7~2027.6)
  health: 0.03595,                               // 건강보험 7.19%의 절반
  care: 0.9448 / 7.19,                           // 장기요양 = 건강보험료 × (0.9448% ÷ 7.19%)
  employ: 0.009,                                 // 고용보험(실업급여) 근로자 0.9%
  // 사업주만 내는 고용안정·직업능력개발사업 보험료율 — 고용보험 및 산업재해보상보험의 보험료징수 등에 관한 법률 시행령 제12조제1항제1호
  // (법제처 국가법령정보센터, 2025.12.23 시행본, 2026-09-27 확인). 산재보험료는 업종별 요율이라 넣지 않는다.
  stab: { u150: 0.0025, p150: 0.0045, u1000: 0.0065, o1000: 0.0085 },
  // 중소기업 취업자 소득세 감면 — 조세특례제한법 제30조제1항 (2026.9.18 시행본, 2026-09-27 확인):
  // 청년 90%(5년), 60세 이상·장애인·경력단절 근로자 70%(3년), 과세기간별 200만원 한도, 2026.12.31까지 취업한 경우
  sme: { youth: 0.9, other: 0.7, cap: 2000000 },
  // 비과세 한도(월) — 소득세법 제12조제3호러목(식대 20만), 머목2)(6세 이하 자녀 보육수당 자녀 1명당 20만),
  // 소득세법 시행령 제12조제3호(자가운전보조금 20만) (2026.7.1 시행본, 2026-09-27 확인)
  nontaxCap: { meal: 200000, car: 200000, child: 200000 },
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
// sme: 중소기업 취업자 감면율(0·0.9·0.7), smeLeft: 올해 남은 감면 한도(원)
function net({ gross, nontax = 0, fam = 1, kids = 0, sme = 0, smeLeft = RATE.sme.cap }) {
  const w = Math.max(gross - Math.min(nontax, gross), 0);
  const pBase = Math.min(Math.max(Math.floor(w / 1000) * 1000, RATE.pMin), RATE.pMax);
  const pension = floor10(pBase * RATE.pension);
  const health = floor10(w * RATE.health);
  const care = floor10(health * RATE.care);
  const employ = floor10(w * RATE.employ);
  const tax0 = floor10(Math.max(familyTax(w, fam) - childCut(kids), 0));
  const cut = Math.min(Math.floor(tax0 * sme), Math.max(smeLeft, 0));
  const income = floor10(tax0 - cut);
  const local = floor10(income * 0.1);
  const total = pension + health + care + employ + income + local;
  return { taxable: w, pension, health, care, employ, tax0, cut: tax0 - income, income, local, total, net: gross - total };
}
// 1년(12개월) 합계: 감면 200만원 한도가 차면 그 뒤 달은 감면 없이 뗀다
function yearNet(o) {
  let left = RATE.sme.cap, sum = 0, cut = 0, months = 0;
  for (let m = 0; m < 12; m++) { const r = net({ ...o, smeLeft: left }); sum += r.net; cut += r.cut; left -= r.cut; if (r.cut) months++; }
  return { net: sum, cut, months };
}
// 회사(사업주) 부담: 국민연금·건강·장기요양은 근로자와 같고, 고용보험은 실업급여 0.9% + 고용안정·직능 (규모별)
function employer(r, size = 'u150') {
  const employ = floor10(r.taxable * (RATE.employ + RATE.stab[size]));
  const total = r.pension + r.health + r.care + employ;
  return { pension: r.pension, health: r.health, care: r.care, employ, total };
}
// 월 실수령액 target이 되는 세전 월급(원, 10원 단위) 역산
function grossFor(target, o = {}) {
  let lo = 0, hi = 2e9;
  while (hi - lo > 10) { const mid = Math.floor((lo + hi) / 20) * 10; if (net({ ...o, gross: mid }).net >= target) hi = mid; else lo = mid; }
  return hi;
}
if (typeof module !== 'undefined') module.exports = { net, yearNet, employer, grossFor, tableTax, childCut, RATE };
