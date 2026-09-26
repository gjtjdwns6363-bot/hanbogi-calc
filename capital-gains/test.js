const assert = require('assert'), { calc, fullYears, ltRate } = require('./calc.js');
const base = { sale: 0, buy: 0, cost: 0, acq: '2016-01-01', date: '2026-10-01', reside: 0, kind: 'one', adjBuy: false };
const c = o => calc({ ...base, ...o });
// 국세청 「1세대 1주택 고가주택의 양도소득금액 계산」 사례: 15억 양도, 8억 취득, 필요경비 3천만, 10년 이상 거주
// → 과세 양도차익 1억 3,400만, 장특공 1억 720만(80%), 양도소득금액 2,680만
let r = c({ sale: 15e8, buy: 8e8, cost: 3e7, acq: '2006-05-07', date: '2022-01-03', reside: 15 });
assert.deepStrictEqual([r.gain, r.taxGain, r.rate, r.ltcg, r.income], [6.7e8, 1.34e8, 0.8, 1.072e8, 2.68e7]);
assert.deepStrictEqual([r.base, r.tax, r.local], [2.43e7, 2385000, 238500]); // 2,430만×15%−126만
// 12억 이하 1주택 2년 보유 → 비과세
assert.strictEqual(c({ sale: 12e8, buy: 5e8, acq: '2024-10-01' }).status, 'free');
// 2017.8.3 이후 조정지역 취득인데 거주 1년 → 비과세 안 됨, 표1 적용
r = c({ sale: 10e8, buy: 5e8, acq: '2018-01-01', reside: 1, adjBuy: true });
assert.strictEqual(r.exempt, false); assert.strictEqual(r.rate, 0.16); // 보유 8년 × 2%
// 보유기간: 취득일 같은 날짜가 되면 만 n년
assert.strictEqual(fullYears('2024-03-01', '2026-03-01'), 2); assert.strictEqual(fullYears('2024-03-01', '2026-02-28'), 1);
assert.strictEqual(fullYears('2024-02-29', '2025-02-28'), 0); assert.strictEqual(fullYears('2024-02-29', '2025-03-01'), 1);
// 장특공 표1·표2 (소득세법 제95조②, 2021.1.1. 이후 양도)
assert.strictEqual(ltRate(2, 2, true), 0); assert.strictEqual(ltRate(3, 2, true), 0.2); // 12% + 거주 2년대 8%
assert.strictEqual(+ltRate(5, 4, true).toFixed(2), 0.36); assert.strictEqual(ltRate(20, 20, true), 0.8);
assert.strictEqual(+ltRate(15, 0, false).toFixed(2), 0.3); assert.strictEqual(+ltRate(30, 0, false).toFixed(2), 0.3);
// 단기: 1년 미만 70%, 2년 미만 60% (1주택이라도 2년 미만이면 비과세 불가)
r = c({ sale: 5e8, buy: 4e8, acq: '2026-01-01' }); assert.strictEqual(r.tax, Math.floor((1e8 - 2.5e6) * 0.7));
r = c({ sale: 5e8, buy: 4e8, acq: '2025-01-01' }); assert.strictEqual(r.tax, Math.floor((1e8 - 2.5e6) * 0.6));
// 일반(다주택, 중과 아님) 10년 보유 차익 1억: 장특공 20% → 소득 8,000만, 과표 7,750만 → 24% − 576만 = 1,284만
r = c({ kind: 'multi', sale: 6e8, buy: 5e8 }); assert.deepStrictEqual([r.ltcg, r.base, r.tax, r.local], [2e7, 7.75e7, 12840000, 1284000]);
// 조정 2주택 중과: 장특공 배제, +20%p → 과표 9,750만 × (35%+20%) − 1,544만 = 3,818.5만
r = c({ kind: 'h2', sale: 6e8, buy: 5e8 }); assert.deepStrictEqual([r.ltcg, r.base, r.tax], [0, 9.75e7, 38185000]);
// 3주택 중과 +30%p, 1년 미만이면 70%와 비교해 큰 세액
r = c({ kind: 'h3', sale: 6e8, buy: 5e8, acq: '2026-01-01' }); assert.strictEqual(r.tax, Math.floor(9.75e7 * 0.7)); // 70% 6,825만 > 중과 4,793.5만
// 손실이면 세금 없음
assert.strictEqual(c({ sale: 4e8, buy: 5e8, kind: 'multi' }).status, 'loss');
console.log('ok');
