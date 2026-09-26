const a = require('assert'), { calc, earnedDeduct, earnedCredit, basicTax, cardDeduct, insEstimate, R } = require('./calc.js');
// 근로소득공제 (소득세법 제47조) — 구간 경계와 2천만 원 한도
a.strictEqual(earnedDeduct(5e6), 3500000);
a.strictEqual(earnedDeduct(1.5e7), 7500000);
a.strictEqual(earnedDeduct(4.5e7), 12000000);
a.strictEqual(earnedDeduct(5e7), 12250000);
a.strictEqual(earnedDeduct(1e8), 14750000);
a.strictEqual(earnedDeduct(3e8), 18750000);
a.strictEqual(earnedDeduct(4e8), 20000000);
// 기본세율 (제55조): 과표 1,400만 → 84만, 5,000만 → 624만, 8,800만 → 1,536만
a.strictEqual(basicTax(1.4e7), 840000); a.strictEqual(basicTax(5e7), 6240000); a.strictEqual(basicTax(8.8e7), 15360000);
// 근로소득세액공제 (제59조) 한도
a.strictEqual(earnedCredit(1e6, 3e7), 550000);
a.strictEqual(earnedCredit(3e6, 3e7), 740000);          // 1,225,000 → 한도 74만
a.strictEqual(earnedCredit(3e6, 5e7), 660000);          // 74만-13.6만=60.4만 → 최저 66만
a.strictEqual(earnedCredit(3e6, 4e7), 684000);          // 74만 - 700만×8/1000
a.strictEqual(earnedCredit(9e6, 1e8), 500000);          // 66만-1,500만/2 → 최저 50만
a.strictEqual(earnedCredit(9e6, 1.5e8), 200000);
// 신용카드 공제 (조특법 제126조의2): 총급여 5천, 신용 2천, 체크 5백 → (300+150) - 1,250×15% = 262.5만
let c = cardDeduct(5e7, 2e7, 5e6, 0); a.strictEqual(c.amount, 2625000);
// 최저사용금액이 신용카드분보다 크면 체크카드분에서 30%로 차감: 신용 1천, 체크 1천 → 150+300-(150+250×30%)=225만
a.strictEqual(cardDeduct(5e7, 1e7, 1e7, 0).amount, 2250000);
a.strictEqual(cardDeduct(5e7, 5e6, 5e6, 0).amount, 0);  // 25% 못 넘으면 0
// 한도: 7천 이하 300만, 자녀 1명 350만, 2명 이상 400만 / 7천 초과 250·275·300만
a.strictEqual(cardDeduct(5e7, 0, 3e7, 0).amount, 3e6);
a.strictEqual(cardDeduct(5e7, 0, 3e7, 1).amount, 3.5e6);
a.strictEqual(cardDeduct(5e7, 0, 3e7, 3).amount, 4e6);
a.strictEqual(cardDeduct(8e7, 0, 5e7, 0).cap, 2.5e6); a.strictEqual(cardDeduct(8e7, 0, 5e7, 2).cap, 3e6);
// 4대보험 추정: 총급여 5천
a.deepStrictEqual(insEstimate(5e7), { pension: 2375000, health: 1797500 + 236200 + 450000 });
// 자녀세액공제 (2025. 1. 1. 이후 금액)
a.strictEqual(R.child(1), 250000); a.strictEqual(R.child(2), 550000); a.strictEqual(R.child(3), 950000);
// 종합 사례 (손 계산): 총급여 5천, 본인 1명, 신용 2천·체크 5백, 기납부 300만
// 근로소득금액 3,775만 - 인적 150만 - 연금 237.5만 - 건강·요양·고용 248.37만 - 카드 262.5만 = 과표 28,766,300
// 산출 3,054,945 - 근로세액공제 66만 = 결정 2,394,945 (표준세액공제 쪽은 2,637,500이라 항목별 선택)
let r = calc({ gross: 5e7, paid: 3e6, deps: 1, credit: 2e7, debit: 5e6 });
a.strictEqual(r.base, 28766300); a.strictEqual(r.tax, 3054945); a.strictEqual(r.earned, 660000);
a.strictEqual(r.final, 2394945); a.strictEqual(r.standard.final, 2637500); a.strictEqual(r.useStandard, false);
a.strictEqual(r.refund, 605055); a.strictEqual(r.local, 239494);
// 월세 600만(17%)=102만, 연금저축 600만(15%)=90만, 자녀세액공제 2명 55만 → 결정 2,394,945-2,470,000 → 0
r = calc({ gross: 5e7, paid: 3e6, deps: 1, credit: 2e7, debit: 5e6, rent: 6e6, saving: 6e6, kidsCredit: 2 });
a.strictEqual(r.special.rent, 1020000); a.strictEqual(r.common.pensionAcct, 900000); a.strictEqual(r.final, 0); a.strictEqual(r.refund, 3e6);
// 연금계좌: 연금저축 800만 + IRP 500만 → 600 + 300 = 900만, 총급여 6천이면 12%
a.strictEqual(calc({ gross: 6e7, saving: 8e6, irp: 5e6 }).common.pensionAcct, 1080000);
// 월세: 총급여 8천 초과면 0, 5,500 초과 8천 이하 15%, 1천만 한도
a.strictEqual(calc({ gross: 9e7, rent: 6e6 }).special.rent, 0);
a.strictEqual(calc({ gross: 7e7, rent: 1.2e7 }).special.rent, 1500000);
// 의료비: 총급여 3% 초과분 15%, 기부금 1천만 초과분 30%
a.strictEqual(calc({ gross: 5e7, medical: 3e6 }).special.medical, 225000);
a.strictEqual(calc({ gross: 5e7, donation: 1.2e7 }).special.donation, 2100000);
// 공제할 게 없으면 표준세액공제 13만이 유리한지 비교해 고른다
r = calc({ gross: 3e7, deps: 1 }); a.ok(r.final === Math.min(r.itemized.final, r.standard.final));
console.log('ok');
