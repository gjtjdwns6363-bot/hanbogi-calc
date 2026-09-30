// 장려금·육아휴직 롱테일 생성기: `node gen/benefit.js`
// → /eitc/single/, /eitc/one-earner/, /eitc/two-earner/ (가구 유형별 소득 표)
//   /parental-leave/wage-<만원>/ (월급 200만~500만, 10만 단위) + /parental-leave/wage/ (목록)
//   + sitemap.xml의 <!-- benefit --> 구간만 교체.
// 금액은 eitc/calc.js·parental-leave/calc.js를 그대로 쓴다. 생성 페이지를 손으로 고치지 말 것.
// 머리말(og·광고·GA·파비콘)과 푸터는 gen/longtail.js·gen/car.js의 page()와 같게 유지한다.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), SITE = 'https://calc.hanbogi.com';
const E = require('../eitc/calc.js'), P = require('../parental-leave/calc.js');

const won = v => Math.round(v).toLocaleString('ko-KR') + '원';
const manw = v => (Math.round(v / 1e3) / 10).toLocaleString('ko-KR') + '만원';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const FOOTER = `<footer>© 한눈 계산기 · <a href="/">다른 계산기</a> · <a href="/about.html">사이트 소개·계산 근거</a> · <a href="/privacy.html">개인정보처리방침</a>
<p class="net">한보기 네트워크: <a href="https://home.hanbogi.com">부동산 알리미</a> · <a href="https://talk.hanbogi.com">한눈 여행회화</a> · <a href="https://grant.hanbogi.com">정부 지원금 찾기</a> · <a href="https://benefit.hanbogi.com">혜택 알리미</a> · <a href="https://license.hanbogi.com">자격증 한눈에</a> · <a href="https://hanbogi.com">오늘의 게임</a> · <a href="https://stay.hanbogi.com">오늘의 숙소</a> · <a href="https://gadget.hanbogi.com">기기 비교소</a></p></footer>`;
const ld = o => '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', ...o }).replace(/</g, '\\u003c') + '</script>';
const crumbs = list => ld({ '@type': 'BreadcrumbList', itemListElement: [['한눈 계산기', '/'], ...list].map(([name, u], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + u })) });
const faq = qa => ld({ '@type': 'FAQPage', mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });

function page({ url, title, desc, body, crumb, qa }) {
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="naver-site-verification" content="21421c877a507dea4b5be99d5ec0d9e9fd8d7b50" />
<title>${esc(title)} | 한눈 계산기</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}${url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="한눈 계산기"><meta property="og:locale" content="ko_KR">
<meta property="og:image" content="${SITE}/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image">
${crumbs(crumb)}${qa ? '\n' + faq(qa) : ''}
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon-32.png" sizes="32x32"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="stylesheet" href="/style.css"><script src="/common.js" defer></script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5424435978828190" crossorigin="anonymous"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-19F8RF6971"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","G-19F8RF6971");</script>
<style>.sub{font-size:.85rem;color:var(--muted)}td.n,th.n{text-align:right;white-space:nowrap}table{font-size:.85rem}</style>
</head>
<body>
<header><a href="/">한눈 계산기</a></header>
<main>
${body}
</main>
${FOOTER}
</body></html>
`;
}
const out = [];
const G = s => `https://grant.hanbogi.com/t/${encodeURIComponent(s)}/`;

// ── 장려금: 가구 유형별 소득 표 ──
const HH = [['single', 'single', '단독가구', '배우자·18세 미만 부양자녀·70세 이상 부양 부모가 모두 없는 가구'],
  ['one', 'one-earner', '홑벌이가구', '배우자의 총급여액 등이 300만 원 미만이거나, 배우자 없이 부양자녀·70세 이상 부양 부모가 있는 가구'],
  ['two', 'two-earner', '맞벌이가구', '본인과 배우자 모두 총급여액 등이 300만 원 이상인 가구']];
for (const [t, slug, name, def] of HH) {
  const p = E.EITC[t], url = `/eitc/${slug}/`, kids = t !== 'single';
  const incs = []; for (let m = 100; m < p.cap; m += 100) incs.push(m);
  if (kids) for (let m = Math.ceil(p.cap / 500) * 500; m < 7000; m += 500) incs.push(m);
  if (kids) incs.push(6900);
  const r = (m, o = {}) => E.calc({ type: t, income: m * 1e4, kids: 0, asset: 'low', ...o });
  const rows = incs.map(m => { const a = r(m), k1 = kids ? E.calc({ type: t, income: m * 1e4, kids: 1, asset: 'low' }).ctc : 0;
    return `<tr><td>${m.toLocaleString('ko-KR')}만 원</td><td class="n"><b>${won(a.eitc)}</b></td><td class="n">${won(r(m, { asset: 'mid' }).eitc)}</td><td class="n">${won(r(m, { late: true }).eitc)}</td>${kids ? `<td class="n">${won(k1)}</td><td class="n">${won(k1 * 2)}</td><td class="n">${won(k1 * 3)}</td>` : ''}</tr>`; }).join('');
  const title = `${name} 근로장려금${kids ? '·자녀장려금' : ''} 소득별 금액표 2026 (2025년 소득분)`;
  const desc = `${name} 근로장려금은 최대 ${p.max}만 원, 총소득 ${p.cap.toLocaleString('ko-KR')}만 원 미만이면 받아요. 소득 100만 원 단위 예상액과 재산 감액(50%)·기한 후 신청(95%) 금액${kids ? ', 자녀 1~3명 자녀장려금' : ''}을 한 표로 정리했어요.`;
  const other = HH.filter(h => h[0] !== t).map(h => `<a href="/eitc/${h[1]}/">${h[2]}</a>`).join(' · ');
  out.push([url, page({ url, title, desc, crumb: [['근로·자녀장려금 계산기', '/eitc/'], [name + ' 소득별 금액표', url]],
    qa: [[`${name} 근로장려금은 최대 얼마인가요?`, `2025년 소득분 기준 ${name}는 부부합산 총소득 ${p.up.toLocaleString('ko-KR')}만~${p.flatEnd.toLocaleString('ko-KR')}만 원 구간에서 최대 ${p.max}만 원을 받고, 총소득 ${p.cap.toLocaleString('ko-KR')}만 원 이상이면 받을 수 없습니다.`],
      [`${name}는 어떤 가구인가요?`, def + '입니다.']],
    body: `<h1>${esc(name)} 근로장려금${kids ? '·자녀장려금' : ''} 소득별 금액표</h1>
<p class="lead">${esc(def)}예요. 2025년 소득분(2026년 신청) ${name} 근로장려금은 총소득 <b>${p.up.toLocaleString('ko-KR')}만~${p.flatEnd.toLocaleString('ko-KR')}만 원</b>에서 최대 <b>${p.max}만 원</b>이고, ${p.cap.toLocaleString('ko-KR')}만 원 이상이면 받을 수 없어요.${kids ? ' 자녀장려금은 총소득 7,000만 원 미만이면 자녀 1명당 최대 100만 원이에요.' : ''}</p>
<a class="cta" href="/eitc/">내 소득·재산으로 계산하기 →</a>
<h2>소득별 예상 장려금 <span class="hint">총소득(부부합산) 구간의 시작 금액 기준</span></h2>
<div class="card"><div style="overflow-x:auto"><table><tr><th>총소득</th><th class="n">근로장려금</th><th class="n">재산 1.7억~2.4억<br><span class="sub">50%</span></th><th class="n">기한 후 신청<br><span class="sub">95%</span></th>${kids ? '<th class="n">자녀 1명</th><th class="n">자녀 2명</th><th class="n">자녀 3명</th>' : ''}</tr>${rows}</table></div>
<p class="hint">총소득 = 근로소득 총급여 + 사업소득(매출 × 업종별 조정률 20~90%) + 종교인소득 등. 표의 금액은 그 소득 구간(100만 원 단위)의 산정액이에요. 재산 2억 4천만 원 이상이면 받을 수 없고, 기한 후 신청에 재산 감액까지 겹치면 둘 다 적용돼요.${kids ? ' 자녀장려금은 자녀세액공제를 받았으면 그만큼 빠져요.' : ''} 근거: 조세특례제한법 제100조의5·제100조의29, 시행령 별표 11·11의2, 국세청 안내(2026년 9월 27일 확인).</p></div>
<h2>신청과 지급</h2>
<div class="card"><p>정기신청(5월)분은 9월 말까지(2026년은 8월 27일) 지급됐고, 2025년 소득분 기한 후 신청은 <b>2026년 12월 1일까지</b> 홈택스·손택스·ARS(1544-9944)로 할 수 있어요. 기한 후 신청은 95%를 신청일부터 4개월 안에 받아요.</p></div>
<p>📊 다른 가구 유형: ${other}</p>
<p>🔎 정부 지원금 찾기: <a href="${G('저소득')}">저소득 가구</a> · <a href="${G(t === 'single' ? '1인-가구' : '다자녀')}">${t === 'single' ? '1인 가구' : '다자녀'}</a> 지원금 모음</p>
<p>🧮 함께 쓰는 계산기: <a href="/eitc/">근로·자녀장려금 계산기</a> · <a href="/salary/">연봉 실수령액 계산기</a> · <a href="/year-end-tax/">연말정산 계산기</a></p>` })]);
}

// ── 육아휴직: 월급별 ──
const WAGES = []; for (let m = 200; m <= 500; m += 10) WAGES.push(m);
const combosNote = '자녀 생후 18개월 안에 부부 모두 쓰는 경우(6+6 특례), 배우자 월급도 같다고 가정';
WAGES.forEach((m, i) => {
  const wage = m * 1e4, url = `/parental-leave/wage-${m}/`;
  const solo = P.calc({ wage, months: 18, mode: 'bothLater', spouseMonths: 18 }), six = P.calc({ wage, months: 6, mode: 'both18', spouseMonths: 6 });
  const single = P.calc({ wage, months: 18, mode: 'single' }), t12 = solo.rows.slice(0, 12).reduce((s, r) => s + r.pay, 0);
  const cb = P.combos(wage, wage), sp = P.spouseLeave(wage), sh = [35, 30, 25, 20, 15].map(a => [a, P.shortHours({ wage, after: a })]);
  const title = `월급 ${m}만원 육아휴직 급여 2026 — 월별 금액·6+6 부모육아휴직 총액`;
  const desc = `월 통상임금 ${m}만 원이면 육아휴직 급여는 1~3개월 월 ${manw(solo.rows[0].pay)}, 4~6개월 ${manw(solo.rows[3].pay)}, 7개월부터 ${manw(solo.rows[6].pay)}이고 12개월 총 ${manw(t12)}이에요. 6+6 부모육아휴직 부부 합계 ${manw(six.total * 2)}, 근로시간 단축·배우자 출산휴가 급여까지 정리했어요.`;
  const mrows = solo.rows.map((r, j) => `<tr><td>${r.m}개월째</td><td class="n">${won(r.pay)}</td><td class="n">${j < 6 ? won(six.rows[j].pay) : '—'}</td><td class="n">${won(single.rows[j].pay)}</td></tr>`).join('');
  const nav = [WAGES[i - 1], WAGES[i + 1]].map((w, k) => w ? `<a href="/parental-leave/wage-${w}/">${k ? '' : '← '}월급 ${w}만원${k ? ' →' : ''}</a>` : '<span></span>').join('');
  out.push([url, page({ url, title, desc, crumb: [['육아휴직 급여 계산기', '/parental-leave/'], ['월급별 육아휴직 급여', '/parental-leave/wage/'], [`월급 ${m}만원`, url]],
    qa: [[`월급 ${m}만원이면 육아휴직 급여는 얼마인가요?`, `월 통상임금 ${m}만 원 기준 2026년 육아휴직 급여는 1~3개월째 월 ${won(solo.rows[0].pay)}, 4~6개월째 ${won(solo.rows[3].pay)}, 7개월째부터 ${won(solo.rows[6].pay)}이고, 12개월 합계 ${won(t12)}입니다. 사후지급금 없이 휴직 중 전액 받고 비과세입니다.`],
      [`월급 ${m}만원 부부가 6+6으로 쓰면 얼마인가요?`, `자녀 생후 18개월 안에 부부 모두 6개월씩 쓰면 한 사람당 ${won(six.total)}, 부부 합계 ${won(six.total * 2)}입니다.`]],
    body: `<h1>월급 ${m}만원 육아휴직 급여 (2026년)</h1>
<p class="lead">월 통상임금 <b>${m}만 원</b>이면 혼자 12개월 쓸 때 총 <b>${manw(t12)}</b>, 부부가 자녀 생후 18개월 안에 6개월씩 쓰면(6+6) 부부 합계는 <b>${manw(six.total * 2)}</b>예요. 사후지급금 없이 휴직 중에 전액, 비과세로 받아요.</p>
<a class="cta" href="/parental-leave/?wage=${wage}">내 조건으로 계산하기 →</a>
<h2>월별 육아휴직 급여</h2>
<div class="card"><div style="overflow-x:auto"><table><tr><th>개월</th><th class="n">일반</th><th class="n">6+6 부모 함께</th><th class="n">한부모</th></tr>${mrows}
<tr><th>합계</th><th class="n">12개월 ${won(t12)}<br>18개월 ${won(solo.total)}</th><th class="n">6개월 ${won(six.total)}</th><th class="n">18개월 ${won(single.total)}</th></tr></table></div>
<p class="hint">일반: 1~3개월 100%(상한 250만), 4~6개월 100%(상한 200만), 7개월부터 80%(상한 160만), 하한 70만 원. 6+6: 부모가 공통으로 쓴 개월 수(최대 6개월)까지 100%, 상한 250·250·300·350·400·450만 원. 1년을 넘겨 18개월까지는 부모가 각각 3개월 이상 쓰거나 한부모일 때 가능해요.</p></div>
<h2>부부 휴직 조합별 총액 <span class="hint">${combosNote}</span></h2>
<div class="card"><div style="overflow-x:auto"><table><tr><th>나 + 배우자</th><th class="n">나</th><th class="n">배우자</th><th class="n">합계</th></tr>${cb.map(c => `<tr><td>${c.m1}개월 + ${c.m2}개월</td><td class="n">${won(c.me)}</td><td class="n">${won(c.sp)}</td><td class="n"><b>${won(c.total)}</b></td></tr>`).join('')}</table></div></div>
<h2>육아기 근로시간 단축 급여 <span class="hint">주 40시간 기준</span></h2>
<div class="card"><div style="overflow-x:auto"><table><tr><th>단축 후</th><th class="n">단축 급여(월)</th><th class="n">회사 월급(비례)</th><th class="n">합계</th></tr>${sh.map(([a, s]) => `<tr><td>주 ${a}시간</td><td class="n"><b>${won(s.pay)}</b></td><td class="n">${won(s.keep)}</td><td class="n">${won(s.keep + s.pay)}</td></tr>`).join('')}</table></div>
<p class="hint">매주 처음 10시간 단축분은 통상임금 100%(상한 250만), 나머지는 80%(상한 160만)를 단축 전 근로시간(40시간)으로 나눠 계산해요. 하한 50만 원. 근거: 고용보험법 시행령 제104조의2.</p></div>
<h2>배우자 출산휴가 20일</h2>
<div class="card"><p>20일분 통상임금 <b>${won(sp.full)}</b>(월 ${m}만 원 ÷ 209시간 × 8시간 × 20일). 중소기업(우선지원대상기업)은 고용보험이 <b>${won(sp.gov)}</b>${sp.employer ? `, 회사가 ${won(sp.employer)}` : ''}를 줘요. 대규모 기업은 회사가 전액 줘요. 상한 20일 1,684,210원(고용노동부고시 제2025-124호).</p></div>
<div class="pn">${nav}</div>
<p>📊 <a href="/parental-leave/wage/">월급별 육아휴직 급여 전체 목록</a></p>
<p>🔎 정부 지원금 찾기: <a href="${G('출산-산모')}">출산·산모</a> · <a href="${G('영유아')}">영유아</a> · <a href="${G('신혼부부')}">신혼부부</a> 지원금 모음</p>
<p>🧮 함께 쓰는 계산기: <a href="/parental-leave/">육아휴직 급여 계산기</a> · <a href="/salary/">연봉 실수령액 계산기</a> · <a href="/unemployment/">실업급여 계산기</a></p>
<p class="hint">기준: 고용보험법 제70조·제73조, 시행령 제95조·제95조의3, 찾기쉬운 생활법령정보(2026. 8. 15. 기준), ${P.RATES.updated} 확인. 참고용이며 실제 금액은 고용센터가 정해요.</p>` })]);
});
out.push(['/parental-leave/wage/', page({ url: '/parental-leave/wage/', crumb: [['육아휴직 급여 계산기', '/parental-leave/'], ['월급별 육아휴직 급여', '/parental-leave/wage/']],
  title: '월급별 육아휴직 급여 표 2026 — 200만~500만원 월별·총액',
  desc: '월 통상임금 200만~500만 원(10만 원 단위)별 2026년 육아휴직 급여 월별 금액, 12개월 총액, 6+6 부모육아휴직 부부 합계를 한 표로 정리했어요.',
  body: `<h1>월급별 육아휴직 급여 표 (2026년)</h1>
<p class="lead">월 통상임금별로 1~3개월·4~6개월·7개월부터 받는 금액과 12개월 총액, 6+6 부모육아휴직 부부 합계예요. 월급을 누르면 자세한 표가 나와요.</p>
<a class="cta" href="/parental-leave/">내 조건으로 계산하기 →</a>
<div class="card"><div style="overflow-x:auto"><table><tr><th>월 통상임금</th><th class="n">1~3개월</th><th class="n">4~6개월</th><th class="n">7개월~</th><th class="n">12개월 총액</th><th class="n">6+6 부부 합계</th></tr>${WAGES.map(m => { const w = m * 1e4, r = P.calc({ wage: w, months: 12, mode: 'solo' }), s6 = P.calc({ wage: w, months: 6, mode: 'both18', spouseMonths: 6 });
    return `<tr><td><a href="/parental-leave/wage-${m}/">${m}만원</a></td><td class="n">${won(r.rows[0].pay)}</td><td class="n">${won(r.rows[3].pay)}</td><td class="n">${won(r.rows[6].pay)}</td><td class="n">${won(r.total)}</td><td class="n">${won(s6.total * 2)}</td></tr>`; }).join('')}</table></div>
<p class="hint">월 500만 원이 넘어도 상한 때문에 500만 원과 같아요(6+6은 450만 원부터 같음). 기준 ${P.RATES.updated}.</p></div>` })]);

// 쓰기: 예전 생성분을 지우고 다시 만든다 (eitc/·parental-leave/의 손으로 만든 파일은 남긴다)
const keep = new Set(['index.html', 'calc.js', 'test.js']);
for (const dir of ['eitc', 'parental-leave']) for (const d of fs.readdirSync(path.join(ROOT, dir))) if (!keep.has(d)) fs.rmSync(path.join(ROOT, dir, d), { recursive: true });
for (const [url, html] of out) { const d = path.join(ROOT, url); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'index.html'), html); }
const today = new Date().toLocaleDateString('sv-SE'), smPath = path.join(ROOT, 'sitemap.xml');
const sm = fs.readFileSync(smPath, 'utf8').replace(/<!-- benefit -->[\s\S]*<!-- \/benefit -->\n/, '');
fs.writeFileSync(smPath, sm.replace('</urlset>', '<!-- benefit -->\n' + out.map(([u]) => `<url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') + '\n<!-- /benefit -->\n</urlset>'));
console.log(`생성 ${out.length}쪽: 장려금 가구 유형 ${HH.length}, 육아휴직 월급별 ${WAGES.length} + 목록 1`);
