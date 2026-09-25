const a = require('assert'), { BOK, legalCap, calc, compare } = require('./calc.js');
a.strictEqual(BOK.rate, 3.00); a.strictEqual(legalCap(), 5); a.strictEqual(legalCap(8.5), 10); a.strictEqual(legalCap(2.5), 4.5);
// 전세 3억 → 보증금 1억 + 월세: 2억 × 5% / 12 = 83.33만
let r = calc('j2w', { jeonse: 30000, deposit: 10000 }, 5);
a.ok(Math.abs(r.monthly - 83.3333) < 1e-3); a.strictEqual(r.over, false);
a.strictEqual(calc('j2w', { jeonse: 30000, deposit: 10000 }, 6).over, true);
// 보증금 1억 + 월세 100만, 5% → 전세 1억 + 2.4억 = 3.4억
r = calc('w2j', { deposit: 10000, monthly: 100 }, 5); a.ok(Math.abs(r.jeonse - 34000) < 1e-6);
// 보증금 1억/월세 100만 → 보증금 2억으로 올림: 월세 100 - 1억×5%/12 = 58.33만
r = calc('adj', { deposit: 10000, monthly: 100, newDeposit: 20000 }, 5); a.ok(Math.abs(r.monthly - 58.3333) < 1e-3);
// 내림 5천: 월세 100 + 20.83 = 120.83, 초과 판정은 보증금→월세 방향에서만
r = calc('adj', { deposit: 10000, monthly: 100, newDeposit: 5000 }, 7); a.ok(Math.abs(r.monthly - 129.1667) < 1e-3); a.strictEqual(r.over, true);
a.strictEqual(calc('adj', { deposit: 10000, monthly: 100, newDeposit: 20000 }, 7).over, false);
a.strictEqual(calc('adj', { deposit: 10000, monthly: 10, newDeposit: 20000 }, 5).monthly, 0);
// 2억을 대출 4% vs 전환율 5%: 이자 800만 < 월세 1,000만
const c = compare(20000, 5, 4); a.strictEqual(c.interest, 800); a.strictEqual(c.rent, 1000); a.strictEqual(c.cheaper, 'jeonse');
a.strictEqual(compare(20000, 5, 6).cheaper, 'wolse');
a.strictEqual(calc('w2j', { deposit: 10000, monthly: 100 }, 9).over, false);
console.log('rent: all tests passed');
