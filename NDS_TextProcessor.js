// NDS_TextProcessor.js
window.NDS_TTS = window.NDS_TTS || {};

window.NDS_TTS.TextProcessor = class TextProcessor {
    static readImageAsDataURL(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        });
    }

    static decodeText(arrayBuffer) {
        try {
            const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
            return utf8Decoder.decode(arrayBuffer);
        } catch (e) {
            const euckrDecoder = new TextDecoder("euc-kr");
            return euckrDecoder.decode(arrayBuffer);
        }
    }

    static splitIntoPages(text, pageSize = 3000) {
        const paragraphs = text.split("\n");
        const pages = [];
        let currentPage = "";

        for (let para of paragraphs) {
            if ((currentPage.length + para.length) > pageSize) {
                pages.push(currentPage.trim());
                currentPage = "";
            }
            currentPage += para + "\n";
        }
        if (currentPage.trim()) {
            pages.push(currentPage.trim());
        }
        return pages;
    }

    static filterText(text, excludeHanja, excludeEnglish) {
        let processed = text;

        if (excludeHanja) {
            processed = processed.replace(/\([\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\s]+\)/g, '');
            processed = processed.replace(/\[[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\s]+\]/g, '');
            processed = processed.replace(/[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/g, '');
        }

        if (excludeEnglish) {
            processed = processed.replace(/[a-zA-Z]+/g, '');
        }

        processed = processed.replace(/ +/g, ' ');
        return processed;
    }

    static extractSentences(text) {
        return text.split(/(?<=[.!?])\s+/).filter(s => s.trim() !== "");
    }

    static async extractTextFromOdt(arrayBuffer) {
        try {
            const zip = await JSZip.loadAsync(arrayBuffer);
            const contentXmlFile = zip.file("content.xml");
            if (!contentXmlFile) {
                throw new Error("content.xml 파일을 찾을 수 없습니다.");
            }
            const contentXmlText = await contentXmlFile.async("string");

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(contentXmlText, "text/xml");
            const elements = xmlDoc.querySelectorAll("text\\:p, text\\:h, p, h");
            const paragraphs = Array.from(elements).map(el => el.textContent);
            return paragraphs.join("\n");
        } catch (err) {
            throw new Error("ODT 문서 파싱 실패: " + err.message);
        }
    }

    static async extractTextFromHwpx(arrayBuffer) {
        try {
            const zip = await JSZip.loadAsync(arrayBuffer);
            const sectionFile = zip.file("Contents/section0.xml");
            if (!sectionFile) {
                throw new Error("Contents/section0.xml 구조를 찾을 수 없습니다.");
            }
            
            const xmlText = await sectionFile.async("string");
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");
            
            const pElements = xmlDoc.querySelectorAll("hp\\:p, p");
            const paragraphs = Array.from(pElements).map(el => {
                const tElements = el.querySelectorAll("hp\\:t, t");
                return Array.from(tElements).map(t => t.textContent).join("");
            });
            
            return paragraphs.join("\n");
        } catch (err) {
            throw new Error("HWPX 파싱 장애: " + err.message);
        }
    }

    // [신규 추가] PDF 본문 텍스트 비동기 추출 메서드 (pdf.js 연동)
    static async extractTextFromPdf(arrayBuffer) {
        try {
            // pdf.js 라이브러리 참조 바인딩 및 가상 워커 정의
            const pdfjsLib = window['pdfjs-dist/build/pdf'];
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            const maxPages = pdf.numPages;
            const pageTexts = [];

            // 전 페이지를 순회하며 줄단위 문자열 결합
            for (let i = 1; i <= maxPages; i++) {
                const page = await pdf.getPage(i);
                const tokenizedText = await page.getTextContent();
                const pageText = tokenizedText.items.map(token => token.str).join(" ");
                pageTexts.push(pageText);
            }

            // 페이지 간 문단 구분을 위해 개행 코드로 연결
            return pageTexts.join("\n\n");
        } catch (err) {
            throw new Error("PDF 분석 장애: " + err.message);
        }
    }
};