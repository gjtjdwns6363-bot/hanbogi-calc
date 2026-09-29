const a = require('assert'), { calc } = require('./calc.js');
const r = calc({ price: 5e8, rate: .04, months: 36, interval: 6, mortgage: 2e8 });
a.strictEqual(r.down, 5e7); a.strictEqual(r.mid, 3e8); a.strictEqual(r.balance, 1.5e8);
a.strictEqual(r.loan, 2e8); a.strictEqual(r.ownMid, 1e8);
a.strictEqual(r.schedule.reduce((s, x) => s + x.amt, 0), 3e8);          // 회차 합 = 중도금
a.strictEqual(r.schedule.reduce((s, x) => s + x.loan, 0), 2e8);         // 나머지 원 단위까지 맞음
a.ok(Math.abs(r.interest - 1e7) < 10);                                   // 2억 × 4% × 평균 1.25년
a.strictEqual(r.schedule[5].interest, 0);                                // 마지막 회차는 입주 직전
a.strictEqual(r.moveIn, 3.5e8);                                          // 잔금 1.5억 + 대출 상환 2억
a.strictEqual(r.shortfall, 1.5e8);                                       // 주담대 2억 받고도 1.5억 모자람
a.strictEqual(r.cashNeeded, 5e7 + 1e8 + 1.5e8 + r.interest);             // 계약금+자납 중도금+입주 부족분+이자
a.strictEqual(calc({ price: 5e8, free: true }).interest, 0);
a.strictEqual(calc({ price: 5e8, loanPct: .9 }).loan, 3e8);              // 중도금 총액 넘는 대출은 안 됨
a.strictEqual(calc({ price: 5e8, deferred: true, rate: .04, interval: 6 }).moveIn, 3.5e8 + calc({ price: 5e8, rate: .04, interval: 6 }).interest);
console.log('down-payment/test.js: 모두 통과');
