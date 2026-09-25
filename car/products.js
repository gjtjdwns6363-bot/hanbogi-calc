// 은행 자동차대출 금리 (각 은행 공식 상품 페이지, 조회 2026-09-26). 모두 변동금리·서울보증 보증서 담보.
// 은행마다 예시 조건(기간·신용등급)이 달라 단순 비교는 참고만. 바뀌면 이 파일만 고친다.
const CAR_PRODUCTS = {
  updated: '2026-09-26',
  list: [
    { bank: '신한', name: 'MY CAR 신차 대출', target: '신차', rate: '5.33~6.34%', min: 5.33, term: '120개월', url: 'https://m.shinhan.com/mw/fin/pg/PR0504S0100F01?mid=220011114007&pid=S615122400' },
    { bank: '하나', name: '1Q오토론', target: '신차·중고차', rate: '5.25~7.00%', min: 5.25, term: '신차 120·중고 60개월', url: 'https://www.kebhana.com/cont/mall/mall08/mall0802/mall080202/1420315_115196.jsp' },
    { bank: 'KB국민', name: '매직카대출 (신차)', target: '신차', rate: '5.66~7.16%', min: 5.66, term: '120개월', url: 'https://obank.kbstar.com/quics?page=C103573&prcode=LN20000107' },
    { bank: '카카오뱅크', name: '중고차 구매대출', target: '중고차', rate: '4.99~9.46%', min: 4.99, term: '60개월', url: 'https://kakaobank.com/products/autoLoan' },
    { bank: '신한', name: 'MY CAR 중고차 대출', target: '중고차', rate: '5.34~6.34%', min: 5.34, term: '60개월', url: 'https://m.shinhan.com/mw/fin/pg/PR0504S0100F01?mid=220011114007&pid=S615122500' },
    { bank: 'KB국민', name: '매직카대출 (중고차)', target: '중고차', rate: '6.65~8.15%', min: 6.65, term: '60개월', url: 'https://obank.kbstar.com/quics?page=C103573&prcode=LN20000108' },
    { bank: '캐피탈', name: '제조사 신차 할부', target: '신차', rate: '차종별 프로모션 (무이자~)', min: null, term: '—', url: '' },
  ],
};
