# 📖 NDS TTS Text Reader

| 📱 Mobile Version | 🖥️ PC Version | 💖 Sponsor & Support |
| :---: | :---: | :---: |
| [**Go to Mobile Guide**](#-1-mobile-version-v35-overview) | [**Go to PC Guide**](#-2-pc-version-v30-full-feature-specifications) | [**Support Project**](#-3-sponsor--developer-info) |

---

## 📱 1. Mobile Version (v3.5) Overview

### 📱 1. Complete Mobile-Centric UI/UX Redesign
- **Top 3-Button Grid:** Redesigned into a touch-friendly top grid featuring three primary buttons: `[ 📂 Bookshelf ]` (JSON Import), `[ 📄 TXT File ]` (Direct Load), and `[ 🗑️ Clear All ]`.
- **Bottom 3-Bar Footer Control:** Realigned the bottom footer toolbar to prioritize core actions: `[ Theme ]`, `[ Settings ]`, and `[ 📖 Reader View ]`.

### ⚡ 2. Streamlined Architecture & Ultra-Lightweight Optimization (Battery/Memory Saving)
- **Playback-Focused Engine:** Resource-heavy features—such as the BGM player, real-time canvas equalizer, audio recorder, bookmarks, and custom font editor—have been removed in the mobile edition to minimize CPU heating and battery consumption.

### 📄 3. Direct TXT Document Loading Support
- **Encoding Auto-Detection:** Supports both EUC-KR and UTF-8 automatic decoding alongside standard JSON bookshelf files.
- **Multi-File Support & Instant Chunk Parsing:** Select and load multiple text files simultaneously. Long novels containing millions of characters are chunked and paginated in under 0.05 seconds for instant playback.

### 🛠️ 4. Mobile Browser Bug Fixes & Readability Improvements
- **Inline Line-Break Rendering Fix:** Applied `box-decoration-break: clone;` to fix line-break background highlighting defects on mobile WebKit/Blink engines.

### 📲 5. Progressive Web App (PWA) Support (Offline Standalone Execution)
- **Add to Home Screen Integration:** Detects browser installation events and automatically displays an `[ 📱 Add to Home Screen ]` button at the top of the sidebar.
- **100% Offline Caching (`service-worker.js`):** Removed all external CDN dependencies and cached core assets locally. The app runs completely offline in airplane mode or subways without internet connectivity.

### 🗂️ 6. PC vs. Mobile Independent Architecture
| Category | PC Desktop Edition | Mobile PWA Edition (v3.5) |
| :--- | :--- | :--- |
| **HTML** | `index.html` (Auto-detects mobile) | `index_m.html` |
| **Stylesheets** | `style.css` | `m_style.css` (Mobile-optimized flat UI) |
| **Controller** | `NDS_App.js` (Full version with BGM/Recorder/EQ) | `m_NDS_App.js` (Ultra-lightweight fast player) |
| **Cache Management** | — | `service-worker.js` (v3.5) |

---

## 🖥️ 2. PC Version (v3.0) Full Feature Specifications

### 📚 Smart Bookshelf & Series Management
- **Multi-Format Parsing:** Support for registering multiple formats at once, including TXT, Word (`.docx`), OpenDocument (`.odt`), Hangul (`.hwpx`), and PDF files.
- **Series Covers & Auto-Inheritance:** Click folder covers to manually assign custom cover art, or let underlying books automatically inherit series covers.
- **Series Folders & Continuous Playback:** Organize episodes into series folders and enable automatic continuous playback to the next volume upon reaching the end of a book.
- **Backup & Restore:** Safely export and restore all bookshelf data, current reading progress, and bookmarks stored in IndexedDB using single JSON files.

### 🎧 High-Performance Web Speech API-Based TTS Player
- **Precision Speech Control:** Complete control over Play, Pause, Stop, Speed adjustment (0.5x to 2.0x), and Volume.
- **Real-Time Highlighting & Click-to-Jump:** Auto-scrolls the active sentence to the screen center with visual emphasis. Clicking any sentence directly jumps TTS playback to that position.
- **Speech Freezing Prevention Engine:** Resolves Chrome/Edge speech stall bugs by automatically invoking `synth.resume()` right before speech and skipping problem sentences upon error detection.
- **Smart Voice Prioritization:** Automatically moves voice models matching the active UI language (Korean/English) to the top of the selection dropdown.
- **Bookmarks:** Saves current page, sentence index, and timestamp with one-click restoration from the bookmark list.

### 📐 Chapter & Section System
- **Right-Aligned Margin System (`text-align: right`):** Displays paragraph numbers (e.g., `Ch.1 Sec.1, Sec.2...`) in a dedicated 55px left margin area.
- **Symbol & Space Auto-Exclusion:** Decorative symbols (`***`, `---`) and empty lines are automatically excluded from section counting.
- **Multilingual Label Sync:** Numbering labels adapt dynamically when switching languages (Korean/English).
- **TTS Speech Exclusion Toggle:** Includes an "Exclude Section Numbers" checkbox (checked by default) in settings to show numbers visually while bypassing them during TTS playback.

### 🔤 Native Text Preservation & On-the-Fly TTS Filtering
- **100% Native Visual Preservation:** Visual reader displays original Hanja (Chinese characters) annotations, English text, and formatting crisply.
- **Real-Time Speech Filtering:** Applies regex filters at the exact moment of TTS output, omitting Hanja and foreign text to deliver clean, fluent Korean speech synthesis.

### 🔴 Real-Time Audio Recording & MP3 Extraction (`NDS_Recorder.js`)
- **Standalone Recorder Module:** Captures tab audio in real time and exports directly as `[Novel_Title]_[Page_Number].mp3`.
- **Seamless Pause Synchronization:** Pausing reading automatically pauses recording to create clean audio files without silent gaps.
- **AGC Spike Protection:** Prevents sudden volume spikes at recording startup through fine-tuned audio constraints.
- **Single Permission Persistence:** Remembers session authorization after the initial prompt, allowing instant continuous recording without repeated pop-ups until refreshed.

### 🎵 MP3 Background Music Player (`NDS_BgmPlayer.js`)
- **Dedicated BGM Engine:** Plays background music (`.mp3`) simultaneously while reading.
- **Low Default Volume (20%):** Pre-configured to a subtle 20% volume to avoid overpowering TTS narration.
- **Playback Modes:** Supports Sequential, Shuffle, and Repeat All modes.
- **Independent BGM Modal (`#bgm-modal`):** Full control window to add, delete, clear all (`× Clear All`), and manage track order.
- **IndexedDB Persistence:** Added MP3 files remain stored locally even after browser restarts.
- **Recording Synergy:** Enables exporting high-quality combined MP3 files containing both TTS narration and background music.

### 🎨 Themes, Wallpapers & Canvas Equalizer (`NDS_ThemeManager.js`)
- **Default Themes:** White, Dark, Gray, and Jade.
- **6 Custom Theme Slots:** Customize and delete (`×`) individual color schemes, including background, sidebar, card color, card borders, highlight color, and text color.
- **Wallpaper Backgrounds:** Layer paper textures or custom photos onto the background with adjustable opacity (10% to 100%).
- **Ultra-Slim Compression:** Automated Canvas compression (1280px / 60KB–100KB) guarantees zero lag.
- **Fixed Frame Structure:** CSS pseudo-elements (`::before`) keep wallpapers fixed during page scrolling while preserving 100% text clarity.
- **Slim Canvas Equalizer:** A compact 90px spectrum box animates 30 frequency bars in real time synchronized with active speech.

### ⚙️ Dynamic Internationalization (i18n) & Centralized Versioning (`I18nManager` & `HelpManager`)
- **Zero CORS Error Script Loader:** Asynchronously loads language files (`language/NDS_i18n_*.js`) only when needed, eliminating CORS security errors even when opening via direct `file://` local access.
- **Smart Fallback Mechanism:** Displays an English notice popup and safely reverts to the previously active language if an unsupported file is requested.
- **Independent Help Module (`NDS_HelpManager.js`):** Modular popup providing up-to-date documentation on core application features.

---

## 💖 3. Sponsor & Developer Info

Hi! I'm **RyuKwoon**, an open-source developer.  
Your sponsorship helps me keep my projects ad-free, open-source, and actively maintained. Thank you for your support! ☕

[![Sponsor me on GitHub](https://img.shields.io/badge/Sponsor-%F0%9F%92%96-brightgreen?style=for-the-badge)](https://github.com/sponsors/ryukwoon)

```text
© 2026 RyuKwoon. All rights reserved.
This software is a standalone client-side open-source reading tool.
