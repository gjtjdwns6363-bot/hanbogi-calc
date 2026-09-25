// 근로·자녀장려금 산정 (조세특례제한법 제100조의5·제100조의29, 시행령 별표 11·11의2, 2025년 귀속 기준)
// 실제 지급액은 산정표 금액이라, 10만원(근로)·50만원(자녀) 구간의 유리한 끝점으로 계산하고 천원 미만을 올린다
// (산정표 역산 결과와 일치: 단독 1,500만원대 889,000원, 맞벌이 4,300만원대 123,000원).
const MAN = 10000;
const EITC = {
  single: { up: 400, flatEnd: 900, cap: 2200, max: 165, down: 1300 },
  one:    { up: 700, flatEnd: 1400, cap: 3200, max: 285, down: 1800 },
  two:    { up: 800, flatEnd: 1700, cap: 4400, max: 330, down: 2700 },
};
const CTC = { one: { flatEnd: 2100, down: 4900 }, two: { flatEnd: 2500, down: 4500 } };
const ceil1000 = v => Math.ceil(Math.round(v) / 1000) * 1000;

function eitcRaw(type, x) { // x: 총급여액등(원) → [금액, 구간]
  const p = EITC[type], a = Math.floor(x / (10 * MAN)) * 10 * MAN;
  if (x >= p.cap * MAN) return [0, 'none'];
  if (x < p.up * MAN) return [ceil1000(Math.min(a + 10 * MAN, p.up * MAN) * p.max / p.up), 'up'];
  if (x < p.flatEnd * MAN) return [p.max * MAN, 'flat'];
  return [ceil1000(p.max * MAN - (a - p.flatEnd * MAN) * p.max / p.down), 'down'];
}
function ctcPerChild(type, x) {
  const p = CTC[type], a = Math.floor(x / (50 * MAN)) * 50 * MAN;
  if (x >= 7000 * MAN) return 0;
  if (x < p.flatEnd * MAN) return 100 * MAN;
  return ceil1000(100 * MAN - (Math.max(a, p.flatEnd * MAN) - p.flatEnd * MAN) * 50 / p.down);
}
// in: {type:'single'|'one'|'two', income, kids, asset:'low'|'mid'|'high', late, childCredit}
function calc(i) {
  const out = { eitc: 0, ctc: 0, notes: [] };
  if (i.asset === 'high') { out.notes.push('가구 재산 합계가 2억 4천만 원 이상이면 받을 수 없어요.'); return out; }
  const rate = (i.asset === 'mid' ? 0.5 : 1) * (i.late ? 0.95 : 1);
  let [e, seg] = eitcRaw(i.type, i.income);
  if (seg === 'none') out.notes.push('근로장려금은 소득 기준(' + EITC[i.type].cap.toLocaleString() + '만 원 미만)을 넘어 해당하지 않아요.');
  e = Math.floor(e * rate);
  if (e > 0 && e < 15000) e = 0;
  else if (seg === 'up' && e < 100000 && e > 0) e = 100000;
  else if (seg === 'down' && e < 30000 && e > 0) e = 30000;
  out.eitc = e;
  if (i.kids > 0 && i.type !== 'single') {
    let c = Math.floor(ctcPerChild(i.type, i.income) * i.kids * rate) - (i.childCredit || 0);
    if (i.income >= 7000 * MAN) out.notes.push('자녀장려금은 부부합산 총소득 7,000만 원 미만만 받을 수 있어요.');
    if (c > 0 && c < 30000) c = 30000;
    out.ctc = Math.max(c, 0);
  }
  return out;
}
if (typeof module !== 'undefined') module.exports = { calc, eitcRaw, ctcPerChild };
