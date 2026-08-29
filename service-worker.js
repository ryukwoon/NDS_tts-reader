/* === service-worker.js 시작 === */
// service-worker.js - NDS TTS 모바일 PWA 오프라인 캐싱 엔진 (v3.5)
const CACHE_NAME = "nds-tts-mobile-v3.5";
const ASSETS_TO_CACHE = [
	"./",
	"./index.html",
	"./index_m.html",
	"./manifest.json",
	"./style.css",
	"./m_style.css",
	"./DynamicRGB_NDS.css",
	"./favicon.ico",
	"./icon-192.png",
	"./icon-512.png",
	"./NDS_TEXT_to_Speech.nds",
	"./NDS_Namespace.js",
	"./NDS_I18nManager.js",
	"./NDS_HelpManager.js",
	"./NDS_DBManager.js",
	"./NDS_TextProcessor.js",
	"./NDS_TTSController.js",
	"./NDS_ThemeManager.js",
	"./NDS_App.js",
	"./m_NDS_App.js",
	"./font/bootstrap-icons.css"
];

// 서비스 워커 설치 및 리소스 오프라인 저장소 캐싱
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(ASSETS_TO_CACHE);
		}).then(() => self.skipWaiting())
	);
});

// 구버전 캐시 자동 삭제 정돈
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cache) => {
					if (cache !== CACHE_NAME) {
						return caches.delete(cache);
					}
				})
			);
		}).then(() => self.clients.claim())
	);
});

// 네트워크 가용 시 최신 유지, 오프라인 시 로컬 저장소 캐시 반환 (Network First with Cache Fallback)
self.addEventListener("fetch", (event) => {
	event.respondWith(
		fetch(event.request).then((response) => {
			if (response && response.status === 200 && response.type === 'basic') {
				const responseToCache = response.clone();
				caches.open(CACHE_NAME).then((cache) => {
					cache.put(event.request, responseToCache);
				});
			}
			return response;
		}).catch(() => {
			return caches.match(event.request);
		})
	);
});
/* === service-worker.js 끝 === */