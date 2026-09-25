// 대출 상환 계산: 원리금균등·원금균등·체증식·만기일시, 거치기간 지원. 월 단위, 원 단위 반올림.
// 체증식 증가율은 기관마다 달라 기본 연 2%로 두고 화면에서 바꿀 수 있게 한다.
var GRAD_RATE = 0.02;
// schedule(원금, 연이율%, 총개월, 방식, 거치개월) → {rows:[{m,pay,prin,int,bal}], totalInt, firstPay, lastPay}
function schedule(P, ratePct, n, method, grace = 0) {
  const r = ratePct / 100 / 12, rows = [];
  let bal = P, totalInt = 0;
  const payN = n - grace; // 원금을 갚는 개월 수
  const annuity = r === 0 ? P / payN : P * r / (1 - Math.pow(1 + r, -payN));
  // 체증식: 상환 시작 후 매년 월 상환액이 g만큼 늘어나고, 만기에 잔액 0이 되도록 첫해 월 상환액을 정한다.
  let grad = 0;
  if (method === 'graduated') {
    const g = GRAD_RATE, v = 1 / (1 + r); let pv = 0;
    for (let k = 0; k < payN; k++) pv += Math.pow(1 + g, Math.floor(k / 12)) * (r === 0 ? 1 : Math.pow(v, k + 1));
    grad = P / pv;
  }
  for (let m = 1; m <= n; m++) {
    const int = Math.round(bal * r);
    let prin;
    if (m <= grace) prin = 0;
    else if (method === 'equalPay') prin = m === n ? bal : Math.round(annuity) - int;
    else if (method === 'equalPrin') prin = m === n ? bal : Math.round(P / payN);
    else if (method === 'graduated') prin = m === n ? bal : Math.round(grad * Math.pow(1 + GRAD_RATE, Math.floor((m - grace - 1) / 12))) - int;
    else prin = m === n ? bal : 0; // bullet: 만기일시
    bal -= prin; totalInt += int;
    rows.push({ m, pay: prin + int, prin, int, bal: Math.max(bal, 0) });
  }
  const firstRepay = rows[grace] || rows[0];
  return { rows, totalInt, firstPay: firstRepay.pay, lastPay: rows[rows.length - 1].pay, gracePay: grace ? rows[0].pay : 0 };
}
if (typeof module !== 'undefined') module.exports = { schedule };
