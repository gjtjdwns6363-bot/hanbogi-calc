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
// 사업소득 업종별 조정률 (조세특례제한법 시행령 제100조의3, 국세청 「근로·자녀장려금 신청자격」 2026-09-27 확인)
// 종교인소득은 총수입금액 그대로(100%) 총소득에 들어간다.
const BIZ_RATES = [
  [0.2, '도매업'], [0.25, '농·임업 및 어업, 소매업'], [0.3, '광업, 자동차·부품 판매업, 그 밖의 업종'],
  [0.4, '제조업, 음식점업(고급·유흥주점 제외), 부동산매매업'], [0.45, '전기·가스·증기·수도사업, 건설업'],
  [0.55, '고급·유흥주점, 숙박업, 운수업, 하수·폐기물처리, 출판·영상·방송통신업'],
  [0.6, '상품중개업, 컴퓨터·정보서비스업, 보험·연금업, 금융·보험 관련 서비스업'],
  [0.7, '금융업, 예술·스포츠·여가 서비스업, 수리·기타 개인서비스업(인적용역 제외)'],
  [0.75, '부동산 관련 서비스업, 전문·과학·기술서비스업, 사업시설관리·사업지원, 교육, 보건·사회복지'],
  [0.9, '부동산 임대업, 기타 임대업, 인적용역(프리랜서 3.3%), 개인 가사서비스'],
];
// 가구 유형 (조특법 제100조의3, 국세청 안내): 배우자 총급여액등 300만 원 기준
// in: {spouse, spouseIncome(원), kids, parents(70세 이상 부양 직계존속 수)}
function hhType(h) {
  if (h.spouse) return h.spouseIncome >= 300 * MAN ? 'two' : 'one';
  return h.kids > 0 || h.parents > 0 ? 'one' : 'single';
}
// 신청 일정 (국세청 「심사 및 지급」, 2025년 귀속). 해가 바뀌면 고친다.
const SCHEDULE = {
  year: 2025, updated: '2026-09-27',
  regular: { from: '2026-05-01', to: '2026-06-01', pay: '2026-08-27' },   // 정기신청(5월), 9월 말까지 지급 — 2026년은 8월 27일 지급
  late: { to: '2026-12-01', months: 4 },                                    // 기한 후 신청: 95%, 신청일부터 4개월 안에 지급
  half: { first: 0.35 },                                                    // 반기: 상반기분 = 연간산정액의 35%, 하반기에 정산
};
// 반기 신청 상반기분의 연 환산 총급여 (국세청: 상반기 근로소득 ÷ 근무월수 × (근무월수 + 6))
const halfAnnual = (h1, months) => months > 0 ? Math.round(h1 / months * (months + 6)) : 0;
if (typeof module !== 'undefined') module.exports = { calc, eitcRaw, ctcPerChild, hhType, halfAnnual, BIZ_RATES, SCHEDULE, EITC, CTC };
