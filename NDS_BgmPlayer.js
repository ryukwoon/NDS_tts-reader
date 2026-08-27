// NDS_BgmPlayer.js - MP3 배경음악 플레이어 전용 관리자 (v2.31)
window.NDS_TTS = window.NDS_TTS || {};

window.NDS_TTS.BgmPlayer = class BgmPlayer {
	constructor(i18nManager) {
		this.i18n = i18nManager;
		this.audio = new Audio();
		this.playlist = [];
		this.currentIndex = 0;
		this.volume = 0.20; // 기본 볼륨 20%
		this.isShuffle = false;
		this.isRepeat = true; // 기본 전체 반복 ON
		this.isPlaying = false;
		this.db = null;

		this.initAudioEvents();
		this.initDB();
	}

	initAudioEvents() {
		this.audio.volume = this.volume;

		this.audio.onended = () => {
			this.playNext();
		};

		this.audio.onerror = (e) => {
			console.error("[BGM] 오디오 재생 에러:", e);
			if (this.playlist.length > 1) {
				this.playNext();
			} else {
				this.stop();
			}
		};
	}

	initDB() {
		const request = indexedDB.open("NDS_BGM_Store", 1);
		request.onupgradeneeded = (e) => {
			const db = e.target.result;
			if (!db.objectStoreNames.contains("tracks")) {
				db.createObjectStore("tracks", { keyPath: "id" });
			}
		};
		request.onsuccess = (e) => {
			this.db = e.target.result;
			this.loadStoredTracks();
		};
		request.onerror = (e) => {
			console.error("[BGM] IndexedDB 오픈 실패:", e);
		};
	}

	loadStoredTracks() {
		if (!this.db) return;
		const transaction = this.db.transaction(["tracks"], "readonly");
		const store = transaction.objectStore("tracks");
		const request = store.getAll();

		request.onsuccess = () => {
			const items = request.result || [];
			this.playlist = items.map(item => {
				const url = URL.createObjectURL(item.blob);
				return { id: item.id, title: item.title, blob: item.blob, url: url };
			});
			this.renderPlaylistUI();
			this.updateCurrentTrackDisplay();
		};
	}

	async addTracks(files) {
		if (!files || files.length === 0) return;

		const isWasEmpty = (this.playlist.length === 0);

		for (const file of Array.from(files)) {
			if (!file.type.includes("audio") && !file.name.endsWith(".mp3")) continue;

			const trackId = "bgm_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
			const title = file.name.replace(/\.[^/.]+$/, "");
			const blob = file;

			const trackData = { id: trackId, title: title, blob: blob };

			if (this.db) {
				const tx = this.db.transaction(["tracks"], "readwrite");
				tx.objectStore("tracks").put(trackData);
			}

			const url = URL.createObjectURL(blob);
			this.playlist.push({ id: trackId, title: title, blob: blob, url: url });
		}

		this.renderPlaylistUI();

		if (isWasEmpty && this.playlist.length > 0) {
			this.currentIndex = 0;
			this.prepareTrack(0);
		} else {
			this.updateCurrentTrackDisplay();
		}
	}

	prepareTrack(index) {
		if (index < 0 || index >= this.playlist.length) return;
		const track = this.playlist[index];
		this.audio.src = track.url;
		this.audio.volume = this.volume;
		this.audio.load();
		this.updateCurrentTrackDisplay();
	}

	togglePlay() {
		if (this.playlist.length === 0) {
			const noTrackMsg = this.i18n ? this.i18n.t("settings.bgmPromptNoTracks") : "등록된 MP3 음악이 없습니다.";
			alert(noTrackMsg);
			return;
		}

		if (this.isPlaying) {
			this.pause();
		} else {
			this.play();
		}
	}

	play() {
		if (this.playlist.length === 0) return;

		if (!this.audio.src || this.audio.src === "") {
			this.prepareTrack(this.currentIndex);
		}

		this.audio.play().then(() => {
			this.isPlaying = true;
			this.updateQuickButtonUI(true);
			this.updateCurrentTrackDisplay();
		}).catch(err => {
			console.error("[BGM] 재생 실패:", err);
		});
	}

	pause() {
		this.audio.pause();
		this.isPlaying = false;
		this.updateQuickButtonUI(false);
		this.updateCurrentTrackDisplay();
	}

	stop() {
		this.audio.pause();
		this.audio.currentTime = 0;
		this.isPlaying = false;
		this.updateQuickButtonUI(false);
		this.updateCurrentTrackDisplay();
	}

	playNext() {
		if (this.playlist.length === 0) return;

		if (this.isShuffle) {
			let nextIdx = Math.floor(Math.random() * this.playlist.length);
			if (this.playlist.length > 1 && nextIdx === this.currentIndex) {
				nextIdx = (nextIdx + 1) % this.playlist.length;
			}
			this.currentIndex = nextIdx;
		} else {
			if (this.currentIndex < this.playlist.length - 1) {
				this.currentIndex++;
			} else {
				if (this.isRepeat) {
					this.currentIndex = 0;
				} else {
					this.stop();
					return;
				}
			}
		}

		this.prepareTrack(this.currentIndex);
		this.play();
	}

	playPrev() {
		if (this.playlist.length === 0) return;

		if (this.currentIndex > 0) {
			this.currentIndex--;
		} else {
			this.currentIndex = this.playlist.length - 1;
		}

		this.prepareTrack(this.currentIndex);
		this.play();
	}

	setVolume(val) {
		this.volume = parseFloat(val);
		this.audio.volume = this.volume;
		const valDisplay = document.getElementById("val-bgm-volume");
		if (valDisplay) {
			valDisplay.textContent = `${Math.round(this.volume * 100)}%`;
		}
	}

	toggleShuffle() {
		this.isShuffle = !this.isShuffle;
		const btnShuffle = document.getElementById("btn-bgm-shuffle");
		if (btnShuffle) {
			btnShuffle.classList.toggle("active", this.isShuffle);
		}
	}

	toggleRepeat() {
		this.isRepeat = !this.isRepeat;
		const btnRepeat = document.getElementById("btn-bgm-repeat");
		if (btnRepeat) {
			btnRepeat.classList.toggle("active", this.isRepeat);
		}
	}

	deleteTrack(trackId) {
		const idx = this.playlist.findIndex(t => t.id === trackId);
		if (idx !== -1) {
			const isCurrentPlaying = (idx === this.currentIndex && this.isPlaying);
			
			if (this.db) {
				const tx = this.db.transaction(["tracks"], "readwrite");
				tx.objectStore("tracks").delete(trackId);
			}

			URL.revokeObjectURL(this.playlist[idx].url);
			this.playlist.splice(idx, 1);

			if (this.playlist.length === 0) {
				this.stop();
				this.audio.removeAttribute("src");
				this.audio.load();
				this.currentIndex = 0;
			} else if (isCurrentPlaying) {
				this.currentIndex = this.currentIndex % this.playlist.length;
				this.prepareTrack(this.currentIndex);
				this.play();
			} else if (idx < this.currentIndex) {
				this.currentIndex--;
			}

			this.renderPlaylistUI();
			this.updateCurrentTrackDisplay();
		}
	}

	clearPlaylist() {
		if (this.playlist.length === 0) return;

		const promptMsg = this.i18n ? this.i18n.t("settings.bgmPromptClearAll") : "배경음악 플레이리스트를 전체 비우시겠습니까?";
		if (confirm(promptMsg)) {
			this.stop();
			this.audio.removeAttribute("src");
			this.audio.load();

			if (this.db) {
				const tx = this.db.transaction(["tracks"], "readwrite");
				tx.objectStore("tracks").clear();
			}

			this.playlist.forEach(t => URL.revokeObjectURL(t.url));
			this.playlist = [];
			this.currentIndex = 0;

			this.renderPlaylistUI();
			this.updateCurrentTrackDisplay();
		}
	}

	updateQuickButtonUI(isPlaying) {
		const btnToggle = document.getElementById("btn-bgm-toggle");
		if (!btnToggle) return;

		if (isPlaying) {
			btnToggle.innerHTML = `<i class="bi-pause-circle-fill" style="color: #10b981;"></i>`;
			btnToggle.classList.add("active");
		} else {
			btnToggle.innerHTML = `<i class="bi-play-circle"></i>`;
			btnToggle.classList.remove("active");
		}
	}

	updateCurrentTrackDisplay() {
		const display = document.getElementById("bgm-current-track-info");
		if (!display) return;

		const noTrackText = this.i18n ? this.i18n.t("settings.bgmNoTrack") : "등록된 배경음악 없음";
		const playingPrefix = this.i18n ? this.i18n.t("settings.bgmPlayingPrefix") : "▶ 재생 중: ";
		const pausedPrefix = this.i18n ? this.i18n.t("settings.bgmPausedPrefix") : "⏸️ 일시정지: ";

		if (this.playlist.length > 0 && this.playlist[this.currentIndex]) {
			const trackName = this.playlist[this.currentIndex].title;
			const statusText = this.isPlaying ? playingPrefix : pausedPrefix;
			display.textContent = `${statusText}${trackName}`;
		} else {
			display.textContent = noTrackText;
		}
	}

	renderPlaylistUI() {
		const container = document.getElementById("bgm-playlist-container");
		if (!container) return;

		container.innerHTML = "";

		if (this.playlist.length === 0) {
			const noTrackText = this.i18n ? this.i18n.t("settings.bgmNoTrack") : "등록된 배경음악 없음";
			container.innerHTML = `<div style="padding: 15px; font-size: 11px; color: gray; text-align: center;">${noTrackText}</div>`;
			return;
		}

		this.playlist.forEach((track, idx) => {
			const item = document.createElement("div");
			item.style = `display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; border-bottom: 1px solid var(--border-color); font-size: 11px; cursor: pointer; ${idx === this.currentIndex ? 'background: rgba(59,130,246,0.12); font-weight: bold;' : ''}`;

			item.innerHTML = `
				<div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:flex; align-items:center; gap:6px;">
					<i class="${idx === this.currentIndex && this.isPlaying ? 'bi-music-note-sound' : 'bi-music-note'}" style="color:#3b82f6;"></i>
					<span>${idx + 1}. ${track.title}</span>
				</div>
				<button class="btn-delete-track" style="background:none; border:none; color:#ff5252; font-size:14px; cursor:pointer;" title="삭제">&times;</button>
			`;

			item.onclick = () => {
				this.currentIndex = idx;
				this.prepareTrack(idx);
				this.play();
			};

			const delBtn = item.querySelector(".btn-delete-track");
			delBtn.onclick = (e) => {
				e.stopPropagation();
				this.deleteTrack(track.id);
			};

			container.appendChild(item);
		});
	}
};