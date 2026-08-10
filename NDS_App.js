// NDS_App.js - 애플리케이션 진입점 및 전역 메인 컨트롤러 (v1.8 마스터 언어 리스트 및 스마트 폴백 연동)
window.NDS_TTS = window.NDS_TTS || {};

window.NDS_TTS.App = class App {
	// 앱 중앙 버전 정보 정의
	static get VERSION() {
		return "v1.8"; // 버전 갱신 규칙 반영 (v1.8)
	}

	getVersion() {
		return App.VERSION;
	}

	constructor() {
		this.dbManager = new window.NDS_TTS.DBManager();
		this.ttsController = new window.NDS_TTS.TTSController();
		this.themeManager = new window.NDS_TTS.ThemeManager();
		this.i18n = new window.NDS_TTS.I18nManager();
		this.helpManager = new window.NDS_TTS.HelpManager(this.i18n);
		this.recorder = new window.NDS_TTS.Recorder(this.i18n);

		this.currentBook = null;
		this.pages = [];
		this.currentPageIndex = 0;
		this.currentSentenceIndex = 0;
		this.sentences = [];

		this.excludeHanja = localStorage.getItem("excludeHanja") === "true";
		this.excludeEnglish = localStorage.getItem("excludeEnglish") === "true";

		this.activeUploadSeriesId = null;
		this.expandedSeries = new Set();

		this.canvas = null;
		this.ctx = null;
		this.barHeights = [];
		this.targetHeights = [];
		this.lastShiftTime = 0;
		this.visualizerBars = 30;

		this.eqBgColor = localStorage.getItem("eq_bgcolor") || "#99cedb";
		this.eqSpectrumColor = localStorage.getItem("eq_color") || "#ff9933";
		this.eqThickness = parseFloat(localStorage.getItem("eq_thickness") || "1.5");
		this.eqSpeed = parseInt(localStorage.getItem("eq_speed") || "50");

		this.volumeTimeout = null;
	}

	async start() {
		try {
			await this.dbManager.init();
			await this.i18n.init();
			this.bindEvents();
			this.initVoices();
			this.initPreferences();
			this.loadBookShelf();
			this.initVisualizer();
		} catch (error) {
			console.error("앱 초기화 중 문제가 생겼습니다.", error);
		}
	}

	initPreferences() {
		document.getElementById("chk-exclude-hanja").checked = this.excludeHanja;
		document.getElementById("chk-exclude-english").checked = this.excludeEnglish;

		// 마스터 언어 드롭다운 목록 동적 생성 및 선택값 적용
		this.i18n.populateLanguageDropdown();

		this.populateThemeOptions();
		const savedTheme = localStorage.getItem("theme") || "white";
		document.getElementById("select-theme").value = savedTheme;
		this.themeManager.setTheme(savedTheme);
		this.updateDeleteThemeButtonVisibility();

		const savedFontSize = localStorage.getItem("fontSize") || "18px";
		document.getElementById("select-font-size").value = savedFontSize;
		this.themeManager.setFontSize(savedFontSize);

		const savedRate = localStorage.getItem("rate") || "1";
		document.getElementById("range-rate").value = savedRate;

		const savedLineHeight = localStorage.getItem("lineHeight") || "1.5";
		document.getElementById("select-line-height").value = savedLineHeight;
		this.applyLineHeight(savedLineHeight);

		document.getElementById("input-eq-bgcolor").value = this.eqBgColor;
		document.getElementById("input-eq-color").value = this.eqSpectrumColor;
		document.getElementById("range-eq-thickness").value = this.eqThickness;
		document.getElementById("range-eq-speed").value = this.eqSpeed;
		this.applyEqBgColor(this.eqBgColor);

		const savedFontFamily = localStorage.getItem("fontFamily") || "system-ui, sans-serif";
		const savedCustomFont = localStorage.getItem("customFontFamily") || "";
		
		document.getElementById("select-font-family").value = savedFontFamily;
		const customInput = document.getElementById("input-custom-font");
		customInput.value = savedCustomFont;

		if (savedFontFamily === "custom") {
			customInput.style.display = "inline-block";
		} else {
			customInput.style.display = "none";
		}
		this.applyFontFamily(savedFontFamily, savedCustomFont);

		const savedSeriesAutoplay = localStorage.getItem("seriesAutoplay") === "true";
		document.getElementById("chk-series-autoplay").checked = savedSeriesAutoplay;

		const savedVolume = localStorage.getItem("ttsVolume") || "0.8";
		document.getElementById("range-volume").value = savedVolume;
		this.updateVolumeIcon(parseFloat(savedVolume));

		const savedWallpaper = localStorage.getItem("wallpaper_image") || "";
		const savedOpacity = parseFloat(localStorage.getItem("wallpaper_opacity") || "1.0");
		document.getElementById("range-wallpaper-opacity").value = savedOpacity;
		document.getElementById("val-wallpaper-opacity").textContent = `${Math.round(savedOpacity * 100)}%`;

		if (savedWallpaper) {
			this.themeManager.applyWallpaper(savedWallpaper, savedOpacity);
		}
		this.updateWallpaperDisplay();

		this.updatePlayerStateUI('stop');
	}

	populateThemeOptions() {
		const selectTheme = document.getElementById("select-theme");
		const currentVal = selectTheme.value;

		const themeWhite = this.i18n.t("settings.themeWhite");
		const themeDark = this.i18n.t("settings.themeDark");
		const themeGrey = this.i18n.t("settings.themeGrey");
		const themeJade = this.i18n.t("settings.themeJade");
		const userPrefix = this.i18n.t("settings.themeUserPrefix");

		selectTheme.innerHTML = `
			<option value="white">${themeWhite}</option>
			<option value="dark">${themeDark}</option>
			<option value="grey">${themeGrey}</option>
			<option value="jade">${themeJade}</option>
		`;

		const customThemes = this.themeManager.getCustomThemes();
		Object.keys(customThemes).forEach(tId => {
			const opt = document.createElement("option");
			opt.value = tId;
			opt.textContent = `${userPrefix}${customThemes[tId].name}`;
			selectTheme.appendChild(opt);
		});

		if (currentVal && selectTheme.querySelector(`option[value="${currentVal}"]`)) {
			selectTheme.value = currentVal;
		}

		this.updateDeleteThemeButtonVisibility();
	}

	updateDeleteThemeButtonVisibility() {
		const selectTheme = document.getElementById("select-theme");
		const btnDelete = document.getElementById("btn-delete-theme");
		if (!btnDelete || !selectTheme) return;

		if (selectTheme.value && selectTheme.value.startsWith("custom_")) {
			btnDelete.style.display = "inline-flex";
		} else {
			btnDelete.style.display = "none";
		}
	}

	updateWallpaperDisplay() {
		const statusEl = document.getElementById("wallpaper-status-display");
		const btnRemove = document.getElementById("btn-remove-wallpaper");
		if (!statusEl) return;

		const savedWallpaper = localStorage.getItem("wallpaper_image");
		if (savedWallpaper) {
			statusEl.textContent = this.i18n.t("settings.wallpaperSet");
			if (btnRemove) btnRemove.style.display = "inline-block";
		} else {
			statusEl.textContent = `🖼️ ${this.i18n.t("settings.wallpaperUnset")}`;
			if (btnRemove) btnRemove.style.display = "none";
		}
	}

	compressImage(file, maxWidth = 1280, maxHeight = 720, quality = 0.75) {
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				const img = new Image();
				img.onload = () => {
					const canvas = document.createElement("canvas");
					let width = img.width;
					let height = img.height;

					if (width > maxWidth) {
						height = Math.round((height * maxWidth) / width);
						width = maxWidth;
					}
					if (height > maxHeight) {
						width = Math.round((width * maxHeight) / height);
						height = maxHeight;
					}

					canvas.width = width;
					canvas.height = height;
					const ctx = canvas.getContext("2d");
					ctx.drawImage(img, 0, 0, width, height);
					resolve(canvas.toDataURL("image/jpeg", quality));
				};
				img.onerror = () => resolve(e.target.result);
				img.src = e.target.result;
			};
			reader.readAsDataURL(file);
		});
	}

	compressCoverImage(file, maxWidth = 200, maxHeight = 260, quality = 0.8) {
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				const img = new Image();
				img.onload = () => {
					const canvas = document.createElement("canvas");
					let width = img.width;
					let height = img.height;

					if (width > maxWidth) {
						height = Math.round((height * maxWidth) / width);
						width = maxWidth;
					}
					if (height > maxHeight) {
						width = Math.round((width * maxHeight) / height);
						height = maxHeight;
					}

					canvas.width = width;
					canvas.height = height;
					const ctx = canvas.getContext("2d");
					ctx.drawImage(img, 0, 0, width, height);
					resolve(canvas.toDataURL("image/jpeg", quality));
				};
				img.onerror = () => resolve(null);
				img.src = e.target.result;
			};
			reader.readAsDataURL(file);
		});
	}

	updateRecordButtonUI(isRecording) {
		const btnRecord = document.getElementById("btn-record");
		if (!btnRecord) return;

		const recordText = this.i18n.t("player.record");
		const recordingText = this.i18n.t("player.recording");

		if (isRecording) {
			btnRecord.classList.add("active");
			btnRecord.innerHTML = `<i class="bi-record-circle-fill"></i> ${recordingText}`;
		} else {
			btnRecord.classList.remove("active");
			btnRecord.innerHTML = `<i class="bi-record-circle-fill" style="color: #ff3366;"></i> ${recordText}`;
		}
	}

	bindEvents() {
		document.getElementById("btn-upload-trigger").addEventListener("click", () => {
			this.activeUploadSeriesId = null;
			document.getElementById("file-uploader").click();
		});
		document.getElementById("btn-create-series").addEventListener("click", () => this.createSeriesAction());
		document.getElementById("file-uploader").addEventListener("change", (e) => this.handleFileUpload(e));
		
		document.getElementById("btn-export-library").addEventListener("click", () => this.exportLibraryToFile());
		document.getElementById("btn-import-trigger").addEventListener("click", () => {
			document.getElementById("library-importer").click();
		});
		document.getElementById("library-importer").addEventListener("change", (e) => this.importLibraryFromFile(e));
		document.getElementById("btn-clear-library").addEventListener("click", () => this.clearLibraryAction());

		document.getElementById("btn-play").addEventListener("click", (e) => {
			this.playSpeech();
			e.currentTarget.blur();
		});
		document.getElementById("btn-pause").addEventListener("click", (e) => {
			this.pauseSpeech();
			e.currentTarget.blur();
		});
		document.getElementById("btn-stop").addEventListener("click", (e) => {
			this.stopSpeech();
			e.currentTarget.blur();
		});

		document.getElementById("btn-record").addEventListener("click", async () => {
			if (!this.recorder.isRecording) {
				const bookTitle = this.currentBook ? this.currentBook.title.replace(/\.[^/.]+$/, "") : "tts_reading";
				const pageNum = this.currentPageIndex + 1;
				const filename = `${bookTitle}_${pageNum}장`;

				const success = await this.recorder.start(filename);
				if (success) {
					this.updateRecordButtonUI(true);
					alert(this.i18n.t("player.recordStartAlert"));
				}
			} else {
				this.recorder.stop();
				this.updateRecordButtonUI(false);
				alert(this.i18n.t("player.recordDoneAlert"));
			}
		});

		document.getElementById("btn-prev-page").addEventListener("click", () => this.changePage(-1));
		document.getElementById("btn-next-page").addEventListener("click", () => this.changePage(1));

		document.getElementById("btn-add-bookmark").addEventListener("click", () => this.addCurrentBookmark());
		document.getElementById("select-bookmarks").addEventListener("change", (e) => this.jumpToSelectedBookmark(e.target.value));

		document.getElementById("btn-floating-toggle").addEventListener("click", () => this.toggleSidebar(true));
		document.getElementById("btn-close-sidebar").addEventListener("click", () => this.toggleSidebar(false));

		document.getElementById("btn-quick-theme").addEventListener("click", () => this.quickCycleTheme());
		
		document.getElementById("btn-toggle-settings").addEventListener("click", () => {
			document.getElementById("settings-modal").style.display = "flex";
		});
		document.getElementById("btn-close-settings-modal").addEventListener("click", () => {
			document.getElementById("settings-modal").style.display = "none";
		});

		document.getElementById("btn-help").addEventListener("click", () => {
			const currentLang = this.i18n.getLanguage();
			const title = this.helpManager.getHelpTitle(currentLang);
			const content = this.helpManager.getHelpContent(this.getVersion(), currentLang);
			this.showModal(title, content);
		});

		document.getElementById("btn-developer").addEventListener("click", () => {
			const githubUrl = "https://github.com/RyuKwoon";
			window.open(githubUrl, "_blank");
		});
		
		document.getElementById("btn-close-modal").addEventListener("click", () => {
			document.getElementById("app-modal").style.display = "none";
		});

		// 언어 변경 이벤트 (검증 실패 시 UI 자동 동기화 유지)
		document.getElementById("select-language").addEventListener("change", async (e) => {
			const success = await this.i18n.setLanguage(e.target.value);
			if (success) {
				this.populateThemeOptions();
				this.updateWallpaperDisplay();
				this.updateBookmarkDropdown();
				this.updatePaginationIndicator();
				this.updatePlayerStateUI(this.ttsController.isPlaying ? 'play' : 'stop');
				this.updateRecordButtonUI(this.recorder.isRecording);
				this.initVoices();
				this.reRenderOnFilterChange();
			}
		});

		document.getElementById("btn-select-wallpaper").addEventListener("click", () => {
			document.getElementById("wallpaper-uploader").click();
		});

		document.getElementById("wallpaper-uploader").addEventListener("change", async (e) => {
			const file = e.target.files[0];
			if (!file) return;

			const compressedDataUrl = await this.compressImage(file);
			const opacity = parseFloat(document.getElementById("range-wallpaper-opacity").value);

			localStorage.setItem("wallpaper_image", compressedDataUrl);
			this.themeManager.applyWallpaper(compressedDataUrl, opacity);
			this.updateWallpaperDisplay();
			e.target.value = "";
		});

		document.getElementById("btn-remove-wallpaper").addEventListener("click", () => {
			localStorage.removeItem("wallpaper_image");
			this.themeManager.removeWallpaper();
			this.updateWallpaperDisplay();
		});

		document.getElementById("range-wallpaper-opacity").addEventListener("input", (e) => {
			const opacity = parseFloat(e.target.value);
			document.getElementById("val-wallpaper-opacity").textContent = `${Math.round(opacity * 100)}%`;
			localStorage.setItem("wallpaper_opacity", opacity);

			const savedWallpaper = localStorage.getItem("wallpaper_image");
			if (savedWallpaper) {
				this.themeManager.applyWallpaper(savedWallpaper, opacity);
			}
		});

		document.getElementById("btn-register-theme").addEventListener("click", () => {
			const name = document.getElementById("input-theme-name").value.trim() || "나만의 테마";
			const appBg = document.getElementById("input-theme-appbg").value;
			const sideBg = document.getElementById("input-theme-sidebg").value;
			const cardBg = document.getElementById("input-theme-cardbg").value;
			const borderColor = document.getElementById("input-theme-bordercolor").value;
			const highlightColor = document.getElementById("input-theme-highlightcolor").value;
			const textColor = document.getElementById("input-theme-textcolor").value;

			const newThemeId = this.themeManager.registerCustomTheme(name, appBg, sideBg, cardBg, borderColor, highlightColor, textColor);
			this.populateThemeOptions();
			document.getElementById("select-theme").value = newThemeId;
			this.themeManager.setTheme(newThemeId);
			localStorage.setItem("theme", newThemeId);
			this.updateDeleteThemeButtonVisibility();
			
			alert(this.i18n.t("settings.themeRegisteredAlert"));
		});

		const btnDeleteTheme = document.getElementById("btn-delete-theme");
		if (btnDeleteTheme) {
			btnDeleteTheme.addEventListener("click", () => {
				const selectTheme = document.getElementById("select-theme");
				const themeId = selectTheme.value;

				if (themeId && themeId.startsWith("custom_")) {
					const customThemes = this.themeManager.getCustomThemes();
					const themeName = customThemes[themeId]?.name || "커스텀 테마";

					const confirmMsg = this.i18n.t("settings.deleteThemeConfirm", { name: themeName });
					if (confirm(confirmMsg)) {
						this.themeManager.deleteCustomTheme(themeId);
						
						localStorage.setItem("theme", "white");
						this.themeManager.setTheme("white");

						this.populateThemeOptions();
						selectTheme.value = "white";
						this.updateDeleteThemeButtonVisibility();

						alert(this.i18n.t("settings.deleteThemeDone"));
					}
				}
			});
		}

		document.getElementById("input-eq-bgcolor").addEventListener("input", (e) => {
			this.eqBgColor = e.target.value;
			localStorage.setItem("eq_bgcolor", this.eqBgColor);
			this.applyEqBgColor(this.eqBgColor);
		});
		document.getElementById("input-eq-color").addEventListener("input", (e) => {
			this.eqSpectrumColor = e.target.value;
			localStorage.setItem("eq_color", this.eqSpectrumColor);
		});
		document.getElementById("range-eq-thickness").addEventListener("input", (e) => {
			this.eqThickness = parseFloat(e.target.value);
			localStorage.setItem("eq_thickness", this.eqThickness);
		});
		document.getElementById("range-eq-speed").addEventListener("input", (e) => {
			this.eqSpeed = parseInt(e.target.value);
			localStorage.setItem("eq_speed", this.eqSpeed);
		});

		document.getElementById("select-font-family").addEventListener("change", (e) => {
			const fontFamily = e.target.value;
			localStorage.setItem("fontFamily", fontFamily);
			
			const customInput = document.getElementById("input-custom-font");
			if (fontFamily === "custom") {
				customInput.style.display = "inline-block";
				this.applyFontFamily("custom", customInput.value);
			} else {
				customInput.style.display = "none";
				this.applyFontFamily(fontFamily);
			}
		});

		document.getElementById("input-custom-font").addEventListener("input", (e) => {
			const customFontName = e.target.value;
			localStorage.setItem("customFontFamily", customFontName);
			this.applyFontFamily("custom", customFontName);
		});

		document.getElementById("select-theme").addEventListener("change", (e) => {
			const theme = e.target.value;
			localStorage.setItem("theme", theme);
			this.themeManager.setTheme(theme);
			this.updateDeleteThemeButtonVisibility();
		});

		document.getElementById("select-font-size").addEventListener("change", (e) => {
			const size = e.target.value;
			localStorage.setItem("fontSize", size);
			this.themeManager.setFontSize(size);
		});

		document.getElementById("select-line-height").addEventListener("change", (e) => {
			const lineHeight = e.target.value;
			localStorage.setItem("lineHeight", lineHeight);
			this.applyLineHeight(lineHeight);
		});

		document.getElementById("range-rate").addEventListener("input", (e) => {
			localStorage.setItem("rate", e.target.value);
		});

		document.getElementById("select-voice").addEventListener("change", (e) => {
			localStorage.setItem("voice", e.target.value);
		});

		document.getElementById("chk-exclude-hanja").addEventListener("change", (e) => {
			this.excludeHanja = e.target.checked;
			localStorage.setItem("excludeHanja", this.excludeHanja);
			this.reRenderOnFilterChange();
		});
		document.getElementById("chk-exclude-english").addEventListener("change", (e) => {
			this.excludeEnglish = e.target.checked;
			localStorage.setItem("excludeEnglish", this.excludeEnglish);
			this.reRenderOnFilterChange();
		});

		document.getElementById("chk-series-autoplay").addEventListener("change", (e) => {
			localStorage.setItem("seriesAutoplay", e.target.checked);
		});

		document.getElementById("range-volume").addEventListener("input", (e) => {
			const vol = parseFloat(e.target.value);
			localStorage.setItem("ttsVolume", vol);
			this.updateVolumeIcon(parseFloat(vol));

			if (this.ttsController.isPlaying) {
				clearTimeout(this.volumeTimeout);
				this.volumeTimeout = setTimeout(() => {
					this.playCurrentSentenceWithNewVolume();
				}, 150);
			}
		});

		if (speechSynthesis.onvoiceschanged !== undefined) {
			speechSynthesis.onvoiceschanged = () => this.initVoices();
		}
	}

	quickCycleTheme() {
		const select = document.getElementById("select-theme");
		let nextIndex = select.selectedIndex + 1;
		if (nextIndex >= select.options.length) nextIndex = 0;
		select.selectedIndex = nextIndex;
		const themeVal = select.value;
		localStorage.setItem("theme", themeVal);
		this.themeManager.setTheme(themeVal);
		this.updateDeleteThemeButtonVisibility();
	}

	applyEqBgColor(color) {
		const housing = document.getElementById("eq-housing");
		if (housing) housing.style.backgroundColor = color;
	}

	initVisualizer() {
		this.canvas = document.getElementById("visualizer-canvas");
		this.ctx = this.canvas.getContext("2d");

		const resize = () => {
			this.canvas.width = this.canvas.parentElement.clientWidth;
			this.canvas.height = this.canvas.parentElement.clientHeight;
		};
		window.addEventListener("resize", resize);
		resize();

		this.barHeights = Array(this.visualizerBars).fill(0);
		this.targetHeights = Array(this.visualizerBars).fill(0);

		const drawLoop = (timestamp) => {
			const width = this.canvas.width;
			const height = this.canvas.height;
			this.ctx.clearRect(0, 0, width, height);

			const isPlaying = this.ttsController && this.ttsController.isPlaying;
			const barWidth = width / this.visualizerBars;

			if (timestamp - this.lastShiftTime > this.eqSpeed) {
				this.lastShiftTime = timestamp;

				for (let i = this.visualizerBars - 1; i > 0; i--) {
					this.targetHeights[i] = this.targetHeights[i - 1];
				}

				if (isPlaying) {
					const rand = Math.random();
					if (rand < 0.15) {
						this.targetHeights[0] = 0.08;
					} else {
						this.targetHeights[0] = Math.random() * 0.82 + 0.18;
					}
				} else {
					this.targetHeights[0] = 0;
				}
			}

			this.ctx.strokeStyle = this.eqSpectrumColor;
			this.ctx.lineWidth = this.eqThickness;
			this.ctx.globalAlpha = 0.85;

			for (let i = 0; i < this.visualizerBars; i++) {
				const targetPixelHeight = this.targetHeights[i] * (height - 2);
				this.barHeights[i] += (targetPixelHeight - this.barHeights[i]) * 0.22;

				const currentBarHeight = this.barHeights[i];
				const x = i * barWidth + barWidth / 2;
				const centerY = height / 2;

				this.ctx.beginPath();
				this.ctx.moveTo(x, centerY - currentBarHeight / 2);
				this.ctx.lineTo(x, centerY + currentBarHeight / 2);
				this.ctx.stroke();
			}

			requestAnimationFrame(drawLoop);
		};
		requestAnimationFrame(drawLoop);
	}

	playCurrentSentenceWithNewVolume() {
		if (!this.currentBook || this.sentences.length === 0) return;
		
		const textToSpeak = this.sentences[this.currentSentenceIndex];
		const selectedVoice = document.getElementById("select-voice").value;
		const rate = parseFloat(document.getElementById("range-rate").value);
		const volume = parseFloat(document.getElementById("range-volume").value);

		this.ttsController.speak(textToSpeak, selectedVoice, rate, volume, () => {
			if (this.ttsController.isPlaying) {
				this.currentSentenceIndex++;
				this.speakCurrentProgress();
			}
		});
	}

	updateVolumeIcon(volume) {
		const icon = document.getElementById("icon-volume");
		if (volume === 0) {
			icon.className = "bi-volume-mute-fill";
		} else if (volume < 0.5) {
			icon.className = "bi-volume-down-fill";
		} else {
			icon.className = "bi-volume-up-fill";
		}
	}

	updatePlayerStateUI(state) {
		const btnPlay = document.getElementById("btn-play");
		const btnPause = document.getElementById("btn-pause");
		const btnStop = document.getElementById("btn-stop");

		if (!btnPlay || !btnPause || !btnStop) return;

		btnPlay.classList.remove("active");
		btnPause.classList.remove("active");
		btnStop.classList.remove("active");

		const playText = this.i18n.t("player.play");
		const playingText = this.i18n.t("player.playing");
		const pauseText = this.i18n.t("player.pause");
		const stopText = this.i18n.t("player.stop");

		btnPlay.innerHTML = `<i class="bi-play-fill"></i> ${playText}`;
		btnPause.innerHTML = `<i class="bi-pause-fill"></i> ${pauseText}`;
		btnStop.innerHTML = `<i class="bi-stop-fill"></i> ${stopText}`;

		if (state === 'play') {
			btnPlay.classList.add("active");
			btnPlay.innerHTML = `<i class="bi-play-fill"></i> ${playingText}`;
		} else if (state === 'pause') {
			btnPause.classList.add("active");
		} else if (state === 'stop') {
			btnStop.classList.add("active");
		}
	}

	applyLineHeight(val) {
		document.documentElement.style.setProperty("--line-height", val);
	}

	toggleSidebar(show) {
		const sidebar = document.getElementById("sidebar");
		const floatingBtn = document.getElementById("btn-floating-toggle");
		if (show) {
			sidebar.style.display = "flex";
			floatingBtn.style.display = "none";
		} else {
			sidebar.style.display = "none";
			floatingBtn.style.display = "flex";
		}
	}

	showModal(title, bodyHtml) {
		const modal = document.getElementById("app-modal");
		if (!modal) return;
		document.getElementById("modal-title").textContent = title;
		document.getElementById("modal-body").innerHTML = bodyHtml;
		modal.style.display = "flex";
	}

	applyFontFamily(fontFamily, customFontName = "") {
		const contentArea = document.getElementById("reader-content");
		if (fontFamily === "custom") {
			contentArea.style.fontFamily = `"${customFontName}", system-ui, -apple-system, sans-serif`;
		} else {
			contentArea.style.fontFamily = fontFamily;
		}
	}

	playSpeech() {
		if (this.sentences.length === 0) return;

		if (this.recorder.isRecording && this.recorder.isPaused) {
			this.recorder.resume();
		}
		
		const selectVoice = document.getElementById("select-voice");
		if (selectVoice && selectVoice.options.length === 0) {
			this.initVoices();
		}

		this.ttsController.isPlaying = true;
		this.updatePlayerStateUI('play');
		this.speakCurrentProgress();
	}

	pauseSpeech() {
		this.ttsController.isPlaying = false;
		this.ttsController.pause();
		if (this.recorder.isRecording) {
			this.recorder.pause();
		}
		this.updatePlayerStateUI('pause');
	}

	stopSpeech() {
		this.ttsController.isPlaying = false;
		this.ttsController.stop();
		if (this.recorder.isRecording) {
			this.recorder.stop();
			this.updateRecordButtonUI(false);
		}
		this.currentSentenceIndex = 0;
		this.applySentenceHighlight(0);
		this.saveState();
		this.updatePlayerStateUI('stop');
	}

	initVoices() {
		const selectVoice = document.getElementById("select-voice");
		if (!selectVoice) return;
		
		const voices = this.ttsController.getAvailableVoices();
		if (voices.length === 0) return;

		selectVoice.innerHTML = "";
		const currentLang = this.i18n ? this.i18n.getLanguage() : "ko";

		const matchedVoices = voices.filter(v => v.lang.toLowerCase().includes(currentLang));
		const listToRender = matchedVoices.length > 0 ? matchedVoices : voices;

		const savedVoice = localStorage.getItem("voice") || "";

		listToRender.forEach(voice => {
			const opt = document.createElement("option");
			opt.value = voice.name;
			opt.textContent = `${voice.name} (${voice.lang})`;
			if (voice.name === savedVoice) {
				opt.selected = true;
			}
			selectVoice.appendChild(opt);
		});

		if (!selectVoice.value && selectVoice.options.length > 0) {
			selectVoice.selectedIndex = 0;
			localStorage.setItem("voice", selectVoice.value);
		}
	}

	async createSeriesAction() {
		const promptMsg = this.i18n.t("sidebar.promptSeriesName");
		const seriesName = prompt(promptMsg);
		if (!seriesName) return;
		const trimmedName = seriesName.trim();
		if (!trimmedName) return;

		const newSeries = {
			title: trimmedName,
			type: "series",
			cover: null,
			addedDate: new Date()
		};

		await this.dbManager.addBook(newSeries);
		this.loadBookShelf();
	}

	async handleFileUpload(e) {
		const files = Array.from(e.target.files || []);
		if (files.length === 0) return;

		const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name));
		const docFiles = files.filter(f => /\.(txt|docx|odt|hwpx|pdf)$/i.test(f.name));

		const imageMap = {};
		for (const imgFile of imageFiles) {
			const baseName = imgFile.name.substring(0, imgFile.name.lastIndexOf('.')).toLowerCase().trim();
			const compressedDataUrl = await this.compressCoverImage(imgFile);
			if (compressedDataUrl) {
				imageMap[baseName] = compressedDataUrl;
			}
		}

		const currentSeriesId = this.activeUploadSeriesId;
		const allItems = await this.dbManager.getAllBooks();
		const allSeries = allItems.filter(i => i.type === "series");

		for (const series of allSeries) {
			const seriesBaseName = series.title.toLowerCase().trim();
			if (imageMap[seriesBaseName]) {
				series.cover = imageMap[seriesBaseName];
				await this.dbManager.updateBook(series);
				delete imageMap[seriesBaseName];
			}
		}

		if (currentSeriesId) {
			const currentSeries = allSeries.find(i => i.id === currentSeriesId);
			if (currentSeries && !currentSeries.cover) {
				const availableImgKeys = Object.keys(imageMap);
				if (availableImgKeys.length > 0) {
					const firstImgKey = availableImgKeys[0];
					currentSeries.cover = imageMap[firstImgKey];
					await this.dbManager.updateBook(currentSeries);
				}
			}
		}

		for (const docFile of docFiles) {
			const baseName = docFile.name.substring(0, docFile.name.lastIndexOf('.')).toLowerCase().trim();
			const matchedCover = imageMap[baseName] || null;
			
			try {
				await this.processSingleFile(docFile, matchedCover, currentSeriesId);
			} catch (fileErr) {
				console.error(`[파일 오류] ${docFile.name} 변환 실패:`, fileErr);
			}

			if (matchedCover) {
				delete imageMap[baseName];
			}
		}

		this.activeUploadSeriesId = null;
		this.loadBookShelf();
		e.target.value = "";
	}

	processSingleFile(file, matchedCover = null, parentSeriesId = null) {
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = async (evt) => {
				const arrayBuffer = evt.target.result;
				let fullText = "";

				if (file.name.endsWith(".docx")) {
					try {
						const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
						fullText = result.value;
					} catch (err) {
						console.error(err);
					}
				} else if (file.name.endsWith(".odt")) {
					try {
						fullText = await window.NDS_TTS.TextProcessor.extractTextFromOdt(arrayBuffer);
					} catch (err) {
						console.error(err);
					}
				} else if (file.name.endsWith(".hwpx")) {
					try {
						fullText = await window.NDS_TTS.TextProcessor.extractTextFromHwpx(arrayBuffer);
					} catch (err) {
						console.error(err);
					}
				} else if (file.name.endsWith(".pdf")) {
					try {
						fullText = await window.NDS_TTS.TextProcessor.extractTextFromPdf(arrayBuffer);
					} catch (err) {
						console.error(err);
					}
				} else {
					fullText = window.NDS_TTS.TextProcessor.decodeText(arrayBuffer);
				}

				if (fullText.trim() !== "") {
					const newBook = {
						title: file.name,
						type: "book",
						parentSeriesId: parentSeriesId,
						chunks: window.NDS_TTS.TextProcessor.splitIntoPages(fullText),
						lastChunkIndex: 0,
						lastSentenceIndex: 0,
						bookmarks: [],
						cover: matchedCover,
						addedDate: new Date()
					};
					await this.dbManager.addBook(newBook);
				}
				resolve();
			};
			reader.readAsArrayBuffer(file);
		});
	}

	addCurrentBookmark() {
		if (!this.currentBook) return;

		if (!this.currentBook.bookmarks) {
			this.currentBook.bookmarks = [];
		}

		const sentenceText = this.sentences[this.currentSentenceIndex] || "첫 문장";
		const shortPreview = sentenceText.length > 15 ? sentenceText.substring(0, 15) + "..." : sentenceText;
		
		const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		const unitText = this.i18n.t("player.pageUnit");
		const bookmark = {
			id: Date.now(),
			pageIndex: this.currentPageIndex,
			sentenceIndex: this.currentSentenceIndex,
			textPreview: `[${this.currentPageIndex + 1}${unitText}] ${shortPreview} (${timestamp})`
		};

		this.currentBook.bookmarks.push(bookmark);
		this.saveState();
		this.updateBookmarkDropdown();
	}

	updateBookmarkDropdown() {
		const select = document.getElementById("select-bookmarks");
		select.innerHTML = `<option value="">${this.i18n.t("player.bookmarkList")}</option>`;

		if (!this.currentBook || !this.currentBook.bookmarks) return;

		this.currentBook.bookmarks.forEach(bm => {
			const opt = document.createElement("option");
			opt.value = `${bm.pageIndex},${bm.sentenceIndex}`;
			opt.textContent = bm.textPreview;
			select.appendChild(opt);
		});
	}

	jumpToSelectedBookmark(value) {
		if (!value) return;

		const [pageIdx, sentenceIdx] = value.split(",").map(Number);
		const wasPlaying = this.ttsController.isPlaying;
		
		this.ttsController.stop();
		this.currentPageIndex = pageIdx;
		this.currentSentenceIndex = sentenceIdx;
		
		this.saveState();
		this.renderViewer();

		if (wasPlaying) {
			this.playSpeech();
		}

		document.getElementById("select-bookmarks").value = "";
	}

	async exportLibraryToFile() {
		const books = await this.dbManager.getAllBooks();
		if (books.length === 0) return;

		let filename = prompt(this.i18n.t("sidebar.promptBackupName"), "tts_library_backup");
		if (filename === null) return;
		
		filename = filename.trim();
		if (!filename) filename = "tts_library_backup";
		if (!filename.endsWith(".json")) filename += ".json";

		const dataStr = JSON.stringify(books, null, 2);
		const blob = new Blob([dataStr], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		
		const link = document.createElement("a");
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	importLibraryFromFile(e) {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = async (evt) => {
			try {
				const importedList = JSON.parse(evt.target.result);
				await this.dbManager.importBooks(importedList);
				
				this.loadBookShelf();
				if (importedList.length > 0) {
					this.loadBookToViewer(importedList[0]);
				}
			} catch (error) {
				console.error(error);
			} finally {
				e.target.value = "";
			}
		};
		reader.readAsText(file);
	}

	async loadBookShelf() {
		const listEl = document.getElementById("book-list-element");
		listEl.innerHTML = "";

		const allItems = await this.dbManager.getAllBooks();

		const seriesItems = allItems.filter(i => i.type === "series");
		const booksList = allItems.filter(i => i.type === "book" || !i.type);

		const independentBooks = booksList.filter(b => !b.parentSeriesId);
		const nestedBooks = booksList.filter(b => b.parentSeriesId);

		const pageUnit = this.i18n.t("player.pageUnit");

		// 1. 시리즈 목록 및 수록 도서 렌더링
		seriesItems.forEach(series => {
			const seriesWrap = document.createElement("div");
			seriesWrap.className = "series-item";
			seriesWrap.setAttribute("data-series-id", series.id);

			const isExpanded = this.expandedSeries.has(series.id);
			const seriesChildren = nestedBooks.filter(b => b.parentSeriesId === series.id);

			const effectiveCover = series.cover || (seriesChildren.find(b => b.cover)?.cover) || null;

			const coverHtml = effectiveCover 
				? `<img src="${effectiveCover}" class="book-cover-mini" style="object-fit: cover; border: 1px solid var(--border-color); cursor: pointer;" title="썸네일 이미지 변경" onerror="this.onerror=null; this.outerHTML='<div class=\\'book-cover-mini\\' style=\\'cursor: pointer;\\'><i class=\\'bi-folder\\' style=\\'font-size: 15px;\\'></i></div>';">`
				: `<div class="book-cover-mini" style="cursor: pointer;" title="썸네일 이미지 등록"><i class="bi-folder" style="font-size: 15px;"></i></div>`;

			const header = document.createElement("div");
			header.className = "series-header";
			header.innerHTML = `
				<span class="series-caret ${isExpanded ? 'expanded' : ''}"><i class="bi-chevron-right"></i></span>
				${coverHtml}
				<div class="series-title" style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-left: 4px;">
					<div style="font-size:13px; font-weight:bold;">${series.title}</div>
					<div style="font-size:11px; color:gray;">시리즈 폴더</div>
				</div>
				<button class="btn-add-to-series" title="회차 추가"><i class="bi-plus-circle"></i></button>
				<button class="btn-delete-book" title="삭제">&times;</button>
			`;

			header.onclick = () => {
				if (this.expandedSeries.has(series.id)) {
					this.expandedSeries.delete(series.id);
				} else {
					this.expandedSeries.add(series.id);
				}
				this.loadBookShelf();
			};

			const coverEl = header.querySelector(".book-cover-mini");
			if (coverEl) {
				coverEl.onclick = (e) => {
					e.stopPropagation();
					const imgInput = document.createElement("input");
					imgInput.type = "file";
					imgInput.accept = "image/*";
					imgInput.onchange = async (evt) => {
						const imgFile = evt.target.files[0];
						if (!imgFile) return;
						const compressedDataUrl = await this.compressCoverImage(imgFile);
						if (compressedDataUrl) {
							series.cover = compressedDataUrl;
							await this.dbManager.updateBook(series);
							this.loadBookShelf();
						}
					};
					imgInput.click();
				};
			}

			const addBtn = header.querySelector(".btn-add-to-series");
			addBtn.onclick = (e) => {
				e.stopPropagation();
				this.activeUploadSeriesId = series.id;
				document.getElementById("file-uploader").click();
			};

			const deleteBtn = header.querySelector(".btn-delete-book");
			deleteBtn.onclick = async (e) => {
				e.stopPropagation();
				const confirmMsg = this.i18n.t("sidebar.deleteSeriesConfirm", { title: series.title });
				if (confirm(confirmMsg)) {
					this.ttsController.stop();
					const children = nestedBooks.filter(b => b.parentSeriesId === series.id);
					for (const child of children) {
						await this.dbManager.deleteBook(child.id);
					}
					await this.dbManager.deleteBook(series.id);

					if (this.currentBook && this.currentBook.parentSeriesId === series.id) {
						this.resetViewer();
					}
					this.loadBookShelf();
				}
			};

			seriesWrap.appendChild(header);

			if (isExpanded) {
				const childrenContainer = document.createElement("div");
				childrenContainer.className = "series-children";

				if (seriesChildren.length === 0) {
					const emptyTip = document.createElement("div");
					emptyTip.style = "padding: 5px 8px; font-size: 11px; color: gray; text-align: center;";
					emptyTip.textContent = this.i18n.t("sidebar.noSeriesItems");
					childrenContainer.appendChild(emptyTip);
				} else {
					seriesChildren.forEach(child => {
						const childItem = document.createElement("div");
						childItem.className = "series-child-item";
						childItem.setAttribute("data-id", child.id);
						if (this.currentBook && this.currentBook.id === child.id) {
							childItem.classList.add("active-book");
						}

						childItem.innerHTML = `
							<div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
								<div style="font-weight:bold; font-size: 12px;">${child.title}</div>
								<div style="font-size:10px; color:gray;">${child.lastChunkIndex ? child.lastChunkIndex + 1 : 1}${pageUnit}</div>
							</div>
							<button class="btn-delete-book" style="font-size: 14px;">&times;</button>
						`;

						childItem.onclick = () => this.loadBookToViewer(child);

						const delChildBtn = childItem.querySelector(".btn-delete-book");
						delChildBtn.onclick = async (e) => {
							e.stopPropagation();
							const confirmMsg = this.i18n.t("sidebar.deleteBookConfirm", { title: child.title });
							if (confirm(confirmMsg)) {
								this.ttsController.stop();
								await this.dbManager.deleteBook(child.id);
								if (this.currentBook && this.currentBook.id === child.id) {
									this.resetViewer();
								}
								this.loadBookShelf();
							}
						};

						childrenContainer.appendChild(childItem);
					});
				}
				seriesWrap.appendChild(childrenContainer);
			}

			listEl.appendChild(seriesWrap);
		});

		// 2. 독립형 도서 목록 렌더링
		independentBooks.forEach(book => {
			const item = document.createElement("div");
			item.className = "book-item";
			item.setAttribute("data-id", book.id);
			if (this.currentBook && this.currentBook.id === book.id) {
				item.classList.add("active-book");
			}
			
			const titleAbbr = book.title.substring(0, 2);
			const coverHtml = book.cover 
				? `<img src="${book.cover}" class="book-cover-mini" style="object-fit: cover; border: 1px solid var(--border-color); cursor: pointer;" onerror="this.onerror=null; this.outerHTML='<div class=\\'book-cover-mini\\' style=\\'cursor: pointer;\\'>${titleAbbr}</div>';">`
				: `<div class="book-cover-mini" style="cursor: pointer;">${titleAbbr}</div>`;

			item.innerHTML = `
				${coverHtml}
				<div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-right: 5px;">
					<div style="font-size:13px; font-weight:bold; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${book.title}</div>
					<div style="font-size:11px; color:gray;">${book.lastChunkIndex ? book.lastChunkIndex + 1 : 1}${pageUnit}</div>
				</div>
				<button class="btn-delete-book">&times;</button>
			`;
			
			item.onclick = () => this.loadBookToViewer(book);

			const deleteBtn = item.querySelector(".btn-delete-book");
			deleteBtn.onclick = async (e) => {
				e.stopPropagation();
				const confirmMsg = this.i18n.t("sidebar.deleteBookConfirm", { title: book.title });
				if (confirm(confirmMsg)) {
					await this.deleteBookAction(book.id);
				}
			};

			listEl.appendChild(item);
		});
	}

	async deleteBookAction(bookId) {
		if (this.currentBook && this.currentBook.id === bookId) {
			this.resetViewer();
		}
		await this.dbManager.deleteBook(bookId);
		this.loadBookShelf();
	}

	resetViewer() {
		this.ttsController.stop();
		this.currentBook = null;
		this.pages = [];
		this.currentPageIndex = 0;
		this.currentSentenceIndex = 0;
		this.sentences = [];
		
		const contentArea = document.getElementById("reader-content");
		contentArea.innerHTML = `
			<div class="reader-scroll-area">
				<p class="empty-message"><i class="bi-book"></i> &nbsp;NDS TEXT to Speech &nbsp;<i class="bi-book"></i> <br>
					<img src='NDS_TEXT_to_Speech.nds' width='60%' border='0'><br>${this.i18n.t("sidebar.emptyLibrary")}
				</p>
			</div>
		`;
		document.getElementById("page-indicator").textContent = "0 / 0";
		this.updatePlayerStateUI('stop');
	}

	loadBookToViewer(book) {
		this.currentBook = book;
		this.pages = book.chunks;
		this.currentPageIndex = book.lastChunkIndex || 0;
		this.currentSentenceIndex = book.lastSentenceIndex || 0;
		
		if (book.parentSeriesId) {
			this.expandedSeries.add(book.parentSeriesId);
		}

		if (!this.currentBook.bookmarks) {
			this.currentBook.bookmarks = [];
		}

		this.renderViewer();
		this.updateBookmarkDropdown();
		this.loadBookShelf();
	}

	renderViewer() {
		const contentArea = document.getElementById("reader-content");
		if (!this.pages[this.currentPageIndex]) return;

		const rawText = this.pages[this.currentPageIndex];
		const rawParagraphs = rawText.split(/\r?\n/);
		
		contentArea.innerHTML = "";
		this.sentences = [];
		let sentenceGlobalIdx = 0;

		const scrollArea = document.createElement("div");
		scrollArea.className = "reader-scroll-area";

		rawParagraphs.forEach(para => {
			const filteredPara = window.NDS_TTS.TextProcessor.filterText(para, this.excludeHanja, this.excludeEnglish);
			const pEl = document.createElement("p");
			pEl.className = "reader-paragraph";

			if (filteredPara.trim() === "") {
				pEl.innerHTML = "&nbsp;";
				scrollArea.appendChild(pEl);
				return;
			}

			const paraSentences = window.NDS_TTS.TextProcessor.extractSentences(filteredPara);
			
			paraSentences.forEach(sentence => {
				const span = document.createElement("span");
				span.className = "sentence";
				const currentIdx = sentenceGlobalIdx++;
				span.id = `s-${currentIdx}`;
				span.textContent = sentence + " ";
				span.onclick = () => this.jumpToSentence(currentIdx);
				
				pEl.appendChild(span);
				this.sentences.push(sentence);
			});

			scrollArea.appendChild(pEl);
		});

		contentArea.appendChild(scrollArea);

		this.updatePaginationIndicator();
		this.ttsController.stop();
		this.applySentenceHighlight(this.currentSentenceIndex);
	}

	updatePaginationIndicator() {
		const indicator = document.getElementById("page-indicator");
		const unitText = this.i18n.t("player.pageUnit");
		indicator.textContent = `${this.currentPageIndex + 1} / ${this.pages.length} ${unitText}`;
	}

	applySentenceHighlight(index) {
		if (index >= this.sentences.length) {
			index = Math.max(0, this.sentences.length - 1);
			this.currentSentenceIndex = index;
		}

		document.querySelectorAll(".sentence").forEach(el => el.classList.remove("active"));
		const activeSpan = document.getElementById(`s-${index}`);
		if (activeSpan) {
			activeSpan.classList.add("active");
			activeSpan.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	}

	speakCurrentProgress() {
		if (!this.ttsController.isPlaying) return;

		if (this.currentSentenceIndex >= this.sentences.length) {
			this.changePage(1, true);
			return;
		}

		this.applySentenceHighlight(this.currentSentenceIndex);
		this.saveState();

		const textToSpeak = this.sentences[this.currentSentenceIndex];
		const selectedVoice = document.getElementById("select-voice").value;
		const rate = parseFloat(document.getElementById("range-rate").value);
		const volume = parseFloat(document.getElementById("range-volume").value);

		this.ttsController.speak(textToSpeak, selectedVoice, rate, volume, () => {
			if (this.ttsController.isPlaying) {
				this.currentSentenceIndex++;
				this.speakCurrentProgress();
			}
		});
	}

	jumpToSentence(index) {
		const wasPlaying = this.ttsController.isPlaying;
		this.ttsController.stop();
		this.currentSentenceIndex = index;
		this.applySentenceHighlight(index);
		this.saveState();
		
		if (wasPlaying) {
			this.playSpeech();
		}
	}

	changePage(direction, autoPlayAfter = false) {
		const targetPageIndex = this.currentPageIndex + direction;
		if (targetPageIndex >= 0 && targetPageIndex < this.pages.length) {
			this.currentPageIndex = targetPageIndex;
			this.currentSentenceIndex = 0;
			this.saveState();
			this.renderViewer();

			if (autoPlayAfter) {
				this.playSpeech();
			}
		} else if (targetPageIndex >= this.pages.length) {
			const isSeriesAutoplay = document.getElementById("chk-series-autoplay").checked;
			if (isSeriesAutoplay && this.currentBook && this.currentBook.parentSeriesId) {
				this.playNextBookInSeries();
			} else {
				this.stopSpeech();
				alert(this.i18n.t("player.lastPageAlert"));
			}
		}
	}

	async playNextBookInSeries() {
		const allItems = await this.dbManager.getAllBooks();
		const seriesChildren = allItems.filter(b => (b.type === "book" || !b.type) && b.parentSeriesId === this.currentBook.parentSeriesId);
		seriesChildren.sort((a, b) => (a.id || 0) - (b.id || 0));

		const currentIndex = seriesChildren.findIndex(b => b.id === this.currentBook.id);
		if (currentIndex !== -1 && currentIndex < seriesChildren.length - 1) {
			const nextBook = seriesChildren[currentIndex + 1];
			this.ttsController.stop();
			
			nextBook.lastChunkIndex = 0;
			nextBook.lastSentenceIndex = 0;
			await this.dbManager.updateBook(nextBook);

			this.loadBookToViewer(nextBook);
			this.playSpeech();
		} else {
			this.stopSpeech();
			alert(this.i18n.t("player.lastSeriesAlert"));
		}
	}

	reRenderOnFilterChange() {
		if (this.currentBook) {
			this.renderViewer();
		}
	}

	async clearLibraryAction() {
		if (confirm(this.i18n.t("sidebar.clearAllConfirm"))) {
			this.ttsController.stop();
			await this.dbManager.clearAll();

			this.currentBook = null;
			this.pages = [];
			this.currentPageIndex = 0;
			this.currentSentenceIndex = 0;
			this.sentences = [];

			this.resetViewer();
			this.loadBookShelf();
		}
	}

	async saveState() {
		if (!this.currentBook) return;
		this.currentBook.lastChunkIndex = this.currentPageIndex;
		this.currentBook.lastSentenceIndex = this.currentSentenceIndex;
		await this.dbManager.updateBook(this.currentBook);
	}
};

window.addEventListener("DOMContentLoaded", () => {
	const app = new window.NDS_TTS.App();
	app.start();
});