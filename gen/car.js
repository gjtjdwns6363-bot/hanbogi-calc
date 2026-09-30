// 차종별 롱테일 페이지 생성기: `node gen/car.js` → /car/<slug>/ (차종마다 1쪽) + /car/list/ + sitemap.xml의 <!-- car --> 구간.
// 가격은 car/models.js, 보조금은 car/ev_subsidy.js, 계산식은 car/compare.js를 그대로 쓴다. 생성 페이지를 손으로 고치지 말 것.
// 머리말(og·광고·GA·파비콘)과 푸터는 gen/longtail.js의 page()와 같게 유지한다.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), SITE = 'https://calc.hanbogi.com';
const { CAR_MODELS } = require('../car/models.js'), { EV_SUBSIDY: S } = require('../car/ev_subsidy.js');
const { RESIDUAL, installment, lease } = require('../car/compare.js');
const A = CAR_MODELS.assume;

const won = v => Math.round(v).toLocaleString('ko-KR') + '원';
const manw = v => (Math.round(v / 1e3) / 10).toLocaleString('ko-KR') + '만원';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const ymd = s => { const [y, m, d] = s.split('-'); return `${y}년 ${+m}월 ${+d}일`; };
const FOOTER = `<footer>© 한눈 계산기 · <a href="/">다른 계산기</a> · <a href="/about.html">사이트 소개·계산 근거</a> · <a href="/privacy.html">개인정보처리방침</a>
<p class="net">한보기 네트워크: <a href="https://home.hanbogi.com">부동산 알리미</a> · <a href="https://talk.hanbogi.com">한눈 여행회화</a> · <a href="https://grant.hanbogi.com">정부 지원금 찾기</a> · <a href="https://benefit.hanbogi.com">혜택 알리미</a> · <a href="https://license.hanbogi.com">자격증 한눈에</a> · <a href="https://hanbogi.com">오늘의 게임</a> · <a href="https://stay.hanbogi.com">오늘의 숙소</a> · <a href="https://gadget.hanbogi.com">기기 비교소</a></p></footer>`;
const crumbs = list => '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [['한눈 계산기', '/'], ['자동차 할부·리스 계산기', '/car/'], ...list].map(([name, u], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + u })) }).replace(/</g, '\\u003c') + '</script>';

function page({ url, title, desc, body, crumb }) {
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
${crumbs(crumb)}
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

// 표 기본 조건: 36개월, 할부는 선수금 20%·은행 신차 평균 금리, 리스·렌트는 보증금 0·잔존가치 기본값
const N = 36, DOWN = 20, kindOf = (m, t) => (t.fuel === '전기' || t.fuel === '수소') ? 'ev' : m.light ? 'light' : 'normal';
function est(m, t, sub = 0) {
  const kind = kindOf(m, t), price = t.price, truck = !!m.truck;
  const i = installment({ price, subsidy: sub, down: Math.round((price - sub) * DOWN / 100), rate: A.loan, months: N, kind, truck });
  const l = lease({ price, subsidy: sub, kind, months: N, rate: A.lease, truck });
  const r = lease({ price, subsidy: sub, kind, months: N, rate: A.rent, extra: A.extra * 1e4, biz: true, truck });
  return { i, l, r };
}
// 보조금: 시·도마다 대표 지역(시·도청 소재지 = 목록 첫 행) 1곳
const kIdx = t => t.ev == null ? -1 : S.keys.indexOf(t.ev);
const SIDO = [...new Set(S.regions.map(r => r[0]))].map(sd => S.regions.find(r => r[0] === sd));
const subOf = (t, reg) => { const k = kIdx(t); return k < 0 ? null : { nat: S.national[k] || 0, loc: reg[2][k] || 0, none: reg[2][k] == null }; };
const SEOUL = S.regions.find(r => r[0] === '서울특별시') || S.regions[0];

const out = [], M = CAR_MODELS.list;
const ASSUME = `36개월 기준. 할부는 선수금 ${DOWN}%·연 ${A.loan}%(원리금균등), 운용리스는 연 ${A.lease}%·보증금 0·잔존가치 ${RESIDUAL[N]}%·취득세 7%(경차 4%·픽업 5%, 감면 반영), 장기렌트는 연 ${A.rent}%(수수료 포함 환산)·영업용 취득세 4%·보험·세금·정비 월 ${A.extra}만원 포함으로 가정했어요. 리스·렌트는 반납 기준이에요.`;

M.forEach(m => {
  const url = `/car/${m.slug}/`, ev = m.trims.some(t => t.fuel === '전기'), min = Math.min(...m.trims.map(t => t.price)), max = Math.max(...m.trims.map(t => t.price));
  const base = m.trims.find(t => t.price === min), range = min === max ? manw(min) : `${manw(min)}~${manw(max)}`;
  const e0 = est(m, base, ev && subOf(base, SEOUL) ? subOf(base, SEOUL).nat + subOf(base, SEOUL).loc : 0);
  const title = ev ? `${m.model} 보조금·실구매가 2026 (지역별) — 트림별 가격·할부·리스 월 납입금`
                   : `${m.model} 할부·리스·장기렌트 월 납입금 2026 — 트림별 가격`;
  const desc = ev ? `${m.maker} ${m.model} 2026 트림별 가격(${range})과 시·도별 전기차 보조금(국고+지자체)을 뺀 실구매가, 36개월 할부·리스·장기렌트 예상 월 납입금을 정리했어요.`
                  : `${m.maker} ${m.model} 2026 트림별 가격(${range})과 36개월 할부 월 ${manw(e0.i.pay)}부터, 운용리스·장기렌트 예상 월 납입금과 취득세를 한 표로 정리했어요.`;
  const trows = m.trims.map((t, j) => { const sb = ev ? subOf(t, SEOUL) : null, e = est(m, t, sb ? sb.nat + sb.loc : 0);
    return `<tr><td><a href="/car/?model=${m.slug}&amp;trim=${j}">${esc(t.name)}</a> <span class="sub">${t.fuel}</span></td><td class="n">${manw(t.price)}</td>${ev ? `<td class="n">${sb ? manw(t.price - sb.nat - sb.loc) : '—'}</td>` : ''}<td class="n" id="i${j}">${won(e.i.pay)}</td><td class="n">${won(e.l.pay)}</td><td class="n">${won(e.r.pay)}</td></tr>`; }).join('');
  let evHtml = '';
  if (ev) {
    const t = m.trims.find(x => kIdx(x) >= 0);
    evHtml = t ? `<h2>시·도별 보조금·실구매가 (${esc(t.name)})</h2>
<div class="card"><div style="overflow-x:auto"><table><tr><th>지역</th><th class="n">국고</th><th class="n">지자체</th><th class="n">실구매가</th></tr>${SIDO.map(r => { const s = subOf(t, r); return `<tr><td>${r[0]}${r[1] !== r[0] ? ` <span class="sub">${r[1]}</span>` : ''}</td><td class="n">${manw(s.nat)}</td><td class="n">${s.none ? '미등재' : manw(s.loc)}</td><td class="n"><b>${manw(t.price - s.nat - s.loc)}</b></td></tr>`; }).join('')}</table></div>
<p class="hint">실구매가 = 판매가 ${manw(t.price)} − 국고 − 지자체 보조금(취득세·옵션 제외). 휠 크기·옵션에 따라 보조금이 몇만 원 다를 수 있고, 미등재는 그 지역 공고에 이 차종이 없다는 뜻이에요. 시·군마다 지자체 보조금이 달라요. 사는 시·군 금액은 <a href="/car/?model=${m.slug}&amp;trim=${m.trims.indexOf(t)}">계산기</a>에서 고르면 나와요. 기준일 ${ymd(S.asOf)}, 출처: <a href="${S.src}" rel="nofollow noopener" target="_blank">환경부 무공해차 통합누리집</a>. 지자체 예산이 소진되면 받을 수 없고, 차상위·청년 첫차·다자녀 추가 지원은 빠진 금액이에요.</p></div>`
      : `<h2>전기차 보조금</h2><div class="card"><p>이 차종은 ${ymd(S.asOf)} 기준 무공해차 통합누리집 보조금 표에서 찾지 못했어요. <a href="${S.src}" rel="nofollow noopener" target="_blank">통합누리집</a>에서 직접 확인하세요.</p></div>`;
  }
  const same = M.filter(x => x.maker === m.maker && x !== m).map(x => `<a href="/car/${x.slug}/">${esc(x.model)}</a>`).join(' · ');
  out.push([url, page({ url, title, desc, crumb: [['차종별 가격표', '/car/list/'], [m.model, url]], body:
`<h1>${esc(m.maker)} ${esc(m.model)} ${ev ? '보조금·실구매가와 ' : ''}할부·리스·렌트 월 납입금 (2026)</h1>
<p class="lead">${esc(m.maker)} 공식 가격표 기준 ${m.model} 트림별 가격은 <b>${range}</b>이에요. ${ev ? '서울 기준 보조금을 빼면 ' + (subOf(base, SEOUL) ? `기본 트림 실구매가는 약 <b>${manw(base.price - subOf(base, SEOUL).nat - subOf(base, SEOUL).loc)}</b>이고, ` : '') : ''}36개월 할부(선수금 ${DOWN}%) 월 납입금은 약 <b>${manw(e0.i.pay)}</b>부터예요.</p>
<a class="cta" href="/car/?model=${m.slug}">${esc(m.model)} 조건 바꿔 계산하기 →</a>
<h2>트림별 가격과 월 납입금 <span class="hint">예상치(회사별 견적과 다름)</span></h2>
<div class="card"><div style="overflow-x:auto"><table><tr><th>트림</th><th class="n">가격</th>${ev ? '<th class="n">실구매가<br><span class="sub">서울</span></th>' : ''}<th class="n">할부 월</th><th class="n">리스 월</th><th class="n">렌트 월</th></tr>${trows}</table></div>
<p class="hint">${ASSUME}${ev ? ' 전기차는 서울 보조금을 뺀 금액으로 계산했어요.' : ''} 트림을 누르면 계산기에 그대로 들어가요.</p></div>
${evHtml}
<h2>가격 기준</h2>
<div class="card"><p class="hint">${esc(m.maker)} 공식 가격표(<a href="${m.src}" rel="nofollow noopener" target="_blank">출처</a>, ${ymd(m.checked)} 확인). 차급 ${m.class}${m.light ? '·경차' : ''}. ${esc(m.taxNote || '')} 선택 옵션·탁송료는 빠진 기본 판매가예요. 할부 금리 ${A.loan}%는 ${A.loanNote}</p></div>
<p>🚗 ${esc(m.maker)} 다른 차종: ${same || '—'} · <a href="/car/list/">전체 차종</a></p>
<p>🧮 함께 쓰는 계산기: <a href="/car/">자동차 할부·리스 계산기</a> · <a href="/salary/">연봉 실수령액 계산기</a> · <a href="/loan/">주택담보대출 계산기</a></p>`
  })]);
});

// 목록
const makers = [...new Set(M.map(m => m.maker))];
out.push(['/car/list/', page({ url: '/car/list/', crumb: [['차종별 가격표', '/car/list/']],
  title: '차종별 신차 가격표 2026 — 현대·기아·제네시스·수입차 트림별 가격·월 납입금',
  desc: `현대·기아·제네시스·KGM·르노코리아·쉐보레와 인기 수입차 ${M.length}개 차종의 2026 공식 판매가와 할부·리스·장기렌트 예상 월 납입금, 전기차 지역별 보조금을 차종별로 정리했어요.`,
  body: `<h1>차종별 신차 가격표 (2026년)</h1>
<p class="lead">제조사 공식 가격표 기준 ${M.length}개 차종이에요. 차종을 누르면 트림별 가격과 할부·리스·렌트 월 납입금${S ? ', 전기차 지역별 실구매가' : ''}를 볼 수 있어요.</p>
<a class="cta" href="/car/">내 조건으로 계산하기 →</a>
${makers.map(mk => `<h2>${esc(mk)}</h2><div class="card"><div style="overflow-x:auto"><table><tr><th>차종</th><th>차급</th><th class="n">가격</th></tr>${M.filter(m => m.maker === mk).map(m => { const p = m.trims.map(t => t.price); return `<tr><td><a href="/car/${m.slug}/">${esc(m.model)}</a>${m.trims.some(t => t.fuel === '전기') ? ' <span class="sub">전기</span>' : ''}</td><td>${m.class}</td><td class="n">${manw(Math.min(...p))}~${manw(Math.max(...p))}</td></tr>`; }).join('')}</table></div></div>`).join('\n')}
<p class="hint">기준일 ${ymd(CAR_MODELS.updated)}. 기본 판매가(부가세 포함, 옵션·탁송 제외)이며 2주마다 공식 가격표를 다시 확인해요.</p>`
})]);

// 쓰기: 예전 생성분(슬러그 폴더·list)을 지우고 다시 만든다
const keep = new Set(['index.html', 'products.js', 'models.js', 'ev_subsidy.js', 'compare.js', 'test.js']);
for (const d of fs.readdirSync(path.join(ROOT, 'car'))) if (!keep.has(d)) fs.rmSync(path.join(ROOT, 'car', d), { recursive: true });
for (const [url, html] of out) { const d = path.join(ROOT, url); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'index.html'), html); }
const today = new Date().toLocaleDateString('sv-SE'), smPath = path.join(ROOT, 'sitemap.xml');
// <!-- car --> 구간만 제자리에서 바꾼다(다른 구간 순서·내용은 그대로). 구간이 없으면 </urlset> 앞에 붙인다.
const block = '<!-- car -->\n' + out.map(([u]) => `<url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') + '\n<!-- /car -->\n';
const sm = fs.readFileSync(smPath, 'utf8'), RE = /<!-- car -->[\s\S]*?<!-- \/car -->\n/;
fs.writeFileSync(smPath, RE.test(sm) ? sm.replace(RE, () => block) : sm.replace('</urlset>', block + '</urlset>'));
console.log(`생성 ${out.length}쪽: 차종 ${M.length} (전기 ${M.filter(m => m.trims.some(t => t.fuel === '전기')).length}), 목록 1`);
