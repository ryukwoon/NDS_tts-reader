// sw.js - NDS TTS PWA 오프라인 캐싱 서비스 워커 (v3.0)
const CACHE_NAME = "nds-tts-v3.0";
const ASSETS_TO_CACHE = [
	"./",
	"./index.html",
	"./style.css",
	"./DynamicRGB_NDS.css",
	"./favicon.ico",
	"./NDS_Namespace.js",
	"./NDS_I18nManager.js",
	"./NDS_HelpManager.js",
	"./NDS_Recorder.js",
	"./NDS_BgmPlayer.js",
	"./NDS_DBManager.js",
	"./NDS_TextProcessor.js",
	"./NDS_TTSController.js",
	"./NDS_ThemeManager.js",
	"./NDS_App.js",
	"./font/bootstrap-icons.css"
];

// 오프라인 리소스 캐시 설치
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(ASSETS_TO_CACHE);
		}).then(() => self.skipWaiting())
	);
});

// 구버전 캐시 자동 정리
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

// 오프라인 요청 처리 (캐시 우선, 없으면 네트워크)
self.addEventListener("fetch", (event) => {
	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			if (cachedResponse) {
				return cachedResponse;
			}
			return fetch(event.request);
		})
	);
});