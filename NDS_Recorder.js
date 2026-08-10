// NDS_Recorder.js - 실시간 탭 오디오 녹음 전용 매니저 (v1.61 팝업 1회 동의 후 재사용 세션 보완)
window.NDS_TTS = window.NDS_TTS || {};

window.NDS_TTS.Recorder = class Recorder {
	constructor(i18nManager) {
		this.i18n = i18nManager;
		this.mediaRecorder = null;
		this.audioStream = null; // 오디오 스트림 메모리 보존
		this.recordedChunks = [];
		this.isRecording = false;
		this.isPaused = false;
		this.currentFilename = "tts_recording";
	}

	// 오디오 녹음 시작 (이미 권한이 있으면 팝업창 없이 즉시 시작)
	async start(filename = "tts_recording") {
		this.currentFilename = filename;

		// 1. 이미 오디오 권한(스트림)이 활성화되어 있으면 팝업창 없이 즉시 녹음 재개
		if (this.audioStream && this.audioStream.active && this.audioStream.getAudioTracks().length > 0) {
			return this.beginRecording();
		}

		// 2. 권한이 없는 첫 1회 실행 시만 브라우저 팝업창 호출
		try {
			this.audioStream = await navigator.mediaDevices.getDisplayMedia({
				video: true, // 탭 선택 팝업 출력을 위해 필수
				audio: {
					suppressLocalAudioPlayback: false
				}
			});

			const audioTracks = this.audioStream.getAudioTracks();
			if (audioTracks.length === 0) {
				alert(this.i18n ? this.i18n.t("player.recordNoAudioAlert") : "오디오 공유가 포함되지 않았습니다. 팝업에서 '오디오 공유'를 체크해 주세요.");
				this.stopStream();
				return false;
			}

			// 사용자 화면 공유 중단 버튼 대응
			this.audioStream.getVideoTracks().forEach(track => {
				track.onended = () => {
					if (this.isRecording) {
						this.stop();
					}
					this.stopStream();
				};
			});

			return this.beginRecording();
		} catch (err) {
			console.error("녹음 시작 취소 또는 실패:", err);
			this.stopStream();
			return false;
		}
	}

	// 실제 MediaRecorder 동작 구동
	beginRecording() {
		try {
			const audioTracks = this.audioStream.getAudioTracks();
			const streamToRecord = new MediaStream([audioTracks[0]]);

			let mimeType = 'audio/webm;codecs=opus';
			if (!MediaRecorder.isTypeSupported(mimeType)) {
				mimeType = 'audio/webm';
			}

			this.recordedChunks = [];
			this.mediaRecorder = new MediaRecorder(streamToRecord, { mimeType: mimeType });

			this.mediaRecorder.ondataavailable = (e) => {
				if (e.data && e.data.size > 0) {
					this.recordedChunks.push(e.data);
				}
			};

			this.mediaRecorder.onstop = () => {
				this.saveFile();
			};

			this.mediaRecorder.start(200); // 200ms 단위 조각 수집
			this.isRecording = true;
			this.isPaused = false;
			return true;
		} catch (e) {
			console.error("MediaRecorder 생성 실패:", e);
			return false;
		}
	}

	// 녹음 일시정지
	pause() {
		if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
			this.mediaRecorder.pause();
			this.isPaused = true;
		}
	}

	// 녹음 재개
	resume() {
		if (this.mediaRecorder && this.mediaRecorder.state === "paused") {
			this.mediaRecorder.resume();
			this.isPaused = false;
		}
	}

	// 녹음 정지 및 MP3 파일 추출 (스트림은 메모리에 보존하여 다음 녹음 시 팝업 방지)
	stop() {
		if (this.mediaRecorder && (this.mediaRecorder.state === "recording" || this.mediaRecorder.state === "paused")) {
			this.mediaRecorder.stop();
		}
		this.isRecording = false;
		this.isPaused = false;
		// note: stopStream()을 여기서 부르지 않고 오디오 스트림을 유지하여 다음 녹음 시 팝업을 띄우지 않음
	}

	// 완전히 세션을 종료하고 권한을 반납할 때 호출
	stopStream() {
		if (this.audioStream) {
			this.audioStream.getTracks().forEach(track => track.stop());
			this.audioStream = null;
		}
	}

	// MP3 파일 다운로드 추출
	saveFile() {
		if (this.recordedChunks.length === 0) return;

		const blob = new Blob(this.recordedChunks, { type: "audio/mp3" });
		const url = URL.createObjectURL(blob);

		let name = this.currentFilename || "tts_recording";
		if (!name.endsWith(".mp3")) {
			name += ".mp3";
		}

		const a = document.createElement("a");
		a.style.display = "none";
		a.href = url;
		a.download = name;
		document.body.appendChild(a);
		a.click();

		setTimeout(() => {
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}, 100);

		this.recordedChunks = [];
	}
};