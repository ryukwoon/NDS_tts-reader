// NDS_i18n_ko.js - 한국어 번역 리소스 파일 (v2.31 마크다운 포맷팅 정정)
window.NDS_TTS = window.NDS_TTS || {};
window.NDS_TTS.i18nData = window.NDS_TTS.i18nData || {};

window.NDS_TTS.i18nData.ko = {
	brand: {
		title: "TEXT to Speech",
		sub: "NDS"
	},
	sidebar: {
		myLibrary: "내 책장",
		closeSidebar: "책장 닫기",
		openSidebar: "책장 열기",
		addBook: "도서 등록",
		addBookTt: "텍스트(.txt), 워드(.docx), ODT, HWPX, PDF 형식의 도서를 책장에 다중 등록합니다.",
		createSeries: "시리즈 생성",
		createSeriesTt: "새로운 도서 시리즈 폴더를 생성합니다.",
		saveLibrary: "책장 저장",
		saveLibraryTt: "현재 책장과 책갈피를 백업 파일로 내보냅니다.",
		loadLibrary: "책장 불러오기",
		loadLibraryTt: "백업해 둔 책장 파일을 가져옵니다.",
		clearLibrary: "책장 전체 비우기",
		clearLibraryTt: "책장의 모든 도서를 한꺼번에 삭제합니다.",
		emptyLibrary: "책장이 비워졌습니다.\n소설 파일을 등록하거나 선택해주세요.",
		noSeriesItems: "수록된 회차가 없습니다.",
		deleteSeriesConfirm: "'{title}' 시리즈와 수록된 도서 회차들이 한꺼번에 삭제됩니다. 계속하시겠습니까?",
		deleteBookConfirm: "'{title}' 회차를 완전히 삭제하시겠습니까?",
		clearAllConfirm: "⚠️ 경고: 책장의 모든 소설과 시리즈를 한꺼번에 비우시겠습니까?\n이 작업은 복원할 수 없으며, 저장되지 않은 본문 데이터는 유실됩니다.",
		promptSeriesName: "생성할 시리즈(폴더)의 이름을 입력해 주세요:",
		promptBackupName: "내보낼 백업 파일의 이름을 입력해 주세요:"
	},
	settings: {
		title: "환경설정",
		fontGroup: "폰트",
		fontFamily: "폰트설정",
		fontSystem: "시스템 기본",
		fontMalgun: "맑은 고딕",
		fontNanumGothic: "나눔고딕",
		fontNanumMyeongjo: "나눔명조",
		fontBatang: "바탕체",
		fontDotum: "돋움체",
		fontGungsuh: "궁서체",
		fontGulim: "굴림체",
		fontCustom: "직접 입력...",
		fontSize: "글자크기",
		fontSizeSmall: "작게",
		fontSizeNormal: "보통",
		fontSizeLarge: "크게",
		fontSizeXLarge: "아주크게",
		lineHeight: "줄간격",
		lh10: "1.0 배",
		lh12: "1.2 배",
		lh15: "1.5 배 (보통)",
		lh20: "2.0 배",
		lh25: "2.5 배",
		customFontPlaceholder: "서체명(예: 나눔명조) 입력",
		excludeHanja: "한자 제외",
		excludeEnglish: "영문 제외",
		excludeSectionNum: "절 번호 음성 제외",
		eqGroup: "이퀄라이저",
		eqBgColor: "배경색",
		eqSpectrumColor: "스펙트럼색",
		eqThickness: "스펙트럼 두께",
		eqSpeed: "스펙트럼 속도",
		themeGroup: "테마 선택",
		themeAddGroup: "테마추가",
		themeName: "테마이름",
		appBgColor: "바탕색",
		sidebarBgColor: "좌측 사이드바",
		cardBgColor: "본문 카드색",
		borderColor: "카드 라인색",
		paragraphColor: "문단 강조색",
		textColor: "글자색",
		registerTheme: "등록",
		deleteTheme: "삭제",
		deleteThemeConfirm: "'{name}' 테마를 정말 삭제하시겠습니까?",
		deleteThemeDone: "테마가 삭제되었습니다.",
		themeRegisteredAlert: "🎨 커스텀 테마가 성공적으로 등록되었습니다!",
		themeWhite: "화이트",
		themeDark: "다크",
		themeGrey: "그레이",
		themeJade: "옥색",
		themeUserPrefix: "[사용자] ",
		langGroup: "언어",
		langKo: "한국어",
		langEn: "English",
		voiceGroup: "목소리 선택",
		voiceBrowserInfo: "(브라우저 별)",
		wallpaperGroup: "바탕화면 이미지",
		selectWallpaper: "이미지 선택",
		removeWallpaper: "제거",
		wallpaperOpacity: "투명도",
		wallpaperUnset: "미설정",
		wallpaperSet: "🖼️ 배경 이미지 적용됨",
		
		bgmGroup: "🎵 MP3 배경음악 설정",
		bgmAdd: "음악 추가",
		bgmClearAll: "모두비우기",
		bgmVolume: "배경음악 볼륨 (기본 20%)",
		bgmNoTrack: "등록된 배경음악 없음",
		bgmPlayingPrefix: "▶ 재생 중: ",
		bgmPausedPrefix: "⏸️ 일시정지: ",
		bgmPromptClearAll: "배경음악 플레이리스트를 전체 비우시겠습니까?",
		bgmPromptNoTracks: "등록된 MP3 음악이 없습니다. 설정창에서 음악을 추가해 주세요.",
		bgmSettingsTt: "MP3 배경음악 설정",
		bgmToggleTt: "배경음악 재생/일시정지",
		bgmShuffleTt: "랜덤 플레이",
		bgmRepeatTt: "전체 반복"
	},
	player: {
		play: "재생하기",
		playing: "재생중",
		pause: "일시정지",
		stop: "정 지",
		seriesAutoplay: "시리즈 연속재생",
		voiceSelect: "목소리 선택",
		speed: "속도",
		volume: "볼륨",
		addBookmark: "북마크 추가",
		bookmarkList: "📖 북마크 목록",
		prevPage: "이전 장",
		nextPage: "다음 장",
		pageUnit: "장",
		chapterSectionFormat: "{chapter}장 {section}절",
		sectionFormat: "{section}절",
		emptyViewerMessage: "책장에서 소설을 선택하세요.",
		lastPageAlert: "도서의 마지막 장입니다.",
		lastSeriesAlert: "시리즈 폴더 내 마지막 권의 마지막 장입니다.",
		record: "녹 음",
		recording: "녹음중",
		recordStartAlert: "🔴 음성 녹음이 시작되었습니다. 재생이 끝나면 MP3 파일로 저장됩니다.",
		recordDoneAlert: "💾 음성 녹음 파일이 MP3로 추출되어 저장되었습니다.",
		recordNoAudioAlert: "오디오 공유가 포함되지 않았습니다. 팝업창에서 '오디오 공유'를 체크해 주세요."
	},
	footer: {
		themeChange: "테마변경",
		themeChangeTt: "미리 정의된 테마를 빠르게 변경합니다.",
		settings: "설정",
		settingsTt: "상세 설정 서랍을 열거나 닫습니다.",
		help: "도움말",
		helpTt: "사용 방법 및 버전 정보를 확인합니다.",
		developer: "개발자",
		developerTt: "개발자 정보 및 저장소를 방문합니다."
	},
	modal: {
		helpTitle: "도움말 & 프로그램 정보",
		devTitle: "개발자 정보",
		close: "닫기",
		helpBody: `
			<div style="display:flex; flex-direction:column; gap:10px;">
				<p><b>1. 스마트 도서 등록 & 표지 자동 매칭</b><br>TXT, DOCX, ODT, HWPX, PDF 문서를 등록할 수 있습니다. 문서 파일과 동일한 이름의 이미지(JPG, PNG 등)를 함께 선택하면 표지가 자동으로 설정됩니다.</p>
				<p><b>2. 시리즈 생성 & 연속 재생</b><br>[시리즈 생성]으로 폴더를 만들고 회차(+)를 등록하세요. '시리즈 연속재생' 체크 시 현재 권 완료 후 다음 권을 자동으로 이어 읽어줍니다.</p>
				<p><b>3. 문장 직접 클릭 & 북마크</b><br>본문의 원하는 문장을 클릭하면 해당 위치부터 즉시 읽기 시작합니다. [북마크 추가]로 현재 위치를 저장하고 목록에서 빠르게 이동하세요.</p>
				<p><b>4. 커스텀 테마 생성 및 삭제</b><br>[설정]에서 본인만의 배경/글자 색상 테마를 등록할 수 있으며, 삭제(×) 버튼으로 자유롭게 관리할 수 있습니다.</p>
				<p><b>5. 이퀄라이저 & 텍스트 필터</b><br>음성 비주얼라이저의 색상, 두께, 속도를 조절할 수 있고, 한자/영문 제외 필터링과 서체/줄간격 맞춤 설정이 가능합니다.</p>
				<p><b>6. 책장 백업 & 복원</b><br>[책장 저장]으로 내 도서 목록과 북마크를 JSON 백업 파일로 추출하고, [책장 불러오기]로 다른 환경에서 그대로 복원할 수 있습니다.</p>
				<p><b>7. 🎯 실시간 음성 녹음 & MP3 추출</b><br>
				- 플레이어 제어판에서 🔴 <b>[녹 음]</b> 버튼을 누릅니다.<br>
				- 브라우저 팝업창이 뜰 때, 하단의 <b>[오디오 공유]</b> 체크박스를 체크한 후 탭을 선택하고 [공유]를 누릅니다.<br>
				- 소설 읽기를 들으면서 일시정지/재생을 수행하면 녹음도 완벽히 동기화되어 일시정지/재개됩니다.<br>
				- 읽기가 완료되거나 🔴 <b>[녹음중]</b> 버튼을 다시 누르면 <b>[소설제목]_[페이지장].mp3</b> 형태의 MP3 파일이 즉시 다운로드됩니다!</p>
				<hr style="border:none; border-top:1px dashed var(--border-color); margin:5px 0;">
				<div style="background-color:rgba(128,128,128,0.08); padding:8px; border-radius:6px; font-size:11px; line-height:1.4;">
					<span style="font-weight:bold; color:#3b82f6;">NDS TEXT to Speech Reader</span><br>
					<span>현재 버전: {version} (MP3 배경음악 연동 탑재판)</span><br>
					<span style="color:gray;">© 2026 RyuKwoon. All rights reserved.</span>
				</div>
			</div>
		`,
		devBody: `
			<p style="font-weight:bold; color:#3b82f6; margin-bottom:5px;">NDS TEXT to SPEECH Reader</p>
			<p style="margin-bottom:10px;">버전: {version} Global OpenSource Edition</p>
			<p style="line-height:1.5;">본 도구는 웹 표준 브라우저 기술 기반의 순수 클라이언트 단독 실행 소설 리더입니다. 개인의 독서 데이터는 외부 서버로 전송되지 않으며 안전하게 로컬 저장소에 보존됩니다.</p>
		`
	}
};