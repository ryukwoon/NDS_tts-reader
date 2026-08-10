// NDS_TTSController.js - Web Speech API 기반 음성 합성 제어기 (먹통 방지 보완)
window.NDS_TTS = window.NDS_TTS || {};

window.NDS_TTS.TTSController = class TTSController {
	constructor() {
		this.synth = window.speechSynthesis;
		this.currentUtterance = null;
		this.isPlaying = false;
		this.onSentenceEndCallback = null;
	}

	getAvailableVoices() {
		return this.synth.getVoices();
	}

	speak(text, voiceName, rate, volume, onEndCallback) {
		this.stop();
		this.isPlaying = true;
		this.onSentenceEndCallback = onEndCallback;

		// 1. 공백 및 빈 문장 처리 (곧바로 다음 문장으로 진행)
		if (!text || text.trim() === "") {
			if (this.isPlaying && this.onSentenceEndCallback) {
				this.onSentenceEndCallback();
			}
			return;
		}

		// 2. 크롬 브라우저 음성 엔진 멈춤(Freezing) 해제
		if (this.synth.paused) {
			this.synth.resume();
		}

		this.currentUtterance = new SpeechSynthesisUtterance(text);
		
		const voices = this.getAvailableVoices();
		let selectedVoice = voices.find(v => v.name === voiceName);
		
		// 지정된 음성이 없으면 한국어 또는 첫 번째 사용 가능 음성 자동 할당
		if (!selectedVoice && voices.length > 0) {
			selectedVoice = voices.find(v => v.lang.toLowerCase().includes("ko")) || voices[0];
		}

		if (selectedVoice) {
			this.currentUtterance.voice = selectedVoice;
		}

		this.currentUtterance.rate = rate || 1.0;
		this.currentUtterance.volume = (volume !== undefined && !isNaN(volume)) ? volume : 0.8;

		// 발화 정상 완료 이벤트
		this.currentUtterance.onend = () => {
			if (this.isPlaying && this.onSentenceEndCallback) {
				this.onSentenceEndCallback();
			}
		};

		// 발화 중 에러 발생 시에도 멈추지 않고 다음 문장으로 스킵 진행
		this.currentUtterance.onerror = (e) => {
			if (e.error !== "interrupted") {
				console.error("TTS 발화 도중 장애 발생: ", e);
				if (this.isPlaying && this.onSentenceEndCallback) {
					this.onSentenceEndCallback();
				}
			}
		};

		// 발화 시작 시 멈춤 상태 자동 해제 보장
		this.currentUtterance.onstart = () => {
			if (this.synth.paused) {
				this.synth.resume();
			}
		};

		this.synth.speak(this.currentUtterance);
	}

	pause() {
		this.isPlaying = false;
		this.synth.pause();
	}

	stop() {
		this.isPlaying = false;
		this.synth.cancel();
	}
};