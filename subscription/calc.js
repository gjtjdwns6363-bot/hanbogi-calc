// 민영주택 청약 가점 (주택공급에 관한 규칙 별표1 가점제 적용기준, 2024.3.25 배우자 통장 합산 반영, 2026.6.15 시행본 기준)
// 날짜는 'YYYY-MM-DD' 문자열. 기간은 날짜 기준 만(滿) 개월로 센다.
const ymd = s => s.split('-').map(Number);
const key = s => { const [y, m, d] = ymd(s); return y * 10000 + m * 100 + d; };
function months(from, to) { // from~to 사이 만 개월 수 (음수면 0)
  const [y1, m1, d1] = ymd(from), [y2, m2, d2] = ymd(to);
  return Math.max(0, (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0));
}
const plusYears = (s, n) => { const [y, m, d] = ymd(s); return `${y + n}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; };
const later = (a, b) => (key(a) >= key(b) ? a : b);

// 무주택기간: 1년 미만 2점, 이후 1년마다 +2점, 15년 이상 32점
const homeScore = m => Math.min(32, 2 * (Math.floor(m / 12) + 1));
// 부양가족: 0명 5점, 1명마다 +5점, 6명 이상 35점
const depScore = n => Math.min(35, 5 + 5 * n);
// 본인 통장: 6개월 미만 1, 6개월~1년 2, 1~2년 3, … 15년 이상 17
const acctScore = m => (m < 6 ? 1 : m < 12 ? 2 : Math.min(17, Math.floor(m / 12) + 2));
// 배우자 통장: 가입기간의 50%를 본인 표에 적용, 최대 3점 (= 1년 미만 1, 1~2년 2, 2년 이상 3)
const spouseScore = m => Math.min(3, acctScore(Math.floor(m / 2)));

// in: {base, birth, married, marriage, owned, homelessSince, deps, acct, spouseAcct}
function calc(i) {
  const notes = [];
  // 기산일: 만 30세 되는 날, 30세 전에 혼인했으면 혼인신고일. 집을 가졌던 적 있으면 마지막으로 무주택이 된 날과 비교해 늦은 날.
  let start = plusYears(i.birth, 30);
  if (i.married && i.marriage && key(i.marriage) < key(start)) start = i.marriage;
  if (i.owned && i.homelessSince) start = later(start, i.homelessSince);
  let home = 0;
  if (key(start) > key(i.base)) notes.push(i.married ? '아직 무주택기간이 시작되지 않았어요.' : '만 30세 미만 미혼이면 무주택기간 점수는 0점이에요.');
  else home = homeScore(months(start, i.base));
  const dep = depScore(Math.min(6, i.deps | 0));
  const own = i.acct ? acctScore(months(i.acct, i.base)) : 0;
  const sp = i.married && i.spouseAcct ? spouseScore(months(i.spouseAcct, i.base)) : 0;
  const acct = Math.min(17, own + sp);
  if (own + sp > 17) notes.push('통장 점수는 배우자 합산해도 최대 17점이에요.');
  return { start, home, homeMonths: key(start) > key(i.base) ? 0 : months(start, i.base), dep, own, sp, acct, total: home + dep + acct, notes };
}
if (typeof module !== 'undefined') module.exports = { calc, months, homeScore, depScore, acctScore, spouseScore };
