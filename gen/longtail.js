// 롱테일 SEO 페이지 생성기: `node gen/longtail.js` 한 번으로 아래 네 묶음과 목록 페이지, sitemap.xml을 다시 만든다.
// 계산식은 각 계산기의 calc.js를 그대로 불러 쓴다. 요율이 바뀌면 calc.js만 고치고 이 스크립트를 다시 실행한다.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), SITE = 'https://calc.hanbogi.com';
const { net, RATE } = require('../salary/calc.js');
const acq = require('../acquisition-tax/calc.js');
const { HOURLY, weekPay, deduct, hm } = require('../hourly/calc.js');
const brk = require('../brokerage/calc.js');

// ---------- 공통 ----------
const won = v => Math.round(v).toLocaleString('ko-KR') + '원';
const manw = v => { const m = Math.round(v / 1e4); return (Math.abs(v - m * 1e4) < 1 ? '' : '약 ') + m.toLocaleString('ko-KR') + '만원'; };
// 만원 단위 금액 → "4,500만원" / "1억 2,000만원" / "5억" (억 뒤 원 생략은 제목용 short)
const kr = (m, short) => { const e = Math.floor(m / 1e4), r = m % 1e4;
  if (!e) return r.toLocaleString('ko-KR') + '만원';
  return e + '억' + (r ? ' ' + (r % 1000 ? r.toLocaleString('ko-KR') + '만원' : r / 1000 + '천만원') : short ? '' : '원'); };
const ymd = s => { const [y, m, d] = s.split('-'); return `${y}년 ${+m}월 ${+d}일`; };
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const pct = r => +(r * 100).toFixed(4) + '%';
// 중개수수료 금액 목록(만원) — 취득세 페이지에서도 링크한다
const BRK_SALE = [10000, 15000, 20000, 25000, 30000, 35000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 110000, 120000, 130000, 140000, 150000, 170000, 200000];
const BRK_JEON = [5000, 7000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 50000, 60000, 70000, 80000, 90000, 100000];

// 공유 미리보기(og)·네트워크 푸터 — 계산기 index.html·about.html·privacy.html에도 같은 내용이 들어 있다
const OG = `<meta property="og:type" content="website"><meta property="og:site_name" content="한눈 계산기"><meta property="og:locale" content="ko_KR">
<meta property="og:image" content="${SITE}/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image">`;
const FOOTER = `<footer>© 한눈 계산기 · <a href="/">다른 계산기</a> · <a href="/about.html">사이트 소개·계산 근거</a> · <a href="/privacy.html">개인정보처리방침</a>
<p class="net">한보기 네트워크: <a href="https://home.hanbogi.com">부동산 알리미</a> · <a href="https://grant.hanbogi.com">정부 지원금 찾기</a> · <a href="https://benefit.hanbogi.com">혜택 알리미</a> · <a href="https://license.hanbogi.com">자격증 한눈에</a> · <a href="https://hanbogi.com">오늘의 게임</a> · <a href="https://stay.hanbogi.com">오늘의 숙소</a> · <a href="https://gadget.hanbogi.com">기기 비교소</a></p></footer>`;
const HOME_LINK = '<p>🏠 <a href="https://home.hanbogi.com/">부동산 알리미</a>에서 우리 동네 아파트 실거래가·전세가율 보기 · <a href="https://home.hanbogi.com/subscription/">이번 달 청약 일정</a></p>';
// 홈 › 계산기 › 이 페이지 (BreadcrumbList)
const crumbs = (list, url, title) => '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [['한눈 계산기', '/'], ...list, [title, url]].map(([name, u], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + u })) }).replace(/</g, '\\u003c') + '</script>';
const CALC = { salary: ['연봉 실수령액 계산기', '연봉별 실수령액 표'], 'acquisition-tax': ['취득세 계산기', '집값별 취득세 표'], hourly: ['알바 시급·주휴수당 계산기', '근무시간별 알바 월급 표'], brokerage: ['중개수수료 계산기', '금액별 복비 표'] };

function page({ url, title, desc, ogTitle, body, crumb }) {
  const dir = url.split('/')[1], [cn, ln] = CALC[dir], calc = [cn, `/${dir}/`];
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="naver-site-verification" content="21421c877a507dea4b5be99d5ec0d9e9fd8d7b50" />
<title>${esc(title)} | 한눈 계산기</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${url}">
<meta property="og:title" content="${esc(ogTitle || title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}${url}">
${OG}
${crumbs(url.endsWith('/list/') ? [calc] : [calc, [ln, `/${dir}/list/`]], url, crumb || title.split(' — ')[0])}
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon-32.png" sizes="32x32"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="stylesheet" href="/style.css">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5424435978828190" crossorigin="anonymous"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-19F8RF6971"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","G-19F8RF6971");</script>
<style>.sub{font-size:.85rem;color:var(--muted)}td.n,th.n{text-align:right;white-space:nowrap}tr.me td{background:#eaf4f4;font-weight:700}@media (prefers-color-scheme:dark){tr.me td{background:#16302f}}</style>
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
const out = [];   // [url, html]
const write = (url, html) => out.push([url, html]);
const nav = (list, i, href, label, listUrl, listLabel) =>
  `<nav class="pn">${i > 0 ? `<a href="${href(list[i - 1])}">← ${label(list[i - 1])}</a>` : '<span></span>'}<a href="${listUrl}">${listLabel}</a>${i < list.length - 1 ? `<a href="${href(list[i + 1])}">${label(list[i + 1])} →</a>` : '<span></span>'}</nav>`;
const near = (list, i, k = 2) => list.slice(Math.max(0, i - k), i + k + 1);

// ---------- 1. 연봉별 실수령액 ----------
const SAL = []; for (let y = 2000; y <= 15000; y += 100) SAL.push(y);
const salOf = (y, o = {}) => net({ gross: Math.round(y * 1e4 / 12), nontax: 200000, fam: 1, kids: 0, ...o });
const salHref = y => `/salary/${y}/`;
SAL.forEach((y, i) => {
  const gross = Math.round(y * 1e4 / 12), r = salOf(y), name = kr(y);
  const row = (k, v, s) => `<tr><th>${k}</th><td class="n">${won(v)}${s ? ` <span class="sub">${s}</span>` : ''}</td></tr>`;
  const fam = [1, 2, 3, 4].map(f => { const x = salOf(y, { fam: f }); return `<tr${f === 1 ? ' class="me"' : ''}><td>${f}명${f === 1 ? ' (본인만)' : ''}</td><td class="n">${won(x.income + x.local)}</td><td class="n">${won(x.net)}</td><td class="n">${won(x.net * 12)}</td></tr>`; }).join('');
  const nt = [0, 200000].map(n => { const x = salOf(y, { nontax: n }); return `<tr${n ? ' class="me"' : ''}><td>${n ? '20만원 (식대)' : '없음'}</td><td class="n">${won(x.total)}</td><td class="n">${won(x.net)}</td></tr>`; }).join('');
  const ntDiff = salOf(y).net - salOf(y, { nontax: 0 }).net;
  const cmp = [-300, -200, -100, 0, 100, 200, 300].map(d => y + d).filter(v => v >= 1000).map(v => {
    const x = salOf(v), lbl = SAL.includes(v) && v !== y ? `<a href="${salHref(v)}">${kr(v)}</a>` : kr(v);
    return `<tr${v === y ? ' class="me"' : ''}><td>${lbl}</td><td class="n">${won(x.net)}</td><td class="n">${won(x.net * 12)}</td></tr>`; }).join('');
  const rate = (1 - r.net * 12 / (y * 1e4)) * 100;
  const title = `연봉 ${kr(y, true)} 실수령액 2026 — 월 ${manw(r.net).replace('약 ', '')} (4대보험·세금 공제)`;
  write(salHref(y), page({
    url: salHref(y), title,
    desc: `연봉 ${name}이면 2026년 기준 4대보험과 소득세를 빼고 월 ${won(r.net)}, 1년에 ${won(r.net * 12)}을 받아요. 공제 항목별 금액, 부양가족 1~4명·비과세 식대 유무에 따른 실수령액 비교.`,
    body: `<h1>연봉 ${name} 실수령액 (2026년)</h1>
<p class="lead">연봉 ${name}은 세전 월급 ${won(gross)}이에요. 국민연금·건강보험·장기요양·고용보험과 소득세·지방소득세를 빼면 <b>매달 ${won(r.net)}</b>이 통장에 들어와요. (비과세 식대 월 20만원, 공제대상가족 본인 1명 기준)</p>
<div class="card">
<div>월 실수령액</div><div class="big" id="rnet">${won(r.net)}</div>
<p>연 실수령액 <b id="ryear">${won(r.net * 12)}</b> · 연봉 대비 공제율 약 ${rate.toFixed(1)}%</p>
<table>${row('세전 월급', gross, '연봉 ÷ 12')}${row('국민연금', r.pension, '4.75%')}${row('건강보험', r.health, '3.595%')}${row('장기요양', r.care, '건보료의 13.14%')}${row('고용보험', r.employ, '0.9%')}${row('소득세', r.income, '간이세액표')}${row('지방소득세', r.local, '소득세의 10%')}<tr><th>공제 합계</th><td class="n"><b>${won(r.total)}</b></td></tr><tr><th>월 실수령액</th><td class="n"><b>${won(r.net)}</b></td></tr></table>
</div>
<a class="cta" href="/salary/?amt=${y}">내 조건(가족 수·비과세)으로 다시 계산하기 →</a>

<h2>부양가족 수별 실수령액</h2>
<div class="card"><p class="hint">공제대상가족(본인 포함)이 많을수록 매달 떼는 소득세가 줄어요. 비과세 20만원 기준.</p>
<div style="overflow-x:auto"><table><tr><th>공제대상가족</th><th class="n">소득세+지방세</th><th class="n">월 실수령</th><th class="n">연 실수령</th></tr>${fam}</table></div></div>

<h2>비과세 식대 있을 때와 없을 때</h2>
<div class="card"><table><tr><th>월 비과세</th><th class="n">월 공제 합계</th><th class="n">월 실수령</th></tr>${nt}</table>
<p class="hint">같은 연봉이라도 식대 20만원이 비과세로 잡히면 보험료·소득세가 줄어 월 ${won(ntDiff)} 더 받아요.</p></div>

<h2>비슷한 연봉과 비교</h2>
<div class="card"><table><tr><th>연봉</th><th class="n">월 실수령</th><th class="n">연 실수령</th></tr>${cmp}</table></div>

<h2>어떻게 계산했나요</h2>
<div class="card">
<p>연봉 ${name}을 12로 나눈 ${won(gross)}에서 비과세 20만원을 뺀 ${won(r.taxable)}을 보수월액으로 보고 4대보험 근로자 부담분을 계산했어요. 국민연금은 기준소득월액(천 원 미만 버림, 하한 41만·상한 659만원) × 4.75%, 건강보험 3.595%, 장기요양은 건강보험료의 13.14%, 고용보험 0.9%예요. 소득세는 소득세법 시행령 별표2 간이세액표에서 월급여 ${won(r.taxable)}·가족 1명 칸의 금액이고, 지방소득세는 그 10%예요. 10원 미만은 버렸어요.</p>
<p class="hint">기준일 ${ymd(RATE.updated)}. 근거: 소득세법 시행령 [별표 2] 근로소득 간이세액표(2026. 2. 27. 개정, 2026. 3. 1. 이후 원천징수분), 국민연금 보험료율 9.5%(2026년)·기준소득월액 상·하한액(2026.7~2027.6), 국민건강보험 2026년 보험료율(건강 7.19%, 장기요양 0.9448%), 고용보험 실업급여 보험료율 1.8%(근로자 0.9%). 매달 떼는 소득세는 미리 내는 세금이라 연말정산에서 환급받거나 더 낼 수 있어요.</p>
</div>
${nav(SAL, i, salHref, kr, '/salary/list/', '연봉별 전체 표')}
<p>🧮 함께 쓰는 계산기: <a href="/salary/">연봉 실수령액 계산기</a> · <a href="/severance/">퇴직금 계산기</a> · <a href="/year-end-tax/">연말정산 환급 계산기</a></p>`
  }));
});
write('/salary/list/', page({
  url: '/salary/list/', title: '연봉별 실수령액 표 2026 — 2,000만원~1억 5,000만원 (100만원 단위)',
  desc: '연봉 2,000만원부터 1억 5,000만원까지 100만원 단위로 2026년 월 실수령액·연 실수령액·월 공제액을 한 표에 정리했어요. 4대보험 요율·간이세액표 원문 기준.',
  body: `<h1>연봉별 실수령액 표 (2026년)</h1>
<p class="lead">연봉 2,000만원부터 1억 5,000만원까지 100만원 단위 실수령액이에요. 비과세 식대 월 20만원, 공제대상가족 본인 1명 기준이고, 연봉을 누르면 부양가족·비과세별 비교와 공제 항목을 볼 수 있어요.</p>
<a class="cta" href="/salary/">내 조건으로 직접 계산하기 →</a>
<div class="card"><div style="overflow-x:auto"><table><tr><th>연봉</th><th class="n">월 공제</th><th class="n">월 실수령</th><th class="n">연 실수령</th></tr>${SAL.map(y => { const r = salOf(y); return `<tr><td><a href="${salHref(y)}">${kr(y)}</a></td><td class="n">${won(r.total)}</td><td class="n">${won(r.net)}</td><td class="n">${won(r.net * 12)}</td></tr>`; }).join('')}</table></div>
<p class="hint">기준일 ${ymd(RATE.updated)}. 국민연금 4.75%(기준소득월액 상한 659만원), 건강보험 3.595%, 장기요양 건보료의 13.14%, 고용보험 0.9%, 소득세는 소득세법 시행령 별표2 간이세액표(2026. 2. 27. 개정).</p></div>`
}));

// ---------- 2. 집값별 아파트 취득세 ----------
const ACQ = []; for (let m = 10000; m < 100000; m += 5000) ACQ.push(m); for (let m = 100000; m <= 200000; m += 10000) ACQ.push(m);
const acqOf = (m, o = {}) => acq.calc({ price: m * 1e4, big: false, houses: 1, adjusted: false, first: false, small: false, ...o });
const acqHref = m => `/acquisition-tax/${m}/`;
const ACQ_CASES = [
  ['1주택', {}], ['1주택 · 생애최초 감면(200만원 한도)', { first: true }],
  ['2주택 · 비조정대상지역', { houses: 2 }], ['2주택 · 조정대상지역', { houses: 2, adjusted: true }],
  ['3주택 · 비조정대상지역', { houses: 3 }], ['3주택 · 조정대상지역', { houses: 3, adjusted: true }],
];
ACQ.forEach((m, i) => {
  const name = kr(m, true), r = acqOf(m), rb = acqOf(m, { big: true }), p = m * 1e4;
  const cell = x => `${won(x.total)}<br><span class="sub">${pct(x.rate)}${x.cut ? ' · 감면 ' + won(x.cut) : ''}</span>`;
  const cases = ACQ_CASES.map(([k, o], j) => {
    const a = acqOf(m, o), b = acqOf(m, { ...o, big: true });
    const note = o.first && !a.firstOk ? ' <span class="sub">(12억 초과라 감면 없음)</span>' : '';
    return `<tr${j ? '' : ' class="me"'}><td>${k}${note}</td><td class="n">${cell(a)}</td><td class="n">${cell(b)}</td></tr>`; }).join('');
  const cmp = near(ACQ, i).map(v => { const a = acqOf(v), b = acqOf(v, { big: true }), c = acqOf(v, { houses: 2, adjusted: true });
    return `<tr${v === m ? ' class="me"' : ''}><td>${v === m ? kr(v, true) : `<a href="${acqHref(v)}">${kr(v, true)}</a>`}</td><td class="n">${won(a.total)}</td><td class="n">${won(b.total)}</td><td class="n">${won(c.total)}</td></tr>`; }).join('');
  const rateExp = p <= 6e8 ? `6억원 이하라 1%예요.` : p > 9e8 ? `9억원을 넘어 3%예요.` : `6억 초과 9억 이하라 (${m / 1e4}억 × 2/3억 − 3)% = ${pct(r.rate)}예요(소수점 다섯째 자리 반올림).`;
  const f = acqOf(m, { first: true });
  write(acqHref(m), page({
    url: acqHref(m),
    title: `${name} 아파트 취득세 2026 — 1주택 ${manw(r.total)} (교육세·농특세 포함)`,
    desc: `${name} 아파트를 살 때 취득세·지방교육세·농특세 합계는 1주택 85㎡ 이하 ${won(r.total)}, 85㎡ 초과 ${won(rb.total)}이에요. 생애최초 감면, 2주택·3주택 조정대상지역 중과 금액까지 비교.`,
    body: `<h1>${name} 아파트 취득세 (2026년)</h1>
<p class="lead">${name} 아파트를 사서 1주택이 되면 취득세율은 ${pct(r.rate)}이고, 지방교육세까지 합친 세금은 <b>전용 85㎡ 이하 ${won(r.total)}</b>, 85㎡ 초과는 농어촌특별세가 붙어 ${won(rb.total)}이에요.</p>
<div class="card">
<div>1주택 · 85㎡ 이하 세금 합계</div><div class="big" id="rtotal">${won(r.total)}</div>
<table><tr><th>취득세</th><td class="n">${won(r.acq)} <span class="sub">${pct(r.rate)}</span></td></tr><tr><th>지방교육세</th><td class="n">${won(r.edu)}</td></tr><tr><th>농어촌특별세</th><td class="n">${won(r.rural)} <span class="sub">85㎡ 이하 비과세 (초과 시 ${won(rb.rural)})</span></td></tr><tr><th>합계</th><td class="n"><b>${won(r.total)}</b> <span class="sub">집값의 ${(r.total / p * 100).toFixed(2)}%</span></td></tr></table>
</div>
<a class="cta" href="/acquisition-tax/?price=${m}">주택 수·면적 바꿔서 계산하기 →</a>

<h2>주택 수·감면별 취득세 합계</h2>
<div class="card"><p class="hint">취득세 + 지방교육세 + 농어촌특별세 합계 (아래 줄은 적용 세율). 주택 수는 이 집을 산 뒤 세대 전체 주택 수예요.</p>
<div style="overflow-x:auto"><table><tr><th>구분</th><th class="n">85㎡ 이하</th><th class="n">85㎡ 초과</th></tr>${cases}</table></div>
<p class="hint">${f.firstOk ? `생애최초로 사면 취득세 ${won(f.cut)}을 감면받아 85㎡ 이하 기준 ${won(f.total)}만 내요.` : '취득가액이 12억원을 넘어 생애최초 감면을 받을 수 없어요.'} 일시적 2주택(기존 집을 3년 안에 처분)과 공시가격 1억원(수도권 밖 2억원) 이하 주택은 중과하지 않아 1주택 세율이에요.</p></div>

<h2>비슷한 집값과 비교</h2>
<div class="card"><div style="overflow-x:auto"><table><tr><th>집값</th><th class="n">1주택 85㎡ 이하</th><th class="n">1주택 85㎡ 초과</th><th class="n">조정 2주택</th></tr>${cmp}</table></div></div>

<h2>어떻게 계산했나요</h2>
<div class="card">
<p>주택 매매 취득세율은 ${rateExp} 지방교육세는 1~3% 구간에서 취득세의 10%, 중과(8%·12%)면 집값의 0.4%예요. 농어촌특별세는 전용 85㎡ 초과 주택만 집값의 0.2%(중과 시 (세율 − 2%) × 10%)이고, 생애최초 감면을 받으면 감면액의 20%가 더 붙어요. 다주택 중과는 조정대상지역 2주택 8%·3주택 이상 12%, 비조정대상지역 3주택 8%·4주택 이상 12%예요. 10원 미만은 버렸어요.</p>
<p class="hint">기준일 ${ymd(acq.RULES.updated)}. 근거: 지방세법 제11조 제1항 제8호(1~3%), 제13조의2(다주택 중과), 제151조(지방교육세), 농어촌특별세법 제4조·제5조, 지방세특례제한법 제36조의3(생애최초 감면, 2028년 12월 31일 취득분까지). 실제 신고 전에는 관할 시·군·구청이나 위택스에서 확인하세요.</p>
</div>
${nav(ACQ, i, acqHref, v => kr(v, true), '/acquisition-tax/list/', '집값별 전체 표')}
<p>🧮 함께 쓰는 계산기: <a href="/acquisition-tax/">취득세 계산기</a> · <a href="/brokerage/sale-${BRK_SALE.includes(m) ? m : 50000}/">${BRK_SALE.includes(m) ? name : '5억'} 매매 복비</a> · <a href="/loan/">주택담보대출 계산기</a></p>
${HOME_LINK}`
  }));
});

write('/acquisition-tax/list/', page({
  url: '/acquisition-tax/list/', title: '집값별 아파트 취득세 표 2026 — 1억~20억 (1주택·다주택 중과)',
  desc: '아파트 1억부터 20억까지 집값별 2026년 취득세·지방교육세·농특세 합계를 1주택 85㎡ 이하·초과, 조정대상지역 2주택 중과로 나눠 한 표에 정리했어요.',
  body: `<h1>집값별 아파트 취득세 표 (2026년)</h1>
<p class="lead">1억~10억은 5천만원 단위, 10억~20억은 1억 단위예요. 금액은 취득세 + 지방교육세 + 농어촌특별세 합계이고, 집값을 누르면 생애최초 감면·3주택 중과까지 볼 수 있어요.</p>
<a class="cta" href="/acquisition-tax/">내 조건으로 직접 계산하기 →</a>
<div class="card"><div style="overflow-x:auto"><table><tr><th>집값</th><th class="n">1주택 85㎡ 이하</th><th class="n">1주택 85㎡ 초과</th><th class="n">조정 2주택</th></tr>${ACQ.map(m => `<tr><td><a href="${acqHref(m)}">${kr(m, true)}</a></td><td class="n">${won(acqOf(m).total)}</td><td class="n">${won(acqOf(m, { big: true }).total)}</td><td class="n">${won(acqOf(m, { houses: 2, adjusted: true }).total)}</td></tr>`).join('')}</table></div>
<p class="hint">기준일 ${ymd(acq.RULES.updated)}. 근거: 지방세법 제11조·제13조의2·제151조, 농어촌특별세법 제4조·제5조. 조정 2주택은 85㎡ 이하 기준 8% 중과예요.</p></div>`
}));

// ---------- 3. 주 근무시간별 알바 월급 ----------
const HRS = []; for (let h = 10; h <= 40; h++) HRS.push(h);
// 주 5일 같은 시간(09:00 시작) 근무로 본다. 하루 8시간 이하·야간 없음이라 요일 배치와 상관없이 금액이 같다.
const hrOf = (h, wage = HOURLY.wage) => weekPay({ days: Array(5).fill({ start: 540, end: 540 + h * 12, brk: 0 }), wage });
const hrHref = h => `/hourly/week-${h}/`;
HRS.forEach((h, i) => {
  const r = hrOf(h), r27 = hrOf(h, HOURLY.wage2027), biz = deduct(r.month, 'biz');
  const row = (k, v, s) => `<tr><th>${k}</th><td class="n">${v}${s ? ` <span class="sub">${s}</span>` : ''}</td></tr>`;
  const cmp = [-3, -2, -1, 0, 1, 2, 3].map(d => h + d).filter(v => v >= 1 && v <= 52).map(v => { const x = hrOf(v);
    return `<tr${v === h ? ' class="me"' : ''}><td>${HRS.includes(v) && v !== h ? `<a href="${hrHref(v)}">주 ${v}시간</a>` : `주 ${v}시간`}</td><td>${x.juhuOk ? '✅' : '❌'}</td><td class="n">${won(x.month)}</td><td class="n">${won(deduct(x.month, 'biz').net)}</td></tr>`; }).join('');
  const r15 = hrOf(15);
  const juhuTxt = r.juhuOk ? `주 소정근로시간이 15시간 이상이라 개근하면 주휴수당 (${h} ÷ 40) × 8 × ${won(HOURLY.wage)} = <b>${won(r.juhu)}</b>이 매주 붙어요.`
    : `주 15시간 미만이라 주휴수당이 없어요(근로기준법 제18조제3항). 주 15시간으로 늘리면 주휴수당 ${won(r15.juhu)}이 붙어 월급이 ${won(r15.month)}이 돼요.`;
  write(hrHref(h), page({
    url: hrHref(h),
    title: `주 ${h}시간 알바 월급 2026 — ${r.juhuOk ? '주휴수당 포함' : '주휴수당 없이'} ${manw(r.month)}`,
    desc: `2026년 최저시급 ${won(HOURLY.wage)}으로 주 ${h}시간 일하면 주급 ${won(r.weekJ)}, 월급 ${won(r.month)}(4.345주)이에요. 주휴수당 ${r.juhuOk ? won(r.juhu) + ' 포함' : '미해당'}, 3.3% 공제 후 ${won(biz.net)}, 2027년 시급 기준 금액까지.`,
    body: `<h1>주 ${h}시간 알바 월급 (2026년 최저시급)</h1>
<p class="lead">최저시급 ${won(HOURLY.wage)}으로 주 ${h}시간 일하면 ${r.juhuOk ? '주휴수당을 포함해' : '주휴수당 없이'} <b>한 달 ${won(r.month)}</b>(세전)을 받아요.</p>
<div class="card">
<p class="jn" style="font-weight:700;color:var(--${r.juhuOk ? 'ok' : 'accent'})">${r.juhuOk ? '✅ 주휴수당 받아요' : '❌ 주휴수당 없어요'}</p>
<div>월 예상 급여 (세전)</div><div class="big" id="rmonth">${won(r.month)}</div>
<table>${row('기본 주급', won(r.base), hm(r.work) + ' × ' + won(HOURLY.wage))}${row('주휴수당 (주)', won(r.juhu), r.juhuOk ? `${h} ÷ 40 × 8시간분` : '15시간 미만 미지급')}${row('주급 합계', '<b>' + won(r.weekJ) + '</b>')}${row('월급 (세전)', '<b>' + won(r.month) + '</b>', '주급 × 4.345주')}${row('3.3% 떼면', won(biz.net), `소득세 ${won(biz.income)} + 지방세 ${won(biz.local)}`)}${row('2027년 시급 ' + won(HOURLY.wage2027) + ' 기준', won(r27.month), '2027.1.1부터')}</table>
</div>
<a class="cta" href="/hourly/?h=${h}">내 시급·출퇴근 시간으로 계산하기 →</a>

<h2>주휴수당 해당 여부</h2>
<div class="card"><p>${juhuTxt}</p><p class="hint">주휴수당은 1주 소정근로일을 모두 나왔을 때만 받아요. 결근한 주에는 그 주 주휴수당이 없어요.</p></div>

<h2>근무시간 1~3시간 차이 비교</h2>
<div class="card"><div style="overflow-x:auto"><table><tr><th>주 근무</th><th>주휴</th><th class="n">월급 (세전)</th><th class="n">3.3% 후</th></tr>${cmp}</table></div></div>

<h2>어떻게 계산했나요</h2>
<div class="card">
<p>주 5일, 하루 ${hm(h * 12)}씩(휴게 제외, 야간 없음) 일한다고 보고 계산했어요. 하루 8시간·주 40시간 이하라 요일 배치가 달라도 금액은 같아요. 기본 주급은 ${h}시간 × 시급, 주휴수당은 (주 소정근로시간 ÷ 40) × 8 × 시급이고, 월급은 주급 × 4.345주(365일 ÷ 7 ÷ 12)예요. 3.3%는 사업소득 원천징수 3%와 지방소득세 0.3%이고 10원 미만은 버렸어요.</p>
<p class="hint">기준일 ${ymd(HOURLY.updated)}. 근거: 고용노동부 고시 제2025-47호(2026년 최저임금 시간급 10,320원), 고용노동부 고시 제2026-60호(2027년 10,700원), 근로기준법 제18조제3항(주 15시간 미만 주휴 제외)·제50조·제55조제1항, 같은 법 시행령 별표2, 소득세법 제129조제1항제3호. 실제 월급은 그달 근무일 수에 따라 달라요.</p>
</div>
${nav(HRS, i, hrHref, v => `주 ${v}시간`, '/hourly/list/', '근무시간별 전체 표')}
<p>🧮 함께 쓰는 계산기: <a href="/hourly/">알바 시급·주휴수당 계산기</a> · <a href="/salary/">연봉 실수령액 계산기</a> · <a href="/unemployment/">실업급여 계산기</a></p>`
  }));
});
write('/hourly/list/', page({
  url: '/hourly/list/', title: '주 근무시간별 알바 월급 표 2026 — 주 10~40시간 (주휴수당 포함)',
  desc: `2026년 최저시급 ${won(HOURLY.wage)} 기준 주 10시간부터 40시간까지 1시간 단위로 주휴수당, 주급, 월급(4.345주), 3.3% 공제 후 금액을 한 표에 정리했어요.`,
  body: `<h1>주 근무시간별 알바 월급 표 (2026년)</h1>
<p class="lead">최저시급 ${won(HOURLY.wage)}, 개근·야간 없음 기준이에요. 주 15시간부터 주휴수당이 붙어요. 시간을 누르면 자세한 계산과 2027년 시급 기준 금액을 볼 수 있어요.</p>
<a class="cta" href="/hourly/">내 시급·근무시간으로 직접 계산하기 →</a>
<div class="card"><div style="overflow-x:auto"><table><tr><th>주 근무</th><th class="n">주휴수당(주)</th><th class="n">주급</th><th class="n">월급</th><th class="n">3.3% 후</th></tr>${HRS.map(h => { const r = hrOf(h); return `<tr><td><a href="${hrHref(h)}">${h}시간</a></td><td class="n">${won(r.juhu)}</td><td class="n">${won(r.weekJ)}</td><td class="n">${won(r.month)}</td><td class="n">${won(deduct(r.month, 'biz').net)}</td></tr>`; }).join('')}</table></div>
<p class="hint">기준일 ${ymd(HOURLY.updated)}. 월급 = 주급 × 4.345주. 근거: 고용노동부 고시 제2025-47호, 근로기준법 제18조제3항·제55조.</p></div>`
}));

// ---------- 4. 금액별 중개수수료 ----------
const brkOf = (deal, m) => brk.calc({ kind: 'house', deal, price: m * 1e4, deposit: m * 1e4, vat: true });
const brkHref = (deal, m) => `/brokerage/${deal}-${m}/`;
[['sale', BRK_SALE, '매매', '아파트 매매'], ['jeonse', BRK_JEON, '전세', '전세']].forEach(([deal, LIST, dn, tn]) => {
  const otherDeal = deal === 'sale' ? 'jeonse' : 'sale', OTHER = deal === 'sale' ? BRK_JEON : BRK_SALE;
  LIST.forEach((m, i) => {
    const name = kr(m, true), r = brkOf(deal, m), ot = brk.calc({ kind: 'officetel', deal, price: m * 1e4, deposit: m * 1e4, vat: true });
    const bands = deal === 'sale' ? brk.RATES.sale : brk.RATES.lease;
    const bi = bands.findIndex(b => m * 1e4 < b[0]), lo = bi ? bands[bi - 1][0] : 0, hi = bands[bi][0];
    const band = `${lo ? kr(lo / 1e4, true) + ' 이상' : ''}${lo && hi !== Infinity ? ' ~ ' : ''}${hi !== Infinity ? kr(hi / 1e4, true) + ' 미만' : ''}`;
    const row = (k, v, s) => `<tr><th>${k}</th><td class="n">${v}${s ? ` <span class="sub">${s}</span>` : ''}</td></tr>`;
    const cmp = near(LIST, i).map(v => { const x = brkOf(deal, v);
      return `<tr${v === m ? ' class="me"' : ''}><td>${v === m ? kr(v, true) : `<a href="${brkHref(deal, v)}">${kr(v, true)}</a>`}</td><td class="n">${pct(x.rate)}</td><td class="n">${won(x.fee)}</td><td class="n">${won(x.total)}</td></tr>`; }).join('');
    const other = OTHER.includes(m) ? ` · <a href="${brkHref(otherDeal, m)}">${name} ${deal === 'sale' ? '전세' : '매매'} 복비</a>` : '';
    const who = deal === 'sale' ? '매도인과 매수인' : '임대인과 임차인';
    write(brkHref(deal, m), page({
      url: brkHref(deal, m),
      title: `${name} ${tn} 복비 2026 — 상한 ${manw(r.fee)} (부가세 포함 ${manw(r.total)})`,
      desc: `${name} 주택 ${dn} 중개수수료(복비) 법정 상한은 요율 ${pct(r.rate)}로 ${won(r.fee)}, 부가세 10% 포함 ${won(r.total)}이에요. 오피스텔일 때 금액과 비슷한 ${dn}가 복비까지 비교.`,
      body: `<h1>${name} ${tn} 복비 (중개수수료, 2026년)</h1>
<p class="lead">${dn}가 ${name} 주택의 중개보수 상한은 <b>${won(r.fee)}</b>이에요. 중개사무소가 일반과세자면 부가세 10%가 붙어 ${won(r.total)}까지 낼 수 있어요. ${who}이 각각 내는 금액이에요.</p>
<div class="card">
<div>중개보수 상한 (부가세 별도)</div><div class="big" id="rfee">${won(r.fee)}</div>
<table>${row('거래금액', won(r.amount))}${row('상한요율', pct(r.rate), band + ' 구간')}${row('한도액', r.cap == null ? '없음' : won(r.cap))}${row('거래금액 × 요율', won(r.raw), r.capped ? '→ 한도액 적용' : '')}${row('부가세 10% 포함', '<b>' + won(r.total) + '</b>', '일반과세자')}${row('양쪽 합계 (부가세 포함)', won(r.total * 2), who + ' 각각')}${row('주거용 오피스텔이면', won(ot.fee), `${pct(ot.rate)} · 부가세 포함 ${won(ot.total)}`)}</table>
</div>
<a class="cta" href="/brokerage/?deal=${deal}&amp;amt=${m}">월세·오피스텔 등 다른 조건으로 계산하기 →</a>

<h2>비슷한 ${dn}가와 비교</h2>
<div class="card"><div style="overflow-x:auto"><table><tr><th>${dn}가</th><th class="n">요율</th><th class="n">상한</th><th class="n">부가세 포함</th></tr>${cmp}</table></div>
<p class="hint">금액은 법이 정한 상한이에요. 실제 복비는 이 안에서 중개사와 협의해 정해요.</p></div>

<h2>어떻게 계산했나요</h2>
<div class="card">
<p>주택 ${dn} 중개보수 상한은 거래금액 × 상한요율이고, 한도액이 있는 구간은 한도액까지예요. ${name}은 ${band} 구간이라 ${pct(r.rate)}${r.cap == null ? '가 적용되고 한도액은 없어요' : `에 한도액 ${won(r.cap)}이 적용돼요`}. 원 미만은 버렸어요. 상한요율은 부가세를 뺀 금액이라, 일반과세자인 중개사무소는 10%를 더 받을 수 있어요. 오피스텔(전용 85㎡ 이하·주거시설 갖춤)은 매매 0.5%·임대차 0.4%예요.</p>
<p class="hint">기준일 ${ymd(brk.RATES.updated)}. 근거: 공인중개사법 제32조, 같은 법 시행규칙 제20조·[별표 1] 주택 중개보수 상한요율·[별표 2] 오피스텔 요율(국토교통부령 제1611호, 2026. 8. 28. 시행 기준 확인), 서울특별시 주택 중개보수 등에 관한 조례. 실제 요율은 중개사무소가 있는 시·도 조례를 따라요.</p>
</div>
${nav(LIST, i, v => brkHref(deal, v), v => kr(v, true), '/brokerage/list/', '금액별 전체 표')}
<p>🧮 함께 쓰는 계산기: <a href="/brokerage/">중개수수료 계산기</a>${other}${deal === 'sale' && ACQ.includes(m) ? ` · <a href="${acqHref(m)}">${name} 취득세</a>` : ' · <a href="/acquisition-tax/">취득세 계산기</a>'} · <a href="/rent/">전월세 전환 계산기</a></p>
${HOME_LINK}`
    }));
  });
});
const brkList = (deal, LIST) => `<div style="overflow-x:auto"><table><tr><th>금액</th><th class="n">요율</th><th class="n">상한</th><th class="n">부가세 포함</th></tr>${LIST.map(m => { const r = brkOf(deal, m); return `<tr><td><a href="${brkHref(deal, m)}">${kr(m, true)}</a></td><td class="n">${pct(r.rate)}</td><td class="n">${won(r.fee)}</td><td class="n">${won(r.total)}</td></tr>`; }).join('')}</table></div>`;
write('/brokerage/list/', page({
  url: '/brokerage/list/', title: '금액별 복비(중개수수료) 표 2026 — 매매 1억~20억·전세 5천만~10억',
  desc: '주택 매매 1억~20억, 전세 5천만~10억 금액별 2026년 중개수수료(복비) 법정 상한과 부가세 포함 금액을 한 표에 정리했어요. 공인중개사법 시행규칙 별표1 기준.',
  body: `<h1>금액별 복비(중개수수료) 표 (2026년)</h1>
<p class="lead">주택 매매·전세의 법정 중개보수 상한이에요. 매도인·매수인(임대인·임차인)이 각각 내는 금액이고, 금액을 누르면 오피스텔일 때 금액과 계산 근거를 볼 수 있어요.</p>
<a class="cta" href="/brokerage/">월세·오피스텔 등 직접 계산하기 →</a>
<h2>주택 매매</h2><div class="card">${brkList('sale', BRK_SALE)}</div>
<h2>주택 전세</h2><div class="card">${brkList('jeonse', BRK_JEON)}
<p class="hint">기준일 ${ymd(brk.RATES.updated)}. 근거: 공인중개사법 시행규칙 제20조·[별표 1]. 부가세 포함은 일반과세자 중개사무소 기준이에요.</p></div>`
}));

// ---------- 쓰기: 예전 생성 폴더를 지우고 다시 만든다 ----------
const GEN = { salary: /^\d+$/, 'acquisition-tax': /^\d+$/, hourly: /^week-\d+$/, brokerage: /^(sale|jeonse)-\d+$/ };
for (const [dir, re] of Object.entries(GEN))
  for (const d of fs.readdirSync(path.join(ROOT, dir))) if (re.test(d) || d === 'list') fs.rmSync(path.join(ROOT, dir, d), { recursive: true });
for (const [url, html] of out) { const d = path.join(ROOT, url); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'index.html'), html); }

// sitemap.xml: 표시 사이의 생성분만 교체
const today = new Date().toLocaleDateString('sv-SE'), smPath = path.join(ROOT, 'sitemap.xml');
const sm = fs.readFileSync(smPath, 'utf8').replace(/<!-- longtail -->[\s\S]*<!-- \/longtail -->\n/, '');
const block = '<!-- longtail -->\n' + out.map(([u]) => `<url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') + '\n<!-- /longtail -->\n';
fs.writeFileSync(smPath, sm.replace('</urlset>', block + '</urlset>'));
console.log(`생성 ${out.length}쪽: 연봉 ${SAL.length}, 취득세 ${ACQ.length}, 알바 ${HRS.length}, 복비 매매 ${BRK_SALE.length}·전세 ${BRK_JEON.length}, 목록 4`);
