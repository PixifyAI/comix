const CACHE_NAME = 'kthoom:v5';

let urlsToCache = [
  '.',
  'code/bitjs/archive/archive.js',
  'code/bitjs/archive/common.js',
  'code/bitjs/archive/compress.js',
  'code/bitjs/archive/decompress.js',
  'code/bitjs/archive/decompress-internal.js',
  'code/bitjs/archive/events.js',
  'code/bitjs/archive/rarvm.js',
  'code/bitjs/archive/unrar.js',
  'code/bitjs/archive/untar.js',
  'code/bitjs/archive/unzip.js',
  'code/bitjs/archive/webworker-wrapper.js',
  'code/bitjs/archive/zip.js',
  'code/bitjs/file/sniffer.js',
  'code/bitjs/image/webp-shim/webp-shim.js',
  'code/bitjs/image/webp-shim/webp-shim-module.js',
  'code/bitjs/image/webp-shim/webp-shim-module.wasm',
  'code/bitjs/io/bitbuffer.js',
  'code/bitjs/io/bitstream.js',
  'code/bitjs/io/bytebuffer.js',
  'code/bitjs/io/bytestream.js',
  'code/comics/comic-book-binder.js',
  'code/comics/comic-book-page-sorter.js',
  'code/common/helpers.js',
  'code/common/dom-walker.js',
  'code/database.js',
  'code/epub/epub-allowlists.js',
  'code/epub/epub-book-binder.js',
  'code/metadata/book-metadata.js',
  'code/metadata/metadata-editor.js',
  'code/metadata/metadata-viewer.js',
  'code/pages/long-strip-page-setter.js',
  'code/pages/one-page-setter.js',
  'code/pages/page-container.js',
  'code/pages/page-setter.js',
  'code/pages/two-page-setter.js',
  'code/pages/wide-strip-page-setter.js',
  'code/book-binder.js',
  'code/book-events.js',
  'code/book-pump.js',
  'code/book-viewer.js',
  'code/book-viewer-types.js',
  'code/book.js',
  'code/config.js',
  'code/file-ref.js',
  'code/kthoom-google.js',
  'code/kthoom-ipfs.js',
  'code/kthoom-messages.js',
  'code/kthoom.css',
  'code/kthoom.js',
  'code/main.js',
  'code/menu.js',
  'code/page.js',
  'code/reading-stack.js',
  'images/logo-192.png',
  'images/logo.png',
  'images/logo.svg',
  'index.html',
  'privacy.html',
  'kthoom.webmanifest',
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(caches.open(CACHE_NAME).then((cache) => {
    return cache.addAll(urlsToCache);
  }));
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

import { db } from './code/database.js';

self.addEventListener('fetch', (evt) => {
  // Let the browser do its default thing
  // for non-GET requests.
  if (evt.request.method !== 'GET') {
    return;
  }

  const url = new URL(evt.request.url);

  // For the service worker, we will always try to get the latest version of the file.
  if (url.origin === location.origin && url.pathname.endsWith('/service-worker.js')) {
    return;
  }

  // For book files, we will try to get them from the database.
  const isBookRequest = url.pathname.endsWith('.cbz') ||
      url.pathname.endsWith('.cbr') ||
      url.pathname.endsWith('.cbt') ||
      url.pathname.endsWith('.epub');
  if (isBookRequest) {
    evt.respondWith((async () => {
      await db.open();
      const bookName = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
      const bookData = await db.getBook(bookName);
      if (bookData) {
        return new Response(bookData);
      }
      return fetch(evt.request);
    })());
    return;
  }

  evt.respondWith(
    caches.match(evt.request).then((response) => {
      return response || fetch(evt.request);
    })
  );
});