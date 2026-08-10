// NDS_ThemeManager.js - 테마 관리 및 동적 사용자 테마/월페이퍼 매니저 (v1.41 글자 투명도 버그 수정)
window.NDS_TTS = window.NDS_TTS || {};

window.NDS_TTS.ThemeManager = class ThemeManager {
	constructor() {
		this.customThemes = JSON.parse(localStorage.getItem("custom_themes") || "{}");
	}

	getBodyEl() {
		return document.body;
	}

	getContentEl() {
		return document.getElementById("reader-content");
	}

	// 미리 정의된 테마 및 커스텀 테마 적용
	setTheme(themeName) {
		const bodyEl = this.getBodyEl();
		if (!bodyEl) return;

		if (this.customThemes[themeName]) {
			const cTheme = this.customThemes[themeName];
			bodyEl.className = "";
			
			document.documentElement.style.setProperty("--app-bg", cTheme.appBg);
			document.documentElement.style.setProperty("--sidebar-bg", cTheme.sidebarBg);
			document.documentElement.style.setProperty("--bg-color", cTheme.cardBg);
			document.documentElement.style.setProperty("--border-color", cTheme.borderColor || cTheme.paraBg || "#cbd5e1");
			document.documentElement.style.setProperty("--text-color", cTheme.textColor);
			document.documentElement.style.setProperty("--highlight-color", cTheme.highlightColor || "rgba(255, 235, 59, 0.5)");
		} else {
			document.documentElement.style.removeProperty("--app-bg");
			document.documentElement.style.removeProperty("--sidebar-bg");
			document.documentElement.style.removeProperty("--bg-color");
			document.documentElement.style.removeProperty("--border-color");
			document.documentElement.style.removeProperty("--text-color");
			document.documentElement.style.removeProperty("--highlight-color");
			
			bodyEl.className = `theme-${themeName}`;
		}
	}

	// 커스텀 테마 추가 및 저장
	registerCustomTheme(name, appBg, sidebarBg, cardBg, borderColor, highlightColor, textColor) {
		const themeId = "custom_" + Date.now();
		this.customThemes[themeId] = {
			name: name,
			appBg: appBg,
			sidebarBg: sidebarBg,
			cardBg: cardBg,
			borderColor: borderColor,
			highlightColor: highlightColor,
			textColor: textColor
		};
		localStorage.setItem("custom_themes", JSON.stringify(this.customThemes));
		return themeId;
	}

	// 본문 바탕화면 월페이퍼 이미지 적용 (글자 투명도 영향 방지 CSS 변수 적용)
	applyWallpaper(dataUrl, opacity = 1.0) {
		const contentEl = this.getContentEl();
		if (!contentEl) return;

		if (dataUrl) {
			contentEl.style.setProperty("--wallpaper-url", `url("${dataUrl}")`);
			contentEl.style.setProperty("--wallpaper-opacity", opacity);
		} else {
			this.removeWallpaper();
		}
	}

	// 월페이퍼 제거
	removeWallpaper() {
		const contentEl = this.getContentEl();
		if (!contentEl) return;

		contentEl.style.removeProperty("--wallpaper-url");
		contentEl.style.removeProperty("--wallpaper-opacity");
	}

	deleteCustomTheme(themeId) {
		if (this.customThemes[themeId]) {
			delete this.customThemes[themeId];
			localStorage.setItem("custom_themes", JSON.stringify(this.customThemes));
			return true;
		}
		return false;
	}

	getCustomThemes() {
		return this.customThemes;
	}

	setFontSize(size) {
		const contentEl = this.getContentEl();
		if (contentEl) {
			contentEl.style.fontSize = size;
		}
	}
};