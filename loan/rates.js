// 정책 주담대 금리표 (조회 2026-09-26: 주택도시기금 nhuf.molit.go.kr, 한국주택금융공사 hf.go.kr 2026-09-01 공시)
// 바뀌면 이 파일만 고친다. 소득 구간은 부부합산 연소득(만원) 상한.
const RATES = {
  updated: '2026-09-26',
  didimdol: {
    name: '내집마련 디딤돌대출', terms: [10, 15, 20, 30], floor: 1.5,
    table: [[2000, [2.85, 2.95, 3.05, 3.10]], [4000, [3.20, 3.30, 3.40, 3.45]], [7000, [3.55, 3.65, 3.75, 3.80]], [8500, [3.90, 4.00, 4.10, 4.15]]],
    incomeCap: { base: 6000, first: 7000, kids2: 7000, newlywed: 8500 },
    limit: { base: 20000, first: 24000, newlywed: 32000, kids2: 32000 },
    priceCap: 50000, priceCapPlus: 60000,
    rateType: [['변동(기본)', 0], ['5년 단위 변동', 0.1], ['10년 고정 후 변동', 0.2], ['순수 고정', 0.3]],
    prefA: [['해당 없음', 0], ['한부모', 0.5], ['장애인', 0.2], ['다문화', 0.2], ['신혼', 0.2], ['생애최초', 0.2], ['1자녀', 0.3], ['2자녀', 0.5], ['3자녀 이상(다자녀)', 0.7]],
    prefB: [['청약저축 5년·60회 이상', 0.3, 'sub'], ['청약저축 10년·120회 이상', 0.4, 'sub'], ['청약저축 15년·180회 이상', 0.5, 'sub'], ['부동산 전자계약', 0.1], ['신청액이 한도의 30% 이하', 0.1]],
    prefCap: 0.5, prefCapMulti: 0.7, local: 0.2,
  },
  newborn: {
    name: '신생아 특례 디딤돌대출', terms: [10, 15, 20, 30], floor: 1.2,
    table: [[2000, [1.80, 1.90, 2.00, 2.05]], [4000, [2.15, 2.25, 2.35, 2.40]], [6000, [2.40, 2.50, 2.60, 2.65]], [8500, [2.65, 2.75, 2.85, 2.90]], [10000, [2.90, 3.00, 3.10, 3.20]], [13000, [3.20, 3.30, 3.40, 3.50]], [15000, [3.50, 3.60, 3.70, 3.80]], [17000, [3.85, 3.95, 4.05, 4.15]], [20000, [4.20, 4.30, 4.40, 4.50]]],
    incomeCap: 13000, incomeCapDual: 20000, limit: 40000, priceCap: 90000,
    pref: [['청약저축 5년·60회 이상', 0.3, 'sub'], ['청약저축 10년·120회 이상', 0.4, 'sub'], ['청약저축 15년·180회 이상', 0.5, 'sub'], ['부동산 전자계약', 0.1], ['대출 후 추가 출산 1명', 0.2, 'birth'], ['대출 후 추가 출산 2명', 0.4, 'birth'], ['출생 2년 지난 미성년 자녀 1명', 0.1, 'older'], ['출생 2년 지난 미성년 자녀 2명', 0.2, 'older'], ['신청액이 한도의 30% 이하', 0.1]],
    prefCap: 0.5, local: 0.2,
  },
  bogeumjari: {
    name: '보금자리론', terms: [10, 15, 20, 30, 40, 50], floor: 0,
    product: [['아낌e (인터넷 신청)', [4.90, 5.00, 5.05, 5.10, 5.15, 5.20]], ['u·t (비대면·대면)', [5.00, 5.10, 5.15, 5.20, 5.25, 5.30]]],
    incomeCap: 7000, limit: 36000, limitMulti: 40000, limitFirst: 42000, priceCap: 60000,
    pref: [['저소득청년 (만 40세 미만, 소득 7천만 이하)', 0.1], ['신혼 (혼인 7년 이내)', 0.3, 'nb'], ['신생아 출산가구', 0.2, 'nb'], ['2자녀', 0.5, 'kid'], ['3자녀 이상', 0.7, 'kid'], ['한부모', 0.7], ['장애인', 0.7], ['다문화', 0.7], ['녹색건축물', 0.1]],
    prefCap: 1.0, regulated: 0.2,
  },
};
function baseRate(p, income, termIdx) {
  for (const [cap, row] of p.table) if (income <= cap) return row[termIdx];
  return null; // 소득 기준 초과
}

// ---------- 대출 한도 규제 (주택구입 목적 주담대, 은행권) ----------
// 출처(모두 금융위원회·국토교통부 공식 발표문, 확인 2026-09-27):
//  - 금융위 「3단계 스트레스 DSR 시행방안」(2025-05-20, 2025-07-01 시행): 혼합·주기형 적용비율, DSR 은행 40%·2금융 50%, 공식 예시
//  - 금융위 「가계부채 관리 강화 방안」(2025-06-27, 06-28 시행): 수도권·규제 유주택 추가구입 LTV 0, 생애최초 70%, 만기 30년
//  - 관계부처 「주택시장 안정화 대책」(2025-10-15, 10-16 시행): 규제지역 확대, 규제지역 LTV 40%, 가격별 한도 6·4·2억, 수도권·규제 ST금리 3.0%
//  - 금융위 「3단계 스트레스 DSR 행정지도 변경시행 예고」(2026-06-18): 지방 주담대 = 산출 ST금리 × 50%, 2026-12-31까지
// 규제지역(조정대상·투기과열) = 서울 25개 구 전역 + 경기 과천·광명·성남(분당·수정·중원)·수원(영통·장안·팔달)·안양동안·의왕·하남·용인수지.
const REG = {
  updated: '2026-09-27',
  dsr: { bank: 40, second: 50 },
  // LTV(%) [지역][주택 수]. dispose = 기존 1주택 6개월 안 처분 조건, own = 처분 안 하는 유주택(추가 구입)
  ltv: {
    reg:   { none: 40, dispose: 40, own: 0, first: 70 },
    metro: { none: 70, dispose: 70, own: 0, first: 70 },
    local: { none: 70, dispose: 70, own: 60, first: 80 },
  },
  // 수도권·규제지역 주택구입 주담대 최대 한도(만원): 시가 15억 이하 6억, 25억 이하 4억, 초과 2억 (정책대출 제외)
  cap: [[150000, 60000], [250000, 40000], [Infinity, 20000]],
  maxTermMetro: 30,
  // 스트레스 금리(%p): 수도권·규제지역 주담대 3.0(하한), 지방 주담대 0.75(하한 1.5 × 50%, 2026-12-31까지)
  stress: { reg: 3.0, metro: 3.0, local: 0.75 },
  // 혼합형·주기형 적용비율(%) — 고정기간(또는 변동주기)/만기 비중 30% 미만 · 30~50% · 50~70%. 70% 이상 미적용, 고정 5년 미만은 100%
  ratio: { mixed: [80, 60, 40], cycle: [40, 30, 20] },
  ratioLocal: { mixed: [60, 40, 20], cycle: [30, 20, 10] }, // 지방은 2단계 비율 유지
};
// 스트레스 가산금리(%p). type: var(변동)·mixed(혼합)·cycle(주기)·fixed(순수고정), fix: 고정기간·변동주기(년), term: 만기(년)
function stressAdd(area, type, fix, term, base = REG.stress[area]) {
  if (type === 'fixed') return 0;
  if (type === 'var' || fix < 5) return base;
  const share = fix / term; if (share >= 0.7) return 0;
  const i = share < 0.3 ? 0 : share < 0.5 ? 1 : 2;
  return Math.round(base * (area === 'local' ? REG.ratioLocal : REG.ratio)[type][i] * 100) / 10000;
}
// 원리금균등 1원당 연 상환액
const annualPer = (ratePct, years) => { const r = ratePct / 1200, n = years * 12; return 12 * (r ? r / (1 - Math.pow(1 + r, -n)) : 1 / n); };
// DSR 한도(만원): (연소득 × DSR − 기존 대출 연 원리금) ÷ (가산 후 금리로 본 1원당 연 상환액)
function dsrMax(income, rate, years, add = 0, existing = 0, dsr = REG.dsr.bank) {
  return Math.max(0, (income * dsr / 100 - existing) / annualPer(rate + add, years));
}
// 최대 대출액(만원) = min(LTV, 수도권·규제 가격별 한도, DSR)
function loanLimit({ income, price, area, owned = 'none', first = false, type = 'var', fix = 0, rate, years, existing = 0, dsr = REG.dsr.bank }) {
  const L = REG.ltv[area], ltv = first && owned === 'none' ? L.first : L[owned];
  const term = area === 'local' ? years : Math.min(years, REG.maxTermMetro);
  const add = stressAdd(area, type, fix, term);
  const byLtv = Math.floor(price * ltv / 100), byCap = area === 'local' ? Infinity : REG.cap.find(([p]) => price <= p)[1];
  const byDsr = Math.floor(dsrMax(income, rate, term, add, existing, dsr));
  const max = Math.min(byLtv, byCap, byDsr);
  return { max, ltv, byLtv, byCap, byDsr, add, term, by: max === byLtv ? 'LTV' : max === byCap ? '가격별 한도' : 'DSR' };
}

// ---------- 은행별 주담대 평균금리 ----------
// 은행연합회 소비자포털 가계대출금리 은행별 비교공시(portal.kfb.or.kr/compare/loan_household_new.php)
// 분할상환방식 주택담보대출(만기 10년 이상), 신규취급액 기준. 2026년 9월 공시 = 2026년 8월 중 신규취급분.
// [은행, 평균금리, 신용 951~1000점 금리, 평균 신용점수(KCB·NICE)]. 이 공시는 고정·변동을 나누지 않는다.
// 2026년 공시일: 9/30, 10/29, 11/25, 12/29 — 공시 뒤 이 표를 바꾼다. (한국산업은행·토스뱅크는 취급 없음)
const BANKS = {
  updated: '2026-10-01', month: '2026년 8월 신규취급',
  src: 'https://portal.kfb.or.kr/compare/loan_household_new.php',
  list: [
    ['BNK부산은행', 4.23, 4.21, 965], ['IBK기업은행', 4.33, 4.31, 943], ['KB국민은행', 4.55, 4.53, 959], ['SC제일은행', 4.57, 4.54, 958],
    ['Sh수협은행', 4.60, 4.51, 940], ['케이뱅크', 4.66, 4.64, 970], ['카카오뱅크', 4.73, 4.73, 968], ['우리은행', 4.80, 4.79, 956],
    ['하나은행', 4.84, 4.83, 949], ['BNK경남은행', 4.92, 4.89, 945], ['광주은행', 4.95, 4.96, 935], ['신한은행', 5.04, 5.01, 953],
    ['iM뱅크', 5.10, 5.09, 933], ['제주은행', 5.12, 5.13, 867], ['전북은행', 5.29, 5.65, 866], ['NH농협은행', 5.45, 5.39, 941],
  ],
};
// 5대 은행(KB·신한·하나·우리·NH) 평균금리 — 롱테일 표 기본 금리
BANKS.big5 = Math.round(['KB국민은행', '신한은행', '하나은행', '우리은행', 'NH농협은행'].reduce((s, b) => s + BANKS.list.find(x => x[0] === b)[1], 0) / 5 * 100) / 100;

// ---------- 중도상환수수료 ----------
// 대출 후 3년이 지나면 받을 수 없고(금융소비자보호법 제20조), 3년 안에는 남은 기간에 비례해 줄어든다(잔존기간 슬라이딩).
// 기본 수수료율 0.65% = 5대 은행 주담대 평균(금융위 2025-01-13 개편, 신규 대출 고정 1.4→0.65·변동 1.2→0.65). 은행마다 다르다.
const PREPAY = { rate: 0.65, years: 3 };
const prepayFee = (amount, month, rate = PREPAY.rate) => Math.round(amount * rate / 100 * Math.max(0, PREPAY.years * 12 - month) / (PREPAY.years * 12));

if (typeof module !== 'undefined') module.exports = { RATES, baseRate, REG, stressAdd, annualPer, dsrMax, loanLimit, BANKS, PREPAY, prepayFee };
