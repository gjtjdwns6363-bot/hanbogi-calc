/* 한눈 계산기 공통 스크립트: 상단바 · 전체 메뉴 · 내 계산기(이 기기 localStorage) · 결과 링크 · 함께 쓰면 좋은 계산기 · 홈 검색
   모든 페이지 <head>에 <script src="/common.js" defer></script> 한 줄. 계산 함수 끝에서 window.HN&&HN.done('#res') 호출. */
(() => {
// [주소, 아이콘, 이름, 분류, 짧은 설명, 검색어]
const C = [
  ['/loan/', '🏠', '주택담보대출 이자 계산기', '대출·부동산', '대출 한도·월 상환액·정책대출', '주담대 LTV DSR 한도 디딤돌 신생아 특례 보금자리론 원리금 이자 중도상환'],
  ['/jeonse-loan/', '🔑', '전세대출 계산기', '대출·부동산', '전세 이자·임대료 월 부담', '전세자금 버팀목 임대 이자 월세 대출'],
  ['/down-payment/', '🏗️', '청약 중도금 계산기', '대출·부동산', '계약금·중도금·잔금 일정', '분양 계약금 잔금 중도금대출 입주'],
  ['/subscription/', '🏢', '청약 가점 계산기', '대출·부동산', '84점 가점·특별공급 자격', '청약 점수 가점 특별공급 신혼희망타운 생애최초 다자녀 통장'],
  ['/rent/', '🔁', '전월세 전환 계산기', '대출·부동산', '전세↔월세 전환율', '전세 월세 전환율 갱신 5% 보증금'],
  ['/brokerage/', '🤝', '중개수수료(복비) 계산기', '대출·부동산', '매매·전세·월세 상한요율', '복비 중개보수 부동산 수수료 매매 전세 월세 오피스텔'],
  ['/salary/', '💵', '연봉 실수령액 계산기', '급여·노동', '세후 월급·4대보험', '월급 연봉 세후 4대보험 소득세 실수령 실수령액'],
  ['/hourly/', '⏰', '알바 시급·주휴수당 계산기', '급여·노동', '주휴·야간·연장 수당', '최저시급 시급 주휴 야간 아르바이트 알바 월급'],
  ['/severance/', '📦', '퇴직금 계산기', '급여·노동', '퇴직금·퇴직소득세·IRP', '퇴직금 퇴직소득세 IRP 평균임금 퇴사'],
  ['/unemployment/', '🧾', '실업급여 계산기', '급여·노동', '구직급여 금액·받는 기간', '실업급여 구직급여 고용보험 수급 자진퇴사 퇴사'],
  ['/year-end-tax/', '📑', '연말정산 환급 계산기', '세금', '환급액·공제 항목별 비교', '연말정산 13월의 월급 카드 공제 의료비 교육비 환급'],
  ['/acquisition-tax/', '🏷️', '부동산 취득세 계산기', '세금', '주택 취득세·감면·중과', '취득세 주택 아파트 생애최초 감면 다주택 중과 조정대상지역'],
  ['/capital-gains/', '📈', '양도소득세 계산기', '세금', '양도세·비과세·장기보유공제', '양도세 양도소득세 1세대1주택 비과세 장기보유특별공제 일시적 2주택'],
  ['/eitc/', '💰', '근로·자녀장려금 계산기', '지원금', '장려금 예상액·신청 시기', '근로장려금 자녀장려금 장려금 EITC 반기 신청'],
  ['/parental-leave/', '👶', '육아휴직 급여 계산기', '지원금', '6+6·근로시간 단축 급여', '육아휴직 6+6 부모육아휴직 근로시간 단축 배우자 출산휴가'],
  ['/car/', '🚗', '자동차 할부·리스·렌트 계산기', '자동차', '차종별 가격·월 납입금 비교', '자동차 오토론 할부 리스 장기렌트 전기차 보조금 취득세 신차 중고차'],
];
const CATS = ['대출·부동산', '급여·노동', '세금', '지원금', '자동차'];
// 검색에만 나오는 표·양식 페이지
const X = [
  ['/salary/list/', '📋', '연봉별 실수령액 표', '급여·노동', '', '연봉표 월급표'],
  ['/severance/list/', '📋', '근속연수별 퇴직금 표', '급여·노동', '', '퇴직금표'],
  ['/hourly/list/', '📋', '주 근무시간별 알바 월급 표', '급여·노동', '', '알바 월급표 시급'],
  ['/loan/list/', '📋', '대출 금액별 월 상환액 표', '대출·부동산', '', '주담대 이자표'],
  ['/brokerage/list/', '📋', '금액별 복비 표', '대출·부동산', '', '중개수수료표'],
  ['/acquisition-tax/list/', '📋', '집값별 취득세 표', '세금', '', '아파트 취득세표'],
  ['/capital-gains/list/', '📋', '양도차익별 양도세 표', '세금', '', '양도세표'],
  ['/year-end-tax/list/', '📋', '총급여별 연말정산 예상표', '세금', '', '연말정산표'],
  ['/car/list/', '📋', '차종별 신차 가격표', '자동차', '', '차값 가격표 트림'],
  ['/free/', '📥', '무료 엑셀 양식', '양식', '', '엑셀 양식 가계부 경조사 이사 결혼 장부 다운로드'],
];
const REL = {
  '/loan/': ['/acquisition-tax/', '/brokerage/', '/down-payment/'],
  '/jeonse-loan/': ['/rent/', '/brokerage/', '/loan/'],
  '/down-payment/': ['/subscription/', '/loan/', '/acquisition-tax/'],
  '/subscription/': ['/down-payment/', '/loan/', '/acquisition-tax/'],
  '/rent/': ['/jeonse-loan/', '/brokerage/', '/loan/'],
  '/brokerage/': ['/acquisition-tax/', '/loan/', '/rent/'],
  '/salary/': ['/year-end-tax/', '/severance/', '/hourly/'],
  '/hourly/': ['/salary/', '/unemployment/', '/eitc/'],
  '/severance/': ['/unemployment/', '/salary/', '/year-end-tax/'],
  '/unemployment/': ['/severance/', '/parental-leave/', '/salary/'],
  '/year-end-tax/': ['/salary/', '/eitc/', '/severance/'],
  '/acquisition-tax/': ['/brokerage/', '/loan/', '/capital-gains/'],
  '/capital-gains/': ['/acquisition-tax/', '/brokerage/', '/loan/'],
  '/eitc/': ['/year-end-tax/', '/hourly/', '/parental-leave/'],
  '/parental-leave/': ['/unemployment/', '/salary/', '/eitc/'],
  '/car/': ['/salary/', '/loan/', '/year-end-tax/'],
};
const byUrl = u => C.find(c => c[0] === u);
const esc = s => String(s).replace(/[&<>"']/g, ch => '&#' + ch.charCodeAt(0) + ';');
const $ = s => document.querySelector(s);
const path = location.pathname, sec = '/' + path.split('/')[1] + '/', cur = byUrl(sec), home = path === '/' || path === '/index.html';
const NAME = cur ? cur[2] : document.title.split('|')[0].trim();

// 저장소 (기기에만 저장, 막혀 있어도 페이지는 동작)
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const favs = () => load('hn_fav', {}), recents = () => load('hn_recent', []);

function toast(msg) {
  let t = $('.hn-toast'); if (!t) { t = document.createElement('div'); t.className = 'hn-toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  t.textContent = msg; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2200);
}
function copy(u) {
  const ok = () => toast('링크를 복사했어요');
  if (navigator.clipboard) navigator.clipboard.writeText(u).then(ok, () => prompt('이 주소를 복사하세요', u)); else prompt('이 주소를 복사하세요', u);
}
const share = (title, url) => navigator.share ? navigator.share({ title, url }).catch(() => {}) : copy(url);

// 상단바
const h = $('header');
if (h) h.innerHTML = `<div class="hn-bar"><a class="hn-logo" href="/">한눈 계산기</a>${cur ? '<a class="hn-back" href="/#all">← 전체<span class="hn-t"> 계산기</span></a>' : ''}<span class="hn-sp"></span>` +
  '<button type="button" class="hn-b" data-a="my" aria-label="내 계산기">⭐<span class="hn-t"> 내 계산기</span></button>' +
  '<button type="button" class="hn-b" data-a="share" aria-label="공유">↗<span class="hn-t"> 공유</span></button>' +
  '<button type="button" class="hn-b" data-a="menu" aria-label="전체 메뉴">☰<span class="hn-t"> 전체</span></button></div>';

// 대화상자(서랍·내 계산기): 네이티브 dialog라 ESC로 닫힘, 어두운 막을 누르면 닫힘
function dlg(id, cls, html) {
  let d = document.getElementById(id);
  if (!d) { d = document.createElement('dialog'); d.id = id; d.className = 'hn-dlg ' + cls; document.body.append(d);
    d.addEventListener('click', e => { if (e.target === d) d.close(); }); }
  d.innerHTML = html; return d;
}
const head = t => `<div class="hn-dh"><b>${t}</b><button type="button" class="hn-x" data-a="close" aria-label="닫기">✕</button></div>`;
function menu() {
  const a = (u, t) => `<a href="${u}"${u === sec || u === path ? ' class="on" aria-current="page"' : ''}>${t}</a>`;
  dlg('hn-menu', 'hn-drawer', head('전체 메뉴') + '<nav class="hn-nav"><h3>바로가기</h3>' +
    a('/', '🏠 홈') + a('/free/', '📥 무료 엑셀 양식') + a('/updates.html', '📝 업데이트 노트') + a('/about.html', 'ℹ️ 사이트 소개') +
    CATS.map(k => `<h3>${k}</h3>` + C.filter(c => c[3] === k).map(c => a(c[0], c[1] + ' ' + c[2])).join('')).join('') + '</nav>').showModal();
}
let tab = 'fav';
function my() {
  const d = dlg('hn-my', '', head('⭐ 내 계산기') + `<div class="hn-tabs" role="tablist"><button type="button" data-a="tab" data-t="fav" role="tab" aria-selected="${tab === 'fav'}">즐겨찾기</button><button type="button" data-a="tab" data-t="rec" role="tab" aria-selected="${tab === 'rec'}">최근 계산</button></div><div class="hn-list">` + myList() + '</div><p class="hint hn-note">이 기기(브라우저)에만 저장되고 서버로 보내지 않아요.</p>');
  if (!d.open) d.showModal();
}
function myList() {
  const row = (u, x) => `<div class="hn-row"><a href="${esc(u)}"><b>${esc(x.n)}</b>${x.r ? `<span>${esc(x.r)}</span>` : ''}<small>${new Date(x.t).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}</small></a><button type="button" class="hn-del" data-a="del" data-u="${esc(u)}" aria-label="삭제">×</button></div>`;
  if (tab === 'fav') { const f = Object.entries(favs()).sort((a, b) => b[1].t - a[1].t);
    return f.length ? f.map(([u, x]) => row(u, x)).join('') : '<p class="hn-empty">저장한 계산이 없어요.<br>계산 결과 아래 <b>☆ 내 계산기에 저장</b>을 누르면 여기에 모여요.</p>'; }
  const r = recents();
  return r.length ? r.map(x => row(x.u, x)).join('') + '<button type="button" class="hn-clear" data-a="clear">최근 계산 전체 삭제</button>' : '<p class="hn-empty">아직 계산 기록이 없어요.<br>계산하면 최근 20개가 자동으로 남아요.</p>';
}

// 결과 링크: 폼의 금액·날짜·선택값만 쿼리스트링에 담는다 (이름 같은 자유 텍스트는 제외)
const linkable = e => /^(select-one|number|date|time|month|range)$/.test(e.type) || (e.type === 'text' && (e.classList.contains('num') || /numeric|decimal/.test(e.inputMode)));
function formFor(el) { let f = null; for (const x of document.forms) if (x.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) f = x; return f; }
function linkOf(f) {
  const p = new URLSearchParams();
  for (const e of f.elements) { const k = e.id || e.name; if (!k || e.disabled) continue;
    if (e.type === 'radio') { if (e.checked) p.set(e.name, e.value); }
    else if (e.type === 'checkbox') { if (e.checked) p.set(k, '1'); }
    else if (linkable(e) && e.value !== '') p.set(k, e.type === 'text' ? e.value.replace(/,/g, '') : e.value); }
  if (f.id) p.set('_f', f.id);
  return location.origin + path + '?' + p;
}
function restore() {
  const p = new URLSearchParams(location.search), f = p.get('_f') && document.getElementById(p.get('_f'));
  if (!f || f.tagName !== 'FORM') return;
  const fire = (e, t) => e.dispatchEvent(new Event(t, { bubbles: true }));
  for (const e of [...f.elements]) { const k = e.id || e.name; if (!k || e.disabled) continue;
    if (e.type === 'radio') { if (p.get(e.name) === e.value && !e.checked) { e.checked = true; fire(e, 'change'); } }
    else if (e.type === 'checkbox') { const c = p.get(k) === '1'; if (e.checked !== c) { e.checked = c; fire(e, 'change'); } }
    else if (linkable(e) && p.has(k)) { e.value = p.get(k); fire(e, 'input'); fire(e, 'change'); } }
  f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event('submit', { cancelable: true }));
}
function summary(el) {
  const b = el.querySelector('.big');
  if (b && b.textContent.trim()) { const l = b.previousElementSibling, lt = l && !l.classList.contains('hint') ? l.textContent.trim() : '';
    return ((lt && lt.length < 30 ? lt + ' ' : '') + b.textContent.trim()).replace(/\s+/g, ' ').slice(0, 80); }
  return el.textContent.trim().replace(/\s+/g, ' ').slice(0, 60);
}
// 계산이 끝나면: 최근 계산 저장 + 결과 아래 버튼
function done(sel, sum) {
  const el = typeof sel === 'string' ? $(sel) : sel, f = el && formFor(el); if (!f) return;
  const u = linkOf(f), r = sum || summary(el);
  save('hn_recent', [{ n: NAME, r, u, t: Date.now() }, ...recents().filter(x => x.u !== u)].slice(0, 20));
  let act = el.querySelector('.hn-act');
  if (!act) { act = document.createElement('div'); act.className = 'hn-act'; el.append(act); }
  act.dataset.u = u; act.dataset.r = r;
  act.innerHTML = `<button type="button" data-a="fav">${favs()[u] ? '★ 저장됨' : '☆ 내 계산기에 저장'}</button><button type="button" data-a="copy">🔗 결과 링크 복사</button>` +
    (navigator.share ? '<button type="button" data-a="rshare">↗ 공유</button>' : '');
}

// 홈: 내 즐겨찾기 줄 + 즉시 검색
function favRow() {
  const box = $('#hn-favrow'); if (!box) return;
  const f = Object.entries(favs()).sort((a, b) => b[1].t - a[1].t);
  box.hidden = !f.length;
  box.querySelector('.hn-chips').innerHTML = f.map(([u, x]) => `<a class="hn-chip" href="${esc(u)}">${esc(x.n)}${x.r ? `<small>${esc(x.r)}</small>` : ''}</a>`).join('');
}
const q = $('#hn-q'), qres = $('#hn-qres');
if (q && qres) {
  const all = [...C, ...X], norm = s => s.toLowerCase().replace(/\s+/g, '');
  q.addEventListener('input', () => {
    const words = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) { qres.hidden = true; return; }
    const m = all.filter(c => { const hay = norm(c[2] + c[3] + c[4] + c[5]); return words.every(w => hay.includes(norm(w))); });
    qres.innerHTML = m.length ? m.map(c => `<li><a href="${c[0]}">${c[1]} ${c[2]} <span class="hint">${c[3]}</span></a></li>`).join('') : '<li class="hn-empty">찾는 계산기가 없어요. 다른 말로 검색해 보세요.</li>';
    qres.hidden = false;
  });
  q.addEventListener('keydown', e => { const a = qres.querySelector('a'); if (e.key === 'Enter' && a) { e.preventDefault(); location.href = a.href; } });
}
favRow();

// 함께 쓰면 좋은 계산기 (계산기 본 페이지는 관련 3개, 생성 페이지는 이 계산기 + 관련 2개)
const main = $('main');
if (cur && main && REL[sec]) {
  const list = (path === sec ? REL[sec] : [sec, ...REL[sec].slice(0, 2)]).map(byUrl);
  const s = document.createElement('section'); s.className = 'hn-rel';
  s.innerHTML = '<h2>함께 쓰면 좋은 계산기</h2><div class="hn-rel-g">' + list.map(c => `<a class="card" href="${c[0]}"><b>${c[1]} ${c[2]}</b><span class="hint">${c[4]}</span></a>`).join('') + '</div>';
  const res = [...main.querySelectorAll('.result')].pop();
  const at = res && [...main.querySelectorAll('h2')].find(x => res.compareDocumentPosition(x) & Node.DOCUMENT_POSITION_FOLLOWING);
  at ? at.before(s) : main.append(s);
}

// 버튼 동작 (한곳에서 처리)
document.addEventListener('click', e => {
  const b = e.target.closest('[data-a]'); if (!b) return;
  const a = b.dataset.a, act = b.closest('.hn-act');
  if (a === 'menu') menu();
  else if (a === 'my') my();
  else if (a === 'share') share(document.title, location.href);
  else if (a === 'close') b.closest('dialog').close();
  else if (a === 'tab') { tab = b.dataset.t; my(); }
  else if (a === 'del') { if (tab === 'fav') { const f = favs(); delete f[b.dataset.u]; save('hn_fav', f); } else save('hn_recent', recents().filter(x => x.u !== b.dataset.u)); my(); favRow(); syncFav(); }
  else if (a === 'clear') { save('hn_recent', []); my(); }
  else if (a === 'fav') { const f = favs(), u = act.dataset.u;
    if (f[u]) { delete f[u]; toast('내 계산기에서 뺐어요'); } else { f[u] = { n: NAME, r: act.dataset.r, t: Date.now() }; toast('내 계산기에 저장했어요 (⭐ 내 계산기에서 확인)'); }
    save('hn_fav', f); syncFav(); }
  else if (a === 'copy') copy(act.dataset.u);
  else if (a === 'rshare') share(NAME + ' 결과', act.dataset.u);
});
function syncFav() { const f = favs(); document.querySelectorAll('.hn-act').forEach(x => { const b = x.querySelector('[data-a=fav]'); if (b) b.textContent = f[x.dataset.u] ? '★ 저장됨' : '☆ 내 계산기에 저장'; }); }

window.HN = { done, C, CATS };
restore();
})();
