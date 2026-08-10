// NDS_i18n_en.js - 영어 번역 리소스 파일 (v1.7)
window.NDS_TTS = window.NDS_TTS || {};
window.NDS_TTS.i18nData = window.NDS_TTS.i18nData || {};

window.NDS_TTS.i18nData.en = {
	brand: {
		title: "TEXT to Speech",
		sub: "NDS"
	},
	sidebar: {
		myLibrary: "My Bookshelf",
		closeSidebar: "Close Bookshelf",
		openSidebar: "Open Bookshelf",
		addBook: "Add Books",
		addBookTt: "Import multiple files (.txt, .docx, .odt, .hwpx, .pdf) to your bookshelf.",
		createSeries: "Create Series",
		createSeriesTt: "Create a new series folder.",
		saveLibrary: "Backup Bookshelf",
		saveLibraryTt: "Export current bookshelf and bookmarks to a backup file.",
		loadLibrary: "Restore Bookshelf",
		loadLibraryTt: "Import a saved bookshelf backup file.",
		clearLibrary: "Clear All Books",
		clearLibraryTt: "Remove all books and series from bookshelf.",
		emptyLibrary: "The bookshelf is empty.\nPlease register or select a novel file.",
		noSeriesItems: "No books in this series.",
		deleteSeriesConfirm: "Are you sure you want to delete the series '{title}' and all its books?",
		deleteBookConfirm: "Are you sure you want to delete '{title}'?",
		clearAllConfirm: "⚠️ Warning: Are you sure you want to clear all books and series?\nThis action cannot be undone.",
		promptSeriesName: "Enter the name of the new series (folder):",
		promptBackupName: "Enter the filename for the backup:"
	},
	settings: {
		title: "Settings",
		fontGroup: "Font",
		fontFamily: "Font Style",
		fontSystem: "System Default",
		fontMalgun: "Malgun Gothic",
		fontNanumGothic: "Nanum Gothic",
		fontNanumMyeongjo: "Nanum Myeongjo",
		fontBatang: "Batang",
		fontDotum: "Dotum",
		fontGungsuh: "Gungsuh",
		fontGulim: "Gulim",
		fontCustom: "Custom...",
		fontSize: "Font Size",
		fontSizeSmall: "Small",
		fontSizeNormal: "Normal",
		fontSizeLarge: "Large",
		fontSizeXLarge: "Extra Large",
		lineHeight: "Line Height",
		lh10: "1.0x",
		lh12: "1.2x",
		lh15: "1.5x (Normal)",
		lh20: "2.0x",
		lh25: "2.5x",
		customFontPlaceholder: "Enter font name (e.g. Arial)",
		excludeHanja: "Exclude Hanja",
		excludeEnglish: "Exclude English",
		eqGroup: "Equalizer",
		eqBgColor: "BG Color",
		eqSpectrumColor: "Spectrum Color",
		eqThickness: "Bar Thickness",
		eqSpeed: "Shift Speed",
		themeGroup: "Select Theme",
		themeAddGroup: "Add Theme",
		themeName: "Theme Name",
		appBgColor: "App Background",
		sidebarBgColor: "Sidebar Background",
		cardBgColor: "Card Background",
		paragraphColor: "Paragraph Color",
		textColor: "Text Color",
		registerTheme: "Save",
		deleteTheme: "Delete",
		deleteThemeConfirm: "Are you sure you want to delete the '{name}' theme?",
		deleteThemeDone: "Theme has been deleted.",
		themeRegisteredAlert: "🎨 Custom theme registered successfully!",
		themeWhite: "White",
		themeDark: "Dark",
		themeGrey: "Grey",
		themeJade: "Jade",
		themeUserPrefix: "[User] ",
		langGroup: "Language",
		langKo: "한국어 (Korean)",
		langEn: "English",
		voiceGroup: "Voice Selection",
		voiceBrowserInfo: "(Browser Voices)",
		wallpaperGroup: "Wallpaper Image",
		selectWallpaper: "Select Image",
		removeWallpaper: "Remove",
		wallpaperOpacity: "Opacity",
		wallpaperUnset: "None",
		wallpaperSet: "🖼️ Wallpaper Applied"
	},
	player: {
		play: "Play",
		playing: "Playing",
		pause: "Pause",
		stop: "Stop",
		seriesAutoplay: "Autoplay Series",
		voiceSelect: "Voice",
		speed: "Speed",
		volume: "Volume",
		addBookmark: "Add Bookmark",
		bookmarkList: "📖 Bookmarks",
		prevPage: "Prev Page",
		nextPage: "Next Page",
		pageUnit: "Page",
		emptyViewerMessage: "Select a novel from the bookshelf.",
		lastPageAlert: "This is the last page of the book.",
		lastSeriesAlert: "Reached the end of the last book in this series.",
		record: "Record",
		recording: "Recording",
		recordStartAlert: "🔴 Recording started. Audio will be saved as MP3 when finished.",
		recordDoneAlert: "💾 Audio recording saved as MP3.",
		recordNoAudioAlert: "No audio stream included. Please check 'Share Audio' in the browser popup."
	},
	footer: {
		themeChange: "Theme",
		themeChangeTt: "Quickly switch preset themes.",
		settings: "Settings",
		settingsTt: "Open or close settings drawer.",
		help: "Help",
		helpTt: "View instructions and version details.",
		developer: "Developer",
		developerTt: "Visit developer information and repository."
	},
	modal: {
		helpTitle: "Help & Program Info",
		devTitle: "Developer Info",
		close: "Close",
		helpBody: `
			<div style="display:flex; flex-direction:column; gap:10px;">
				<p><b>1. Smart Import & Cover Matching</b><br>Supports TXT, DOCX, ODT, HWPX, and PDF. Selecting an image (JPG, PNG) with the same filename as your document automatically sets it as the book cover.</p>
				<p><b>2. Series Creation & Autoplay</b><br>Create series folders and add volumes (+). Enable 'Autoplay Series' to seamlessly listen through consecutive volumes.</p>
				<p><b>3. Sentence Jump & Bookmarks</b><br>Click any sentence in the text to immediately jump playback to that position. Use [Add Bookmark] to save your current page and sentence position.</p>
				<p><b>4. Custom Themes & Management</b><br>Build custom color themes (background, card, text) in Settings and delete them anytime using the (×) button.</p>
				<p><b>5. Equalizer & Text Filtering</b><br>Customize visualizer colors, bar thickness, and shift speed. Exclude Hanja or English characters and tune fonts & line spacing.</p>
				<p><b>6. Bookshelf Backup & Restore</b><br>Export your library and bookmarks to a JSON file via [Backup Bookshelf] and restore it anytime using [Restore Bookshelf].</p>
				<p><b>7. 🎯 Audio Recording & MP3 Export</b><br>
				- Click the 🔴 <b>[Record]</b> button on the player controls.<br>
				- In the browser popup, check <b>[Share Audio]</b>, select the tab, and click [Share].<br>
				- Pausing/resuming playback automatically syncs recording.<br>
				- When reading finishes or when clicking 🔴 <b>[Recording]</b> again, an MP3 file named <b>[Title]_[Page].mp3</b> is downloaded instantly!</p>
				<hr style="border:none; border-top:1px dashed var(--border-color); margin:5px 0;">
				<div style="background-color:rgba(128,128,128,0.08); padding:8px; border-radius:6px; font-size:11px; line-height:1.4;">
					<span style="font-weight:bold; color:#3b82f6;">NDS TEXT to Speech Reader</span><br>
					<span>Version: {version} (Audio Recording & MP3 Export Edition)</span><br>
					<span style="color:gray;">© 2026 RyuKwoon. All rights reserved.</span>
				</div>
			</div>
		`,
		devBody: `
			<p style="font-weight:bold; color:#3b82f6; margin-bottom:5px;">NDS TEXT to SPEECH Reader</p>
			<p style="margin-bottom:10px;">Version: {version} Global OpenSource Edition</p>
			<p style="line-height:1.5;">This application is a local-first web reader. All book data and reading progress remain strictly in your browser local storage.</p>
		`
	}
};