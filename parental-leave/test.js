const assert = require('assert'), { calc, maxMonths } = require('./calc.js');
const pays = r => r.rows.map(x => x.pay / 10000);
// 혼자, 통상임금 300만 12개월: 250×3 + 200×3 + 160×6 = 2,310만
let r = calc({ wage: 3e6, months: 12, mode: 'solo' });
assert.deepStrictEqual(pays(r), [250, 250, 250, 200, 200, 200, 160, 160, 160, 160, 160, 160]); assert.strictEqual(r.total, 23.1e6);
// 통상임금 180만: 1~6개월 100% = 180, 7개월~ 80% = 144
assert.deepStrictEqual(pays(calc({ wage: 1.8e6, months: 8, mode: 'solo' })), [180, 180, 180, 180, 180, 180, 144, 144]);
// 하한 70만: 통상임금 80만 → 7개월째 64만이 아니라 70만
assert.deepStrictEqual(pays(calc({ wage: 8e5, months: 7, mode: 'solo' })), [80, 80, 80, 80, 80, 80, 70]);
// 6+6 부모 모두 6개월, 통상임금 500만: 250,250,300,350,400,450 = 2,000만 (생활법령 표)
r = calc({ wage: 5e6, months: 6, mode: 'both18', spouseMonths: 6 });
assert.deepStrictEqual(pays(r), [250, 250, 300, 350, 400, 450]); assert.strictEqual(r.total, 20e6);
// 배우자 3개월만 쓰면 특례도 3개월까지 → 4개월째부터 일반 상한
r = calc({ wage: 5e6, months: 12, mode: 'both18', spouseMonths: 3 });
assert.strictEqual(r.special, 3); assert.deepStrictEqual(pays(r).slice(0, 7), [250, 250, 300, 200, 200, 200, 160]);
// 6+6이라도 통상임금이 상한보다 낮으면 통상임금 100%
assert.deepStrictEqual(pays(calc({ wage: 3.2e6, months: 6, mode: 'both18', spouseMonths: 6 })), [250, 250, 300, 320, 320, 320]);
// 18개월 이후 부모 모두 → 특례 없음
assert.strictEqual(calc({ wage: 5e6, months: 6, mode: 'bothLater', spouseMonths: 6 }).special, 0);
// 한부모: 첫 3개월 상한 300만
assert.deepStrictEqual(pays(calc({ wage: 4e6, months: 7, mode: 'single' })), [300, 300, 300, 200, 200, 200, 160]);
// 최대 기간
assert.strictEqual(maxMonths({ mode: 'solo', months: 12 }), 12);
assert.strictEqual(maxMonths({ mode: 'both18', months: 12, spouseMonths: 3 }), 18);
assert.strictEqual(maxMonths({ mode: 'bothLater', months: 12, spouseMonths: 2 }), 12);
assert.strictEqual(maxMonths({ mode: 'single', months: 1 }), 18);
// 18개월 전부: 250×3+200×3+160×12
assert.strictEqual(calc({ wage: 5e6, months: 18, mode: 'bothLater', spouseMonths: 6 }).total, 32.7e6);
console.log('ok');
