const assert = require('assert'), { calc, baseRate, heavyLevel } = require('./calc.js');
const c = (price, o = {}) => calc({ price, big: false, houses: 1, adjusted: false, first: false, small: false, ...o });
// 1주택 세율 구간 (지방세법 제11조①8호)
assert.strictEqual(baseRate(6e8), 0.01); assert.strictEqual(baseRate(9e8), 0.03); assert.strictEqual(baseRate(9e8 + 1), 0.03);
assert.strictEqual(baseRate(7.5e8), 0.02);
assert.strictEqual(baseRate(7e8), 0.016667); // 1.6667%
// 7억·85㎡ 이하: 취득세 11,666,900, 지방교육세 1,166,690, 농특세 0 (널리 쓰이는 예시와 일치)
let r = c(7e8); assert.deepStrictEqual([r.tax, r.edu, r.rural], [11666900, 1166690, 0]);
// 5억·85㎡ 초과: 1% 500만, 교육세 0.1% 50만, 농특세 0.2% 100만 → 650만
r = c(5e8, { big: true }); assert.deepStrictEqual([r.tax, r.edu, r.rural, r.total], [5e6, 5e5, 1e6, 6.5e6]);
// 10억 3% → 3,000만, 교육세 0.3% 300만, 농특 0.2% 200만
r = c(1e9, { big: true }); assert.deepStrictEqual([r.tax, r.edu, r.rural], [3e7, 3e6, 2e6]);
// 중과 단계 (제13조의2)
assert.deepStrictEqual([heavyLevel(1, true), heavyLevel(2, true), heavyLevel(2, false), heavyLevel(3, false), heavyLevel(3, true), heavyLevel(4, false)], [0, 2, 0, 2, 3, 3]);
// 조정 2주택 5억 85㎡ 초과: 8% 4,000만 + 교육 0.4% 200만 + 농특 0.6% 300만
r = c(5e8, { houses: 2, adjusted: true, big: true }); assert.deepStrictEqual([r.tax, r.edu, r.rural, r.total], [4e7, 2e6, 3e6, 4.5e7]);
// 12%: 농특 1.0%
r = c(5e8, { houses: 4, big: true }); assert.deepStrictEqual([r.tax, r.edu, r.rural], [6e7, 2e6, 5e6]);
// 생애최초: 1.5억 → 150만 전액 면제, 교육세도 0
r = c(1.5e8, { first: true }); assert.deepStrictEqual([r.cut, r.acq, r.edu, r.total], [1.5e6, 0, 0, 0]);
// 3억 → 300만 − 200만 = 100만, 교육세 10만 / 소형(300만 한도)이면 0
r = c(3e8, { first: true }); assert.deepStrictEqual([r.acq, r.edu], [1e6, 1e5]);
r = c(3e8, { first: true, small: true }); assert.deepStrictEqual([r.acq, r.edu], [0, 0]);
// 85㎡ 초과 생애최초: 감면세액 200만의 20% = 40만 농특세 추가
r = c(5e8, { first: true, big: true }); assert.deepStrictEqual([r.acq, r.edu, r.rural], [3e6, 3e5, 1.4e6]);
// 12억 초과·다주택은 생애최초 불가
assert.strictEqual(c(1.3e9, { first: true }).cut, 0); assert.strictEqual(c(3e8, { first: true, houses: 2 }).cut, 0);
// 출산·양육 주택 감면 500만 (지특법 제36조의5): 7억 → 11,666,900 − 500만, 교육세도 같은 비율로 감면
r = c(7e8, { birth: true }); assert.deepStrictEqual([r.cut, r.acq, r.edu, r.relief], [5e6, 6666900, 666690, 'birth']);
assert.strictEqual(c(1.5e9, { birth: true }).cut, 0); assert.strictEqual(c(3e8, { birth: true, houses: 2 }).cut, 0);
// 생애최초와 겹치면 감면액이 큰 것 하나만 (제180조): 5억 → 생애최초 200만 < 출산 500만
r = c(5e8, { first: true, birth: true }); assert.deepStrictEqual([r.cut, r.relief], [5e6, 'birth']);
r = c(2e8, { first: true, small: true, birth: true }); assert.deepStrictEqual([r.cut, r.acq], [2e6, 0]); // 세액 200만 전액 면제
// 법인 주택 12% (제13조의2①1호): 교육세 0.4%, 85㎡ 초과 농특 1.0% / 이하 0
r = c(5e8, { type: 'corp', big: true }); assert.deepStrictEqual([r.rate, r.tax, r.edu, r.rural, r.total], [0.12, 6e7, 2e6, 5e6, 6.7e7]);
assert.strictEqual(c(5e8, { type: 'corp', first: true }).cut, 0); assert.strictEqual(c(5e8, { type: 'corp' }).rural, 0);
// 오피스텔·상가·토지 4% + 교육 0.4% + 농특 0.2% = 4.6% (위택스 안내 표와 같은 세율), 농지 3% + 0.2% + 0.2% = 3.4%
r = c(5e8, { type: 'other' }); assert.deepStrictEqual([r.tax, r.edu, r.rural, r.total], [2e7, 2e6, 1e6, 2.3e7]);
r = c(1e8, { type: 'farm' }); assert.deepStrictEqual([r.tax, r.edu, r.rural, r.total], [3e6, 2e5, 2e5, 3.4e6]);
// 조정대상지역 현황 (국토부 2026. 6. 30. 보도참고 참고2): 서울 25 + 경기 15 = 40곳
const { REGIONS, regionOf } = require('./regions.js');
assert.strictEqual(Object.keys(REGIONS.adj).length, 40);
assert.strictEqual(regionOf('11680').adj, '2016-11-03'); assert.strictEqual(regionOf('11440').adj, '2025-10-16');
assert.strictEqual(regionOf('41597').adj, '2026-07-01'); assert.strictEqual(regionOf('41461').adj, null); // 용인 처인구는 아님
assert.strictEqual(regionOf('26350').capital, false); assert.strictEqual(regionOf('28185').capital, true);
console.log('ok');
