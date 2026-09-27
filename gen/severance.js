// 근속연수별 퇴직금 롱테일 페이지 생성기: `node gen/severance.js` → /severance/year-<N>/ (근속 1~30년) + /severance/list/ + sitemap.xml의 <!-- severance --> 구간.
// 계산식은 severance/calc.js를 그대로 쓴다. 세법이 바뀌면 calc.js만 고치고 다시 실행한다. 생성 페이지를 손으로 고치지 말 것.
// 머리말(og·광고·GA·파비콘)과 푸터는 gen/longtail.js의 page()와 같게 유지한다.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), SITE = 'https://calc.hanbogi.com';
const { SEV, calc, irpTax } = require('../severance/calc.js');

const won = v => Math.round(v).toLocaleString('ko-KR') + '원';
const manw = v => (Math.round(v / 1e3) / 10).toLocaleString('ko-KR') + '만원';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const ld = o => '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', ...o }).replace(/</g, '\\u003c') + '</script>';
const FOOTER = `<footer>© 한눈 계산기 · <a href="/">다른 계산기</a> · <a href="/about.html">사이트 소개·계산 근거</a> · <a href="/privacy.html">개인정보처리방침</a>
<p class="net">한보기 네트워크: <a href="https://home.hanbogi.com">부동산 알리미</a> · <a href="https://talk.hanbogi.com">한눈 여행회화</a> · <a href="https://grant.hanbogi.com">정부 지원금 찾기</a> · <a href="https://benefit.hanbogi.com">혜택 알리미</a> · <a href="https://license.hanbogi.com">자격증 한눈에</a> · <a href="https://hanbogi.com">오늘의 게임</a> · <a href="https://stay.hanbogi.com">오늘의 숙소</a> · <a href="https://gadget.hanbogi.com">기기 비교소</a></p></footer>`;
const crumbs = list => ld({ '@type': 'BreadcrumbList',
  itemListElement: [['한눈 계산기', '/'], ['퇴직금 계산기', '/severance/'], ...list].map(([name, u], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + u })) });
const faq = qa => ld({ '@type': 'FAQPage', mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });

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
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon-32.png" sizes="32x32"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="stylesheet" href="/style.css">
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

// 가정: 2026-09-30까지 일하고 퇴직(퇴직일 10-01), 입사일은 정확히 N년 전 10-01, 3개월(7/1~9/30 = 92일) 동안 매달 같은 월급, 상여·연차수당 없음
const END = '2026-10-01', YEARS = Array.from({ length: 30 }, (_, i) => i + 1);
const WAGES = []; for (let w = 200; w <= 800; w += 50) WAGES.push(w);
const one = (n, w) => { const r = calc({ start: `${2026 - n}-10-01`, end: END, wage3: w * 3e4 }); return { ...r, irp: irpTax(r.t)[0].tax }; };
const ASSUME = `2026년 9월 30일까지 일하고 퇴직, 입사일은 정확히 근속연수만큼 전(10월 1일), 퇴직 전 3개월(7~9월, 92일) 동안 매달 같은 세전 월급, 상여금·연차수당 없음으로 계산했어요. 상여금·연차수당이 있으면 퇴직금이 늘어나니 <a href="/severance/">계산기</a>에 넣어 보세요.`;
const out = [];

YEARS.forEach((n, i) => {
  const url = `/severance/year-${n}/`, r300 = one(n, 300);
  const rows = WAGES.map(w => { const r = one(n, w);
    return `<tr><td>${w.toLocaleString('ko-KR')}만원</td><td class="n"${w === 300 ? ' id="r300"' : ''}>${won(r.pay)}</td><td class="n">${won(r.t.tax + r.t.local)}</td><td class="n"><b>${won(r.net)}</b></td><td class="n">${won(r.irp)}</td></tr>`; }).join('');
  const t = r300.t;
  const title = `근속 ${n}년 퇴직금 2026 — 월급별 퇴직금·퇴직소득세·세후 실수령액`;
  const desc = `${n}년 일하고 퇴직하면 월급 300만원 기준 퇴직금은 약 ${manw(r300.pay)}, 퇴직소득세·지방소득세 ${won(t.tax + t.local)}을 빼면 ${manw(r300.net)}이에요. 월급 200만~800만원별 퇴직금과 세금, IRP로 받을 때 세금까지 한 표로 정리했어요.`;
  const nav = `<nav class="pn">${i ? `<a href="/severance/year-${n - 1}/">← 근속 ${n - 1}년</a>` : '<span></span>'}<a href="/severance/list/">근속연수별 전체 표</a>${n < 30 ? `<a href="/severance/year-${n + 1}/">근속 ${n + 1}년 →</a>` : '<span></span>'}</nav>`;
  out.push([url, page({ url, title, desc, crumb: [['근속연수별 퇴직금 표', '/severance/list/'], [`근속 ${n}년 퇴직금`, url]],
    head: '\n' + faq([[`${n}년 근무하면 퇴직금은 얼마인가요?`, `월급이 매달 같고 상여금이 없다면 퇴직금은 월급 × ${n}보다 조금 적어요(1일 평균임금을 달력 일수로 나누기 때문). 월급 300만원이면 약 ${manw(r300.pay)}이고, 퇴직소득세와 지방소득세 ${won(t.tax + t.local)}을 빼면 약 ${manw(r300.net)}을 받아요.`],
      [`근속 ${n}년 퇴직소득세는 어떻게 계산하나요?`, `근속연수공제 ${won(t.td)}을 빼고 ${n}년으로 나눠 12를 곱한 환산급여에서 환산급여공제를 뺀 과세표준에 기본세율을 적용한 뒤, 다시 12로 나누고 근속연수 ${n}년을 곱해요. 월급 300만원이면 퇴직소득세 ${won(t.tax)}, 지방소득세 ${won(t.local)}이에요.`]]),
    body: `<h1>근속 ${n}년 퇴직금 (2026년)</h1>
<p class="lead">${n}년 일하고 퇴직하면 월급 300만원 기준 퇴직금은 <b>${won(r300.pay)}</b>, 세금 ${won(t.tax + t.local)}을 빼면 <b>${won(r300.net)}</b>을 받아요. IRP로 받아 10년 안에 연금으로 나눠 받으면 세금은 ${won(r300.irp)}으로 줄어요.</p>
<a class="cta" href="/severance/">내 입사일·월급·상여금으로 계산하기 →</a>
<h2>월급별 퇴직금 (근속 ${n}년)</h2>
<div class="card"><div style="overflow-x:auto"><table><tr><th>세전 월급</th><th class="n">퇴직금</th><th class="n">세금<br><span class="sub">퇴직소득세+지방</span></th><th class="n">세후 퇴직금</th><th class="n">IRP 연금 수령 시 세금<br><span class="sub">10년 차까지 70%</span></th></tr>${rows}</table></div>
<p class="hint">${ASSUME}</p></div>
<h2>월급 300만원일 때 퇴직소득세 계산 과정</h2>
<div class="card"><table>
<tr><th>퇴직금</th><td class="n">${won(r300.pay)}</td></tr>
<tr><th>근속연수공제 (${n}년)</th><td class="n">${won(t.td)}</td></tr>
<tr><th>환산급여 <span class="sub">(퇴직금 − 공제) ÷ ${n} × 12</span></th><td class="n">${won(t.conv)}</td></tr>
<tr><th>환산급여공제</th><td class="n">${won(t.cd)}</td></tr>
<tr><th>과세표준</th><td class="n">${won(t.base)}</td></tr>
<tr><th>환산산출세액 <span class="sub">기본세율 6~45%</span></th><td class="n">${won(t.convTax)}</td></tr>
<tr><th>퇴직소득세 <span class="sub">÷ 12 × ${n}</span></th><td class="n">${won(t.tax)}</td></tr>
<tr><th>지방소득세 <span class="sub">10%</span></th><td class="n">${won(t.local)}</td></tr>
</table>
<p class="hint">근거: 근로자퇴직급여 보장법 제8조, 소득세법 제48조(근속연수공제·환산급여공제)·제55조(기본세율)·제129조제1항제5호의3(연금 수령 시 70·60·50%). 기준일 ${SEV.updated}. 세금은 10원 미만 버림, 퇴직금은 고용노동부 계산기와 같은 방식(1일 평균임금 전 단위 올림 × 30일 × 재직일수/365)이에요.</p></div>
${nav}
<p>🧮 함께 쓰는 계산기: <a href="/severance/">퇴직금 계산기</a> · <a href="/salary/">연봉 실수령액 계산기</a> · <a href="/unemployment/">실업급여 계산기</a></p>`
  })]);
});

// 목록: 근속연수 × 월급 (세전 퇴직금)
const LW = [200, 300, 400, 500, 600, 800];
out.push(['/severance/list/', page({ url: '/severance/list/', crumb: [['근속연수별 퇴직금 표', '/severance/list/']],
  title: '근속연수별 퇴직금 표 2026 — 1년~30년, 월급 200만~800만원',
  desc: '근속 1년부터 30년까지, 월급 200만~800만원별 예상 퇴직금과 퇴직소득세를 뺀 세후 금액을 한 표로 정리했어요. 근속연수를 누르면 월급별 상세 표와 세금 계산 과정을 볼 수 있어요.',
  body: `<h1>근속연수별 퇴직금 표 (2026년)</h1>
<p class="lead">세후 퇴직금(퇴직소득세·지방소득세를 뺀 금액)이에요. 근속연수를 누르면 월급 50만원 단위 표와 세금 계산 과정, IRP로 받을 때 세금이 나와요.</p>
<a class="cta" href="/severance/">내 조건으로 직접 계산하기 →</a>
<div class="card"><div style="overflow-x:auto"><table><tr><th>근속</th>${LW.map(w => `<th class="n">월 ${w}만</th>`).join('')}</tr>
${YEARS.map(n => `<tr><td><a href="/severance/year-${n}/">${n}년</a></td>${LW.map(w => `<td class="n">${manw(one(n, w).net)}</td>`).join('')}</tr>`).join('\n')}</table></div>
<p class="hint">${ASSUME} 세전 퇴직금은 월급 × 근속연수보다 2% 안팎 적어요.</p></div>
<p>🧮 함께 쓰는 계산기: <a href="/severance/">퇴직금 계산기</a> · <a href="/salary/">연봉 실수령액 계산기</a></p>`
})]);

// 쓰기: 예전 생성분(year-N·list)만 지우고 다시 만든다
for (const d of fs.readdirSync(path.join(ROOT, 'severance'))) if (/^year-\d+$/.test(d) || d === 'list') fs.rmSync(path.join(ROOT, 'severance', d), { recursive: true });
for (const [url, html] of out) { const d = path.join(ROOT, url); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'index.html'), html); }
const today = new Date().toLocaleDateString('sv-SE'), smPath = path.join(ROOT, 'sitemap.xml');
const sm = fs.readFileSync(smPath, 'utf8').replace(/<!-- severance -->[\s\S]*<!-- \/severance -->\n/, '');
fs.writeFileSync(smPath, sm.replace('</urlset>', '<!-- severance -->\n' + out.map(([u]) => `<url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') + '\n<!-- /severance -->\n</urlset>'));
console.log(`생성 ${out.length}쪽: 근속 ${YEARS.length}, 목록 1`);
