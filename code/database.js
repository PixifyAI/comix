/**
 * database.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2024 Google Inc.
 */
const DB_NAME = 'kthoom-db';
const DB_VERSION = 2;
const BOOK_STORE_NAME = 'books';
const PAGE_STORE_NAME = 'pages';

class Database {
  constructor() {
    this.db_ = null;
  }

  open() {
    return new Promise((resolve, reject) => {
      if (this.db_) {
        resolve();
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(BOOK_STORE_NAME)) {
          db.createObjectStore(BOOK_STORE_NAME);
        }
        if (!db.objectStoreNames.contains(PAGE_STORE_NAME)) {
          db.createObjectStore(PAGE_STORE_NAME);
        }
      };
      request.onsuccess = (event) => {
        this.db_ = event.target.result;
        resolve();
      };
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * @param {import('./book.js').Book} book
   * @returns {Promise<void>}
   */
  async saveBook(book) {
    if (!this.db_) {
      await this.open();
    }
    const bookName = book.getName();
    const pageNames = [];
    for (let i = 0; i < book.getNumberOfPages(); ++i) {
      pageNames.push(book.getPage(i).getPageName());
    }
    const bookMetadata = {
      name: bookName,
      pageNames: pageNames,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db_.transaction([BOOK_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(BOOK_STORE_NAME);
      const request = store.put(bookMetadata, bookName);
      request.onsuccess = () => {
        console.log('Successfully saved book metadata: ' + bookName);
        resolve();
      };
      request.onerror = (event) => {
        console.error('Failed to save book metadata: ' + event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * @param {string} bookName
   * @param {import('./page.js').Page} page
   * @returns {Promise<void>}
   */
  async savePage(bookName, page) {
    if (!this.db_) {
      await this.open();
    }
    const pageKey = `${bookName}:${page.getPageName()}`;
    const pageData = page.getBytes();
    return new Promise((resolve, reject) => {
      const transaction = this.db_.transaction([PAGE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(PAGE_STORE_NAME);
      const request = store.put(pageData, pageKey);
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }

  /**
   * @param {string} bookName
   * @param {string} pageName
   * @returns {Promise<Uint8Array>}
   */
  getPage(bookName, pageName) {
    return new Promise(async (resolve, reject) => {
      if (!this.db_) {
        await this.open();
      }
      const pageKey = `${bookName}:${pageName}`;
      const transaction = this.db_.transaction([PAGE_STORE_NAME], 'readonly');
      const store = transaction.objectStore(PAGE_STORE_NAME);
      const request = store.get(pageKey);
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  /**
   * @param {string} bookName
   * @returns {Promise<ArrayBuffer>}
   */
  getBook(bookName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db_.transaction([BOOK_STORE_NAME], 'readonly');
      const store = transaction.objectStore(BOOK_STORE_NAME);
      const request = store.get(bookName);
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  /**
   * @param {string} bookName
   * @returns {Promise<void>}
   */
  deleteBook(bookName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db_.transaction([BOOK_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(BOOK_STORE_NAME);
      const request = store.delete(bookName);
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }

  /**
   * @returns {Promise<string[]>}
   */
  getSavedBookNames() {
    return new Promise((resolve, reject) => {
      const transaction = this.db_.transaction([BOOK_STORE_NAME], 'readonly');
      const store = transaction.objectStore(BOOK_STORE_NAME);
      const request = store.getAllKeys();
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  deleteAllBooks() {
    return new Promise((resolve, reject) => {
      const transaction = this.db_.transaction([BOOK_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(BOOK_STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }
}

export const db = new Database();
