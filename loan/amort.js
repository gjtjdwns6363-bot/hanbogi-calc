// 대출 상환 계산: 원리금균등·원금균등·만기일시, 거치기간 지원. 월 단위, 원 단위 반올림.
// schedule(원금, 연이율%, 총개월, 방식, 거치개월) → {rows:[{m,pay,prin,int,bal}], totalInt, firstPay, lastPay}
function schedule(P, ratePct, n, method, grace = 0) {
  const r = ratePct / 100 / 12, rows = [];
  let bal = P, totalInt = 0;
  const payN = n - grace; // 원금을 갚는 개월 수
  const annuity = r === 0 ? P / payN : P * r / (1 - Math.pow(1 + r, -payN));
  for (let m = 1; m <= n; m++) {
    const int = Math.round(bal * r);
    let prin;
    if (m <= grace) prin = 0;
    else if (method === 'equalPay') prin = m === n ? bal : Math.round(annuity) - int;
    else if (method === 'equalPrin') prin = m === n ? bal : Math.round(P / payN);
    else prin = m === n ? bal : 0; // bullet: 만기일시
    bal -= prin; totalInt += int;
    rows.push({ m, pay: prin + int, prin, int, bal: Math.max(bal, 0) });
  }
  const firstRepay = rows[grace] || rows[0];
  return { rows, totalInt, firstPay: firstRepay.pay, lastPay: rows[rows.length - 1].pay, gracePay: grace ? rows[0].pay : 0 };
}
if (typeof module !== 'undefined') module.exports = { schedule };
