// 양도차익별 양도세 롱테일 생성기: `node gen/capital-gains.js` → /capital-gains/gain-<만원>/ + /capital-gains/list/ + sitemap.xml의 <!-- capital-gains --> 구간.
// 세액은 capital-gains/calc.js의 calc()를 그대로 쓴다. 세율·공제가 바뀌면 calc.js만 고치고 이 스크립트를 다시 실행한다. 생성 페이지를 손으로 고치지 말 것.
// 머리말(og·광고·GA·파비콘)과 푸터는 gen/longtail.js·gen/car.js의 page()와 같게 유지한다.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), SITE = 'https://calc.hanbogi.com', DIR = 'capital-gains';
const { calc, RULES } = require('../capital-gains/calc.js');

const won = v => Math.round(v).toLocaleString('ko-KR') + '원';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const ymd = s => { const [y, m, d] = s.split('-'); return `${y}년 ${+m}월 ${+d}일`; };
const kr = m => { const e = Math.floor(m / 1e4), r = m % 1e4; return (e ? e + '억' : '') + (r ? (e ? ' ' : '') + (r % 1000 ? r.toLocaleString('ko-KR') + '만' : r / 1000 + '천만') : '') + '원'; };
const FOOTER = `<footer>© 한눈 계산기 · <a href="/">다른 계산기</a> · <a href="/about.html">사이트 소개·계산 근거</a> · <a href="/privacy.html">개인정보처리방침</a>
<p class="net">한보기 네트워크: <a href="https://home.hanbogi.com">부동산 알리미</a> · <a href="https://talk.hanbogi.com">한눈 여행회화</a> · <a href="https://grant.hanbogi.com">정부 지원금 찾기</a> · <a href="https://benefit.hanbogi.com">혜택 알리미</a> · <a href="https://license.hanbogi.com">자격증 한눈에</a> · <a href="https://hanbogi.com">오늘의 게임</a> · <a href="https://stay.hanbogi.com">오늘의 숙소</a> · <a href="https://gadget.hanbogi.com">기기 비교소</a></p></footer>`;
const ld = o => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>';
const crumbs = list => ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [['한눈 계산기', '/'], ['양도소득세 계산기', '/capital-gains/'], ...list].map(([name, u], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + u })) });
const faq = qa => ld({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });

function page({ url, title, desc, body, crumb, head = '' }) {
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
${crumbs(crumb)}${head}
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon-32.png" sizes="32x32"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="stylesheet" href="/style.css"><script src="/common.js" defer></script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5424435978828190" crossorigin="anonymous"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-19F8RF6971"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","G-19F8RF6971");</script>
<style>.sub{font-size:.85rem;color:var(--muted)}td.n,th.n{text-align:right;white-space:nowrap}table{font-size:.85rem}tr.me td{background:#eaf4f4;font-weight:700}@media (prefers-color-scheme:dark){tr.me td{background:#16302f}}</style>
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

// 표 기준: 양도일 2026-10-01, 필요경비를 뺀 양도차익, 기본공제 250만, 같은 해 다른 양도 없음. 보유 기간은 취득일을 앞당겨 만든다.
const DATE = '2026-10-01', BUY = 5e8;
const HOLDS = [['1년 미만', '2026-04-01'], ['1~2년', '2025-04-01'], ['2년', '2024-10-01'], ['3년', '2023-10-01'], ['5년', '2021-10-01'], ['7년', '2019-10-01'], ['10년', '2016-10-01'], ['15년 이상', '2011-10-01']];
const tax = (m, acq, kind) => { const r = calc({ sale: BUY + m * 1e4, buy: BUY, cost: 0, acq, date: DATE, reside: 0, kind, adjBuy: false }); return { ...r, total: r.tax + r.local }; };
const GAINS = [3000, 5000, 7000, 10000, 15000, 20000, 30000, 50000, 70000, 100000];
const href = m => `/${DIR}/gain-${m}/`;
const out = [];

GAINS.forEach((m, i) => {
  const url = href(m), name = kr(m), t10 = tax(m, HOLDS[6][1], 'multi'), t2 = tax(m, HOLDS[2][1], 'multi'), h2 = tax(m, HOLDS[6][1], 'h2');
  const rows = HOLDS.map(([lbl, acq]) => { const a = tax(m, acq, 'multi'), b = tax(m, acq, 'h2'), c = tax(m, acq, 'h3');
    return `<tr${lbl === '10년' ? ' class="me"' : ''}><td>${lbl}</td><td class="n">${Math.round(a.rate * 100)}%</td><td class="n">${won(a.total)}</td><td class="n">${won(b.total)}</td><td class="n">${won(c.total)}</td></tr>`; }).join('');
  const d = t10; // 10년 보유 일반 상세
  const title = `양도차익 ${name.replace(/원$/, '')} 양도세 2026 — 보유기간별·다주택 중과 세액표`;
  const desc = `주택 양도차익 ${name}이면 10년 보유(중과 없음) 양도세는 지방소득세 포함 ${won(t10.total)}, 2년 보유면 ${won(t2.total)}, 조정대상지역 2주택 중과면 ${won(h2.total)}이에요. 보유기간 1년 미만~15년, 3주택 중과까지 한 표로.`;
  const nav = `<nav class="pn">${i > 0 ? `<a href="${href(GAINS[i - 1])}">← ${kr(GAINS[i - 1])}</a>` : '<span></span>'}<a href="/${DIR}/list/">양도차익별 전체 표</a>${i < GAINS.length - 1 ? `<a href="${href(GAINS[i + 1])}">${kr(GAINS[i + 1])} →</a>` : '<span></span>'}</nav>`;
  out.push([url, page({ url, title, desc, crumb: [['양도차익별 양도세 표', `/${DIR}/list/`], [`양도차익 ${name}`, url]],
    head: faq([[`양도차익 ${name}이면 양도세가 얼마인가요?`, `1세대 1주택 비과세가 아니고 중과 대상도 아니라면 10년 보유 시 장기보유특별공제 20%를 받아 양도소득세 ${won(t10.tax)}, 지방소득세 ${won(t10.local)}로 합계 ${won(t10.total)}입니다. 2년 보유면 ${won(t2.total)}, 조정대상지역 2주택 중과(10년 보유)면 ${won(h2.total)}입니다.`],
      ['1세대 1주택도 양도세를 내나요?', '양도일 현재 1세대 1주택이고 2년 이상 보유(2017년 8월 3일 이후 조정대상지역 취득분은 2년 거주도)했다면 양도가액 12억 원까지 비과세입니다. 12억 원을 넘으면 넘는 비율만큼만 과세하고 장기보유특별공제는 최대 80%입니다.']]),
    body: `<h1>양도차익 ${name} 양도소득세 (2026년)</h1>
<p class="lead">집을 팔아 남긴 차익(양도가액 − 취득가액 − 필요경비)이 ${name}이면, 1세대 1주택 비과세가 아니고 중과 대상이 아닐 때 <b>10년 보유 기준 ${won(t10.total)}</b>(지방소득세 포함)을 내요. 보유 기간이 짧거나 조정대상지역 다주택 중과면 크게 늘어나요.</p>
<div class="card">
<div>10년 보유 · 중과 없음 (지방소득세 포함)</div><div class="big" id="r10">${won(t10.total)}</div>
<table><tr><th>양도차익</th><td class="n">${won(d.gain)}</td></tr><tr><th>장기보유특별공제 (표1 20%)</th><td class="n">− ${won(d.ltcg)}</td></tr><tr><th>기본공제</th><td class="n">− ${won(Math.min(RULES.basicCut, d.income))}</td></tr><tr><th>과세표준</th><td class="n">${won(d.base)}</td></tr><tr><th>양도소득세</th><td class="n">${won(d.tax)}</td></tr><tr><th>지방소득세 (10%)</th><td class="n">${won(d.local)}</td></tr><tr><th>합계</th><td class="n"><b>${won(d.total)}</b></td></tr></table>
</div>
<a class="cta" href="/capital-gains/">내 집 조건(1주택·지역·거주 기간)으로 계산하기 →</a>

<h2>보유 기간별·주택 수별 양도세 <span class="hint">지방소득세 포함</span></h2>
<div class="card"><div style="overflow-x:auto"><table><tr><th>보유 기간</th><th class="n">장특공<br><span class="sub">표1</span></th><th class="n">중과 없음<br><span class="sub">비조정·다주택 등</span></th><th class="n">조정 2주택<br><span class="sub">+20%p</span></th><th class="n">조정 3주택+<br><span class="sub">+30%p</span></th></tr>${rows}</table></div>
<p class="hint">1년 미만 70%, 1~2년 60%(중과는 단기 세율과 비교해 큰 세액). 2년 이상은 기본세율 6~45%, 3년 이상 보유하면 장기보유특별공제 연 2%(최대 30%). 조정대상지역 다주택 중과는 공제 없이 기본세율 + 20%p·30%p예요(2026년 5월 10일 이후 양도분).</p></div>

<h2>1세대 1주택이라면</h2>
<div class="card"><p>양도일 현재 1세대 1주택(일시적 2주택 포함)이고 2년 이상 보유했다면 양도가액 12억 원까지는 <b>비과세</b>예요. 2017년 8월 3일 이후 조정대상지역에서 산 집은 2년 이상 거주도 해야 해요. 12억 원을 넘는 고가주택은 양도차익 × (양도가액 − 12억) ÷ 양도가액만 과세하고, 2년 이상 거주했다면 장기보유특별공제가 보유·거주 각 연 4%로 최대 80%까지 늘어나요. 양도가액·거주 기간이 필요해 <a href="/capital-gains/">계산기</a>에서 계산해 보세요.</p></div>

<h2>어떻게 계산했나요</h2>
<div class="card"><p class="hint">양도일 ${ymd(DATE)}, 양도차익 ${name}(필요경비 반영 후), 같은 해 다른 양도 없음, 기본공제 250만 원을 가정했어요. 원 미만은 버렸어요. 기준일 ${ymd(RULES.updated)}. 근거: 소득세법 제55조·제95조·제103조·제104조, 지방세법 제103조의3. 다주택 중과 여부는 양도일 현재 조정대상지역인지로 정해요(지역 목록은 <a href="/acquisition-tax/">취득세 계산기</a> 아래 현황 표). 2026년 8월 발표된 세제개편안은 국회 통과 전이라 반영하지 않았어요.</p></div>
${nav}
<p>🧮 함께 쓰는 계산기: <a href="/capital-gains/">양도소득세 계산기</a> · <a href="/acquisition-tax/">취득세 계산기</a> · <a href="/brokerage/">중개수수료 계산기</a></p>`
  })]);
});

out.push([`/${DIR}/list/`, page({ url: `/${DIR}/list/`, crumb: [['양도차익별 양도세 표', `/${DIR}/list/`]],
  title: '양도차익별 양도세 표 2026 — 3천만원~10억 (보유기간·다주택 중과별)',
  desc: '주택 양도차익 3천만원부터 10억원까지 보유 기간(1년 미만~15년)과 다주택 중과 여부별 양도소득세·지방소득세 합계를 한 표에 정리했어요.',
  body: `<h1>양도차익별 양도세 표 (2026년)</h1>
<p class="lead">주택을 팔아 남긴 차익별로 내야 할 양도소득세(지방소득세 포함)예요. 1세대 1주택 비과세가 아닌 경우 기준이고, 금액을 누르면 보유 기간별 표를 볼 수 있어요.</p>
<a class="cta" href="/capital-gains/">내 조건으로 직접 계산하기 →</a>
<div class="card"><div style="overflow-x:auto"><table><tr><th>양도차익</th><th class="n">2년 보유</th><th class="n">10년 보유</th><th class="n">조정 2주택 중과<br><span class="sub">10년</span></th></tr>${GAINS.map(m => `<tr><td><a href="${href(m)}">${kr(m)}</a></td><td class="n">${won(tax(m, HOLDS[2][1], 'multi').total)}</td><td class="n">${won(tax(m, HOLDS[6][1], 'multi').total)}</td><td class="n">${won(tax(m, HOLDS[6][1], 'h2').total)}</td></tr>`).join('')}</table></div>
<p class="hint">양도일 ${ymd(DATE)}, 기본공제 250만 원, 중과 없음은 장기보유특별공제 표1(10년 20%) 적용. 기준일 ${ymd(RULES.updated)}.</p></div>`
})]);

// 쓰기: 예전 생성분(gain-*·list)을 지우고 다시 만든다
for (const d of fs.readdirSync(path.join(ROOT, DIR))) if (/^gain-\d+$/.test(d) || d === 'list') fs.rmSync(path.join(ROOT, DIR, d), { recursive: true });
for (const [url, html] of out) { const d = path.join(ROOT, url); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'index.html'), html); }
const today = new Date().toLocaleDateString('sv-SE'), smPath = path.join(ROOT, 'sitemap.xml');
const sm = fs.readFileSync(smPath, 'utf8').replace(/<!-- capital-gains -->[\s\S]*<!-- \/capital-gains -->\n/, '');
fs.writeFileSync(smPath, sm.replace('</urlset>', '<!-- capital-gains -->\n' + out.map(([u]) => `<url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') + '\n<!-- /capital-gains -->\n</urlset>'));
console.log(`생성 ${out.length}쪽: 양도차익 ${GAINS.length}, 목록 1`);
