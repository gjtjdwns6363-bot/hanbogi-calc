// node eitc/test.js — 근로·자녀장려금 계산 확인 (국세청 안내·시행령 별표 11·11의2 대조)
const assert = require('assert'), { calc, eitcRaw, ctcPerChild, hhType, halfAnnual, BIZ_RATES, EITC } = require('./calc.js');
const M = 1e4, e = (type, man, o = {}) => calc({ type, income: man * M, kids: 0, asset: 'low', ...o });
// UPDATE.md 기준값: 단독 1,500만 = 889,000원, 맞벌이 4,300만 = 123,000원
assert.strictEqual(e('single', 1500).eitc, 889000);
assert.strictEqual(e('two', 4300).eitc, 123000);
// 최대 지급액 구간 (국세청: 단독 165만·홑벌이 285만·맞벌이 330만)
assert.strictEqual(e('single', 400).eitc, 1650000); assert.strictEqual(e('single', 899).eitc, 1650000);
assert.strictEqual(e('one', 700).eitc, 2850000); assert.strictEqual(e('one', 1399).eitc, 2850000);
assert.strictEqual(e('two', 800).eitc, 3300000); assert.strictEqual(e('two', 1699).eitc, 3300000);
// 소득 기준금액 이상이면 0 (2,200만·3,200만·4,400만 미만)
for (const [t, cap] of [['single', 2200], ['one', 3200], ['two', 4400]]) { assert.strictEqual(e(t, cap).eitc, 0); assert(e(t, cap - 100).eitc >= 30000); }
// 점증 구간: 소득에 비례 (단독 200만 → 구간 끝 210만 × 165/400 = 866,250 → 867,000)
assert.strictEqual(eitcRaw('single', 200 * M)[0], 867000);
// 재산 1.7억~2.4억 50%, 기한 후 95%, 2.4억 이상 0
assert.strictEqual(e('single', 600, { asset: 'mid' }).eitc, 825000);
assert.strictEqual(e('single', 600, { late: true }).eitc, 1567500);
assert.strictEqual(e('single', 600, { asset: 'mid', late: true }).eitc, 783750);
assert.strictEqual(e('single', 600, { asset: 'high' }).eitc, 0);
// 자녀장려금: 1명당 최대 100만(홑벌이 2,100만·맞벌이 2,500만 미만), 7,000만 이상 0, 단독은 없음
assert.strictEqual(ctcPerChild('one', 2000 * M), 1e6); assert.strictEqual(ctcPerChild('two', 2400 * M), 1e6);
assert.strictEqual(ctcPerChild('two', 7000 * M), 0);
assert(ctcPerChild('one', 6999 * M) >= 500000 && ctcPerChild('one', 6999 * M) < 520000); // 끝에서 약 50만
assert.strictEqual(e('one', 2000, { kids: 3 }).ctc, 3e6);
assert.strictEqual(e('single', 2000, { kids: 2 }).ctc, 0);
// 자녀세액공제를 받았으면 그만큼 빼고 준다
assert.strictEqual(e('one', 2000, { kids: 2, childCredit: 250000 }).ctc, 1750000);
// 가구 유형 판정
assert.strictEqual(hhType({ spouse: false, kids: 0, parents: 0 }), 'single');
assert.strictEqual(hhType({ spouse: false, kids: 1, parents: 0 }), 'one');
assert.strictEqual(hhType({ spouse: false, kids: 0, parents: 1 }), 'one');
assert.strictEqual(hhType({ spouse: true, spouseIncome: 299 * M }), 'one');
assert.strictEqual(hhType({ spouse: true, spouseIncome: 300 * M }), 'two');
// 업종별 조정률 10단계 20~90%
assert.deepStrictEqual(BIZ_RATES.map(r => Math.round(r[0] * 100)), [20, 25, 30, 40, 45, 55, 60, 70, 75, 90]);
// 반기 신청 연 환산: 상반기 6개월 900만 → 900/6×12 = 1,800만, 3개월 450만 → 450/3×9 = 1,350만
assert.strictEqual(halfAnnual(900 * M, 6), 1800 * M); assert.strictEqual(halfAnnual(450 * M, 3), 1350 * M);
assert.strictEqual(Object.keys(EITC).length, 3);
console.log('ok');
