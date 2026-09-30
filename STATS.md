# 계산기별 조회수 갱신 (매일 06:30 자동)

launchd `~/Library/LaunchAgents/com.hanbogi.calc-stats.plist` → 터미널에서 `~/bin/calc-stats.sh` → `claude '<이 절차대로>'`.
화면(홈 순위·👁 조회수·NEW 배지·계산기 제목 아래 "누적 조회")은 `common.js`가 `/stats.json`만 읽어서 그린다. **실제 GA4 숫자만 넣는다. 추측·고정 숫자 금지.**

## 절차
1. `git pull`
2. Chrome(Claude in Chrome 도구: ToolSearch로 `mcp__claude-in-chrome__*` 로드 → `tabs_context_mcp` → 새 탭)으로 GA4 "페이지 및 화면" 보고서를 호스트 calc.hanbogi.com 필터로 연다. 아래 주소에서 `DATE0`·`DATE1`(YYYYMMDD)만 바꾼다.
   `https://analytics.google.com/analytics/web/#/a273403427p556032768/reports/explorer?r=all-pages-and-screens&params=_u.date00%3DDATE0%26_u.date01%3DDATE1%26_r..dataFilters%3D%5B%7B%22type%22:1,%22fieldName%22:%22hostname%22,%22evaluationType%22:1,%22expressionList%22:%5B%22calc.hanbogi.com%22%5D,%22complement%22:false,%22isCaseSensitive%22:true,%22expression%22:%22%22%7D%5D`
   - 누적: DATE0 = **20260926**(사이트 오픈·GA 시작일), DATE1 = 오늘
   - 30일: DATE0 = 오늘−29일, DATE1 = 오늘
   - 10초쯤 기다린 뒤 `get_page_text`로 표를 읽는다. 표 아래 "1~10 / N"이면 "다음 페이지" 버튼(find로 찾기)을 눌러 끝까지 읽는다(주소에 `%26_r.explorerCard..startRow%3D10` 추가해도 됨). 필터 줄에 "호스트 이름 다음과 정확하게 일치 'calc.hanbogi.com'"이 보이는지 확인.
   - 끝나면 연 탭을 닫는다.
3. 계산기 16개(`common.js`의 `C`) 본 페이지 경로별 **조회수** 열을 쓴다. 하위 페이지(`/salary/5000/`, `/car/byd-atto-3/`, `/loan/list/` 등 `/<계산기>/`로 시작하는 경로)는 그 계산기에 합산한다. 표에 없는 계산기는 0.
4. `stats.json`을 덮어쓴다: `{"updated":"오늘 YYYY-MM-DD","views":{"/loan/":{"total":N,"d30":N},...}}` (16개 모두). `node -e "JSON.parse(require('fs').readFileSync('stats.json'))"`로 형식 확인.
5. **로그인이 풀려 있거나 보고서를 못 읽으면** 로그인하지 말고 stats.json을 건드리지 않는다(어제 값 유지) — 사용자에게 로그인 필요만 알린다.
6. 숫자가 바뀌었으면 `git add stats.json && git commit -m "조회수 갱신 YYYY-MM-DD"` → `git push`. 확인 없이 진행한다.

## 표시 규칙 (common.js)
- 홈 「많이 찾는 계산기」: total 내림차순 10개, 1~3위 금·은·동 원, 4위부터 회색. 오른쪽 `👁 1.2천`.
- 50회 미만이거나 값이 없으면 숫자 대신 NEW. stats.json을 못 읽으면 숫자·NEW 없이 기본 순서.
- 계산기 본 페이지 제목 아래 "누적 조회 1,234회 · 기준 YYYY-MM-DD"(50회 이상일 때만).
