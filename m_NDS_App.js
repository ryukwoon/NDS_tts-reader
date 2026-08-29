/* === m_NDS_App.js 시작 === */
// m_NDS_App.js - 모바일 전용 고속 컨트롤러 (v3.5 - TXT 문서 불러오기 엔진 추가)
window.NDS_TTS = window.NDS_TTS || {};

window.NDS_TTS.App = class App {
	// 모바일 전용 기능개선 버전 정보 (v3.5)
	static get VERSION() {
		return "v3.5";
	}

	static get GITHUB_URL() {
		return "https://ryukwoon.github.io/NDS_tts-reader/";
	}

	getVersion() {
		return App.VERSION;
	}

	constructor() {
		this.dbManager = new window.NDS_TTS.DBManager();
		this.ttsController = new window.NDS_TTS.TTSController();
		this.themeManager = new window.NDS_TTS.ThemeManager();
		this.i18n = new window.NDS_TTS.I18nManager();

		this.currentBook = null;
		this.pages = [];
		this.currentPageIndex = 0;
		this.currentSentenceIndex = 0;
		this.sentences = [];

		// [설정 디폴트값] 한자 제외: true, 영문 제외: false, 절 번호 음성 제외: true
		this.excludeHanja = localStorage.getItem("excludeHanja") !== "false";
		this.excludeEnglish = localStorage.getItem("excludeEnglish") === "true";
		this.excludeSectionNum = localStorage.getItem("excludeSectionNum") !== "false";

		this.expandedSeries = new Set();
		this.wakeLock = null;
		this.deferredPrompt = null;
	}

	async start() {
		try {
			document.body.classList.add("mobile-mode");

			// PWA 설치 이벤트
			window.addEventListener("beforeinstallprompt", (e) => {
				e.preventDefault();
				this.deferredPrompt = e;
				const btnInstall = document.getElementById("btn-pwa-install");
				if (btnInstall) btnInstall.style.display = "flex";
			});

			await this.dbManager.init();
			await this.i18n.init();
			this.bindEvents();
			this.initVoices();
			this.initPreferences();
			this.loadBookShelf();
			this.bindMobileLifeCycle();
		} catch (error) {
			console.error("앱 초기화 중 문제가 발생했습니다.", error);
		}
	}

	bindMobileLifeCycle() {
		window.addEventListener("visibilitychange", () => {
			if (document.visibilityState === "hidden") {
				this.saveState();
			}
		});
		window.addEventListener("pagehide", () => {
			this.saveState();
		});
	}

	async requestWakeLock() {
		if ('wakeLock' in navigator) {
			try {
				this.wakeLock = await navigator.wakeLock.request('screen');
			} catch (err) {
				console.log("WakeLock 활성화 실패:", err);
			}
		}
	}

	releaseWakeLock() {
		if (this.wakeLock) {
			this.wakeLock.release().then(() => {
				this.wakeLock = null;
			});
		}
	}

	initPreferences() {
		const chkHanja = document.getElementById("chk-exclude-hanja");
		if (chkHanja) chkHanja.checked = this.excludeHanja;

		const chkEng = document.getElementById("chk-exclude-english");
		if (chkEng) chkEng.checked = this.excludeEnglish;

		const chkSecNum = document.getElementById("chk-exclude-section-num");
		if (chkSecNum) chkSecNum.checked = this.excludeSectionNum;

		this.populateThemeOptions();
		const savedTheme = localStorage.getItem("theme") || "white";
		const selectTheme = document.getElementById("select-theme");
		if (selectTheme) selectTheme.value = savedTheme;
		this.themeManager.setTheme(savedTheme);

		const savedFontSize = localStorage.getItem("fontSize") || "18px";
		const selectFontSize = document.getElementById("select-font-size");
		if (selectFontSize) selectFontSize.value = savedFontSize;
		this.themeManager.setFontSize(savedFontSize);

		const savedRate = localStorage.getItem("rate") || "1";
		const rangeRate = document.getElementById("range-rate");
		if (rangeRate) rangeRate.value = savedRate;

		const savedLineHeight = localStorage.getItem("lineHeight") || "1.6";
		const selectLineHeight = document.getElementById("select-line-height");
		if (selectLineHeight) selectLineHeight.value = savedLineHeight;
		this.applyLineHeight(savedLineHeight);

		const savedSeriesAutoplay = localStorage.getItem("seriesAutoplay") === "true";
		const chkSeries = document.getElementById("chk-series-autoplay");
		if (chkSeries) chkSeries.checked = savedSeriesAutoplay;

		const savedVolume = localStorage.getItem("ttsVolume") || "0.8";
		const rangeVol = document.getElementById("range-volume");
		if (rangeVol) rangeVol.value = savedVolume;
		this.updateVolumeIcon(parseFloat(savedVolume));

		const savedWallpaper = localStorage.getItem("wallpaper_image") || "";
		const savedOpacity = parseFloat(localStorage.getItem("wallpaper_opacity") || "1.0");
		const rangeWallOp = document.getElementById("range-wallpaper-opacity");
		if (rangeWallOp) rangeWallOp.value = savedOpacity;

		if (savedWallpaper) {
			this.themeManager.applyWallpaper(savedWallpaper, savedOpacity);
		}
		this.updateWallpaperDisplay();

		const verDisplay = document.getElementById("app-version-display");
		if (verDisplay) verDisplay.textContent = App.VERSION;

		this.updatePlayerStateUI('stop');
	}

	populateThemeOptions() {
		const selectTheme = document.getElementById("select-theme");
		if (!selectTheme) return;

		selectTheme.innerHTML = `
			<option value="white">화이트 테마</option>
			<option value="dark">다크 테마</option>
			<option value="grey">그레이 테마</option>
			<option value="jade">비취색 테마</option>
		`;
	}

	updateWallpaperDisplay() {
		const statusEl = document.getElementById("wallpaper-status-display");
		const btnRemove = document.getElementById("btn-remove-wallpaper");
		if (!statusEl) return;

		const savedWallpaper = localStorage.getItem("wallpaper_image");
		if (savedWallpaper) {
			statusEl.textContent = "🖼️ 배경화면 적용됨";
			if (btnRemove) btnRemove.style.display = "inline-block";
		} else {
			statusEl.textContent = "🖼️ 미설정";
			if (btnRemove) btnRemove.style.display = "none";
		}
	}

	compressImage(file, maxWidth = 1080, quality = 0.75) {
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

	bindEvents() {
		// PWA 홈 화면 추가 버튼
		const btnInstall = document.getElementById("btn-pwa-install");
		if (btnInstall) {
			btnInstall.addEventListener("click", async () => {
				if (this.deferredPrompt) {
					this.deferredPrompt.prompt();
					const { outcome } = await this.deferredPrompt.userChoice;
					if (outcome === 'accepted') {
						btnInstall.style.display = 'none';
					}
					this.deferredPrompt = null;
				} else {
					alert("iOS 사파리는 하단 [공유] 버튼을 누른 후 [홈 화면에 추가]를 선택하세요.");
				}
			});
		}

		// 본문에서 책장으로 돌아가기
		const btnBackLib = document.getElementById("btn-back-to-library");
		if (btnBackLib) {
			btnBackLib.addEventListener("click", () => {
				document.body.classList.remove("view-reader");
			});
		}

		// 사이드바 하단 [본문보기] 버튼 클릭 -> 기존 읽던 위치 그대로 본문으로 복귀
		const btnReturnViewer = document.getElementById("btn-return-viewer");
		if (btnReturnViewer) {
			btnReturnViewer.addEventListener("click", () => {
				if (this.currentBook && this.pages.length > 0) {
					document.body.classList.add("view-reader");
					this.applySentenceHighlight(this.currentSentenceIndex);
				} else {
					alert("현재 열려 있는 도서가 없습니다. 책장에서 도서를 먼저 선택하세요.");
				}
			});
		}

		// 1) 책장 불러오기 (JSON)
		document.getElementById("btn-import-trigger").addEventListener("click", () => {
			document.getElementById("library-importer").click();
		});
		document.getElementById("library-importer").addEventListener("change", (e) => this.importLibraryFromFile(e));

		// 2) [신규] TXT 문서 불러오기
		const btnUploadTxt = document.getElementById("btn-upload-txt");
		if (btnUploadTxt) {
			btnUploadTxt.addEventListener("click", () => {
				document.getElementById("txt-file-uploader").click();
			});
		}
		const txtUploader = document.getElementById("txt-file-uploader");
		if (txtUploader) {
			txtUploader.addEventListener("change", (e) => this.handleTxtFileUpload(e));
		}

		// 3) 책장 전체 비우기
		document.getElementById("btn-clear-library").addEventListener("click", () => this.clearLibraryAction());

		// 재생 컨트롤
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

		// 페이징
		document.getElementById("btn-prev-page").addEventListener("click", () => this.changePage(-1));
		document.getElementById("btn-next-page").addEventListener("click", () => this.changePage(1));

		// 하단 제어 메뉴
		document.getElementById("btn-quick-theme").addEventListener("click", () => this.quickCycleTheme());
		document.getElementById("btn-toggle-settings").addEventListener("click", () => {
			document.getElementById("settings-modal").style.display = "flex";
		});

		const closeSettings = () => {
			document.getElementById("settings-modal").style.display = "none";
		};
		document.getElementById("btn-close-settings-modal").addEventListener("click", closeSettings);
		const btnCloseX = document.getElementById("btn-close-settings-x");
		if (btnCloseX) btnCloseX.addEventListener("click", closeSettings);

		// GitHub 링크
		const btnGit = document.getElementById("btn-open-github");
		if (btnGit) {
			btnGit.addEventListener("click", () => window.open(App.GITHUB_URL, "_blank"));
		}

		document.getElementById("btn-close-modal").addEventListener("click", () => {
			document.getElementById("app-modal").style.display = "none";
		});

		// 배경화면 업로더
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
			const valEl = document.getElementById("val-wallpaper-opacity");
			if (valEl) valEl.textContent = `${Math.round(opacity * 100)}%`;
			localStorage.setItem("wallpaper_opacity", opacity);
			const savedWallpaper = localStorage.getItem("wallpaper_image");
			if (savedWallpaper) {
				this.themeManager.applyWallpaper(savedWallpaper, opacity);
			}
		});

		// 설정 변경
		document.getElementById("select-theme").addEventListener("change", (e) => {
			const theme = e.target.value;
			localStorage.setItem("theme", theme);
			this.themeManager.setTheme(theme);
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
		document.getElementById("chk-exclude-section-num").addEventListener("change", (e) => {
			this.excludeSectionNum = e.target.checked;
			localStorage.setItem("excludeSectionNum", this.excludeSectionNum);
		});

		document.getElementById("chk-series-autoplay").addEventListener("change", (e) => {
			localStorage.setItem("seriesAutoplay", e.target.checked);
		});

		document.getElementById("range-volume").addEventListener("input", (e) => {
			const vol = parseFloat(e.target.value);
			localStorage.setItem("ttsVolume", vol);
			this.updateVolumeIcon(vol);
		});

		if (speechSynthesis.onvoiceschanged !== undefined) {
			speechSynthesis.onvoiceschanged = () => this.initVoices();
		}
	}

	// [신규] TXT 파일 등록 및 인코딩 자동 판별 파싱
	async handleTxtFileUpload(e) {
		const files = Array.from(e.target.files || []);
		if (files.length === 0) return;

		let lastAddedBook = null;

		for (const file of files) {
			try {
				const arrayBuffer = await file.arrayBuffer();
				// EUC-KR / UTF-8 자동 판별 디코딩
				const fullText = window.NDS_TTS.TextProcessor.decodeText(arrayBuffer);

				if (fullText.trim() !== "") {
					const newBook = {
						title: file.name,
						type: "book",
						parentSeriesId: null,
						chunks: window.NDS_TTS.TextProcessor.splitIntoPages(fullText),
						lastChunkIndex: 0,
						lastSentenceIndex: 0,
						bookmarks: [],
						cover: null,
						addedDate: new Date()
					};
					lastAddedBook = await this.dbManager.addBook(newBook);
				}
			} catch (err) {
				console.error(`[TXT 읽기 오류] ${file.name}:`, err);
			}
		}

		this.loadBookShelf();
		if (lastAddedBook) {
			this.loadBookToViewer(lastAddedBook);
		}
		e.target.value = "";
	}

	quickCycleTheme() {
		const select = document.getElementById("select-theme");
		let nextIndex = select.selectedIndex + 1;
		if (nextIndex >= select.options.length) nextIndex = 0;
		select.selectedIndex = nextIndex;
		const themeVal = select.value;
		localStorage.setItem("theme", themeVal);
		this.themeManager.setTheme(themeVal);
	}

	updateVolumeIcon(volume) {
		const icon = document.getElementById("icon-volume");
		if (!icon) return;
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

		if (state === 'play') {
			btnPlay.classList.add("active");
		} else if (state === 'pause') {
			btnPause.classList.add("active");
		} else if (state === 'stop') {
			btnStop.classList.add("active");
		}
	}

	applyLineHeight(val) {
		document.documentElement.style.setProperty("--line-height", val);
	}

	async playSpeech() {
		if (this.sentences.length === 0) return;
		await this.requestWakeLock();
		this.ttsController.isPlaying = true;
		this.updatePlayerStateUI('play');
		this.speakCurrentProgress();
	}

	loadBookToViewer(book) {
		this.currentBook = book;
		this.pages = book.chunks || [];
		this.currentPageIndex = book.lastChunkIndex || 0;
		this.currentSentenceIndex = book.lastSentenceIndex || 0;

		if (book.parentSeriesId) {
			this.expandedSeries.add(book.parentSeriesId);
		}

		document.body.classList.add("view-reader");
		this.renderViewer();
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

		let sectionCounter = 1;
		const currentChapterNum = this.currentPageIndex + 1;

		rawParagraphs.forEach(para => {
			const isValidSectionText = /[\u4E00-\u9FFF\u3131-\u318D\uAC00-\uD7A3a-zA-Z0-9]/.test(para);
			const rowEl = document.createElement("div");
			rowEl.className = "reader-paragraph-row";

			const labelEl = document.createElement("div");
			labelEl.className = "reader-section-label";

			if (isValidSectionText) {
				const currentSec = sectionCounter++;
				labelEl.textContent = (currentSec === 1) ? `${currentChapterNum}장 1` : `${currentSec}`;
			} else {
				labelEl.textContent = "";
			}

			const paragraphWrap = document.createElement("div");
			paragraphWrap.className = "paragraph-content";

			const pEl = document.createElement("p");
			pEl.className = "reader-paragraph";

			if (para.trim() === "") {
				pEl.innerHTML = "&nbsp;";
			} else {
				const paraSentences = window.NDS_TTS.TextProcessor.extractSentences(para);
				let isFirstSentence = true;

				paraSentences.forEach(sentence => {
					const span = document.createElement("span");
					span.className = "sentence";
					const currentIdx = sentenceGlobalIdx++;
					span.id = `s-${currentIdx}`;
					span.textContent = sentence + " ";
					span.onclick = () => this.jumpToSentence(currentIdx);

					pEl.appendChild(span);

					this.sentences.push({
						rawText: sentence,
						sectionTag: (isValidSectionText && isFirstSentence && labelEl.textContent) ? labelEl.textContent : ""
					});

					isFirstSentence = false;
				});
			}

			paragraphWrap.appendChild(pEl);
			rowEl.appendChild(labelEl);
			rowEl.appendChild(paragraphWrap);
			scrollArea.appendChild(rowEl);
		});

		contentArea.appendChild(scrollArea);
		this.updatePaginationIndicator();
		this.ttsController.stop();
		this.applySentenceHighlight(this.currentSentenceIndex);
	}

	updatePaginationIndicator() {
		const indicator = document.getElementById("page-indicator");
		if (!indicator) return;
		indicator.textContent = `${this.currentPageIndex + 1} / ${this.pages.length} 장`;
	}

	applySentenceHighlight(index) {
		if (index >= this.sentences.length) {
			index = Math.max(0, this.sentences.length - 1);
			this.currentSentenceIndex = index;
		}

		document.querySelectorAll(".sentence.active").forEach(el => el.classList.remove("active"));
		document.querySelectorAll(".reader-paragraph-row.active-row").forEach(el => el.classList.remove("active-row"));

		const activeSpan = document.getElementById(`s-${index}`);
		if (activeSpan) {
			activeSpan.classList.add("active");

			const parentRow = activeSpan.closest(".reader-paragraph-row");
			if (parentRow) {
				parentRow.classList.add("active-row");
			}

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

		const sentenceObj = this.sentences[this.currentSentenceIndex];
		const rawText = typeof sentenceObj === "object" ? sentenceObj.rawText : sentenceObj;
		let textToSpeak = window.NDS_TTS.TextProcessor.filterText(rawText, this.excludeHanja, this.excludeEnglish);

		if (!this.excludeSectionNum && typeof sentenceObj === "object" && sentenceObj.sectionTag) {
			const isParagraphStart = (this.currentSentenceIndex === 0) ||
				(typeof this.sentences[this.currentSentenceIndex - 1] === "object" &&
					this.sentences[this.currentSentenceIndex - 1].sectionTag !== sentenceObj.sectionTag);
			if (isParagraphStart) {
				textToSpeak = `${sentenceObj.sectionTag}. ${textToSpeak}`;
			}
		}

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

	pauseSpeech() {
		this.ttsController.isPlaying = false;
		this.ttsController.pause();
		this.releaseWakeLock();
		this.updatePlayerStateUI('pause');
	}

	stopSpeech() {
		this.ttsController.isPlaying = false;
		this.ttsController.stop();
		this.releaseWakeLock();
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
		const savedVoice = localStorage.getItem("voice") || "";

		const koreanVoices = voices.filter(v => v.lang.toLowerCase().includes("ko"));
		const otherVoices = voices.filter(v => !v.lang.toLowerCase().includes("ko"));
		const sortedVoices = [...koreanVoices, ...otherVoices];

		sortedVoices.forEach(voice => {
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

	importLibraryFromFile(e) {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = async (evt) => {
			try {
				const jsonContent = JSON.parse(evt.target.result);
				let booksToImport = Array.isArray(jsonContent) ? jsonContent : (jsonContent.data || []);
				await this.dbManager.importBooks(booksToImport);
				this.loadBookShelf();
				if (booksToImport.length > 0) {
					const firstBook = booksToImport.find(b => b.type === "book" || !b.type);
					if (firstBook) this.loadBookToViewer(firstBook);
				}
			} catch (error) {
				alert("책장 파일을 불러오는 중 오류가 발생했습니다.");
			} finally {
				e.target.value = "";
			}
		};
		reader.readAsText(file);
	}

	async loadBookShelf() {
		const listEl = document.getElementById("book-list-element");
		if (!listEl) return;
		listEl.innerHTML = "";

		const allItems = await this.dbManager.getAllBooks();
		const seriesItems = allItems.filter(i => i.type === "series");
		const booksList = allItems.filter(i => i.type === "book" || !i.type);

		const independentBooks = booksList.filter(b => !b.parentSeriesId);
		const nestedBooks = booksList.filter(b => b.parentSeriesId);

		// 시리즈 렌더링
		seriesItems.forEach(series => {
			const seriesWrap = document.createElement("div");
			seriesWrap.className = "series-item";
			const isExpanded = this.expandedSeries.has(series.id);
			const seriesChildren = nestedBooks.filter(b => b.parentSeriesId === series.id);

			const header = document.createElement("div");
			header.className = "series-header";
			header.innerHTML = `
				<span class="series-caret" style="transform: ${isExpanded ? 'rotate(90deg)' : 'none'};"><i class="bi-chevron-right"></i></span>
				<div class="book-cover-mini"><i class="bi-folder" style="font-size: 16px;"></i></div>
				<div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-left: 4px;">
					<div style="font-size:14px; font-weight:bold;">${series.title}</div>
					<div style="font-size:11px; color:gray;">시리즈 (${seriesChildren.length}권)</div>
				</div>
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

			const deleteBtn = header.querySelector(".btn-delete-book");
			deleteBtn.onclick = async (e) => {
				e.stopPropagation();
				if (confirm(`'${series.title}' 시리즈와 수록된 도서를 모두 삭제하시겠습니까?`)) {
					this.ttsController.stop();
					for (const child of seriesChildren) {
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

				seriesChildren.forEach(child => {
					const childItem = document.createElement("div");
					childItem.className = "series-child-item";
					if (this.currentBook && this.currentBook.id === child.id) {
						childItem.classList.add("active-book");
					}

					childItem.innerHTML = `
						<div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
							<div style="font-weight:bold; font-size: 13px;">${child.title}</div>
							<div style="font-size:11px; color:gray;">${child.lastChunkIndex ? child.lastChunkIndex + 1 : 1}장 진행중</div>
						</div>
						<button class="btn-delete-book">&times;</button>
					`;

					childItem.onclick = () => this.loadBookToViewer(child);

					const delChildBtn = childItem.querySelector(".btn-delete-book");
					delChildBtn.onclick = async (e) => {
						e.stopPropagation();
						if (confirm(`'${child.title}' 도서를 삭제하시겠습니까?`)) {
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
				seriesWrap.appendChild(childrenContainer);
			}

			listEl.appendChild(seriesWrap);
		});

		// 단독 도서 렌더링
		independentBooks.forEach(book => {
			const item = document.createElement("div");
			item.className = "book-item";
			if (this.currentBook && this.currentBook.id === book.id) {
				item.classList.add("active-book");
			}

			item.innerHTML = `
				<div class="book-cover-mini"><i class="bi-file-text" style="font-size: 16px;"></i></div>
				<div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-left: 4px;">
					<div style="font-size:14px; font-weight:bold; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${book.title}</div>
					<div style="font-size:11px; color:gray;">${book.lastChunkIndex ? book.lastChunkIndex + 1 : 1}장 진행중</div>
				</div>
				<button class="btn-delete-book">&times;</button>
			`;

			item.onclick = () => this.loadBookToViewer(book);

			const deleteBtn = item.querySelector(".btn-delete-book");
			deleteBtn.onclick = async (e) => {
				e.stopPropagation();
				if (confirm(`'${book.title}' 도서를 삭제하시겠습니까?`)) {
					if (this.currentBook && this.currentBook.id === book.id) {
						this.resetViewer();
					}
					await this.dbManager.deleteBook(book.id);
					this.loadBookShelf();
				}
			};

			listEl.appendChild(item);
		});
	}

	resetViewer() {
		this.ttsController.stop();
		this.currentBook = null;
		this.pages = [];
		this.currentPageIndex = 0;
		this.currentSentenceIndex = 0;
		this.sentences = [];

		document.body.classList.remove("view-reader");

		const contentArea = document.getElementById("reader-content");
		contentArea.innerHTML = `
			<div class="reader-scroll-area">
				<p class="empty-message"><i class="bi-book"></i> &nbsp;NDS TTS 모바일 &nbsp;<i class="bi-book"></i> <br>
					<img src='NDS_TEXT_to_Speech.nds' class='empty-guide-img' border='0'><br>책장이 비어있습니다.
				</p>
			</div>
		`;
		document.getElementById("page-indicator").textContent = "0 / 0";
		this.updatePlayerStateUI('stop');
	}

	jumpToSentence(index) {
		const wasPlaying = this.ttsController.isPlaying;
		this.ttsController.stop();
		this.currentSentenceIndex = index;
		this.applySentenceHighlight(index);
		this.saveState();
		if (wasPlaying) this.playSpeech();
	}

	changePage(direction, autoPlayAfter = false) {
		const targetPageIndex = this.currentPageIndex + direction;
		if (targetPageIndex >= 0 && targetPageIndex < this.pages.length) {
			this.currentPageIndex = targetPageIndex;
			this.currentSentenceIndex = 0;
			this.saveState();
			this.renderViewer();

			if (autoPlayAfter) this.playSpeech();
		} else if (targetPageIndex >= this.pages.length) {
			const isSeriesAutoplay = document.getElementById("chk-series-autoplay").checked;
			if (isSeriesAutoplay && this.currentBook && this.currentBook.parentSeriesId) {
				this.playNextBookInSeries();
			} else {
				this.stopSpeech();
				alert("마지막 장입니다.");
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
			alert("시리즈의 마지막 회차입니다.");
		}
	}

	reRenderOnFilterChange() {
		if (this.currentBook) {
			this.renderViewer();
		}
	}

	async clearLibraryAction() {
		if (confirm("책장의 모든 도서와 시리즈를 완전히 비우시겠습니까?")) {
			this.ttsController.stop();
			await this.dbManager.clearAll();
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
/* === m_NDS_App.js 끝 === */