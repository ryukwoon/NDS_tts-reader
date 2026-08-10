// NDS_GoogleDriveManager.js
window.NDS_TTS = window.NDS_TTS || {};

window.NDS_TTS.GoogleDriveManager = class GoogleDriveManager {
    constructor() {
        this.clientId = localStorage.getItem("gdrive_client_id") || "";
        this.apiKey = localStorage.getItem("gdrive_api_key") || "";
        this.tokenClient = null;
        this.accessToken = null;
        this.onFileSelectedCallback = null;
    }

    saveKeys(clientId, apiKey) {
        this.clientId = clientId.trim();
        this.apiKey = apiKey.trim();
        localStorage.setItem("gdrive_client_id", this.clientId);
        localStorage.setItem("gdrive_api_key", this.apiKey);
    }

    openPicker(onFileSelectedCallback) {
        this.onFileSelectedCallback = onFileSelectedCallback;

        if (!this.clientId || !this.apiKey) {
            alert("⚙️ 우측 톱니바퀴 버튼을 눌러 본인의 구글 Client ID와 API Key를 먼저 설정해주세요.");
            return;
        }

        if (!this.accessToken) {
            this.requestAuthToken();
        } else {
            this.createPicker();
        }
    }

    requestAuthToken() {
        try {
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.clientId,
                scope: "https://www.googleapis.com/auth/drive.readonly",
                callback: (response) => {
                    if (response.error !== undefined) {
                        alert("구글 로그인 중 에러가 발생했습니다.");
                        return;
                    }
                    this.accessToken = response.access_token;
                    this.createPicker();
                },
            });
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
        } catch (error) {
            alert("구글 인증 라이브러리가 완전히 로드되지 않았습니다. 잠시 후 다시 시도하거나 인터넷 연결을 확인해 주세요.");
            console.error(error);
        }
    }

    createPicker() {
        gapi.load('picker', {
            callback: () => {
                const view = new google.picker.View(google.picker.ViewId.DOCS);
                view.setMimeTypes("text/plain,application/json,application/vnd.openxmlformats-officedocument.wordprocessingml.document");

                const picker = new google.picker.PickerBuilder()
                    .addView(view)
                    .setOAuthToken(this.accessToken)
                    .setDeveloperKey(this.apiKey)
                    .setCallback((data) => this.handlePickerCallback(data))
                    .build();
                picker.setVisible(true);
            }
        });
    }

    async handlePickerCallback(data) {
        if (data.action === google.picker.Action.PICKED) {
            const document = data.docs[0];
            const fileId = document.id;
            const fileName = document.name;

            try {
                const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`
                    }
                });

                if (!response.ok) throw new Error("파일 다운로드 실패");

                const blob = await response.blob();
                const arrayBuffer = await blob.arrayBuffer();

                if (this.onFileSelectedCallback) {
                    this.onFileSelectedCallback(fileName, arrayBuffer);
                }
            } catch (error) {
                alert("구글 드라이브에서 파일을 가져오는 데 실패했습니다.");
                console.error(error);
            }
        }
    }
};