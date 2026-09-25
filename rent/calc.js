// 전월세 전환 (주택임대차보호법 제7조의2, 시행령 제9조)
// 법정 상한 = min(연 10%, 한국은행 기준금리 + 연 2%p). 기준금리 바뀌면 rate·updated만 고친다.
const BOK = { rate: 3.00, updated: '2026-08-27', src: 'https://www.bok.or.kr/portal/singl/baseRate/list.do?dataSeCd=01&menuNo=200643' };
const legalCap = (base = BOK.rate) => Math.min(10, +(base + 2).toFixed(2));
// 금액 단위는 호출 쪽과 같게(만 원이든 원이든), rate는 연 %
const toMonthly = (amount, rate) => amount * rate / 100 / 12;   // 보증금 → 월세
const toDeposit = (monthly, rate) => monthly * 12 / (rate / 100); // 월세 → 보증금
// mode: 'j2w' 전세→월세 {jeonse, deposit} / 'w2j' 월세→전세 {deposit, monthly} / 'adj' 보증금 조정 {deposit, monthly, newDeposit}
function calc(mode, i, rate) {
  const cap = legalCap(), over = rate > cap;
  if (mode === 'j2w') { const d = i.jeonse - i.deposit; return { monthly: toMonthly(d, rate), converted: d, cap, over }; }
  if (mode === 'w2j') return { jeonse: i.deposit + toDeposit(i.monthly, rate), converted: toDeposit(i.monthly, rate), cap, over: false };
  const d = i.newDeposit - i.deposit; // +면 보증금 올림(월세↓), -면 내림(월세↑)
  return { monthly: Math.max(0, i.monthly - toMonthly(d, rate)), converted: Math.abs(d), cap, over: d < 0 && over };
}
// 전환 금액을 전세대출로 마련할 때 연 이자 vs 그만큼의 월세 1년치
const compare = (converted, rate, loanRate) => {
  const interest = converted * loanRate / 100, rent = converted * rate / 100;
  return { interest, rent, cheaper: interest < rent ? 'jeonse' : interest > rent ? 'wolse' : 'same' };
};
if (typeof module !== 'undefined') module.exports = { BOK, legalCap, calc, compare };
