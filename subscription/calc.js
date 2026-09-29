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

// ---------------- 1순위·예치금·특별공급 (2026-09-27 추가) ----------------
// 출처: 주택공급에 관한 규칙 [시행 2026.6.15.] 제28조(민영 1순위·가점제 비율)·제40·41·43·46·48조(특별공급),
//       청약홈 '청약통장' 지역별 예치금액(규칙 별표2)·'규제지역정보'(확인 2026-09-27)·'특별공급 소득기준'(2025년도 도시근로자 월평균소득).
const SUB = {
  checked: '2026-09-27',
  // 투기과열지구 = 청약과열지역 (청약홈 규제지역정보, 2026-09-27 확인). 청약위축지역은 지정 없음.
  regulated: { '서울특별시': ['전역'], '경기도': ['과천시', '광명시', '수원시 영통구', '수원시 장안구', '수원시 팔달구', '성남시 분당구', '성남시 수정구', '성남시 중원구', '안양시 동안구', '용인시 수지구', '용인시 기흥구', '화성시 동탄구', '의왕시', '하남시', '구리시'] },
  sido: ['서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시', '대전광역시', '울산광역시', '세종특별자치시', '경기도', '강원특별자치도', '충청북도', '충청남도', '전북특별자치도', '전라남도', '경상북도', '경상남도', '제주특별자치도'],
  capital: ['서울특별시', '인천광역시', '경기도'],
  // 별표2 예치기준금액(만원): [85㎡ 이하, 102㎡ 이하, 135㎡ 이하, 모든 면적]
  deposit: { seoulBusan: [300, 600, 1000, 1500], metro: [250, 400, 700, 1000], other: [200, 300, 400, 500] },
  areas: ['85㎡ 이하', '102㎡ 이하', '135㎡ 이하', '135㎡ 초과'],
  // 청약홈 게시 '2025년도 도시근로자 가구원수별 월평균소득'(100%, 원): 3인 이하·4인·5인 (6인 이상은 모집공고 확인)
  income: { 3: 7533763, 4: 8802202, 5: 9326985 },
  assetCap: 331000000, // 부동산가액 기준(국민건강보험법 시행령 별표4 재산등급 29등급 평균) — 청약홈 안내 3억 3,100만원
};
const depositGroup = sido => sido === '서울특별시' || sido === '부산광역시' ? 'seoulBusan' : /광역시$/.test(sido) ? 'metro' : 'other';
const isRegulated = (sido, sigungu) => { const L = SUB.regulated[sido]; return !!L && (L[0] === '전역' || L.includes(sigungu)); };
const incomeLimit = (size, pct) => { const b = SUB.income[Math.min(Math.max(size, 3), 5)]; return Math.round(b * pct / 100); };
// 민영주택 1순위 가점제 비율(제28조②④): 전용면적(㎡)과 규제 여부
function gajeomShare(area, reg) {
  if (area <= 60) return reg ? '가점제 40% · 추첨제 60%' : '가점제 40% 이하(시장·군수·구청장 공고) · 나머지 추첨';
  if (area <= 85) return reg ? '가점제 70% · 추첨제 30%' : '가점제 40% 이하(시장·군수·구청장 공고) · 나머지 추첨';
  return reg ? '가점제 80% · 추첨제 20% (투기과열지구, 청약과열지역만이면 50%)' : '추첨제 100%';
}
// i: {base, sido, sigungu, acct 가입일, deposit 납입인정금액(만원), areaIdx 0~3, head 세대주, won5 5년 내 당첨 세대, homes 세대 보유 주택 수}
function rank1(i) {
  const reg = isRegulated(i.sido, i.sigungu), cap = SUB.capital.includes(i.sido);
  const need = SUB.deposit[depositGroup(i.sido)][i.areaIdx | 0];
  const m = i.acct ? months(i.acct, i.base) : 0;
  const needM = reg ? 24 : cap ? 12 : 6;
  const fails = [];
  if (!i.acct) fails.push('청약통장이 없어요.');
  else if (m < needM) fails.push(`가입 ${needM}개월이 지나야 해요(지금 ${m}개월).`);
  if ((i.deposit || 0) < need) fails.push(`예치금이 ${need}만원 이상이어야 해요(지금 ${(i.deposit || 0).toLocaleString('ko-KR')}만원).`);
  if (reg) {
    if (!i.head) fails.push('투기과열지구·청약과열지역은 세대주만 1순위예요.');
    if (i.won5) fails.push('과거 5년 안에 세대원이 당첨된 적이 있으면 1순위가 안 돼요.');
    if ((i.homes | 0) >= 2) fails.push('2주택 이상 세대는 1순위가 안 돼요.');
  }
  const notes = [];
  if (!reg) notes.push(cap ? '시·도지사가 과열 우려로 가입기간을 24개월까지 늘려 공고할 수 있어요.' : '시·도지사가 과열 우려로 가입기간을 12개월까지 늘려 공고할 수 있어요.');
  if (reg && (i.homes | 0) === 1) notes.push('1주택 세대는 1순위여도 가점제 대상에서 빠지고 추첨제로만 경쟁해요.');
  return { ok: !fails.length, reg, capital: cap, need, needM, months: m, fails, notes };
}
// 특별공급(민영주택) 자격 판별. i: rank1 입력 + {marriage, married, kids 미성년 자녀 수, anyKid 혼인 중 출산·임신·입양 자녀, size 가구원 수,
//   income 세대 월평균소득(원), dual 맞벌이, everOwned 세대원 누구라도 주택 소유 이력, homeless 지금 세대 전원 무주택, tax5 5년 이상 소득세 납부, parent65 65세+ 직계존속 3년 이상 등재, asset 부동산가액(원)}
function special(i) {
  const r1 = rank1(i), base = i.base, out = [];
  const acctOk = !!i.acct && months(i.acct, base) >= 6 && (i.deposit || 0) >= r1.need; // 제48조 제2호
  const tier = (lo, hi) => i.income <= incomeLimit(i.size, lo) ? `우선공급(소득 ${lo}% 이하)` : i.income <= incomeLimit(i.size, hi) ? `일반공급(소득 ${hi}% 이하)` : (i.asset != null && i.asset <= SUB.assetCap) ? '추첨공급(소득 초과, 부동산 3억 3,100만원 이하)' : null;
  const bigHouse = (i.size | 0) > 5 ? ' 6인 이상 가구 소득 기준은 모집공고문에서 확인하세요.' : '';
  // 신혼부부 (제41조①③)
  { const why = []; const yrs = i.married && i.marriage ? months(i.marriage, base) : -1;
    if (!i.married || !i.marriage) why.push('혼인신고를 한 부부만 신청할 수 있어요.');
    else if (yrs >= 84) why.push(`혼인 7년이 지났어요(혼인 ${Math.floor(yrs / 12)}년 ${yrs % 12}개월).`);
    if (!i.homeless) why.push('세대원 전원이 무주택이어야 해요.');
    if (!acctOk) why.push('청약통장 가입 6개월·예치금 요건이 필요해요.');
    const lo = i.dual ? 120 : 100, hi = i.dual ? 160 : 140, t = tier(lo, hi);
    if (!t) why.push(`세대 월평균소득이 ${hi}%(${incomeLimit(i.size, hi).toLocaleString('ko-KR')}원)를 넘고 부동산가액 기준도 넘어요.`);
    out.push({ key: 'newlywed', name: '신혼부부', ok: !why.length, why, tier: t, rank: i.anyKid ? '1순위(혼인 중 자녀)' : '2순위(자녀 없음)',
      note: (i.dual ? '맞벌이 우선공급은 부부 중 한 명의 소득이 100%를 넘으면 안 돼요.' : '') + bigHouse }); }
  // 생애최초 (제43조③④)
  { const why = []; const family = i.married || (i.kids | 0) > 0 || i.anyKid;
    if (!r1.ok) why.push('1순위여야 해요: ' + r1.fails.join(' '));
    if (i.everOwned) why.push('세대원 모두 주택을 가진 적이 없어야 해요.');
    if (!i.tax5) why.push('근로자·자영업자로 5년 이상 소득세를 냈어야 해요(공제로 낼 세금이 없던 해 포함).');
    let t = family ? tier(130, 160) : (i.income <= incomeLimit(i.size, 160) || (i.asset != null && i.asset <= SUB.assetCap)) ? '추첨공급(1인 가구)' : null;
    if (!t) why.push(`세대 월평균소득이 160%(${incomeLimit(i.size, 160).toLocaleString('ko-KR')}원)를 넘고 부동산가액 기준도 넘어요.`);
    out.push({ key: 'first', name: '생애최초', ok: !why.length, why, tier: t, rank: '추첨',
      note: (family ? '' : '미혼·무자녀(1인 가구)는 전용 60㎡ 이하만, 추첨 물량(30%)에서만 신청할 수 있어요.') + bigHouse }); }
  // 다자녀 (제40조①)
  { const why = [];
    if ((i.kids | 0) < 2) why.push('미성년 자녀가 2명 이상이어야 해요(태아·입양 포함).');
    if (!i.homeless) why.push('세대원 전원이 무주택이어야 해요.');
    if (!acctOk) why.push('청약통장 가입 6개월·예치금 요건이 필요해요.');
    out.push({ key: 'multi', name: '다자녀가구', ok: !why.length, why, tier: null, rank: '배점표 순', note: '민영주택은 소득 기준이 없어요. 자녀 수·무주택기간·거주기간 등 배점표 점수로 뽑아요.' }); }
  // 노부모 부양 (제46조①)
  { const why = [];
    if (!i.parent65) why.push('만 65세 이상 직계존속(배우자 쪽 포함)을 3년 이상 같은 등본에서 부양해야 해요.');
    if (!r1.ok) why.push('1순위여야 해요: ' + r1.fails.join(' '));
    if (!i.head) why.push('세대주여야 해요.');
    if (!i.homeless) why.push('세대원 전원이 무주택이어야 해요(부양하는 부모와 그 배우자 포함).');
    out.push({ key: 'parents', name: '노부모부양', ok: !why.length, why, tier: null, rank: '가점제', note: '민영주택은 일반공급과 같은 가점제로 뽑아요. 피부양자의 배우자가 집을 가졌던 기간은 무주택기간에서 빠져요.' }); }
  return { rank1: r1, list: out };
}
if (typeof module !== 'undefined') Object.assign(module.exports, { SUB, rank1, special, isRegulated, depositGroup, incomeLimit, gajeomShare });

// ---------------- 신혼희망타운 공공분양 배점 (2026-09-29 추가) ----------------
// 근거: 공공주택 특별법 시행규칙 제19조제4항·별표 6의3 (2026.6.22 개정본, 국가법령정보센터 확인 2026-09-29). 주택공급에 관한 규칙이 아니다.
// 선정: 30%(가목, 혼인 2년 이내·2세 이하 자녀) 배점 → 60%(나목, 혼인 2~7년·3~6세 자녀 + 가목 탈락자) 배점 → 나머지 추첨. 동점은 추첨, 1·2순위 없음.
// i: {base, married, marriage, kids, young('none'|'le2'|'3to6'|'ge7' 막내 나이), homeless, homeMonths, resYears(시·도 연속 거주 0/1/2년), acct, payCnt, income(원), size, dual}
function hopeTown(i) {
  const why = [], base = i.base;
  const mm = i.married && i.marriage ? months(i.marriage, base) : -1;
  const y = (i.kids | 0) > 0 || i.anyKid ? i.young || 'ge7' : 'none';
  const child6 = y === 'le2' || y === '3to6';
  if (mm < 0) why.push('혼인신고를 한 부부만 계산해요(예비신혼부부·한부모는 공고문 확인).');
  else if (mm >= 84 && !child6) why.push('혼인 7년이 지났고 6세 이하 자녀도 없어요.');
  if (!i.homeless) why.push('세대원 전원이 무주택이어야 해요.');
  const pay = i.payCnt != null ? i.payCnt : i.acct ? months(i.acct, base) : 0;
  if (!i.acct || months(i.acct, base) < 6 || pay < 6) why.push('청약통장 가입 6개월이 지나고 6회 이상 납입해야 해요.');
  const capAll = incomeLimit(i.size, i.dual ? 200 : 130), capScore = incomeLimit(i.size, i.dual ? 140 : 130);
  if (i.income > capAll) why.push(`세대 월평균소득이 ${i.dual ? 200 : 130}%(${capAll.toLocaleString('ko-KR')}원)를 넘어요.`);
  if (why.length) return { ok: false, why, stage: null };
  const pct = i.income / incomeLimit(i.size, 100) * 100;
  const incS = pct <= (i.dual ? 80 : 70) ? 3 : pct <= (i.dual ? 110 : 100) ? 2 : 1;
  const resS = i.resYears >= 2 ? 3 : i.resYears >= 1 ? 2 : 1;
  const payS = pay >= 24 ? 3 : pay >= 12 ? 2 : 1;
  const kidS = Math.min(3, i.kids | 0), homeS = i.homeMonths >= 36 ? 3 : i.homeMonths >= 12 ? 2 : 1;
  const A = { score: incS + resS + payS, max: 9, parts: [['소득', incS], ['시·도 거주', resS], ['통장 납입', payS]] };
  const B = { score: kidS + homeS + resS + payS, max: 12, parts: [['미성년 자녀', kidS], ['무주택기간', homeS], ['시·도 거주', resS], ['통장 납입', payS]] };
  const inA = key(plusYears(i.marriage, 2)) >= key(base) || y === 'le2', inB = mm < 84 || child6;
  const scored = i.income <= capScore;
  const stage = !scored ? '다목' : inA ? '가목' : inB ? '나목' : '다목';
  return { ok: true, why, stage, A, B, scored, pct: Math.round(pct), pay, capScore };
}
if (typeof module !== 'undefined') Object.assign(module.exports, { hopeTown });
