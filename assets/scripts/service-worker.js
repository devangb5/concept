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

// Install event - caches the specified URLs
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activate event - cleans up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event - serves cached content or fetches from network
self.addEventListener('fetch', event => {
    // Check if the request is within the scope of your subdomain
    if (event.request.url.startsWith('https://blogs.aroundtheville.com')) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    return response || fetch(event.request).then(networkResponse => {
                        return caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, networkResponse.clone());
                            return networkResponse;
                        });
                    });
                })
                .catch(() => {
                    // Fallback logic if the request fails
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html'); // Return the index.html for navigation requests
                    }
                })
        );
    } else {
        // Handle other domains or requests accordingly
        event.respondWith(fetch(event.request)); // Just fetch from the network
    }
});

// Optionally, listen for the 'beforeinstallprompt' event to manage installation prompts
self.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); // Prevent the default prompt
    // Optionally, save the event to show later
});
