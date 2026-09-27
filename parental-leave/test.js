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
// 육아기 근로시간 단축 급여 (시행령 제104조의2)
const { shortHours, spouseLeave } = require('./calc.js');
// 월 250만, 주 40→30시간(하루 2시간): 250만 × 10/40 = 625,000원 (고용노동부 예시, 매일신문 2026.9.22.)
assert.strictEqual(shortHours({ wage: 2.5e6, after: 30 }).pay, 625000);
// 월 400만, 40→20시간: 첫 10시간 250만(상한)×10/40 = 625,000 + 나머지 10시간 160만(80% 상한)×10/40 = 400,000
let s = shortHours({ wage: 4e6, after: 20 }); assert.deepStrictEqual([s.pay1, s.pay2, s.pay], [625000, 400000, 1025000]);
// 월 180만, 40→25: 180만×10/40 = 450,000 + 144만×5/40 = 180,000
s = shortHours({ wage: 1.8e6, after: 25 }); assert.deepStrictEqual([s.pay1, s.pay2], [450000, 180000]);
// 하한 50만: 월 40만(단시간) 20→15 → 50만 × 5/20 = 125,000
assert.strictEqual(shortHours({ wage: 4e5, before: 20, after: 15 }).pay, 125000);
// 배우자 출산휴가 20일: 월 220만 → 1,684,210원 = 고시 상한과 같음
assert.strictEqual(spouseLeave(2.2e6).full, 1684210);
s = spouseLeave(4e6); assert.strictEqual(s.gov, 1684210); assert.strictEqual(s.gov + s.employer, s.full);
assert.strictEqual(spouseLeave(4e6, false).gov, 0);
// 부부 조합: 둘 다 500만 → 6+6 = 2,000만 × 2 = 4,000만, 혼자 12개월 = 250×3+200×3+160×6 = 2,310만
const { combos } = require('./calc.js'), cb = combos(5e6, 5e6);
assert.strictEqual(cb.find(c => c.m1 === 6 && c.m2 === 6).total, 40e6);
assert.strictEqual(cb.find(c => c.m2 === 0).total, 23.1e6);
// 12+3: 나 250·250·300 + 200×3 + 160×6 = 2,360만, 배우자 3개월 250·250·300 = 800만
assert.deepStrictEqual((({ me, sp }) => [me, sp])(cb.find(c => c.m1 === 12 && c.m2 === 3)), [23.6e6, 8e6]);
console.log('ok');
