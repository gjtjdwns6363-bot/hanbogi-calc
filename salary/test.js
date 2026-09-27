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

// 중소기업 취업 청년 감면 90% (조특법 제30조): 300만(비과세 20만) 1인 소득세 56,800 → 5,680, 지방세 560
const { yearNet, employer, grossFor, RATE } = require('./calc.js');
const y = net({ gross: 3000000, nontax: 200000, sme: 0.9 });
eq(y.tax0, 56800, '감면 전'); eq(y.income, 5680, '청년 90% 감면'); eq(y.local, 560, '감면 후 지방소득세'); eq(y.net, a.net + (56800 - 5680) + (5680 - 560), '감면만큼 실수령 증가');
eq(net({ gross: 3000000, nontax: 200000, sme: 0.7 }).income, 17040, '70% 감면');
// 한도 200만: 월 500만(비과세 20만) 1인 소득세 × 90% × 12 > 200만 → 연 감면은 딱 200만(10원 절사 오차 이내)
const yb = yearNet({ gross: 5000000, nontax: 200000, sme: 0.9 });
assert(yb.cut <= 2000000 && yb.cut > 1999000, '연 한도 200만: ' + yb.cut); assert(yb.months < 12, '한도 도달 후 감면 없음');
eq(yearNet({ gross: 3000000, nontax: 200000 }).net, a.net * 12, '감면 없으면 월 × 12');
// 회사 부담 (고용보험 시행령 제12조): 150인 미만 → 280만 × (0.9% + 0.25%) = 32,200
const e = employer(a, 'u150');
eq(e.employ, 32200, '사업주 고용보험 150인 미만'); eq(employer(a, 'o1000').employ, 49000, '1,000인 이상 1.75%');
eq(e.total, 133000 + 100660 + 13220 + 32200, '사업주 부담 합계');
// 역산: 실수령액 a.net이 되는 최소 세전 월급 ≤ 300만, 그 결과의 실수령액 ≥ 목표
const g = grossFor(a.net, { nontax: 200000 });
assert(g <= 3000000 && net({ gross: g, nontax: 200000 }).net >= a.net && net({ gross: g - 10, nontax: 200000 }).net < a.net, '역산 ' + g);
eq(RATE.nontaxCap.meal, 200000, '식대 비과세 한도');
console.log('ok', a, b);
