/**
 * Service Worker for Script Builder
 * 
 * Provides offline support, caching, and background sync capabilities
 * for the Script Builder application.
 */

const CACHE_NAME = 'script-builder-v1';
const DYNAMIC_CACHE_NAME = 'script-builder-dynamic-v1';

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/utils.js',
    '/history.js',
    '/script-builder.js',
    '/app.js',
    'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS.map(url => {
                    return new Request(url, { mode: 'no-cors' });
                }));
            })
            .then(() => {
                console.log('Service Worker: Installation complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Installation failed', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            return cacheName.startsWith('script-builder-') &&
                                   cacheName !== CACHE_NAME &&
                                   cacheName !== DYNAMIC_CACHE_NAME;
                        })
                        .map((cacheName) => {
                            console.log('Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('Service Worker: Activation complete');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache when available
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-HTTP requests
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    // Handle API requests differently (no caching)
    if (url.pathname.includes('/api/')) {
        event.respondWith(
            fetch(request)
                .catch(() => {
                    return new Response(
                        JSON.stringify({ error: 'Network error' }),
                        {
                            headers: { 'Content-Type': 'application/json' },
                            status: 503
                        }
                    );
                })
        );
        return;
    }
    
    // Cache-first strategy for static assets
    if (isStaticAsset(url.pathname)) {
        event.respondWith(
            caches.match(request)
                .then((response) => {
                    if (response) {
                        return response;
                    }
                    
                    return fetch(request)
                        .then((fetchResponse) => {
                            // Don't cache non-successful responses
                            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type === 'opaque') {
                                return fetchResponse;
                            }
                            
                            const responseToCache = fetchResponse.clone();
                            
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(request, responseToCache);
                                });
                            
                            return fetchResponse;
                        });
                })
                .catch(() => {
                    // Return offline page if available
                    return caches.match('/offline.html');
                })
        );
        return;
    }
    
    // Network-first strategy for dynamic content
    event.respondWith(
        fetch(request)
            .then((response) => {
                // Clone the response before caching
                const responseToCache = response.clone();
                
                caches.open(DYNAMIC_CACHE_NAME)
                    .then((cache) => {
                        cache.put(request, responseToCache);
                    });
                
                return response;
            })
            .catch(() => {
                return caches.match(request);
            })
    );
});

// Background sync for saving scripts
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered');
    
    if (event.tag === 'sync-scripts') {
        event.waitUntil(syncScripts());
    }
});

// Message handling for communication with main app
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'CACHE_SCRIPT':
            cacheScript(data);
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches();
            break;
            
        case 'GET_CACHE_SIZE':
            getCacheSize().then((size) => {
                event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
            });
            break;
            
        default:
            console.log('Service Worker: Unknown message type:', type);
    }
});

// Helper functions
function isStaticAsset(pathname) {
    const staticExtensions = ['.html', '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
    return staticExtensions.some(ext => pathname.endsWith(ext));
}

async function syncScripts() {
    try {
        // Get pending scripts from IndexedDB
        const db = await openDB();
        const pendingScripts = await getPendingScripts(db);
        
        if (pendingScripts.length === 0) {
            console.log('Service Worker: No scripts to sync');
            return;
        }
        
        console.log(`Service Worker: Syncing ${pendingScripts.length} scripts`);
        
        // Sync each script
        for (const script of pendingScripts) {
            try {
                // Here you would normally sync with a server
                // For now, we'll just mark as synced
                await markScriptAsSynced(db, script.id);
                console.log(`Service Worker: Synced script ${script.id}`);
            } catch (error) {
                console.error(`Service Worker: Failed to sync script ${script.id}`, error);
            }
        }
        
        // Notify clients of sync completion
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_COMPLETE',
                count: pendingScripts.length
            });
        });
        
    } catch (error) {
        console.error('Service Worker: Sync failed', error);
    }
}

async function cacheScript(script) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const response = new Response(JSON.stringify(script), {
            headers: { 'Content-Type': 'application/json' }
        });
        
        await cache.put(`/scripts/${script.id}`, response);
        console.log(`Service Worker: Cached script ${script.id}`);
    } catch (error) {
        console.error('Service Worker: Failed to cache script', error);
    }
}

async function clearAllCaches() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('Service Worker: All caches cleared');
    } catch (error) {
        console.error('Service Worker: Failed to clear caches', error);
    }
}

async function getCacheSize() {
    try {
        const cacheNames = await caches.keys();
        let totalSize = 0;
        
        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            
            for (const request of requests) {
                const response = await cache.match(request);
                if (response) {
                    const blob = await response.blob();
                    totalSize += blob.size;
                }
            }
        }
        
        return totalSize;
    } catch (error) {
        console.error('Service Worker: Failed to calculate cache size', error);
        return 0;
    }
}

// IndexedDB helpers
async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ScriptBuilderHistory', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getPendingScripts(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['scripts'], 'readonly');
        const store = transaction.objectStore('scripts');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const scripts = request.result || [];
            // Filter for scripts that need syncing (you'd have a sync flag)
            const pendingScripts = scripts.filter(s => !s.synced);
            resolve(pendingScripts);
        };
        
        request.onerror = () => reject(request.error);
    });
}

async function markScriptAsSynced(db, scriptId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['scripts'], 'readwrite');
        const store = transaction.objectStore('scripts');
        const getRequest = store.get(scriptId);
        
        getRequest.onsuccess = () => {
            const script = getRequest.result;
            if (script) {
                script.synced = true;
                script.syncedAt = Date.now();
                
                const putRequest = store.put(script);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(putRequest.error);
            } else {
                resolve();
            }
        };
        
        getRequest.onerror = () => reject(getRequest.error);
    });
}

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'sync-scripts-periodic') {
        event.waitUntil(syncScripts());
    }
});

// Push notifications (for future use)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'New update available',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };
    
    event.waitUntil(
        self.registration.showNotification('Script Builder', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});

console.log('Service Worker: Loaded');
