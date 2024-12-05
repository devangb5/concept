const CACHE_NAME = 'my-site-cache-v1';
const urlsToCache = [
        '/',
        '/index.html',
        '/assets/styles/header.css',
        '/assets/styles/footer.css',
        '/assets/styles/article.css',
        '/assets/scripts/header.js',
        '/assets/scripts/footer.js',
        '/assets/scripts/article.js',
        '/assets/icons/favicon/favicon-96x96.png',
        '/assets/icons/favicon/favicon.svg',
        '/assets/icons/favicon/favicon.ico',
        '/assets/icons/favicon/apple-touch-icon.png',
        '/assets/icons/favicon/site.webmanifest',
        // Add more specific assets if needed
    ];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});
