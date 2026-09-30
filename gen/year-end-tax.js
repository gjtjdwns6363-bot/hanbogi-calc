// 총급여별 연말정산 롱테일 페이지 생성기: `node gen/year-end-tax.js` → /year-end-tax/<만원>/ + /year-end-tax/list/ + sitemap.xml의 <!-- year-end-tax --> 구간.
// 계산식은 year-end-tax/calc.js(결정세액)와 salary/calc.js(간이세액표 원천징수)를 그대로 쓴다. 생성 페이지를 손으로 고치지 말 것.
// 머리말(og·광고·GA·파비콘)과 푸터는 gen/longtail.js·gen/car.js의 page()와 같게 유지한다.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), SITE = 'https://calc.hanbogi.com';
const { calc, earnedDeduct, R } = require('../year-end-tax/calc.js');
const { net } = require('../salary/calc.js');

const won = v => Math.round(v).toLocaleString('ko-KR') + '원';
const manw = v => (Math.round(v / 1e3) / 10).toLocaleString('ko-KR') + '만원';
const kr = m => m >= 1e4 ? Math.floor(m / 1e4) + '억' + (m % 1e4 ? ' ' + (m % 1e4).toLocaleString('ko-KR') + '만원' : '원') : m.toLocaleString('ko-KR') + '만원';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const ymd = s => { const [y, m, d] = s.split('-'); return `${y}년 ${+m}월 ${+d}일`; };
const FOOTER = `<footer>© 한눈 계산기 · <a href="/">다른 계산기</a> · <a href="/about.html">사이트 소개·계산 근거</a> · <a href="/privacy.html">개인정보처리방침</a>
<p class="net">한보기 네트워크: <a href="https://home.hanbogi.com">부동산 알리미</a> · <a href="https://talk.hanbogi.com">한눈 여행회화</a> · <a href="https://grant.hanbogi.com">정부 지원금 찾기</a> · <a href="https://benefit.hanbogi.com">혜택 알리미</a> · <a href="https://license.hanbogi.com">자격증 한눈에</a> · <a href="https://hanbogi.com">오늘의 게임</a> · <a href="https://stay.hanbogi.com">오늘의 숙소</a> · <a href="https://gadget.hanbogi.com">기기 비교소</a></p></footer>`;
const ld = o => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>';
const crumbs = list => ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [['한눈 계산기', '/'], ['연말정산 환급 계산기', '/year-end-tax/'], ...list].map(([name, u], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + u })) });
const faq = qa => ld({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });

function page({ url, title, desc, body, crumb, extra = '' }) {
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
${crumbs(crumb)}${extra}
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

// 총급여(만원) 목록: 2천~1억은 500만 간격, 그 위는 1천만 간격
const LIST = [];
for (let m = 2000; m <= 10000; m += 500) LIST.push(m);
for (let m = 11000; m <= 15000; m += 1000) LIST.push(m);

// 1년 원천징수 추정: 간이세액표(소득세법 시행령 별표2) 100% 선택, 매달 같은 급여, 비과세 0
const withheld = (g, fam = 1, kids = 0) => net({ gross: g / 12, fam, kids }).income * 12;
// 시나리오 (가정은 페이지에 그대로 적는다)
const SC = [
  ['공제 거의 없음', '본인 1명, 카드 공제 없음', g => ({ gross: g, deps: 1 }), 1, 0],
  ['카드 총급여 50% 사용', '본인 1명, 신용카드 25%·체크카드 25%, 보장성보험 100만원', g => ({ gross: g, deps: 1, credit: g * .25, debit: g * .25, insurance: 1e6 }), 1, 0],
  ['+ 연금저축·IRP 900만원', '위 조건 + 연금저축 600만·IRP 300만원', g => ({ gross: g, deps: 1, credit: g * .25, debit: g * .25, insurance: 1e6, saving: 6e6, irp: 3e6 }), 1, 0],
  ['4인 외벌이', '배우자(소득 없음)·자녀 2명(9세 이상), 카드 50%, 보험 100만원', g => ({ gross: g, deps: 4, kids: 2, kidsCredit: 2, credit: g * .25, debit: g * .25, insurance: 1e6 }), 4, 2],
];
const out = [], MED = R.medical.floor, P = R.pensionAcct, CARD = R.card;

LIST.forEach((m, idx) => {
  const g = m * 1e4, url = `/year-end-tax/${m}/`, lo = g <= CARD.lowGross;
  const rows = SC.map(([name, note, f, fam, kids]) => { const i = f(g), paid = withheld(g, fam, kids), r = calc({ ...i, paid }); return { name, note, r, paid, refund: paid - r.final }; });
  const s0 = rows[0], s1 = rows[1];
  const minUse = g * CARD.minRate, cap = CARD.cap[lo ? 0 : 1];
  const fill = minUse + cap / CARD.debit;                        // 신용카드로 25%를 채운 뒤 체크카드로 한도까지
  const acctRate = g <= P.lowGross ? P.lowRate : P.rate, rentRate = g <= R.rent.lowGross ? R.rent.lowRate : g <= R.rent.maxGross ? R.rent.rate : 0;
  const saveOk = g <= R.housing.saveMaxGross, wd = earnedDeduct(g);
  const sign = v => v >= 0 ? `환급 약 <b>${manw(v)}</b>` : `추가 납부 약 <b>${manw(-v)}</b>`;
  const title = `연봉 ${kr(m)} 연말정산 환급 예상 2026 — 결정세액·카드 공제 한도·연금저축`;
  const desc = `총급여 ${kr(m)} 2026년 귀속 연말정산: 공제 없이 결정세액 ${manw(s0.r.final)}, 카드를 총급여 절반 쓰면 ${manw(s1.r.final)}. 매달 뗀 세금 대비 환급·추가 납부 예상, 카드 공제가 시작되는 사용액 ${manw(minUse)}, 연금저축 ${Math.round(acctRate * 100)}%·월세 ${rentRate ? Math.round(rentRate * 100) + '%' : '불가'} 공제율 정리.`;
  const trs = rows.map(x => `<tr><td><b>${x.name}</b><br><span class="sub">${x.note}</span></td><td class="n">${won(x.r.final)}</td><td class="n">${won(x.paid)}</td><td class="n">${x.refund >= 0 ? won(x.refund) : '<span style="color:var(--accent)">−' + won(-x.refund) + '</span>'}</td></tr>`).join('');
  const qa = [
    [`연봉 ${kr(m)}이면 연말정산 카드는 얼마부터 공제되나요?`, `총급여의 25%인 ${manw(minUse)}을 넘게 쓴 부분부터 공제돼요. 신용카드로 25%를 채우고 그 위를 체크카드·현금영수증(30%)으로 쓰면 약 ${manw(fill)}에서 기본 한도 ${manw(cap)}을 채워요.`],
    [`연봉 ${kr(m)} 연금저축 세액공제는 얼마인가요?`, `총급여 ${g <= P.lowGross ? '5,500만원 이하라 15%' : '5,500만원 초과라 12%'}예요. 연금저축·IRP 합계 900만원을 채우면 최대 ${manw(P.totalCap * acctRate)}을 돌려받지만 결정세액보다 많이 돌려받을 수는 없어요.`],
    [`연봉 ${kr(m)}도 월세 세액공제를 받을 수 있나요?`, rentRate ? `무주택 세대주라면 월세의 ${Math.round(rentRate * 100)}%를 연 1천만원 한도로 공제받아요(최대 ${manw(1e7 * rentRate)}).` : `총급여 8천만원을 넘어 월세 세액공제는 받을 수 없어요.`],
  ];
  const prev = LIST[idx - 1], next = LIST[idx + 1];
  out.push([url, page({ url, title, desc, crumb: [['총급여별 연말정산 표', '/year-end-tax/list/'], [`총급여 ${kr(m)}`, url]], extra: faq(qa), body:
`<h1>연봉 ${kr(m)} 연말정산 환급 예상 (2026년 귀속)</h1>
<p class="lead">총급여(비과세 제외) ${kr(m)}이면 공제를 거의 받지 않을 때 결정세액은 <b>${manw(s0.r.final)}</b>이에요. 매달 간이세액표대로 뗐다면 ${sign(s0.refund)}이고, 카드를 총급여 절반쯤 쓰고 보험료를 넣으면 ${sign(s1.refund)}이에요.</p>
<a class="cta" href="/year-end-tax/?gross=${m}">내 공제 항목 넣어 정확히 계산하기 →</a>
<h2>상황별 결정세액과 환급 예상</h2>
<div class="card"><div style="overflow-x:auto"><table><tr><th>상황</th><th class="n">결정세액</th><th class="n">매달 뗀 세금<br><span class="sub">1년 추정</span></th><th class="n">환급(−는 추가 납부)</th></tr>${trs}</table></div>
<p class="hint">소득세만이에요(지방소득세 10% 별도). 매달 뗀 세금은 월급이 1년 내내 ${won(g / 12)}으로 같고 비과세가 없으며 간이세액표 100%를 골랐다고 본 추정치예요. 4인 외벌이는 공제대상가족 4명·8~20세 자녀 2명 칸으로 계산했어요. 실제 기납부세액은 원천징수영수증에서 확인하세요.</p></div>
<h2>총급여 ${kr(m)} 공제 기준 한눈에</h2>
<div class="card"><table>
<tr><th>근로소득공제</th><td class="n">${won(wd)}</td></tr>
<tr><th>4대보험 추정 (국민연금 / 건강·요양·고용)</th><td class="n">${won(s0.r.ins.pension)} / ${won(s0.r.ins.health)}</td></tr>
<tr><th>카드 공제 시작 (총급여 25%)</th><td class="n">${manw(minUse)}</td></tr>
<tr><th>카드 공제 기본 한도 <span class="sub">자녀 1명 / 2명+</span></th><td class="n">${manw(cap)} <span class="sub">/ ${manw(cap + CARD.kidAdd[lo ? 0 : 1])} / ${manw(cap + CARD.kidAdd[lo ? 0 : 1] * 2)}</span></td></tr>
<tr><th>한도를 채우는 사용액 <span class="sub">25%는 신용, 나머지 체크</span></th><td class="n">약 ${manw(fill)}</td></tr>
<tr><th>전통시장·대중교통 추가 한도</th><td class="n">${manw(CARD.extraCap[lo ? 0 : 1])}${lo ? ' <span class="sub">문화체육 포함</span>' : ''}</td></tr>
<tr><th>연금저축·IRP 세액공제율</th><td class="n">${Math.round(acctRate * 100)}% <span class="sub">900만원 → ${manw(P.totalCap * acctRate)}</span></td></tr>
<tr><th>월세 세액공제율</th><td class="n">${rentRate ? Math.round(rentRate * 100) + '% <span class="sub">1천만원 → ' + manw(1e7 * rentRate) + '</span>' : '대상 아님 (8천만원 초과)'}</td></tr>
<tr><th>의료비 공제 시작 (총급여 3%)</th><td class="n">${manw(g * MED)}</td></tr>
<tr><th>주택청약종합저축 소득공제</th><td class="n">${saveOk ? '가능 <span class="sub">300만원 × 40% = 120만원</span>' : '대상 아님 (7천만원 초과)'}</td></tr>
<tr><th>문화체육(도서·공연·영화·헬스장) 30%</th><td class="n">${lo ? '가능' : '대상 아님 (7천만원 초과)'}</td></tr>
</table>
<p class="hint">근거: 소득세법(2026. 7. 1. 시행본) 제47·59조의3·59조의4, 조세특례제한법(2026. 9. 18. 시행본) 제87·95조의2·126조의2. 결정세액은 <a href="/year-end-tax/">연말정산 계산기</a>와 같은 식이고, 항목별 공제와 표준세액공제(13만원) 중 유리한 쪽을 골랐어요. 기준일 ${ymd(R.updated)}.</p></div>
<h2>자주 묻는 질문</h2>
<div class="card">${qa.map(([q, a]) => `<p><b>Q. ${q}</b><br>${a}</p>`).join('')}</div>
<nav class="pn">${prev ? `<a href="/year-end-tax/${prev}/">← ${kr(prev)}</a>` : '<span></span>'}<a href="/year-end-tax/list/">총급여별 전체 표</a>${next ? `<a href="/year-end-tax/${next}/">${kr(next)} →</a>` : '<span></span>'}</nav>
<p>🧮 함께 쓰는 계산기: <a href="/salary/${m}/">연봉 ${kr(m)} 실수령액</a> · <a href="/year-end-tax/">연말정산 환급 계산기</a> · <a href="/eitc/">근로장려금 계산기</a></p>`
  })]);
});

// 목록
out.push(['/year-end-tax/list/', page({ url: '/year-end-tax/list/', crumb: [['총급여별 연말정산 표', '/year-end-tax/list/']],
  title: '총급여별 연말정산 예상표 2026 — 연봉 2천~1억5천 결정세액·환급',
  desc: `총급여 ${kr(LIST[0])}부터 ${kr(LIST[LIST.length - 1])}까지 2026년 귀속 연말정산 결정세액, 매달 뗀 세금 대비 환급·추가 납부 예상, 카드 공제 시작 금액을 한 표로 정리했어요.`,
  body: `<h1>총급여별 연말정산 예상표 (2026년 귀속)</h1>
<p class="lead">본인 1명, 카드를 총급여 절반(신용 25%·체크 25%) 쓰고 보장성보험 100만원을 넣었다고 가정한 결정세액과 환급 예상이에요. 총급여를 누르면 상황별 표와 공제 기준을 볼 수 있어요.</p>
<a class="cta" href="/year-end-tax/">내 조건으로 계산하기 →</a>
<div class="card"><div style="overflow-x:auto"><table><tr><th>총급여</th><th class="n">결정세액</th><th class="n">매달 뗀 세금(1년)</th><th class="n">환급 예상</th><th class="n">카드 공제 시작</th></tr>${LIST.map(m => { const g = m * 1e4, i = SC[1][2](g), paid = withheld(g), r = calc({ ...i, paid }); return `<tr><td><a href="/year-end-tax/${m}/">${kr(m)}</a></td><td class="n">${won(r.final)}</td><td class="n">${won(paid)}</td><td class="n">${r.refund >= 0 ? won(r.refund) : '−' + won(-r.refund)}</td><td class="n">${manw(g * CARD.minRate)}</td></tr>`; }).join('')}</table></div>
<p class="hint">소득세만(지방소득세 10% 별도). 매달 뗀 세금은 간이세액표 100%·가족 1명·비과세 0 추정이에요. 기준일 ${ymd(R.updated)}.</p></div>`
})]);

// 쓰기: 예전 생성분(숫자 폴더·list)을 지우고 다시 만든다
const dir = path.join(ROOT, 'year-end-tax');
for (const d of fs.readdirSync(dir)) if (/^\d+$/.test(d) || d === 'list') fs.rmSync(path.join(dir, d), { recursive: true });
for (const [url, html] of out) { const d = path.join(ROOT, url); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'index.html'), html); }
const today = new Date().toLocaleDateString('sv-SE'), smPath = path.join(ROOT, 'sitemap.xml');
const sm = fs.readFileSync(smPath, 'utf8').replace(/<!-- year-end-tax -->[\s\S]*<!-- \/year-end-tax -->\n/, '');
fs.writeFileSync(smPath, sm.replace('</urlset>', '<!-- year-end-tax -->\n' + out.map(([u]) => `<url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') + '\n<!-- /year-end-tax -->\n</urlset>'));
console.log(`생성 ${out.length}쪽: 총급여 ${LIST.length}, 목록 1`);
