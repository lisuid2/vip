/**
 * Service Worker - 资源缓存和离线支持
 * 缓存策略：
 * - HTML: 网络优先，缓存作为备选
 * - CSS/JS: 缓存优先，网络更新
 * - 图片: 缓存优先，缓存30天
 * - API/第三方: 网络优先，缓存作为备选
 */

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index-new.html',
  '/css/css.css',
  '/js/utils.js',
  '/js/api.js',
  '/js/player.js',
  '/js/ui.js'
];

// 安装阶段 - 缓存核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] 缓存静态资源');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('[SW] 静态资源缓存失败:', error);
      })
  );
  // 立即激活新版本
  self.skipWaiting();
});

// 激活阶段 - 清理过期缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name !== STATIC_CACHE &&
                     name !== DYNAMIC_CACHE &&
                     name !== API_CACHE &&
                     name !== IMAGE_CACHE;
            })
            .map((name) => {
              console.log('[SW] 删除过期缓存:', name);
              return caches.delete(name);
            })
        );
      })
  );
  // 立即接管所有页面
  self.clients.claim();
});

// 请求拦截
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非GET请求
  if (request.method !== 'GET') {
    return;
  }

  // 跳过第三方域名（除了必要的外部API）
  if (url.origin !== location.origin && !isAllowedExternalUrl(url.href)) {
    return;
  }

  // HTML文件：网络优先策略
  if (request.destination === 'document' || request.url.endsWith('.html')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // CSS/JS文件：缓存优先策略
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 图片：缓存优先策略
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, 30 * 24 * 60 * 60 * 1000)); // 30天
    return;
  }

  // API请求：网络优先策略
  if (url.href.includes('/api') || url.href.includes('jx.')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // 默认：缓存优先
  event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
});

/**
 * 缓存优先策略
 * 先查找缓存，缓存不存在则网络请求
 */
async function cacheFirst(request, cacheName, maxAge = null) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    // 检查缓存是否过期
    if (maxAge) {
      const cacheTime = cached.headers.get('sw-cache-time');
      if (cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        if (age < maxAge) {
          return cached;
        }
      }
    } else {
      return cached;
    }
  }

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cloned = response.clone();
      const newResponse = new Response(cloned.body, {
        status: cloned.status,
        statusText: cloned.statusText,
        headers: new Headers(cloned.headers)
      });
      newResponse.headers.set('sw-cache-time', Date.now());
      cache.put(request, newResponse);
    }
    return response;
  } catch (error) {
    console.error('[SW] 请求失败:', request.url);
    // 返回缓存版本作为备选
    return cached || new Response('网络请求失败', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * 网络优先策略
 * 先尝试网络请求，网络失败则使用缓存
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] 网络请求失败:', request.url);
    const cache = await caches.open(cacheName);
    return cache.match(request) || new Response('网络请求失败，离线模式', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * 检查是否允许的外部URL
 */
function isAllowedExternalUrl(url) {
  // 允许的外部API列表
  const allowed = [
    'jx.xmflv.com',
    'jx.nnxv.cn',
    'jx.m3u8.tv',
    'jx.xmflv.cc',
    'jx.playerjy.com',
    'okjx.cc'
  ];

  return allowed.some((domain) => url.includes(domain));
}
