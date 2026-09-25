# 한눈 계산기 정기 업데이트 (매달 1일·15일)

사용자 지시(2026-09-26): 계산기 사이트는 2주 단위로 업데이트한다.

## 확인할 것
1. **보금자리론** (매달 1일 공시): https://www.hf.go.kr/ko/sub01/sub01_01_04.do → `loan/rates.js`의 bogeumjari.product 금리(아낌e, u·t, 만기 10~50년)
2. **디딤돌·신생아 특례**: https://nhuf.molit.go.kr 상품 안내(금리표·한도·우대) → `loan/rates.js` didimdol, newborn
3. **은행 자동차대출**: `car/products.js`의 각 url(신한 MY CAR, 하나 1Q오토론, KB 매직카, 카카오뱅크) 금리 범위·최저금리
4. **근로·자녀장려금**: 국세청 장려금 안내(신청 기간, 기준 변경), 해가 바뀌면 귀속연도·기한 문구 수정 (`eitc/index.html`, `eitc/calc.js`)
5. **자동차 취득세 감면**: 전기차 140만원 감면 2026-12-31 종료 여부, 경차 75만원(2027-12-31)

## 절차
- 바뀐 값만 고치고 `updated` 날짜를 오늘로 바꾼다. 확인 못 한 값은 추측하지 않는다.
- 로컬 확인: `node`로 amort.js·calc.js 테스트(원리금균등 3억 4% 30년 = 1,432,246원, 단독 1,500만원 = 889,000원).
- `sitemap.xml` lastmod 갱신 → `git commit` → `git push`(GitHub Pages 자동 배포, gh 로그인 gjtjdwns6363-bot).
- 결과를 사용자에게 한국어로 짧게 보고(무엇이 바뀌었는지).
