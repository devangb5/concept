const CACHE_NAME = 'subdomain-site-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/assets/styles/article.css',
    '/assets/scripts/article.js',
    '/assets/icons/favicon/favicon-96x96.png',
    '/assets/icons/favicon/apple-touch-icon.png',
    '/assets/icons/favicon/site.webmanifest',
    // Add more subdomain assets here
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
    if (event.request.url.startsWith('https://blogs.aroundtheville.com')) {
        event.respondWith(
            caches.match(event.request)
                .then(response => response || fetch(event.request))
        );
    } else {
        event.respondWith(fetch(event.request));
    }
});
