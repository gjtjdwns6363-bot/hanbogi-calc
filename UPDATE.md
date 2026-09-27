# 한눈 계산기 정기 업데이트 (매달 1일·15일)

사용자 지시(2026-09-26): 계산기 사이트는 2주 단위로 업데이트한다.

## 확인할 것
1. **보금자리론** (매달 1일 공시): https://www.hf.go.kr/ko/sub01/sub01_01_04.do → `loan/rates.js`의 bogeumjari.product 금리(아낌e, u·t, 만기 10~50년)
2. **디딤돌·신생아 특례**: https://nhuf.molit.go.kr 상품 안내(금리표·한도·우대) → `loan/rates.js` didimdol, newborn
3. **은행 자동차대출**: `car/products.js`의 각 url (target에 신차·중고차 구분을 꼭 적는다 — 화면 표가 이것으로 나뉜다)(신한 MY CAR, 하나 1Q오토론, KB 매직카, 카카오뱅크) 금리 범위·최저금리
4. **근로·자녀장려금**: 국세청 장려금 안내(신청 기간, 기준 변경), 해가 바뀌면 귀속연도·기한 문구 수정 (`eitc/index.html`, `eitc/calc.js`)
5. **자동차 취득세 감면**: 전기차 140만원 감면 2026-12-31 종료 여부, 경차 75만원(2027-12-31)
6. **한국은행 기준금리** (https://www.bok.or.kr/portal/singl/baseRate/list.do?dataSeCd=01&menuNo=200643) → `rent/calc.js` 맨 위 BOK(rate, updated). 전환율 상한 = min(10, 기준금리+2)
7. **4대보험 요율·간이세액표** → `salary/calc.js`. 국민연금 기준소득월액 상·하한은 매년 7월 변경(2026.7~ 659만/41만), 건강·장기요양은 매년 1월, 간이세액표(소득세법 시행령 별표2)가 개정되면 `salary/table.js` 교체
8. **퇴직소득세**(소득세법 제48·55조) 개정 여부 → `severance/calc.js`
9. **청약 가점**(주택공급에 관한 규칙 별표1·제23조) → `subscription/`. 만 30세 이상 자녀 등재 1년→3년 개정안(2026-04 입법예고)이 시행되면 문구 수정

10. **실업급여·육아휴직**(고용보험법 시행령, 최저임금 매년 1월) → `unemployment/calc.js`·`parental-leave/calc.js` RATES
11. **취득세·양도세**(지방세법, 소득세법, 조정대상지역 지정·해제, 다주택 중과·세제개편안 국회 통과 여부) → `acquisition-tax/calc.js`·`capital-gains/calc.js`
12. **중개보수**(공인중개사법 시행규칙 별표) → `brokerage/calc.js`
13. **연말정산**(소득세법·조특법 개정, 자녀세액공제 나이 부칙, 카드 공제 한도) → `year-end-tax/calc.js`. 해가 바뀌면 귀속연도 갱신
14. **최저시급**(매년 8월 고시, 1월 시행: 2027년 10,700원) → `hourly/calc.js` HOURLY. 해가 바뀌면 기본 시급 교체
15. **롱테일 페이지 다시 만들기** — 위 1~14에서 `salary`·`acquisition-tax`·`hourly`·`brokerage`의 calc.js(요율·최저시급·세율)를 하나라도 고쳤으면 반드시 `node gen/longtail.js`를 실행해 연봉별·집값별·근무시간별·금액별 페이지 230쪽과 sitemap.xml 생성분을 다시 만들고 `node gen/test.js`로 확인한다. 생성 페이지를 손으로 고치지 말고 `gen/longtail.js`를 고친다.
16. **차량 가격표** → `car/models.js`: 각 차종 `src`(제조사 공식 가격표·가격 페이지)를 열어 트림 가격이 바뀌었으면 고치고 `checked`·맨 위 `updated`를 오늘로. 연식 변경·신차 출시·단종은 차종을 넣고 뺀다(공식 가격을 확인 못 하면 넣지 않는다). 현대·제네시스는 공식 가격표, 기아 `kia.com/kr/vehicles/<차종>/price`, KGM 견적 API의 가격표 PDF, 르노 `renault.co.kr/upload/asset/price/price_*_YYYYMM.pdf`, 쉐보레 e-catalog 가격표, 수입차는 각 사 가격표 PDF·구성기. 개소세 인하(3.5%) 종료·연장 공지가 나오면 가격이 일괄로 바뀌니 반드시 전부 다시 확인한다.
17. **전기차 보조금** → `car/ev_subsidy.js`: 무공해차 통합누리집(https://ev.or.kr) 구매보조금 → 차종별 보조금(국비/지방비, 시·군별)을 다시 받아 `asOf`를 바꾼다. 새 전기차 트림은 `car/models.js` 트림의 `ev` 키(보조금 표의 제조사|차종 이름)를 이어 준다. 해가 바뀌면(2027 지침) 국고 단가·전환지원금 등 규칙과 전기차 취득세 140만 감면(2026-12-31 종료 예정) 연장 여부를 확인해 `car/compare.js`·안내 문구를 고친다.
18. **여신금융협회 금리 공시** (https://gongsi.crefia.or.kr → 자동차할부·자동차리스): 신차 할부 평균 실제금리 → `car/models.js` assume.loan, 중고차 평균금리 → assume.usedLoan, 운용리스 월 리스료(보증금·잔존 30% 기준)와 비교해 assume.lease가 크게 어긋나지 않는지 확인. 렌트 금리(assume.rent)와 보험·세금·정비(assume.extra)는 가정값이라 그대로 두되 문구 유지.
19. **차종별 페이지 다시 만들기** — 16~18에서 하나라도 고쳤으면 `node gen/car.js` → `node car/test.js`. 생성 페이지(`car/<차종>/`, `car/list/`)는 손으로 고치지 않는다. `gen/longtail.js`와 따로 돌아가며 sitemap.xml의 `<!-- car -->` 구간만 바꾼다.
## 절차
- 바뀐 값만 고치고 `updated` 날짜를 오늘로 바꾼다. 확인 못 한 값은 추측하지 않는다.
- 로컬 확인: `node`로 amort.js·calc.js 테스트(원리금균등 3억 4% 30년 = 1,432,246원, 단독 1,500만원 = 889,000원), `node salary/test.js`·`severance/test.js`·`subscription/test.js`·`rent/test.js`, unemployment·parental-leave·acquisition-tax·capital-gains·brokerage·year-end-tax·hourly 의 test.js, `gen/test.js` 모두 통과, `node car/test.js` 통과.
- `sitemap.xml` lastmod 갱신 → `git commit` → `git push`(GitHub Pages 자동 배포, gh 로그인 gjtjdwns6363-bot).
- **IndexNow 전송(매 업데이트 후 필수)**: 배포가 끝나면(`gh api repos/{owner}/{repo}/pages/builds/latest`의 status가 built, 또는 바뀐 페이지를 curl로 확인) `node gen/indexnow.js` 실행 → sitemap.xml에서 lastmod가 오늘인 URL만 네이버 서치어드바이저·api.indexnow.org로 보낸다. 특정 URL만: `node gen/indexnow.js /salary/ /loan/`. 전체(`--all`)는 대규모 개편 때만. 200·202면 정상(api.indexnow.org가 `403 SiteVerificationNotCompleted`면 키 확인 대기라 몇 분 뒤 다시 실행). 키 파일 `/e386846d4b6f939fd1b440af9728c599.txt`는 지우지 않는다.
- 새 페이지를 손으로 만들면 기존 계산기 index.html처럼 og 태그(og:image `/og.png` 포함)·네트워크 푸터·about 링크를 똑같이 넣고 sitemap.xml에 추가한다. 롱테일 페이지는 `gen/longtail.js`의 `OG`·`FOOTER`가 넣어 준다.
- 결과를 사용자에게 한국어로 짧게 보고(무엇이 바뀌었는지).
