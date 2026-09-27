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
// depRate(선택): 그 돈이 내 돈이면 예금에 넣어 받을 이자(기회비용). 이자소득 원천징수 15.4%(소득세 14% + 지방소득세 1.4%) 뺀 세후
const INTEREST_TAX = 0.154;
const compare = (converted, rate, loanRate, depRate) => {
  const interest = converted * loanRate / 100, rent = converted * rate / 100;
  const out = { interest, rent, cheaper: interest < rent ? 'jeonse' : interest > rent ? 'wolse' : 'same' };
  if (depRate != null) { out.opportunity = converted * depRate / 100 * (1 - INTEREST_TAX); out.cheaperOwn = out.opportunity < rent ? 'jeonse' : out.opportunity > rent ? 'wolse' : 'same'; }
  return out;
};
// 갱신·증액 상한 (주택임대차보호법 제7조②, 시행령 제8조①): 약정한 차임이나 보증금의 20분의 1(5%)까지.
// 보증금과 월세를 섞어 올릴 때 참고용으로 월세를 전환율로 보증금에 환산한 합계(환산보증금)의 5%도 함께 보여 준다(법이 정한 산식은 아님).
const RENEW = 0.05;
function renew({ deposit, monthly }, rate) {
  const base = deposit + (monthly ? toDeposit(monthly, rate) : 0);
  return { maxDeposit: deposit * (1 + RENEW), maxMonthly: monthly * (1 + RENEW), base, maxBase: base * (1 + RENEW), upDeposit: deposit * RENEW, upMonthly: monthly * RENEW };
}
if (typeof module !== 'undefined') module.exports = { BOK, legalCap, calc, compare, renew, RENEW, INTEREST_TAX };
