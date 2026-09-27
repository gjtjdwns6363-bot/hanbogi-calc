const assert = require('assert'), { calc, RATES } = require('./calc.js');
const base = { lastDay: '2026-08-31', over50: false, ins: 2, hours: 8 };
// 이직일 8/31 → 6/1~8/31 = 92일
// 월 300만: 900만/92 = 97,826원 × 60% = 58,695 < 하한 66,048 → 하한 적용
let r = calc({ ...base, wage3: 9e6 });
assert.strictEqual(r.d3, 92); assert.strictEqual(r.floor, 66048); assert.strictEqual(r.daily, 66048); assert.strictEqual(r.kind, 'floor');
assert.strictEqual(r.days, 180); assert.strictEqual(r.total, 66048 * 180);
// 월 600만: 평균임금 195,652원 > 기초일액 상한 113,500 → 68,100원, 50세 이상 10년 이상 270일
r = calc({ ...base, wage3: 18e6, over50: true, ins: 4 });
assert.strictEqual(r.daily, RATES.dailyCap); assert.strictEqual(r.kind, 'cap'); assert.strictEqual(r.days, 270); assert.strictEqual(r.total, 18387000);
// 상한·하한 사이: 월 350만 → 1,050만/92 = 114,130 → 상한 / 월 340만 → 1,020만/92 = 110,869.5 × 0.6 = 66,521
r = calc({ ...base, wage3: 10.2e6 }); assert.strictEqual(r.daily, 66521); assert.strictEqual(r.kind, 'normal');
// 1일 4시간 근로자: 하한 = 10,320 × 4 × 80% = 33,024원
r = calc({ ...base, wage3: 4.5e6, hours: 4 }); assert.strictEqual(r.floor, 33024); assert.strictEqual(r.daily, 33024);
// 8시간 넘게 넣어도 8시간 한도
assert.strictEqual(calc({ ...base, wage3: 1e6, hours: 10 }).floor, 66048);
// 소정급여일수 표 (별표1)
assert.deepStrictEqual([0, 1, 2, 3, 4].map(ins => calc({ ...base, wage3: 9e6, ins }).days), [120, 150, 180, 210, 240]);
assert.deepStrictEqual([0, 1, 2, 3, 4].map(ins => calc({ ...base, wage3: 9e6, ins, over50: true }).days), [120, 180, 210, 240, 270]);
// 하한이 상한을 넘지 않는지 (2026년 기준 안전 확인)
assert(8 * RATES.minWage * RATES.floorRate <= RATES.dailyCap);
// 조기재취업수당: 180일 중 60일 받고 재취업 → 남은 120일 × 66,048 ÷ 2 = 3,962,880원
const { earlyReemp, schedule } = require('./calc.js');
assert.deepStrictEqual(earlyReemp({ daily: 66048, days: 180, paid: 60 }), { left: 120, ok: true, pay: 3962880 });
assert.strictEqual(earlyReemp({ daily: 66048, days: 180, paid: 90 }).ok, true);   // 딱 절반 남김 → 가능
assert.strictEqual(earlyReemp({ daily: 66048, days: 180, paid: 91 }).pay, 0);      // 절반 미만 → 없음
// 수급 일정: 8/31 이직, 9/7 신고 → 대기 9/7~9/13, 9/14부터 180일 → 2027-03-12, 수급기간 끝 2027-08-31
let sc = schedule({ lastDay: '2026-08-31', applyDay: '2026-09-07', days: 180 });
assert.deepStrictEqual([sc.waitEnd, sc.start, sc.end, sc.limit, sc.lost], ['2026-09-13', '2026-09-14', '2027-03-12', '2027-08-31', 0]);
// 늦게 신고하면 12개월을 넘는 날수는 못 받음: 2027-06-01 신고, 270일 → 2027-06-08부터 270일(2028-03-03) 중 수급기간 끝 2027-08-31 넘는 185일 손해
sc = schedule({ lastDay: '2026-08-31', applyDay: '2027-06-01', days: 270 });
assert.strictEqual(sc.end, '2027-08-31'); assert.strictEqual(sc.lost, 185);
console.log('ok');
