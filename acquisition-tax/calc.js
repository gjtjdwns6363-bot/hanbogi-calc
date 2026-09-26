// 주택 매매(유상거래) 취득세 계산
// 근거: 지방세법 제11조①8호(1~3%)·제13조의2(다주택 중과)·제151조(지방교육세), 농어촌특별세법 제4조·제5조, 지방세특례제한법 제36조의3(생애최초)
const RULES = {
  updated: '2026-09-26',
  heavy: { 2: 0.08, 3: 0.12 },   // 중과세율: 중과기준세율 2%의 200%·400%를 표준세율 4%에 더한 세율 (제13조의2)
  eduHeavy: 0.004,               // 중과 시 지방교육세 (4% − 2%) × 20% (제151조①1호나목)
  ruralBase: 0.02,               // 농특세 과세표준: 표준세율 2% 기준 세액의 10% (농특세법 제5조①6호)
  firstLimit: { normal: 2000000, small: 3000000 }, // 생애최초 감면 한도, 2028-12-31 취득분까지
  firstMax: 1200000000,          // 생애최초 감면 취득가액 상한 12억
};
const floor10 = v => Math.floor(Math.round(v) / 10) * 10; // 10원 미만 절사

// 1주택 세율(소수): 6억 이하 1%, 9억 초과 3%, 그 사이 (가액×2/3억−3)% 를 % 기준 소수점 넷째자리까지 반올림
function baseRate(p) {
  if (p <= 6e8) return 0.01;
  if (p > 9e8) return 0.03;
  return Math.round((p * 2 / 3e8 - 3) * 10000) / 10000 / 100;
}
// 중과 단계: 0(없음)·2(8%)·3(12%). houses = 취득 후 1세대 주택 수(4는 4채 이상)
function heavyLevel(houses, adjusted) {
  if (houses >= 4) return 3;
  if (houses === 3) return adjusted ? 3 : 2;
  if (houses === 2) return adjusted ? 2 : 0;
  return 0;
}
// in: {price(원), big(85㎡ 초과), houses, adjusted(조정대상지역), first(생애최초), small(300만 한도 대상)}
function calc(i) {
  const lv = heavyLevel(i.houses, i.adjusted);
  const rate = lv ? RULES.heavy[lv] : baseRate(i.price);
  const tax = floor10(i.price * rate);
  const firstOk = !!i.first && i.houses === 1 && i.price <= RULES.firstMax;
  const cut = firstOk ? Math.min(tax, RULES.firstLimit[i.small ? 'small' : 'normal']) : 0;
  const acq = tax - cut;
  // 지방교육세: 1~3% 구간은 세율×50%×20% (= 취득세의 10%), 중과는 0.4%. 감면되면 감면 비율만큼 줄어요(제151조①1호다목)
  const eduFull = lv ? i.price * RULES.eduHeavy : i.price * rate * 0.5 * 0.2;
  const edu = floor10(tax ? eduFull * acq / tax : 0);
  // 농특세: 전용 85㎡ 이하(서민주택) 비과세. 초과면 2% 기준 세액의 10%(0.2%), 중과는 (중과세율 − 2%)×10%
  let rural = 0;
  if (i.big) {
    rural = lv ? i.price * (rate - RULES.ruralBase) * 0.1 : i.price * RULES.ruralBase * 0.1;
    rural += cut * 0.2; // 감면세액의 20% (농특세법 제5조①1호)
    rural = floor10(rural);
  }
  return { rate, lv, tax, cut, acq, edu, rural, total: acq + edu + rural, firstOk };
}
if (typeof module !== 'undefined') module.exports = { calc, baseRate, heavyLevel, RULES };
