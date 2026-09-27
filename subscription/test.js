const a = require('assert'), { calc, months, homeScore, depScore, acctScore, spouseScore, SUB, rank1, special, isRegulated, depositGroup, incomeLimit, gajeomShare } = require('./calc.js');
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

// ---- 1순위·예치금·특별공급 (2026-09-27) ----
// 청약홈 특별공급 소득기준표와 같은 금액이 나와야 한다(100% × 비율, 원 단위 반올림)
a.equal(incomeLimit(3, 120), 9040516); a.equal(incomeLimit(3, 140), 10547268); a.equal(incomeLimit(3, 160), 12054021); a.equal(incomeLimit(3, 130), 9793892);
a.equal(incomeLimit(4, 120), 10562642); a.equal(incomeLimit(4, 140), 12323083); a.equal(incomeLimit(4, 130), 11442863); a.equal(incomeLimit(4, 160), 14083523);
a.equal(incomeLimit(5, 120), 11192382); a.equal(incomeLimit(5, 140), 13057779); a.equal(incomeLimit(5, 130), 12125081); a.equal(incomeLimit(5, 160), 14923176);
a.equal(incomeLimit(1, 100), 7533763); // 3인 이하는 같은 기준
// 예치금 그룹 (별표2)
a.equal(depositGroup('서울특별시'), 'seoulBusan'); a.equal(depositGroup('부산광역시'), 'seoulBusan'); a.equal(depositGroup('인천광역시'), 'metro');
a.equal(depositGroup('경기도'), 'other'); a.equal(depositGroup('세종특별자치시'), 'other');
a.deepEqual(SUB.deposit.seoulBusan, [300, 600, 1000, 1500]); a.deepEqual(SUB.deposit.metro, [250, 400, 700, 1000]); a.deepEqual(SUB.deposit.other, [200, 300, 400, 500]);
// 규제지역
a.ok(isRegulated('서울특별시', '강남구')); a.ok(isRegulated('경기도', '과천시')); a.ok(!isRegulated('경기도', '수원시 권선구')); a.ok(!isRegulated('부산광역시', ''));
// 1순위: 서울(규제) 24개월·세대주·예치금 300만
const B = { base: '2026-09-27', areaIdx: 0, homes: 0 };
let q = rank1({ ...B, sido: '서울특별시', acct: '2024-09-27', deposit: 300, head: true }); a.ok(q.ok); a.equal(q.needM, 24); a.equal(q.need, 300);
q = rank1({ ...B, sido: '서울특별시', acct: '2024-09-28', deposit: 300, head: true }); a.ok(!q.ok);                 // 23개월
q = rank1({ ...B, sido: '서울특별시', acct: '2020-01-01', deposit: 300, head: false }); a.ok(!q.ok);               // 세대원
q = rank1({ ...B, sido: '서울특별시', acct: '2020-01-01', deposit: 300, head: true, won5: true }); a.ok(!q.ok);
q = rank1({ ...B, sido: '서울특별시', acct: '2020-01-01', deposit: 300, head: true, homes: 2 }); a.ok(!q.ok);
q = rank1({ ...B, sido: '서울특별시', acct: '2020-01-01', deposit: 500, head: true, areaIdx: 1 }); a.ok(!q.ok); a.equal(q.need, 600); // 102㎡ 이하 600만
// 비규제 수도권 12개월(세대원도 가능), 비수도권 6개월
a.ok(rank1({ ...B, sido: '경기도', sigungu: '수원시 권선구', acct: '2025-09-27', deposit: 200, head: false }).ok);
a.ok(!rank1({ ...B, sido: '인천광역시', acct: '2025-10-01', deposit: 250 }).ok);
a.ok(rank1({ ...B, sido: '대구광역시', acct: '2026-03-27', deposit: 250 }).ok);
a.equal(rank1({ ...B, sido: '대구광역시', acct: '2026-03-27', deposit: 250 }).needM, 6);
// 가점제 비율 (제28조②④)
a.ok(gajeomShare(59, true).startsWith('가점제 40%')); a.ok(gajeomShare(84, true).startsWith('가점제 70%')); a.ok(gajeomShare(100, true).startsWith('가점제 80%')); a.equal(gajeomShare(100, false), '추첨제 100%');
// 특별공급: 서울, 혼인 3년, 자녀 1, 맞벌이 월 900만(3인 120% = 9,040,516 이하) → 신혼 우선공급 1순위
const P = { ...B, sido: '서울특별시', acct: '2018-01-01', deposit: 300, head: true, married: true, marriage: '2023-05-01', kids: 1, anyKid: true, size: 3, dual: true, homeless: true, everOwned: false, tax5: true };
let s = special({ ...P, income: 9e6 }), nw = s.list.find(x => x.key === 'newlywed');
a.ok(nw.ok); a.ok(nw.tier.startsWith('우선공급')); a.ok(nw.rank.startsWith('1순위'));
nw = special({ ...P, income: 1.1e7 }).list.find(x => x.key === 'newlywed'); a.ok(nw.ok); a.ok(nw.tier.startsWith('일반공급'));   // 160% 이하
nw = special({ ...P, income: 1.3e7 }).list.find(x => x.key === 'newlywed'); a.ok(!nw.ok);                                          // 160% 초과, 자산 미입력
nw = special({ ...P, income: 1.3e7, asset: 3e8 }).list.find(x => x.key === 'newlywed'); a.ok(nw.ok); a.ok(nw.tier.startsWith('추첨'));
nw = special({ ...P, income: 9e6, marriage: '2019-09-27' }).list.find(x => x.key === 'newlywed'); a.ok(!nw.ok);                     // 7년 지남
// 생애최초: 같은 조건, 3인 130% = 9,793,892 → 9백만 우선공급
let fs1 = special({ ...P, income: 9e6 }).list.find(x => x.key === 'first'); a.ok(fs1.ok); a.ok(fs1.tier.startsWith('우선공급(소득 130%'));
fs1 = special({ ...P, income: 9e6, tax5: false }).list.find(x => x.key === 'first'); a.ok(!fs1.ok);
fs1 = special({ ...P, income: 9e6, everOwned: true }).list.find(x => x.key === 'first'); a.ok(!fs1.ok);
fs1 = special({ ...P, married: false, kids: 0, anyKid: false, size: 1, income: 5e6 }).list.find(x => x.key === 'first'); a.ok(fs1.ok); a.ok(fs1.tier.includes('1인'));
// 다자녀: 미성년 2명 이상
a.ok(!special({ ...P, income: 9e6 }).list.find(x => x.key === 'multi').ok);
a.ok(special({ ...P, income: 2e7, kids: 2 }).list.find(x => x.key === 'multi').ok);   // 민영은 소득 무관
// 노부모: 65세 이상 3년 부양 + 1순위 + 세대주
a.ok(special({ ...P, income: 9e6, parent65: true }).list.find(x => x.key === 'parents').ok);
a.ok(!special({ ...P, income: 9e6, parent65: true, head: false }).list.find(x => x.key === 'parents').ok);
console.log('subscription calc: all tests passed');
