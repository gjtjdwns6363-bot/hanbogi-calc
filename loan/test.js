// node loan/test.js — 상환 스케줄·한도(LTV·DSR·스트레스 DSR)·중도상환수수료 확인
const assert = require('assert');
const { schedule } = require('./amort.js');
const { RATES, baseRate, REG, stressAdd, dsrMax, loanLimit, BANKS, prepayFee } = require('./rates.js');
const eok = v => Math.round(v / 1000) / 10; // 만원 → 억(소수 1자리, 금융위 표기)

// 원리금균등 3억 4% 30년 = 1,432,246원 (UPDATE.md 기준값)
const s = schedule(3e8, 4, 360, 'equalPay');
assert.strictEqual(s.firstPay, 1432246);
assert.strictEqual(s.rows[359].bal, 0);
assert.strictEqual(schedule(3e8, 4, 360, 'equalPrin').firstPay, 833333 + 1000000); // 원금 83.3만 + 첫 달 이자 100만
assert.strictEqual(schedule(3e8, 4, 360, 'bullet').totalInt, 1e6 * 360);
assert(schedule(3e8, 4, 360, 'equalPrin').totalInt < s.totalInt, '원금균등 총이자가 더 적다');

// 금융위 「3단계 스트레스 DSR 시행방안」 참고2 예시: 소득 5천만·1억, 30년 원리금균등, 금리 4.2%, 은행 DSR 40%, 3단계 ST금리 1.5%
const lim = (inc, type, fix, base) => eok(dsrMax(inc, 4.2, 30, stressAdd('metro', type, fix, 30, base)));
const limL = (inc, type, fix) => eok(dsrMax(inc, 4.2, 30, stressAdd('local', type, fix, 30, 0.75)));
assert.strictEqual(lim(5000, 'fixed', 0), 3.4);  // 미적용
assert.strictEqual(lim(5000, 'var', 0, 1.5), 2.9);   // 수도권 변동형
assert.strictEqual(lim(5000, 'mixed', 5, 1.5), 3.0); // 혼합형(5년)
assert.strictEqual(lim(5000, 'cycle', 5, 1.5), 3.2); // 주기형(5년)
assert.strictEqual(limL(5000, 'var', 0), 3.1);       // 지방 0.75%
assert.strictEqual(limL(5000, 'mixed', 5), 3.2);
assert.strictEqual(limL(5000, 'cycle', 5), 3.3);
assert.strictEqual(lim(10000, 'fixed', 0), 6.8);
assert.strictEqual(lim(10000, 'var', 0, 1.5), 5.7);
assert.strictEqual(lim(10000, 'mixed', 5, 1.5), 5.9);
assert.strictEqual(lim(10000, 'cycle', 5, 1.5), 6.4);
assert.strictEqual(limL(10000, 'var', 0), 6.2);
assert.strictEqual(limL(10000, 'mixed', 5), 6.5);
assert.strictEqual(limL(10000, 'cycle', 5), 6.6);
// 「주택시장 안정화 대책」(2025-10-15) 예시: 수도권 ST금리 3% → 5년 주기형 1.2%, 5년 혼합형 2.4%
assert.strictEqual(stressAdd('metro', 'cycle', 5, 30), 1.2);
assert.strictEqual(stressAdd('reg', 'mixed', 5, 30), 2.4);
assert.strictEqual(stressAdd('reg', 'var', 0, 30), 3.0);
assert.strictEqual(stressAdd('reg', 'mixed', 3, 30), 3.0);  // 고정 5년 미만 = 변동과 같음
assert.strictEqual(stressAdd('reg', 'mixed', 21, 30), 0);   // 비중 70% 이상 미적용
assert.strictEqual(stressAdd('reg', 'mixed', 9, 30), 1.8);  // 30% → 60%
assert.strictEqual(stressAdd('local', 'var', 0, 30), 0.75);

// LTV·가격별 한도: 서울 20억 무주택, 소득 충분 → LTV 40% 8억보다 가격별 한도 4억이 작다
let L = loanLimit({ income: 100000, price: 200000, area: 'reg', rate: 4, years: 30 });
assert.deepStrictEqual([L.ltv, L.byLtv, L.byCap, L.max, L.by], [40, 80000, 40000, 40000, '가격별 한도']);
L = loanLimit({ income: 100000, price: 100000, area: 'reg', first: true, rate: 4, years: 40 }); // 생애최초 70% = 7억 > 6억 한도, 만기 30년으로 제한
assert.deepStrictEqual([L.ltv, L.max, L.term], [70, 60000, 30]);
assert.strictEqual(loanLimit({ income: 10000, price: 50000, area: 'metro', owned: 'own', rate: 4, years: 30 }).max, 0); // 수도권 추가 구입 금지
L = loanLimit({ income: 5000, price: 50000, area: 'local', rate: 4.2, years: 30 }); // 지방 5억, 소득 5천: LTV 3.5억 vs DSR 3.1억
assert.strictEqual(L.by, 'DSR'); assert.strictEqual(eok(L.max), 3.1);
assert.strictEqual(loanLimit({ income: 5000, price: 50000, area: 'local', first: true, rate: 4.2, years: 30 }).byLtv, 40000); // 지방 생애최초 80%
// 기존 대출 연 원리금이 DSR 한도를 줄인다
assert(loanLimit({ income: 5000, price: 50000, area: 'local', rate: 4.2, years: 30, existing: 600 }).max < L.max);

// 중도상환수수료: 1억을 12개월째 갚으면 0.65% × 24/36 = 433,333원, 36개월 뒤는 0
assert.strictEqual(prepayFee(1e8, 12), 433333);
assert.strictEqual(prepayFee(1e8, 36), 0);

// 데이터 형식
assert(BANKS.list.every(([b, avg, top, sc]) => b && avg > 2 && avg < 9 && top > 2 && sc > 800), '은행 금리 표');
assert(BANKS.big5 > 4 && BANKS.big5 < 6);
assert.strictEqual(baseRate(RATES.didimdol, 3000, 3), 3.45);

// 생성 페이지(node gen/loan.js 후): 3억 페이지 30년·기준 금리 월 상환액 = schedule 결과
const fs = require('fs'), p = __dirname + '/30000/index.html';
if (fs.existsSync(p)) {
  const pay = schedule(3e8, BANKS.big5, 360, 'equalPay').firstPay;
  assert(fs.readFileSync(p, 'utf8').includes(`id="rpay">${pay.toLocaleString('ko-KR')}원<`), '3억 페이지 월 상환액');
}
console.log('loan/test.js 통과');
