// NDS_HelpManager.js - 도움말 수신 및 버전 파라미터 치환 전용 매니저 (v1.7)
window.NDS_TTS = window.NDS_TTS || {};

window.NDS_TTS.HelpManager = class HelpManager {
	constructor(i18nManager) {
		this.i18n = i18nManager;
	}

	getHelpTitle() {
		return this.i18n ? this.i18n.t("modal.helpTitle") : "도움말 & 프로그램 정보";
	}

	getHelpContent(version = "v1.7") {
		if (!this.i18n) return "";
		return this.i18n.t("modal.helpBody", { version: version });
	}
};