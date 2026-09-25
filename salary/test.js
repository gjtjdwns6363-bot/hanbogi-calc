// node salary/test.js — 기준값 확인
const assert = require('assert');
const { net, tableTax } = require('./calc.js');
const eq = (a, b, m) => assert.strictEqual(a, b, `${m}: ${a} !== ${b}`);

// 소득세법 시행령 별표2(2026.2.27 개정) 원문 값
eq(tableTax(3000000, 1), 74350, '300만 1인');
eq(tableTax(3000000, 3), 31940, '300만 3인 (icalc.kr 예시와 일치)');
eq(tableTax(5000000, 1), 335470, '500만 1인');
eq(tableTax(5000000, 2), 306710, '500만 2인');
eq(tableTax(1050000, 1), 0, '105만 면세');
eq(tableTax(1060000, 1), 1040, '106만 1인');
eq(tableTax(9985000, 11), 958650, '998만 11인');
eq(tableTax(10000000, 1), 1507400, '1,000만 1인');
eq(tableTax(12000000, 1), 1507400 + 686000 + 25000, '1,200만 1인 (초과 산식)');

// 자녀 공제 (별표2 제3호): 300만 3인 + 자녀 1명 = 31,940 - 20,830
eq(net({ gross: 3000000, fam: 3, kids: 1 }).income, 11110, '자녀 1명 공제');
eq(net({ gross: 3000000, fam: 3, kids: 2 }).income, 0, '공제 후 음수는 0');

// 4대보험: 월 300만(비과세 20만) — job.cosmosfarm.com 2026 표와 비교
const a = net({ gross: 3000000, nontax: 200000, fam: 1 });
eq(a.pension, 133000, '국민연금'); eq(a.health, 100660, '건강보험'); eq(a.care, 13220, '장기요양');
eq(a.employ, 25200, '고용보험'); eq(a.income, 56800, '소득세 280만 1인'); eq(a.local, 5680, '지방소득세');
// 월 500만(비과세 20만)
const b = net({ gross: 5000000, nontax: 200000, fam: 1 });
eq(b.pension, 228000, '국민연금 480만'); eq(b.health, 172560, '건강보험 480만'); eq(b.care, 22670, '장기요양 480만');
// 국민연금 상한 659만 × 4.75% = 313,025 → 10원 미만 절사
eq(net({ gross: 9000000 }).pension, 313020, '국민연금 상한');
console.log('ok', a, b);
