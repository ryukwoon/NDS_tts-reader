// NDS_DBManager.js
window.NDS_TTS = window.NDS_TTS || {};

window.NDS_TTS.DBManager = class DBManager {
    constructor() {
        this.dbName = "NDS_TTS_Library";
        this.storeName = "books";
        this.db = null;
        this.fallbackBooks = [];
        this.useFallback = false;
        this.nextId = 1;
    }

    init() {
        return new Promise((resolve) => {
            if (!window.indexedDB) {
                console.warn("IndexedDB를 지원하지 않는 브라우저입니다. 메모리 모드로 동작합니다.");
                this.useFallback = true;
                resolve();
                return;
            }
            try {
                const request = window.indexedDB.open(this.dbName, 1);
                
                request.onerror = (e) => {
                    console.warn("IndexedDB 보안 샌드박스 제약으로 메모리 모드로 대체합니다.", e);
                    this.useFallback = true;
                    resolve();
                };
                
                request.onsuccess = (e) => {
                    this.db = e.target.result;
                    resolve();
                };
                
                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        db.createObjectStore(this.storeName, { keyPath: "id", autoIncrement: true });
                    }
                };
            } catch (err) {
                console.warn("IndexedDB 초기화 예외 발생. 메모리 모드로 우회합니다.", err);
                this.useFallback = true;
                resolve();
            }
        });
    }

    addBook(book) {
        if (this.useFallback) {
            book.id = this.nextId++;
            this.fallbackBooks.push(book);
            return Promise.resolve(book);
        }
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);
            if (book.id === undefined) delete book.id;
            const request = store.add(book);
            
            request.onsuccess = (e) => {
                book.id = e.target.result;
                resolve(book);
            };
            request.onerror = (e) => reject(e);
        });
    }

    updateBook(book) {
        if (this.useFallback) {
            const index = this.fallbackBooks.findIndex(b => b.id === book.id);
            if (index !== -1) {
                this.fallbackBooks[index] = book;
            }
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.put(book);
            
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e);
        });
    }

    deleteBook(id) {
        if (this.useFallback) {
            this.fallbackBooks = this.fallbackBooks.filter(b => b.id !== id);
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e);
        });
    }

    getAllBooks() {
        if (this.useFallback) {
            return Promise.resolve(this.fallbackBooks);
        }
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], "readonly");
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = (e) => {
                resolve(e.target.result || []);
            };
            request.onerror = (e) => reject(e);
        });
    }

    importBooks(importedList) {
        if (!Array.isArray(importedList)) return Promise.reject("올바르지 않은 데이터 규격입니다.");
        if (this.useFallback) {
            this.fallbackBooks = importedList;
            let maxId = 0;
            this.fallbackBooks.forEach(b => {
                if (b.id && b.id > maxId) maxId = b.id;
            });
            this.nextId = maxId + 1;
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);
            
            const clearReq = store.clear();
            clearReq.onsuccess = () => {
                if (importedList.length === 0) {
                    resolve();
                    return;
                }
                let count = 0;
                importedList.forEach(book => {
                    const putReq = store.put(book);
                    putReq.onsuccess = () => {
                        count++;
                        if (count === importedList.length) {
                            resolve();
                        }
                    };
                    putReq.onerror = (e) => reject(e);
                });
            };
            clearReq.onerror = (e) => reject(e);
        });
    }

    clearAll() {
        if (this.useFallback) {
            this.fallbackBooks = [];
            this.nextId = 1;
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e);
        });
    }
};