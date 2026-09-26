// 부동산 중개보수(중개수수료) 상한 계산
// 근거: 공인중개사법 제32조, 같은 법 시행규칙 제20조·[별표 1](주택, 2021.10.19. 신설)·[별표 2](오피스텔),
//       시행규칙 현행 [시행 2026. 8. 28.] 국토교통부령 제1611호 기준으로 확인. 요율이 바뀌면 RATES만 고친다.
const RATES = {
  updated: '2026-09-26',
  // [상한 거래금액(미만), 요율, 한도액(원, 없으면 null)]
  sale: [[5e7, .006, 250000], [2e8, .005, 800000], [9e8, .004, null], [12e8, .005, null], [15e8, .006, null], [Infinity, .007, null]],
  lease: [[5e7, .005, 200000], [1e8, .004, 300000], [6e8, .003, null], [12e8, .004, null], [15e8, .005, null], [Infinity, .006, null]],
  officetel: { sale: .005, lease: .004 }, // 전용 85㎡ 이하 + 전용 부엌·수세식 화장실·목욕시설 (별표 2)
  other: .009,                            // 토지·상가·위 요건 밖 오피스텔: 0.9% 이내 협의 (제20조제4항제2호)
  vat: .1,
};
// 거래금액 (시행규칙 제20조제5항): 월세 있으면 보증금 + 월세×100, 그 합이 5천만 원 미만이면 보증금 + 월세×70
function dealAmount(deal, i) {
  if (deal === 'sale') return i.price;
  if (deal === 'jeonse') return i.deposit;
  const a = i.deposit + i.monthly * 100;
  return a < 5e7 ? i.deposit + i.monthly * 70 : a;
}
// kind: 'house' | 'officetel' | 'other', deal: 'sale' | 'jeonse' | 'wolse', vat: 부가세 포함 표시 여부
const fl = v => Math.floor(Math.round(v * 100) / 100); // 부동소수 오차 제거 후 원 미만 버림
function calc({ kind = 'house', deal = 'sale', price = 0, deposit = 0, monthly = 0, vat = false }) {
  const amount = dealAmount(deal, { price, deposit, monthly }), isSale = deal === 'sale';
  let rate, cap = null;
  if (kind === 'house') [, rate, cap] = (isSale ? RATES.sale : RATES.lease).find(b => amount < b[0]);
  else if (kind === 'officetel') rate = isSale ? RATES.officetel.sale : RATES.officetel.lease;
  else rate = RATES.other;
  const raw = fl(amount * rate), fee = cap == null ? raw : Math.min(raw, cap); // 원 미만 버림
  const vatAmt = vat ? fl(fee * RATES.vat) : 0;
  return { amount, rate, cap, raw, capped: cap != null && raw > cap, fee, vatAmt, total: fee + vatAmt };
}
if (typeof module !== 'undefined') module.exports = { calc, dealAmount, RATES };
