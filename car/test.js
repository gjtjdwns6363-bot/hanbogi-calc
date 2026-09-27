// node car/test.js — 할부·리스·렌트 비교식과 차량 데이터 확인
const assert = require('assert');
const { acqTax, installment, lease } = require('./compare.js');
const near = (a, b, m) => assert(Math.abs(a - b) <= 2, `${m}: ${a} vs ${b}`);
// 닫힌 식: 원금 P, 만기잔액 B인 원리금균등 월 납입
const pmt = (P, B, rPct, n) => { const r = rPct / 1200, v = Math.pow(1 + r, -n); return (P - B * v) * r / (1 - v); };

// 취득세: 3천만 신차 = 27,272,727 × 7% = 1,909,090 (10원 미만 절사)
assert.deepStrictEqual(acqTax(30e6, 'normal'), { tax: 1909090, cut: 0, net: 1909090 });
assert.strictEqual(acqTax(15e6, 'light').net, 545450 - 545450); // 경차 4% 545,450 → 75만 한도 안이라 0
assert.strictEqual(acqTax(50e6, 'ev').net, 3181810 - 1400000);  // 전기차 140만 감면
assert.strictEqual(acqTax(20e6, 'normal', { used: true }).net, 1400000); // 중고차는 거래가격 × 7%
assert.strictEqual(acqTax(30e6, 'normal', { biz: true }).net, 1090900);  // 렌트(영업용) 4%
assert.strictEqual(acqTax(15e6, 'light', { biz: true }).net, 545450);    // 영업용 경차는 75만 감면 없음
assert.strictEqual(acqTax(33e6, 'normal', { truck: true }).net, 1500000);   // 픽업(화물) 5%

// 할부: 3천만, 선수금 600만, 5% 36개월
const i = installment({ price: 30e6, down: 6e6, rate: 5, months: 36, kind: 'normal' });
near(i.pay, pmt(24e6, 0, 5, 36), '할부 월 납입'); assert.strictEqual(i.loan, 24e6);
assert.strictEqual(i.outlay, 6e6 + 24e6 + i.totalInt + 1909090);
// 보조금은 할부 원금에서 빠지고 취득세 과세표준에선 안 빠진다
const e = installment({ price: 50e6, subsidy: 10e6, down: 0, rate: 5, months: 36, kind: 'ev' });
assert.strictEqual(e.loan, 40e6); assert.strictEqual(e.tax, 1781810);

// 운용리스: 3천만, 36개월 6%, 보증금 0, 잔존 50% → 취득원가 31,909,090, 잔존 1,500만
const l = lease({ price: 30e6, kind: 'normal', months: 36, rate: 6, residualPct: 50 });
assert.strictEqual(l.cost, 31909090); near(l.pay, pmt(31909090, 15e6, 6, 36), '리스 월');
assert(l.pay > 580000 && l.pay < 600000, '리스 월 약 58.9만: ' + l.pay);
// 보증금 20%: 원금·잔액 모두 600만 줄어 월 납입은 600만 × 월이자만큼 준다
const l2 = lease({ price: 30e6, kind: 'normal', months: 36, rate: 6, depositPct: 20, residualPct: 50 });
near(l.pay - l2.pay, 6e6 * 0.005, '보증금 효과');
// 장기렌트: 영업용 취득세 4% + 포함 비용(월 10만)
const r = lease({ price: 30e6, kind: 'normal', months: 36, rate: 6, residualPct: 50, extra: 1e5, biz: true });
assert.strictEqual(r.cost, 30e6 + 1090900); near(r.pay, pmt(31090900, 15e6, 6, 36) + 1e5, '렌트 월');
assert.strictEqual(r.outlay, r.pay * 36);

// 차량 데이터: 가격은 정수 원, 슬러그 중복 없음, 출처·확인일 있음
const { CAR_MODELS } = require('./models.js');
const slugs = new Set();
for (const m of CAR_MODELS.list) {
  assert(!slugs.has(m.slug), '슬러그 중복 ' + m.slug); slugs.add(m.slug);
  assert(/^https:\/\//.test(m.src) && m.checked, m.model + ' 출처');
  assert(m.trims.length, m.model + ' 트림 없음');
  for (const t of m.trims) assert(Number.isInteger(t.price) && t.price > 5e6 && t.price < 5e8, `${m.model} ${t.name} 가격 ${t.price}`);
}
// 보조금 데이터: 전기 트림의 ev 키가 국고 표에 있어야 한다
const { EV_SUBSIDY } = require('./ev_subsidy.js');
for (const m of CAR_MODELS.list) for (const t of m.trims) if (t.ev) assert(EV_SUBSIDY.national[EV_SUBSIDY.keys.indexOf(t.ev)] > 0, `${m.model} ${t.name} 보조금 키 ${t.ev}`);
assert(EV_SUBSIDY.regions.every(r => r[2].length === EV_SUBSIDY.keys.length), '지역별 보조금 칸 수');
// 8,500만 원 이상 전기 트림은 보조금 대상이 아니므로 ev 키가 없어야 한다
for (const m of CAR_MODELS.list) for (const t of m.trims) if (t.fuel === '전기' && t.price >= 85e6) assert(!t.ev, `${m.model} ${t.name} 8500만 이상인데 보조금 연결`);
// 수입 브랜드: 가격 자동 입력값(트림 price)과 보조금 연결 규칙
const byS = s => CAR_MODELS.list.find(m => m.slug === s), tr = (s, n) => byS(s).trims.find(t => t.name === n);
assert.strictEqual(tr('bmw-i5', 'i5 eDrive40').price, 84900000); assert.strictEqual(tr('bmw-i5', 'i5 eDrive40').ev, 'BMW|i5 eDrive 40');
assert(!tr('bmw-i5', 'i5 eDrive40 M 스포츠').ev, 'i5 M 스포츠 9,700만은 보조금 제외');
assert.strictEqual(tr('benz-eqa', 'EQA 250 Progressive').price, 70800000);
assert(EV_SUBSIDY.national[EV_SUBSIDY.keys.indexOf(tr('benz-eqa', 'EQA 250 Progressive').ev)] === 1900000, 'EQA 국고');
assert(byS('benz-eqe').trims.every(t => !t.ev), 'EQE 1억 1천만 보조금 제외');
// BYD: ev.or.kr 보조금 표에서 '(단종)'으로만 올라 있어 연결하지 않는다(새 연식 등재되면 ev 추가)
assert.strictEqual(tr('byd-atto-3', 'BYD ATTO 3 Plus').price, 34900000);
assert(CAR_MODELS.list.filter(m => m.maker === 'BYD').every(m => m.trims.every(t => !t.ev)), 'BYD 보조금 미연결');
assert.strictEqual(tr('polestar-4', 'Rear motor').ev, '폴스타오토모티브코리아|Polestar 4 Coupe Rear Motor');
assert(!tr('polestar-3', 'Dual motor').ev, '폴스타 3 Dual 8,590만 보조금 제외');
assert.strictEqual(tr('mini-cooper-electric', 'SE Classic').ev, 'BMW|MINI Cooper SE');
assert.strictEqual(tr('audi-q4-e-tron', '45 e-tron').price, 66300000);
assert(byS('gmc-sierra').truck && byS('jeep-gladiator').truck, '수입 픽업 truck');
// 제조사 선택: 국산/수입 optgroup
const html = require('fs').readFileSync(__dirname + '/index.html', 'utf8');
assert(html.includes("g('국산'") && html.includes("g('수입'"), '제조사 optgroup');
// 생성 페이지(node gen/car.js 후): 아이오닉5 첫 트림 할부 월 = installment 결과
const fs = require('fs'), p = __dirname + '/ioniq5/index.html';
if (fs.existsSync(p)) {
  const { assume: A } = CAR_MODELS, m = CAR_MODELS.list.find(x => x.slug === 'ioniq5'), t = m.trims[0], S = EV_SUBSIDY, k = S.keys.indexOf(t.ev);
  const seoul = S.regions.find(r => r[0] === '서울특별시'), sub = S.national[k] + seoul[2][k];
  const pay = installment({ price: t.price, subsidy: sub, down: Math.round((t.price - sub) * 0.2), rate: A.loan, months: 36, kind: 'ev' }).pay;
  assert(fs.readFileSync(p, 'utf8').includes(`id="i0">${Math.round(pay).toLocaleString('ko-KR')}원<`), '아이오닉5 페이지 할부 월');
}
console.log('car/test.js 통과');
