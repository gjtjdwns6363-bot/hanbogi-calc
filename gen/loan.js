// 대출 금액별 롱테일 페이지 생성기: `node gen/loan.js` → /loan/<만원>/ (금액마다 1쪽) + /loan/list/ + sitemap.xml의 <!-- loan --> 구간.
// 계산식은 loan/amort.js(상환)·loan/rates.js(스트레스 DSR·은행 평균금리·정책대출 한도)를 그대로 쓴다. 생성 페이지를 손으로 고치지 말 것.
// 머리말(og·광고·GA·파비콘)과 푸터는 gen/car.js·gen/longtail.js의 page()와 같게 유지한다.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), SITE = 'https://calc.hanbogi.com';
const { schedule } = require('../loan/amort.js');
const { RATES, REG, stressAdd, annualPer, BANKS } = require('../loan/rates.js');

const AMTS = [5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 50000, 60000, 70000, 80000, 100000]; // 만원
const R0 = BANKS.big5, TERMS = [20, 30, 40], RATES_T = [...new Set([3.0, 3.5, 4.0, 4.5, R0, 5.0, 5.5, 6.0])].sort((a, b) => a - b);

const won = v => Math.round(v).toLocaleString('ko-KR') + '원';
const kr = m => { const e = Math.floor(m / 1e4), r = m % 1e4; return (e ? e + '억' : '') + (r ? (e ? ' ' : '') + r.toLocaleString('ko-KR') + '만' : '') + '원'; };
const manw = v => kr(Math.round(v / 1e4));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const ymd = s => { const [y, m, d] = s.split('-'); return `${y}년 ${+m}월 ${+d}일`; };
const pay = (m, r, y, how = 'equalPay') => schedule(m * 1e4, r, y * 12, how);
const FOOTER = `<footer>© 한눈 계산기 · <a href="/">다른 계산기</a> · <a href="/about.html">사이트 소개·계산 근거</a> · <a href="/privacy.html">개인정보처리방침</a>
<p class="net">한보기 네트워크: <a href="https://home.hanbogi.com">부동산 알리미</a> · <a href="https://talk.hanbogi.com">한눈 여행회화</a> · <a href="https://grant.hanbogi.com">정부 지원금 찾기</a> · <a href="https://benefit.hanbogi.com">혜택 알리미</a> · <a href="https://license.hanbogi.com">자격증 한눈에</a> · <a href="https://hanbogi.com">오늘의 게임</a> · <a href="https://stay.hanbogi.com">오늘의 숙소</a> · <a href="https://gadget.hanbogi.com">기기 비교소</a></p></footer>`;
const ld = o => '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', ...o }).replace(/</g, '\\u003c') + '</script>';
const crumbs = list => ld({ '@type': 'BreadcrumbList', itemListElement: [['한눈 계산기', '/'], ['주택담보대출 계산기', '/loan/'], ...list].map(([name, u], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + u })) });
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
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon-32.png" sizes="32x32"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="stylesheet" href="/style.css"><link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#1f5c5c"><script src="/common.js" defer></script>
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

// 이 금액을 빌리려면 필요한 연소득(만원): DSR 40%, 30년 원리금균등, 다른 대출 없음
const needInc = (m, area, type, fix) => Math.ceil(m * annualPer(R0 + stressAdd(area, type, fix, 30), 30) / (REG.dsr.bank / 100));
const INC_ROWS = [['수도권·규제지역 변동금리', 'reg', 'var', 0], ['수도권·규제지역 혼합형 5년', 'reg', 'mixed', 5], ['수도권·규제지역 주기형 5년', 'reg', 'cycle', 5], ['지방 변동금리', 'local', 'var', 0], ['순수 고정금리 (지역 무관)', 'reg', 'fixed', 0]];
const POLICY = [['디딤돌 (신혼·2자녀 최대)', RATES.didimdol.limit.newlywed], ['신생아 특례 디딤돌', RATES.newborn.limit], ['보금자리론 (생애최초 최대)', RATES.bogeumjari.limitFirst]];
const SRC = `금리 연 ${R0}%는 은행연합회 소비자포털 공시 5대 은행(KB국민·신한·하나·우리·NH농협) 분할상환 주담대 평균금리(${BANKS.month}, ${ymd(BANKS.updated)} 공시)예요.`;

const out = [];
for (const m of AMTS) {
  const url = `/loan/${m}/`, name = kr(m).replace(/원$/, ''), base = pay(m, R0, 30), prin = pay(m, R0, 30, 'equalPrin'), p40 = pay(m, R0, 40);
  const inc0 = needInc(m, 'reg', 'var', 0), incL = needInc(m, 'local', 'var', 0);
  const title = `${name} 대출 이자·월 상환액 2026 — 금리·만기별 표와 필요 연소득`;
  const desc = `주택담보대출 ${name}을 연 ${R0}%·30년 원리금균등으로 빌리면 월 ${won(base.firstPay)}, 총이자 ${manw(base.totalInt)}이에요. 금리 3~6%·만기 20~40년별 월 상환액, 원금균등 비교, 스트레스 DSR로 필요한 연소득까지 정리했어요.`;
  const rateRows = RATES_T.map(r => `<tr${r === R0 ? ' class="me"' : ''}><td>연 ${r.toFixed(2)}%${r === R0 ? ' <span class="sub">은행 평균</span>' : ''}</td>${TERMS.map(y => `<td class="n">${won(pay(m, r, y).firstPay)}</td>`).join('')}<td class="n">${manw(pay(m, r, 30).totalInt)}</td></tr>`).join('');
  const capNote = m > 60000 ? `수도권·규제지역은 주택구입 주담대가 최대 6억 원(시가 15억 초과 4억, 25억 초과 2억)이라 ${name}은 은행 주담대만으로는 빌릴 수 없어요. 지방 주택이거나 여러 대출을 합친 경우에만 해당돼요.`
    : `규제지역 무주택자(LTV 40%)라면 집값이 ${kr(Math.ceil(m / 0.4))} 이상, 규제지역 밖(LTV 70%)이라면 ${kr(Math.ceil(m / 0.7))} 이상이어야 ${name}까지 나와요.${m > 40000 ? ' 수도권·규제지역은 시가 15억 초과 주택이면 한도가 4억, 25억 초과면 2억으로 줄어요.' : ''}`;
  const pol = POLICY.filter(([, l]) => l >= m);
  const near = AMTS.filter(x => x !== m).map(x => `<a href="/loan/${x}/">${kr(x).replace(/원$/, '')}</a>`).join(' · ');
  out.push([url, page({ url, title, desc, crumb: [['대출 금액별 표', '/loan/list/'], [name + ' 대출', url]],
    qa: [[`${name} 대출 월 상환액은 얼마인가요?`, `연 ${R0}%, 30년 원리금균등이면 매달 ${won(base.firstPay)}씩 내고 총이자는 ${manw(base.totalInt)}이에요. 40년이면 월 ${won(p40.firstPay)}, 원금균등이면 첫 달 ${won(prin.firstPay)}에서 점점 줄어요.`],
         [`${name} 주담대를 받으려면 연소득이 얼마나 필요한가요?`, `은행 DSR 40%, 30년, 연 ${R0}% 기준으로 다른 대출이 없다면 수도권·규제지역 변동금리는 스트레스 금리 ${REG.stress.reg}%p가 더해져 약 ${kr(inc0)}, 지방 변동금리는 약 ${kr(incL)}의 연소득이 필요해요.`]],
    body: `<h1>${name} 대출 이자·월 상환액 (2026년)</h1>
<p class="lead">주택담보대출 <b>${name}</b>을 은행 평균 금리 연 ${R0}%, 30년 원리금균등으로 빌리면 매달 <b id="rpay">${won(base.firstPay)}</b>을 내고, 30년 동안 이자만 <b>${manw(base.totalInt)}</b>을 내요.</p>
<a class="cta" href="/loan/?amt=${m}">${name} 내 조건으로 계산하기 →</a>
<h2>금리·만기별 월 상환액 <span class="hint">원리금균등</span></h2>
<div class="card"><div style="overflow-x:auto"><table><tr><th>금리</th>${TERMS.map(y => `<th class="n">${y}년</th>`).join('')}<th class="n">총이자<br><span class="sub">30년</span></th></tr>${rateRows}</table></div>
<p class="hint">${SRC} 원 단위 반올림, 거치기간 없음. 변동금리라면 금리가 1%p 오를 때 월 상환액이 어떻게 바뀌는지 위아래 줄을 비교해 보세요.</p></div>
<h2>상환 방식별 비교 <span class="hint">연 ${R0}% · 30년</span></h2>
<div class="card"><table><tr><th>방식</th><th class="n">첫 달</th><th class="n">마지막 달</th><th class="n">총이자</th></tr>
<tr><td>원리금균등</td><td class="n">${won(base.firstPay)}</td><td class="n">${won(base.lastPay)}</td><td class="n">${manw(base.totalInt)}</td></tr>
<tr><td>원금균등</td><td class="n">${won(prin.firstPay)}</td><td class="n">${won(prin.lastPay)}</td><td class="n">${manw(prin.totalInt)}</td></tr>
<tr><td>만기일시 (이자만)</td><td class="n">${won(pay(m, R0, 30, 'bullet').firstPay)}</td><td class="n">원금 + 이자</td><td class="n">${manw(pay(m, R0, 30, 'bullet').totalInt)}</td></tr></table>
<p class="hint">원금균등은 처음 부담이 크지만 총이자가 ${manw(base.totalInt - prin.totalInt)} 적어요.</p></div>
<h2>${name} 빌리려면 연소득은? <span class="hint">스트레스 DSR 반영</span></h2>
<div class="card"><table><tr><th>금리 유형</th><th class="n">DSR 계산 금리</th><th class="n">필요 연소득</th></tr>${INC_ROWS.map(([t, a, ty, f]) => { const ad = stressAdd(a, ty, f, 30); return `<tr><td>${t}</td><td class="n">${(R0 + ad).toFixed(2)}%${ad ? ` <span class="sub">+${ad}%p</span>` : ''}</td><td class="n">${kr(needInc(m, a, ty, f))} 이상</td></tr>`; }).join('')}</table>
<p class="hint">은행 DSR 40%, 30년 원리금균등, 연 ${R0}%, 다른 대출이 없고 대출 받는 사람(차주) 본인 소득 기준으로 가정. 스트레스 금리는 한도 계산에만 더하고 실제 이자에는 붙지 않아요. 수도권·규제지역 ${REG.stress.reg}%p, 지방 ${REG.stress.local}%p(2026년 말까지)이고 혼합형·주기형은 고정기간 비중만큼 덜 더해요. 근거: 금융위원회 3단계 스트레스 DSR(2025.7), 주택시장 안정화 대책(2025.10.15).</p>
<p>${capNote}</p></div>
<h2>정책대출로 ${name}?</h2>
<div class="card"><p>${pol.length ? `최대 한도로 ${name}까지 가능한 정책대출: <b>${pol.map(([t]) => t).join(', ')}</b>. 정책대출은 DSR 대신 소득·집값 기준과 LTV로 한도를 정해요.` : `디딤돌(최대 3.2억)·신생아 특례(4억)·보금자리론(최대 4.2억)은 한도가 ${name}보다 작아요. 은행 주담대나 정책대출+은행 대출 조합을 알아봐야 해요.`} 자격(소득·집값·무주택)은 <a href="/loan/#limit">계산기 ①</a>에서 바로 확인할 수 있어요.</p></div>
<p>💰 다른 금액: ${near} · <a href="/loan/list/">전체 표</a></p>
<p>🧮 함께 쓰는 계산기: <a href="/loan/">주택담보대출 한도·이자 계산기</a> · <a href="/acquisition-tax/">취득세 계산기</a> · <a href="/brokerage/">중개수수료 계산기</a></p>`
  })]);
}

// 목록
out.push(['/loan/list/', page({ url: '/loan/list/', crumb: [['대출 금액별 표', '/loan/list/']],
  title: '대출 금액별 월 상환액 표 2026 — 1억·2억·3억·5억 주담대 이자',
  desc: `주택담보대출 5천만 원부터 10억 원까지 금액별로 은행 평균 금리 연 ${R0}%·30년 원리금균등 월 상환액과 총이자, 스트레스 DSR로 필요한 연소득을 한 표로 정리했어요.`,
  body: `<h1>대출 금액별 월 상환액 표 (2026년)</h1>
<p class="lead">은행 평균 금리 연 ${R0}%, 원리금균등 기준이에요. 금액을 누르면 금리·만기별 표와 필요 연소득을 볼 수 있어요.</p>
<a class="cta" href="/loan/">내 조건으로 계산하기 →</a>
<div class="card"><div style="overflow-x:auto"><table><tr><th>대출 금액</th><th class="n">30년 월</th><th class="n">40년 월</th><th class="n">총이자 (30년)</th><th class="n">필요 연소득<br><span class="sub">수도권 변동</span></th></tr>${AMTS.map(m => `<tr><td><a href="/loan/${m}/">${kr(m).replace(/원$/, '')}</a></td><td class="n">${won(pay(m, R0, 30).firstPay)}</td><td class="n">${won(pay(m, R0, 40).firstPay)}</td><td class="n">${manw(pay(m, R0, 30).totalInt)}</td><td class="n">${kr(needInc(m, 'reg', 'var', 0))}</td></tr>`).join('')}</table></div>
<p class="hint">${SRC} 필요 연소득은 은행 DSR 40%, 30년, 스트레스 금리 ${REG.stress.reg}%p(수도권·규제지역 변동금리), 다른 대출 없음 기준이에요.</p></div>`
})]);

// 쓰기: 예전 생성분(숫자 폴더·list)을 지우고 다시 만든다
for (const d of fs.readdirSync(path.join(ROOT, 'loan'))) if (/^\d+$|^list$/.test(d)) fs.rmSync(path.join(ROOT, 'loan', d), { recursive: true });
for (const [url, html] of out) { const d = path.join(ROOT, url); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'index.html'), html); }
const today = new Date().toLocaleDateString('sv-SE'), smPath = path.join(ROOT, 'sitemap.xml');
const sm = fs.readFileSync(smPath, 'utf8').replace(/<!-- loan -->[\s\S]*<!-- \/loan -->\n/, '');
fs.writeFileSync(smPath, sm.replace('</urlset>', '<!-- loan -->\n' + out.map(([u]) => `<url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') + '\n<!-- /loan -->\n</urlset>'));
console.log(`생성 ${out.length}쪽: 금액 ${AMTS.length}, 목록 1 (기준 금리 ${R0}%)`);
