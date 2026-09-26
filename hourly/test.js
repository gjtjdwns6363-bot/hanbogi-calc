// node hourly/test.js — 기준값 확인
const assert = require('assert');
const { HOURLY, dayWork, weekPay, deduct, hm } = require('./calc.js');
const eq = (a, b, m) => assert.strictEqual(a, b, `${m}: ${a} !== ${b}`);
const t = (h, m = 0) => h * 60 + m;
const days = (n, s, e, brk = 0) => Array(n).fill({ start: s, end: e, brk });

eq(HOURLY.wage, 10320, '2026 최저시급');
// 10분 단위 합산: 09:10~14:00, 휴게 20분 = 4시간 30분
eq(dayWork({ start: t(9, 10), end: t(14), brk: 20 }).work, 270, '10분 단위');
eq(hm(890), '14시간 50분', 'hm');
// 10분 = 1,720원 딱 떨어짐, 4시간 30분 × 10,320 = 46,440
eq(weekPay({ days: days(1, t(9, 10), t(14), 20) }).base, 46440, '4시간 30분 급여');

// 15시간 경계: 주 14시간 50분 → 주휴 없음, 15시간 → (15/40)×8×10,320 = 30,960
const a = weekPay({ days: [...days(2, t(9), t(14)), { start: t(9), end: t(13, 50) }] });
eq(a.sched, 890, '14:50'); eq(a.juhuOk, false, '14:50 주휴 없음'); eq(a.juhu, 0, '14:50 주휴 0');
const b = weekPay({ days: days(3, t(9), t(14)) });
eq(b.sched, 900, '15:00'); eq(b.juhu, 30960, '15시간 주휴');
eq(weekPay({ days: days(3, t(9), t(14)), full: false }).juhu, 0, '결근 시 주휴 없음');

// 40시간 상한: 하루 9시간(휴게 1시간 → 8시간) × 6일 = 48시간 → 주휴는 40시간 기준 8 × 10,320 = 82,560
const c = weekPay({ days: days(6, t(9), t(18), 60), five: true });
eq(c.sched, 2400, '소정 40시간 상한'); eq(c.juhu, 82560, '주휴 상한'); eq(c.ext, 480, '주 40 초과 8시간 연장');
eq(c.prem, 480 / 60 * 10320 * 0.5, '연장 가산 50%');
// 주 40시간 = 월 209시간 → 10,320 × 209 = 2,156,880 (고시 월 환산액과 같음, 4.345주 × 48시간 = 208.56)
const f = weekPay({ days: days(5, t(9), t(18), 60) });
eq(Math.round((f.work + 480) / 60 * HOURLY.weekToMonth), 209, '월 209시간');

// 하루 10시간 → 2시간 연장
eq(weekPay({ days: days(1, t(8), t(18)) }).ext, 120, '일 8시간 초과 연장');

// 야간: 20:00~02:00 휴게 30분 → 실근무 5.5h, 야간 4h (휴게는 야간 외에서 먼저)
const n = dayWork({ start: t(20), end: t(2), brk: 30 });
eq(n.work, 330, '야간 실근무'); eq(n.night, 240, '야간 4시간');
eq(dayWork({ start: t(22), end: t(6), brk: 60 }).night, 420, '밤샘 휴게 1시간');
eq(dayWork({ start: t(5), end: t(23) }).night, 120, '새벽·밤 양쪽');
const g5 = weekPay({ days: [{ start: t(20), end: t(2), brk: 30 }] });
eq(g5.prem, 240 / 60 * 10320 * 0.5, '야간 가산');
eq(weekPay({ days: [{ start: t(20), end: t(2), brk: 30 }], five: false }).prem, 0, '5인 미만 가산 없음');
// 휴일 10시간: 8시간 × 50% + 2시간 × 100%
eq(weekPay({ days: [], holiday: 600 }).prem, 8 * 10320 * 0.5 + 2 * 10320, '휴일 가산');
eq(weekPay({ days: [], holiday: 600 }).sched, 0, '휴일근로는 주휴 산정 제외');

// 3.3%: 100만 → 30,000 + 3,000
eq(deduct(1000000, 'biz').net, 967000, '3.3%');
// 4대보험: salary 계산기와 같은 값 (월 300만, 비과세 0)
eq(deduct(3000000, 'ins').pension, 142500, '국민연금 4.75%');
console.log('ok', { b, c: { juhu: c.juhu, month: Math.round(c.month) } });
