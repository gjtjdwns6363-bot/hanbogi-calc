const a = require('assert'), { calc, months, homeScore, depScore, acctScore, spouseScore } = require('./calc.js');
// 점수표 경계
a.equal(homeScore(0), 2); a.equal(homeScore(11), 2); a.equal(homeScore(12), 4); a.equal(homeScore(8 * 12), 18); a.equal(homeScore(15 * 12), 32); a.equal(homeScore(30 * 12), 32);
a.equal(depScore(0), 5); a.equal(depScore(3), 20); a.equal(depScore(6), 35);
a.equal(acctScore(5), 1); a.equal(acctScore(6), 2); a.equal(acctScore(12), 3); a.equal(acctScore(60), 7); a.equal(acctScore(8 * 12), 10); a.equal(acctScore(15 * 12), 17); a.equal(acctScore(40 * 12), 17);
a.equal(spouseScore(11), 1); a.equal(spouseScore(12), 2); a.equal(spouseScore(23), 2); a.equal(spouseScore(24), 3); a.equal(spouseScore(120), 3);
a.equal(months('2020-05-10', '2026-05-09'), 71); a.equal(months('2020-05-10', '2026-05-10'), 72);
// 국토부 예시: 본인 5년(7점) + 배우자 4년(50%=2년, 3점) = 10점
let r = calc({ base: '2026-09-26', birth: '1990-01-01', married: true, marriage: '2019-01-01', deps: 1, acct: '2021-09-26', spouseAcct: '2022-09-26' });
a.equal(r.own, 7); a.equal(r.sp, 3); a.equal(r.acct, 10);
// 30세 전 혼인 → 혼인신고일부터: 2018-03-01~2026-09-26 = 8년 → 18점
r = calc({ base: '2026-09-26', birth: '1990-05-10', married: true, marriage: '2018-03-01', deps: 0, acct: '' });
a.equal(r.start, '2018-03-01'); a.equal(r.home, 18); a.equal(r.dep, 5); a.equal(r.acct, 0);
// 미혼 → 만 30세(2020-05-10)부터 6년 → 14점
r = calc({ base: '2026-09-26', birth: '1990-05-10', married: false, deps: 0, acct: '2010-01-01' });
a.equal(r.start, '2020-05-10'); a.equal(r.home, 14); a.equal(r.acct, 17);
// 30세 이후 혼인이면 여전히 30세부터
r = calc({ base: '2026-09-26', birth: '1990-05-10', married: true, marriage: '2023-01-01', deps: 1, acct: '' });
a.equal(r.start, '2020-05-10');
// 만 30세 미만 미혼 → 0점
r = calc({ base: '2026-09-26', birth: '2000-01-01', married: false, deps: 0, acct: '2025-12-01' });
a.equal(r.home, 0); a.equal(r.own, 2); a.equal(r.total, 7);
// 집을 판 날이 더 늦으면 그날부터: 2024-01-10 처분 → 2년 → 6점
r = calc({ base: '2026-09-26', birth: '1980-01-01', married: false, owned: true, homelessSince: '2024-01-10', deps: 0, acct: '' });
a.equal(r.home, 6);
// 만점 84: 무주택 15년+, 부양 6명, 통장 15년+
r = calc({ base: '2026-09-26', birth: '1970-01-01', married: true, marriage: '1998-01-01', deps: 6, acct: '2000-01-01', spouseAcct: '2000-01-01' });
a.equal(r.total, 84); a.equal(r.acct, 17);
// 17점 상한: 본인 15년(17) + 배우자 3점
a.ok(r.notes.some(n => n.includes('17점')));
console.log('subscription calc: all tests passed');
