const assert = require('assert'), { calc, retireTax, serviceYears, days3m, irpTax } = require('./calc.js');
// 국세청 예시: 근속 20년, 퇴직급여 1억 → 근속연수공제 4,000만, 환산급여 3,600만, 환산급여공제 2,480만, 과표 1,120만, 환산산출세액 672,000, 산출세액 1,120,000
const t = retireTax(1e8, 20);
assert.deepStrictEqual([t.td, t.conv, t.cd, t.base, t.convTax, t.tax, t.local], [4e7, 3.6e7, 2.48e7, 1.12e7, 672000, 1120000, 112000]);
// KB국민은행(kbthink) 예시: 근속 10년, 1억 → 공제 1,500만, 환산급여 1억200만, 환산급여공제 6,260만, 과표 3,940만, 산출세액 3,875,000
const k = retireTax(1e8, 10);
assert.deepStrictEqual([k.td, k.conv, k.cd, k.base, k.tax], [1.5e7, 1.02e8, 6.26e7, 3.94e7, 3875000]);
// 고용노동부 예시: 2014.10.2 입사, 퇴직일 2017.9.16 → 재직 1,080일, 3개월 92일, 1일 평균임금 88,641.30원
const r = calc({ start: '2014-10-02', end: '2017-09-16', wage3: 7080000, bonus: 4000000, leave: 300000 });
assert.strictEqual(r.workDays, 1080); assert.strictEqual(r.d3, 92);
assert.strictEqual(r.daily, 88641.31); // 노동부 표기 88,641원 31전
assert.strictEqual(r.t.years, 3);
console.log('노동부 예시 퇴직금', r.pay, '세금', r.t.tax, r.t.local);
// 근속연수 올림·경계
assert.strictEqual(serviceYears('2020-01-01', '2025-01-01'), 5);
assert.strictEqual(serviceYears('2020-01-01', '2025-01-02'), 6);
assert.strictEqual(serviceYears('2025-03-01', '2026-03-01'), 1);
// 1년 미만 → 대상 아님
assert.strictEqual(calc({ start: '2025-10-01', end: '2026-09-30', wage3: 9e6, bonus: 0, leave: 0 }).eligible, false);
assert.strictEqual(calc({ start: '2025-09-30', end: '2026-09-30', wage3: 9e6, bonus: 0, leave: 0 }).eligible, true);
// 노동부 계산기 규칙: 5/31 → 3/1~5/30(91일), 7/31 → 4/30~7/30(92일), 6/1 → 3/1~5/31(92일)
assert.strictEqual(days3m('2026-05-31'), 91); assert.strictEqual(days3m('2026-07-31'), 92); assert.strictEqual(days3m('2026-06-01'), 92); assert.strictEqual(days3m('2026-05-29'), 89);
// 윤년 걸친 1년: 2023-03-02 입사, 2024-03-01 퇴직일 → 365일이지만 1년 미만
assert.strictEqual(calc({ start: '2023-03-02', end: '2024-03-01', wage3: 9e6, bonus: 0, leave: 0 }).eligible, false);
// 공제가 퇴직금보다 크면 세금 0
assert.strictEqual(retireTax(3e6, 3).tax, 0);
// 상여·연차수당 생략 가능(0으로 봄)
assert.strictEqual(calc({ start: '2014-10-02', end: '2017-09-16', wage3: 7080000 }).daily, Math.ceil(7080000 / 92 * 100) / 100);
// IRP 연금 수령 (소득세법 제129조제1항제5호의3): 국세청 예시 세액 1,120,000 + 지방 112,000 = 1,232,000 → 70% 862,400 · 60% 739,200 · 50% 616,000
assert.deepStrictEqual(irpTax(t).map(x => x.tax), [862400, 739200, 616000]);
// 생성 페이지(node gen/severance.js) 숫자가 calc와 같은지: 근속 N년, 월급 300만, 퇴직일 2026-10-01
const fs = require('fs'), path = require('path');
for (const n of [1, 10, 30]) {
  const f = path.join(__dirname, 'year-' + n, 'index.html'); if (!fs.existsSync(f)) continue;
  const m = fs.readFileSync(f, 'utf8').match(/id="r300">([^<]+)</);
  assert.strictEqual(m && m[1], Math.round(calc({ start: (2026 - n) + '-10-01', end: '2026-10-01', wage3: 9e6 }).pay).toLocaleString('ko-KR') + '원', 'year-' + n);
}
console.log('ok');
