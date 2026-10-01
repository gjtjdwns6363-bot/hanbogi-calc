const a = require('assert'), { loanAmount, calc } = require('./calc.js');
a.strictEqual(loanAmount(1e8, 80, 0), 8e7); a.strictEqual(loanAmount(1e8, 80, 7e7), 7e7); a.strictEqual(loanAmount(1e8, 120, 0), 1e8);
// 만기일시: 8천만 × 4% ÷ 12 = 266,667원 + 월 임대료 30만 = 566,667원, 자기 자금 2천만
let r = calc({ deposit: 1e8, rent: 3e5, ratio: 80, cap: 0, rate: 4, years: 2, method: 'bullet' });
a.strictEqual(r.loan, 8e7); a.strictEqual(r.own, 2e7); a.strictEqual(r.firstPay, 266667); a.strictEqual(r.monthly, 566667); a.strictEqual(r.balloon, 8e7);
a.strictEqual(r.yearly, 566667 * 12);
// 일반 전세(임대료 0): 월 부담 = 이자
r = calc({ deposit: 3e8, rent: 0, ratio: 80, cap: 0, rate: 4, years: 2, method: 'bullet' }); a.strictEqual(r.monthly, 800000);
// 원리금균등 2년
r = calc({ deposit: 1e8, rent: 0, ratio: 80, cap: 0, rate: 4, years: 2, method: 'equalPay' });
a.ok(r.firstPay > 3.3e6 && r.firstPay < 3.5e6); a.strictEqual(r.balloon, 0);
// 대출 0%면 월 부담 = 임대료, 보증금 0이면 대출 없음
r = calc({ deposit: 1e8, rent: 3e5, ratio: 0, cap: 0, rate: 4, years: 2, method: 'bullet' }); a.strictEqual(r.monthly, 3e5); a.strictEqual(r.loan, 0);
r = calc({ deposit: 0, rent: 5e5, ratio: 80, cap: 0, rate: 4, years: 2, method: 'bullet' }); a.strictEqual(r.monthly, 5e5);
// 거치 12개월 후 원리금균등: 거치 중은 이자만, 이후는 더 큼
r = calc({ deposit: 1e8, rent: 0, ratio: 80, cap: 0, rate: 4, years: 2, method: 'equalPay', grace: 12 });
a.strictEqual(r.firstPay, 266667); a.ok(r.monthlyLater > r.monthly);
console.log('jeonse-loan: all tests passed');
// 정책 금리 조회
const { JEONSE_PRODUCTS: P, policyRate } = require('./rates.js');
a.strictEqual(policyRate(P[0], 3000, 8000, true), 2.8); a.strictEqual(policyRate(P[0], 3000, 8000, false), 2.6);
a.strictEqual(policyRate(P[2], 6000, 12000, true), 2.8); a.strictEqual(policyRate(P[3], 20000, 60000, true), 4.3);
a.strictEqual(policyRate(P[3], 2000, 3000, false), 1.1); a.strictEqual(policyRate(P[0], 6000, 8000, true), null);
a.strictEqual(policyRate(P[1], 3000, 25000, true), 2.5); a.strictEqual(policyRate(P[4], 0, 8000, true), 4.60);
console.log('jeonse-loan rates: ok');
