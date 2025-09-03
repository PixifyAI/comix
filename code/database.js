/**
 * database.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2024 Google Inc.
 */
const DB_NAME = 'kthoom-db';
const DB_VERSION = 1;
const BOOK_STORE_NAME = 'books';

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
        db.createObjectStore(BOOK_STORE_NAME);
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
    const bookData = await book.getArrayBuffer();
    return new Promise((resolve, reject) => {
      const transaction = this.db_.transaction([BOOK_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(BOOK_STORE_NAME);
      const request = store.put(bookData, bookName);
      request.onsuccess = () => {
        console.log('Successfully saved book: ' + bookName);
        resolve();
      };
      request.onerror = (event) => {
        console.error('Failed to save book: ' + event.target.error);
        reject(event.target.error);
      };
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
