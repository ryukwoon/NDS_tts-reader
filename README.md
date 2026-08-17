# 📖 NDS TTS Text Reader v2.0.1

**A Web Standard-Based, Standalone Client-Side e-Book & Real-Time TTS (Text-to-Speech) Reader**  
An offline-optimized web application that allows you to load, visually read, listen to, and instantly extract audio to MP3 files from various novel documents in your local environment without any server installation.

---

## 🌟 Project Overview

**NDS TTS Text Reader** is a *Local-First* web reader designed so that personal reading data is never transmitted to external servers.  
It supports multiple document formats (`.txt`, `.docx`, `.odt`, `.hwpx`, `.pdf`), providing advanced voice controls, verse/paragraph numbering (Chapter/Verse), real-time MP3 audio recording, custom wallpaper backgrounds, and a canvas visualizer equalizer.

---

## ✨ Key Features

### 1. 📚 Smart Book & Series Management
- **Multi-Format Parsing:** Multi-registration support for TXT, Word (`.docx`), OpenDocument (`.odt`), Hangul (`.hwpx`), and PDF formats.
- **Auto Cover Matching:** Uploading an image file (JPG, PNG, WEBP, etc.) with the same name as the document automatically assigns it as the cover art. You can also click on the cover to change it at any time.
- **Series Folder Setup:** Create series structures to organize episodes/chapters and enable continuous playback across consecutive volumes when reaching the end of a book.
- **Backup & Restore:** Safely export and import entire bookshelves and bookmark data as JSON files.

### 2. 🎧 Web Standard Web Speech API-Based TTS Player
- **Precision Speech Control:** Supports Play, Pause, Stop, Speed adjustment (0.5x to 2.0x), and Volume control.
- **Real-Time Highlighting & Click-to-Jump:** The active sentence being spoken auto-scrolls to the center of the screen with visual emphasis. Clicking any sentence in the body text instantly starts playback from that location.
- **Bookmarks:** Record page, sentence, and timestamp progress to return with a single click from the bookmark list.

### 3. 🔴 Real-Time Audio Recording & MP3 Extraction (`NDS_Recorder.js`)
- **Audio Recording & Sync:** Capture tab audio in real time while the TTS engine reads the novel.
- **Seamless Pause Integration:** Pausing your reading automatically pauses the audio capture, gathering continuous narration without empty silence.
- **Instant MP3 Download:** Upon completion or stopping, the audio is exported as an MP3 file formatted as `[Novel_Title]_[Page_Number].mp3`.

### 4. 📐 Chapter/Verse Structure & Native Text Preservation
- **Chapter/Verse Layout:** A right-aligned margin on the left side splits paragraphs clearly by page (e.g., Chapter 1 Verse 1, Verse 2, Verse 3...).
- **Special Character / Whitespace Filter:** Decorative symbols (`***`, `---`) or whitespace-only lines are automatically excluded from the verse numbering counter.
- **Native Text Preservation & Selective Speech Filtering:**
  - Original Hanja (Chinese characters) annotations and English text remain intact and crisp in the visual viewer.
  - Hanja, English text, and verse numbers can be selectively omitted during TTS speech playback to ensure natural Korean narration.

### 5. 🎨 Themes, Wallpapers & Canvas Equalizer
- **Customizable Themes:** Includes default themes (White, Dark, Gray, Jade) and options to create/delete (`×`) user-defined themes.
- **Wallpaper Backgrounds:** Layer paper textures or custom photos onto the background with adjustable **opacity (10% to 100%)**, featuring automated image compression for smooth performance.
- **Real-Time Canvas Equalizer:** A compact 90px horizontal spectrum box animates 30 frequency bars with a wave effect synchronized to the active TTS speech state.

### 6. 🌐 Dynamic Internationalization (i18n) System
- **Korean/English & Extensible Architecture:** Employs a module script injection method to prevent CORS security errors when running directly from local files (`file://`).
- **Smart Fallback System:** If an unsupported language is selected, a fallback pop-up is displayed in English, safely reverting to the previously selected language.
- **Centralized Version Control:** Updating the version string once in `NDS_App.js` automatically syncs version information across help dialogs and the overall application.

---

## 📂 File & Directory Structure

```text
NDS_tts-reader/
├── index.html                  # Main application HTML UI structure
├── style.css                   # Dynamic theme variables, layout, and animation styles
├── DynamicRGB_NDS.css          # Brand logo & rainbow visual effect CSS
├── favicon.ico                 # Favicon icon
│
├── NDS_Namespace.js            # Global NDS_TTS namespace definition
├── NDS_I18nManager.js          # Dynamic script injection i18n manager (CORS prevention)
├── NDS_HelpManager.js          # Help manager with automatic version parameter injection
├── NDS_Recorder.js             # Real-time audio recording & MP3 extraction module
├── NDS_DBManager.js            # IndexedDB database CRUD manager
├── NDS_TextProcessor.js        # Multi-format parsing (TXT, DOCX, ODT, HWPX, PDF) & pre-processor
├── NDS_TTSController.js        # Web Speech API controller (Includes Chrome speech stall workaround)
├── NDS_ThemeManager.js         # Theme settings & wallpaper background manager
├── NDS_App.js                  # Main event controller & viewer rendering engine (v2.1)
│
└── language/                   # Multilingual translation resources
    ├── NDS_i18n_ko.js          # Korean translation resource file
    └── NDS_i18n_en.js          # English translation resource file
```

## 🚀 Quick Start & Usage

### 1. How to Run
- **Direct Local Execution:** Double-click `index.html` to open directly in modern browsers such as Chrome or Edge.
- **Web Server Execution:** Run via VS Code's Live Server or a local Node.js / Python server (`http://localhost:5500`).

### 2. Audio Recording (MP3 Extraction)
1. Click the **🔴 [Record]** button on the top control panel.
2. When the browser screen sharing prompt appears:
   - Select the **[Chrome Tab]** (or **[Edge Tab]**) option.
   - Select the current reader tab, ensure **Share tab audio** in the bottom corner is enabled, and click **[Share]**.
3. Pressing **[Pause]** or **[Play]** while listening will automatically pause or resume the active audio recording.
4. When reading completes or the **🔴 [Recording]** button is pressed again, the `[Novel_Title]_[Page_Number].mp3` file will automatically download to your computer.  
*(※ After the initial permission grant per session, recording starts instantly without pop-up prompts until the page is refreshed.)*

---

## 🛠 Tech Stack & Dependencies

- **Core:** HTML5, CSS3 (CSS Variables, Flexbox, Grid, Pseudo-elements), Vanilla JavaScript (ES6+ Classes)
- **Web APIs:**
  - **Web Speech API (`speechSynthesis`):** TTS voice synthesis engine
  - **MediaRecorder API & `getDisplayMedia`:** Real-time audio capture & MP3 export
  - **Canvas 2D API:** 30-bar dynamic equalizer visualizer
  - **IndexedDB:** Local storage for novel texts, thumbnails, and reading progress
  - **LocalStorage:** User preferences, themes, and wallpaper settings
- **External CDN Libraries:**
  - **JSZip (v3.10.1):** ZIP archive extraction and data backup handling
  - **Mammoth.js (v1.8.0):** Microsoft Word (`.docx`) text parsing
  - **PDF.js (v3.11.174):** PDF document text parsing
  - **Bootstrap Icons:** UI vector icon set

---

## 📜 Version & Developer Information

- **Current Version:** v2.1 (Integrated Chapter/Verse System, i18n, & Audio Recording)
- **Developer:** RyuKwoon
- **Repository:** GitHub Repository
- **License:** Global OpenSource Edition

© 2026 RyuKwoon. 
This software is a standalone client-side open-source reading tool.
