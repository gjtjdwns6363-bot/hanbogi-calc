const a = require('assert'), { calc, earnedDeduct, earnedCredit, basicTax, cardDeduct, medicalCredit, insEstimate, tips, couple, R } = require('./calc.js');
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
let c = cardDeduct(5e7, { credit: 2e7, debit: 5e6 }); a.strictEqual(c.amount, 2625000);
// 최저사용금액이 신용카드분보다 크면 체크카드분에서 30%로 차감: 신용 1천, 체크 1천 → 150+300-(150+250×30%)=225만
a.strictEqual(cardDeduct(5e7, { credit: 1e7, debit: 1e7 }).amount, 2250000);
a.strictEqual(cardDeduct(5e7, { credit: 5e6, debit: 5e6 }).amount, 0);  // 25% 못 넘으면 0
// 한도: 7천 이하 300만, 자녀 1명 350만, 2명 이상 400만 / 7천 초과 250·275·300만
a.strictEqual(cardDeduct(5e7, { debit: 3e7 }, 0).amount, 3e6);
a.strictEqual(cardDeduct(5e7, { debit: 3e7 }, 1).amount, 3.5e6);
a.strictEqual(cardDeduct(5e7, { debit: 3e7 }, 3).amount, 4e6);
a.strictEqual(cardDeduct(8e7, { debit: 5e7 }, 0).cap, 2.5e6); a.strictEqual(cardDeduct(8e7, { debit: 5e7 }, 2).cap, 3e6);
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

// ---- 2026-09-27 확장: 카드 사용처별 공제율·추가 한도 (조특법 제126조의2 ②·⑪) ----
// 총급여 5천, 신용 1,250만(=최저사용금액) + 체크 500 + 전통시장 200 + 대중교통 100 → 150+80+40 = 270만
a.strictEqual(cardDeduct(5e7, { credit: 1.25e7, debit: 5e6, market: 2e6, transit: 1e6 }).amount, 2700000);
// 체크 1,500으로 늘리면 570만 → 기본 한도 300만 + 전통시장·대중교통 공제분 120만(추가 한도 300만 이내) = 420만
c = cardDeduct(5e7, { credit: 1.25e7, debit: 1.5e7, market: 2e6, transit: 1e6 });
a.strictEqual(c.before, 5700000); a.strictEqual(c.add, 1200000); a.strictEqual(c.amount, 4200000);
// 7천 이하 문화체육 30%도 추가 한도에 들어간다: 신용 1,250 + 문화 100 + 체크 1,000 → 330만(한도 300 + 30)
a.strictEqual(cardDeduct(5e7, { credit: 1.25e7, debit: 1e7, culture: 1e6 }).amount, 3300000);
// 7천 초과면 문화체육 30%가 없어 신용카드분(15%)으로 계산: 총급여 8천, 신용 2,000 + 문화 200 → 30만
a.strictEqual(cardDeduct(8e7, { credit: 2e7, culture: 2e6 }).amount, 300000);
// 최저사용금액이 신용+체크보다 크면 나머지는 40%로 차감(제6호 다목): 신용 500·체크 500·전통시장 500 → 425-325 = 100만
a.strictEqual(cardDeduct(5e7, { credit: 5e6, debit: 5e6, market: 5e6 }).amount, 1000000);
// 7천 초과 추가 한도는 전통시장·대중교통만 200만: 총급여 8천, 체크 3천·전통시장 500·대중교통 500 → 250 + 200 = 450만
c = cardDeduct(8e7, { debit: 3e7, market: 5e6, transit: 5e6 });
a.strictEqual(c.before, 7000000); a.strictEqual(c.extraCap, 2e6); a.strictEqual(c.amount, 4500000);

// 의료비 (소득세법 제59조의4②): 3% 문턱은 일반 → 특정 → 미숙아 → 난임 순으로 뺀다
// 총급여 5천(문턱 150만), 일반 100 + 본인 300 + 난임 200 → (300-50)×15% + 200×30% = 37.5만 + 60만
a.deepStrictEqual(medicalCredit(5e7, { general: 1e6, special: 3e6, ivf: 2e6 }), { base: 4500000, credit: 975000 });
a.strictEqual(medicalCredit(5e7, { general: 1e7 }).credit, 1050000);          // 일반은 700만 한도
a.strictEqual(medicalCredit(5e7, { special: 2e7 }).credit, 2775000);          // 본인·65세 이상 등은 한도 없음: (2,000-150)×15%
a.strictEqual(medicalCredit(5e7, { general: 2e6, preemie: 1e6 }).credit, 75000 + 200000); // 미숙아 20%
a.strictEqual(calc({ gross: 5e7, medical: 3e6 }).special.medical, 225000);   // 예전 입력(medical)도 그대로

// 교육비 1명당 한도: 초중고 500만(1명) → 300만, 대학 1,000만(1명) → 900만, 본인 200만(한도 없음) → 1,400만 × 15%
a.strictEqual(calc({ gross: 5e7, eduSchool: 5e6, eduSchoolN: 1, eduUni: 1e7, eduUniN: 1, eduSelf: 2e6 }).special.edu, 2100000);
a.strictEqual(calc({ gross: 5e7, eduSchool: 5e6, eduSchoolN: 2 }).special.edu, 750000);

// 주택청약종합저축 40%(연 300만 납입 한도, 총급여 7천 이하) + 주택임차차입금 40%, 합계 400만 한도
r = calc({ gross: 5e7, housingSave: 3e6 }); a.strictEqual(r.housing.save, 1200000);
r = calc({ gross: 5e7, housingSave: 3e6, leaseLoan: 1e7 }); a.strictEqual(r.itemized.housing.total, 4e6); a.strictEqual(r.itemized.housing.save, 1200000);
a.strictEqual(calc({ gross: 8e7, housingSave: 3e6 }).itemized.housing.total, 0);
a.strictEqual(calc({ gross: 5e7, leaseLoan: 1e7 }).standard.housing.total, 0); // 표준세액공제를 고르면 주택임차차입금 공제 불가

// 추가공제 (소득세법 제51조): 경로 100만, 장애인 200만, 부녀자 50만(근로소득금액 3천 이하), 한부모 100만(부녀자와 중복 시 한부모)
a.strictEqual(calc({ gross: 5e7, deps: 3, senior: 1, disabled: 1 }).person, 4500000 + 3000000);
a.strictEqual(calc({ gross: 3e7, woman: true }).addl, 500000);
a.strictEqual(calc({ gross: 5e7, woman: true }).addl, 0);                     // 근로소득금액 3,775만 > 3천
a.strictEqual(calc({ gross: 3e7, woman: true, single: true }).addl, 1000000);

// 출산·입양 세액공제 (제59조의2③) 첫째 30만·둘째 50만·셋째 이상 70만, 혼인세액공제 50만 (조특법 제92조)
a.strictEqual(calc({ gross: 5e7, birth: 1 }).common.birth, 300000);
a.strictEqual(calc({ gross: 5e7, birth: 2 }).common.birth, 500000);
a.strictEqual(calc({ gross: 5e7, birth: 3 }).common.birth, 700000);
r = calc({ gross: 5e7, paid: 3e6, deps: 1, credit: 2e7, debit: 5e6, marriage: true });
a.strictEqual(r.final, 2394945 - 500000);

// 더 받을 여지: 연금계좌 900만 × 15%, 결정세액을 넘지 않게
r = calc({ gross: 5e7, deps: 1, credit: 2e7, debit: 5e6 }); const tp = tips({ gross: 5e7, credit: 2e7, debit: 5e6 }, r);
a.strictEqual(tp.find(t => t.k === 'pension').gain, 1350000);
a.ok(tp.find(t => t.k === 'housing'));

// 맞벌이 배분: 네 조합 중 부부 합계 결정세액이 가장 작은 것이 맨 앞, 합계는 각자 calc와 일치
const A1 = { gross: 8e7, credit: 2.5e7 }, B1 = { gross: 3.5e7, debit: 1e7 };
const opts = couple(A1, B1, { n: 2, credit: 2, medical: 3e6, edu: 4e6, eduN: 2 }, { n: 1, senior: 1, medical: 2e6 });
a.strictEqual(opts.length, 4);
a.ok(opts.every(o => o.total >= opts[0].total));
const allToA = opts.find(o => o.kidsTo === 'a' && o.parentsTo === 'a');
a.strictEqual(allToA.a, calc({ ...A1, deps: 4, kids: 2, kidsCredit: 2, senior: 1, medical: 5e6, eduSchool: 4e6, eduSchoolN: 2 }).final);
a.strictEqual(allToA.b, calc({ ...B1, deps: 1 }).final);
// 부양가족이 없으면 한 가지만
a.strictEqual(couple(A1, B1, { n: 0 }, { n: 0 }).length, 1);
console.log('ok');
