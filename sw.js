// 홈 화면 설치 조건을 채우기 위한 최소 서비스워커. 캐시하지 않고 그대로 네트워크로 보낸다(계산 기준이 바뀌면 바로 반영되도록).
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
