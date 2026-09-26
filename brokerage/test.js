const a = require('assert'), { calc, dealAmount } = require('./calc.js');
const f = o => calc(o).fee;
// 매매: 구간 경계와 한도액 (별표 1)
a.strictEqual(f({ price: 4e7 }), 240000);               // 4천만 × 0.6%
a.strictEqual(f({ price: 49990000 }), 250000);          // 299,940 → 한도 25만
a.strictEqual(f({ price: 5e7 }), 250000);               // 5천만 × 0.5% = 25만
a.strictEqual(f({ price: 1.9e8 }), 800000);             // 95만 → 한도 80만
a.strictEqual(f({ price: 2e8 }), 800000);               // 2억 × 0.4%
a.strictEqual(f({ price: 5e8 }), 2000000);
a.strictEqual(f({ price: 9e8 }), 4500000);              // 9억 × 0.5%
a.strictEqual(f({ price: 10e8 }), 5000000);
a.strictEqual(f({ price: 12e8 }), 7200000);             // 12억 × 0.6%
a.strictEqual(f({ price: 15e8 }), 10500000);            // 15억 × 0.7%
// 전세
a.strictEqual(f({ deal: 'jeonse', deposit: 4e7 }), 200000);  // 0.5% = 20만 (한도 20만)
a.strictEqual(f({ deal: 'jeonse', deposit: 9e7 }), 300000);  // 36만 → 한도 30만
a.strictEqual(f({ deal: 'jeonse', deposit: 3e8 }), 900000);  // 0.3%
a.strictEqual(f({ deal: 'jeonse', deposit: 6e8 }), 2400000); // 0.4%
// 월세 환산: 1천만/50만 → 1천만+5천만=6천만 (×100)
a.strictEqual(dealAmount('wolse', { deposit: 1e7, monthly: 5e5 }), 6e7);
a.strictEqual(f({ deal: 'wolse', deposit: 1e7, monthly: 5e5 }), 240000);
// 500만/30만 → ×100이면 3,500만(5천 미만) → ×70: 500만+2,100만=2,600만 × 0.5% = 13만
a.strictEqual(dealAmount('wolse', { deposit: 5e6, monthly: 3e5 }), 2.6e7);
a.strictEqual(f({ deal: 'wolse', deposit: 5e6, monthly: 3e5 }), 130000);
// 오피스텔(85㎡ 이하 주거용): 매매 0.5%, 임대 0.4%, 한도 없음
a.strictEqual(f({ kind: 'officetel', price: 3e8 }), 1500000);
a.strictEqual(f({ kind: 'officetel', deal: 'jeonse', deposit: 2e8 }), 800000);
// 그 밖(토지·상가 등) 0.9%
a.strictEqual(f({ kind: 'other', price: 5e8 }), 4500000);
// 부가세 10%
const v = calc({ price: 5e8, vat: true }); a.strictEqual(v.vatAmt, 200000); a.strictEqual(v.total, 2200000);
a.strictEqual(calc({ price: 5e8 }).total, 2000000);
console.log('ok');
