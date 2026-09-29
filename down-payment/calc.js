// 청약(분양) 계약금·중도금·잔금 일정과 중도금대출 이자 계산 (단순이자, 원 단위)
// 기본 납부 비율은 민간 아파트 분양의 일반적인 10% / 60%(6회) / 30%. 단지마다 공고문이 정하므로 입력으로 바꾼다.
const DEFAULTS = { downPct: .1, midPct: .6, rounds: 6, interval: 4, loanPct: .4, rate: .045, months: 36 };
const fl = Math.floor;
function calc(o) {
  const c = { ...DEFAULTS, ...o };
  const price = c.price, down = fl(price * c.downPct), mid = fl(price * c.midPct), balance = price - down - mid;
  const loan = Math.min(fl(price * c.loanPct), mid), n = c.rounds;
  const split = (total) => Array.from({ length: n }, (_, i) => fl(total / n) + (i === n - 1 ? total - fl(total / n) * n : 0)); // 나머지는 마지막 회차
  const amts = split(mid), loans = split(loan);
  let drawn = 0, interest = 0;
  const schedule = amts.map((amt, i) => {
    const month = Math.min((i + 1) * c.interval, c.months);
    drawn += loans[i];
    const it = c.free ? 0 : Math.round(loans[i] * c.rate * (c.months - month) / 12); // 이 회차 대출이 입주까지 붙는 이자
    interest += it;
    return { n: i + 1, month, amt, loan: loans[i], own: amts[i] - loans[i], interest: it, drawn };
  });
  const need = balance + loan + (c.deferred ? interest : 0);      // 입주 때 한꺼번에 내야 할 돈 (중도금대출 상환 + 잔금)
  return { price, down, mid, balance, loan, ownMid: mid - loan, interest, schedule,
    monthlyPeak: c.free ? 0 : Math.round(loan * c.rate / 12), moveIn: need, shortfall: Math.max(0, need - (c.mortgage || 0)),
    cashNeeded: down + (mid - loan) + Math.max(0, need - (c.mortgage || 0)) + (c.deferred ? 0 : interest) };
}
if (typeof module !== 'undefined') module.exports = { calc, DEFAULTS };
