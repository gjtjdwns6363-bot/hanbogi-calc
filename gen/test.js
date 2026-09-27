// node gen/test.js — 생성된 롱테일 페이지의 숫자가 계산기 함수 결과와 같은지 확인 (먼저 node gen/longtail.js)
const assert = require('assert'), fs = require('fs'), path = require('path');
const { net } = require('../salary/calc.js'), acq = require('../acquisition-tax/calc.js');
const { weekPay } = require('../hourly/calc.js'), brk = require('../brokerage/calc.js');
const won = v => Math.round(v).toLocaleString('ko-KR') + '원';
const grab = (url, id) => {
  const html = fs.readFileSync(path.join(__dirname, '..', url, 'index.html'), 'utf8');
  const m = html.match(new RegExp(`id="${id}">([^<]+)<`)); assert(m, `${url} #${id} 없음`); return m[1];
};
const eq = (url, id, v) => assert.strictEqual(grab(url, id), won(v), url);

for (const y of [2000, 4500, 10000, 15000]) eq(`salary/${y}`, 'rnet', net({ gross: Math.round(y * 1e4 / 12), nontax: 200000 }).net);
eq('salary/4500', 'ryear', net({ gross: 3750000, nontax: 200000 }).net * 12);
for (const m of [15000, 70000, 200000]) eq(`acquisition-tax/${m}`, 'rtotal', acq.calc({ price: m * 1e4, houses: 1 }).total);
assert.strictEqual(grab('acquisition-tax/70000', 'rtotal'), '12,833,590원'); // 7억: 11,666,900 + 1,166,690 (acquisition-tax/test.js와 같음)
for (const h of [10, 14, 15, 20, 40]) eq(`hourly/week-${h}`, 'rmonth', weekPay({ days: Array(5).fill({ start: 540, end: 540 + h * 12 }) }).month);
eq('hourly/week-40', 'rmonth', (40 + 8) * 10320 * 4.345); // 주 40시간 + 주휴 8시간
eq('brokerage/sale-50000', 'rfee', brk.calc({ deal: 'sale', price: 5e8 }).fee);
assert.strictEqual(grab('brokerage/sale-50000', 'rfee'), '2,000,000원');
eq('brokerage/sale-10000', 'rfee', 500000); // 0.5% = 50만 (한도 80만 이하)
eq('brokerage/jeonse-5000', 'rfee', brk.calc({ deal: 'jeonse', deposit: 5e7 }).fee);
console.log('gen/test.js 통과');
