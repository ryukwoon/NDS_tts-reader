// NDS_I18nManager.js - 마스터 언어 목록 관리 및 파일 미존재 시 자동 복귀 매니저 (v1.8)
window.NDS_TTS = window.NDS_TTS || {};
window.NDS_TTS.i18nData = window.NDS_TTS.i18nData || {};

window.NDS_TTS.I18nManager = class I18nManager {
	constructor() {
		this.currentLang = localStorage.getItem("language") || "ko";
		
		// 마스터 지원 언어 리스트 (언어 파일이 추가되는 대로 자동 매칭)
		this.supportedLanguages = {
			ko: "한국어 (Korean)",
			en: "English",
			ja: "日本語 (Japanese)",
			zh: "中文 (Chinese)",
			es: "Español (Spanish)",
			fr: "Français (French)",
			de: "Deutsch (German)",
			ru: "Русский (Russian)"
		};
	}

	async init() {
		await this.setLanguage(this.currentLang);
	}

	getLanguage() {
		return this.currentLang;
	}

	// 설정창 언어 드롭다운 메뉴 동적 동기화
	populateLanguageDropdown() {
		const selectLang = document.getElementById("select-language");
		if (!selectLang) return;

		selectLang.innerHTML = "";
		Object.keys(this.supportedLanguages).forEach(code => {
			const opt = document.createElement("option");
			opt.value = code;
			opt.textContent = this.supportedLanguages[code];
			if (code === this.currentLang) {
				opt.selected = true;
			}
			selectLang.appendChild(opt);
		});
	}

	// 언어 변경 및 동적 스크립트 주입 (파일이 없을 경우 영문 메시지 후 이전 언어 복귀)
	setLanguage(lang) {
		return new Promise((resolve) => {
			const prevLang = this.currentLang;

			// 이미 로드되어 있는 언어인 경우 즉시 적용
			if (window.NDS_TTS.i18nData && window.NDS_TTS.i18nData[lang]) {
				this.currentLang = lang;
				localStorage.setItem("language", lang);
				this.updateDOM();
				resolve(true);
				return;
			}

			// 동적 스크립트 주입
			const script = document.createElement("script");
			script.src = `language/NDS_i18n_${lang}.js`;

			script.onload = () => {
				this.currentLang = lang;
				localStorage.setItem("language", lang);
				this.updateDOM();
				resolve(true);
			};

			// 해당 언어 파일이 language/ 폴더에 존재하지 않을 경우 대응
			script.onerror = () => {
				script.remove(); // 실패한 스크립트 태그 제거

				const langName = this.supportedLanguages[lang] || lang;
				// 영문 안내 메시지 출력
				alert(`The language file for '${langName}' (${lang}) is not available in the 'language/' folder.`);

				// 드롭다운 및 상태를 이전 언어로 복귀
				const selectLang = document.getElementById("select-language");
				if (selectLang) {
					selectLang.value = prevLang;
				}

				resolve(false);
			};

			document.head.appendChild(script);
		});
	}

	// 키 탐색 함수
	t(keyPath, params = {}) {
		const langData = window.NDS_TTS.i18nData[this.currentLang];
		if (!langData) return keyPath;

		const keys = keyPath.split('.');
		let current = langData;

		for (const key of keys) {
			if (current && current[key] !== undefined) {
				current = current[key];
			} else {
				return keyPath;
			}
		}

		let text = current;

		if (typeof text === 'string' && params) {
			Object.keys(params).forEach(pKey => {
				text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), params[pKey]);
			});
		}

		return text;
	}

	// DOM 요소 다국어 일괄 바인딩
	updateDOM() {
		document.querySelectorAll("[data-i18n]").forEach(el => {
			const key = el.getAttribute("data-i18n");
			const translated = this.t(key);
			if (translated && translated !== key) {
				el.textContent = translated;
			}
		});

		document.querySelectorAll("[data-i18n-title]").forEach(el => {
			const key = el.getAttribute("data-i18n-title");
			const translated = this.t(key);
			if (translated && translated !== key) {
				el.setAttribute("title", translated);
			}
		});

		document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
			const key = el.getAttribute("data-i18n-placeholder");
			const translated = this.t(key);
			if (translated && translated !== key) {
				el.setAttribute("placeholder", translated);
			}
		});
	}
};