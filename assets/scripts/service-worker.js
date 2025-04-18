const CACHE_NAME = 'main-site-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/assets/styles/header.css',
    '/assets/scripts/header.js',
    '/assets/icons/favicon/favicon.ico',
    '/assets/icons/favicon/site.webmanifest',
    // Add more main domain assets here
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            )
        )
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
