// Service Worker للمكتبة الإسلامية الرقمية
// يوفر الوظائف دون اتصال بالإنترنت والتخزين المؤقت

const CACHE_NAME = 'islamic-library-v1.0.0';
const STATIC_CACHE_NAME = 'islamic-library-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'islamic-library-dynamic-v1.0.0';

// الملفات الأساسية للتخزين المؤقت
const STATIC_FILES = [
  '/',
  '/index.html',
  '/pages/quran.html',
  '/pages/hadith.html',
  '/pages/audio.html',
  '/pages/about.html',
  '/css/main.css',
  '/js/main.js',
  '/js/quran.js',
  '/js/hadith.js',
  '/js/audio.js',
  '/manifest.json',
  '/assets/images/icon-192.png',
  '/assets/images/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// البيانات الأساسية للتخزين المؤقت
const CORE_DATA = [
  '/data/surahs.json',
  '/data/translations.json',
  '/data/reciters.json'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then(cache => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      }),
      caches.open(DYNAMIC_CACHE_NAME).then(cache => {
        console.log('[SW] Caching core data');
        return cache.addAll(CORE_DATA);
      })
    ]).then(() => {
      console.log('[SW] Service Worker installed successfully');
      return self.skipWaiting();
    })
  );
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service Worker activated successfully');
      return self.clients.claim();
    })
  );
});

// اعتراض الطلبات
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // تجاهل الطلبات غير HTTP/HTTPS
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }
  
  // معالجة الطلبات المختلفة
  if (isStaticFile(request)) {
    event.respondWith(handleStaticFile(request));
  } else if (isApiCall(request)) {
    event.respondWith(handleApiCall(request));
  } else if (isAudioFile(request)) {
    event.respondWith(handleAudioFile(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// التحقق من الملفات الثابتة
function isStaticFile(request) {
  const url = new URL(request.url);
  return STATIC_FILES.some(file => url.pathname.endsWith(file)) ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.jpeg') ||
         url.pathname.endsWith('.svg') ||
         url.pathname.endsWith('.ico');
}

// التحقق من استدعاءات API
function isApiCall(request) {
  const url = new URL(request.url);
  return url.hostname.includes('api.') ||
         url.pathname.includes('/api/') ||
         url.hostname.includes('quran.com') ||
         url.hostname.includes('sunnah.com') ||
         url.hostname.includes('aladhan.com');
}

// التحقق من الملفات الصوتية
function isAudioFile(request) {
  const url = new URL(request.url);
  return url.pathname.endsWith('.mp3') ||
         url.pathname.endsWith('.ogg') ||
         url.pathname.endsWith('.wav') ||
         url.hostname.includes('everyayah.com');
}

// معالجة الملفات الثابتة
async function handleStaticFile(request) {
  try {
    // البحث في الكاش أولاً
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // إذا لم توجد في الكاش، جلب من الشبكة
    const networkResponse = await fetch(request);
    
    // تخزين في الكاش للمرة القادمة
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static file fetch failed:', error);
    
    // إرجاع صفحة دون اتصال إذا كان الطلب لصفحة HTML
    if (request.headers.get('Accept')?.includes('text/html')) {
      return getOfflinePage();
    }
    
    throw error;
  }
}

// معالجة استدعاءات API
async function handleApiCall(request) {
  try {
    // محاولة الشبكة أولاً
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // تخزين في الكاش الديناميكي
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] API call failed:', error);
    
    // البحث في الكاش كبديل
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // إرجاع استجابة افتراضية
    return getOfflineApiResponse(request);
  }
}

// معالجة الملفات الصوتية
async function handleAudioFile(request) {
  try {
    // البحث في الكاش أولاً للملفات الصوتية المحفوظة
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // جلب من الشبكة
    const networkResponse = await fetch(request);
    
    // تخزين الملفات الصوتية الصغيرة فقط
    if (networkResponse.ok && 
        networkResponse.headers.get('content-length') < 10000000) { // 10MB
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Audio file fetch failed:', error);
    throw error;
  }
}

// معالجة الطلبات الديناميكية
async function handleDynamicRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Dynamic request failed:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // إرجاع صفحة دون اتصال للصفحات
    if (request.headers.get('Accept')?.includes('text/html')) {
      return getOfflinePage();
    }
    
    throw error;
  }
}

// الحصول على صفحة عدم الاتصال
function getOfflinePage() {
  return new Response(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>عدم الاتصال - المكتبة الإسلامية الرقمية</title>
        <style>
            body {
                font-family: 'Noto Sans Arabic', sans-serif;
                text-align: center;
                padding: 2rem;
                background: linear-gradient(135deg, #2D5A27 0%, #1B4332 100%);
                color: white;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }
            .offline-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
                color: #D4AF37;
            }
            h1 {
                font-size: 2rem;
                margin-bottom: 1rem;
            }
            p {
                font-size: 1.1rem;
                margin-bottom: 2rem;
                opacity: 0.9;
            }
            .retry-btn {
                background: #D4AF37;
                color: #2D5A27;
                padding: 0.75rem 2rem;
                border: none;
                border-radius: 25px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .retry-btn:hover {
                background: #B8860B;
                transform: translateY(-2px);
            }
            .cached-content {
                margin-top: 2rem;
                padding: 1rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                backdrop-filter: blur(10px);
            }
            .cached-links {
                display: flex;
                gap: 1rem;
                justify-content: center;
                flex-wrap: wrap;
                margin-top: 1rem;
            }
            .cached-links a {
                color: #D4AF37;
                text-decoration: none;
                padding: 0.5rem 1rem;
                border: 1px solid #D4AF37;
                border-radius: 20px;
                transition: all 0.3s ease;
            }
            .cached-links a:hover {
                background: #D4AF37;
                color: #2D5A27;
            }
        </style>
    </head>
    <body>
        <div class="offline-icon">📱</div>
        <h1>عدم الاتصال بالإنترنت</h1>
        <p>لا يمكن الوصول للإنترنت في الوقت الحالي، ولكن يمكنك الاستمرار في استخدام المحتوى المحفوظ.</p>
        
        <button class="retry-btn" onclick="location.reload()">
            إعادة المحاولة
        </button>
        
        <div class="cached-content">
            <h3>المحتوى المتاح دون اتصال:</h3>
            <div class="cached-links">
                <a href="/">الصفحة الرئيسية</a>
                <a href="/pages/quran.html">القرآن الكريم</a>
                <a href="/pages/hadith.html">الأحاديث</a>
                <a href="/pages/about.html">عن الموقع</a>
            </div>
        </div>
        
        <script>
            // التحقق من الاتصال كل 30 ثانية
            setInterval(() => {
                if (navigator.onLine) {
                    location.reload();
                }
            }, 30000);
        </script>
    </body>
    </html>
  `, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  });
}

// الحصول على استجابة API دون اتصال
function getOfflineApiResponse(request) {
  const url = new URL(request.url);
  
  // استجابات افتراضية للـ APIs المختلفة
  if (url.hostname.includes('aladhan.com')) {
    return new Response(JSON.stringify({
      code: 200,
      status: "OK",
      data: {
        timings: {
          Fajr: "05:30",
          Dhuhr: "12:00",
          Asr: "15:30",
          Maghrib: "18:00",
          Isha: "19:30"
        },
        meta: {
          timezone: "Asia/Riyadh"
        }
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
  
  if (url.hostname.includes('quran.com')) {
    return new Response(JSON.stringify({
      chapters: [],
      verses: [],
      message: "المحتوى غير متاح دون اتصال"
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
  
  // استجابة افتراضية عامة
  return new Response(JSON.stringify({
    error: "لا يوجد اتصال بالإنترنت",
    message: "هذا المحتوى غير متاح دون اتصال",
    offline: true
  }), {
    status: 503,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}

// تنظيف الكاش القديم
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    cleanOldCache();
  }
});

// تنظيف الكاش القديم
async function cleanOldCache() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    name.startsWith('islamic-library-') && 
    name !== STATIC_CACHE_NAME && 
    name !== DYNAMIC_CACHE_NAME
  );
  
  await Promise.all(oldCaches.map(name => caches.delete(name)));
  console.log('[SW] Old caches cleaned');
}

// تحديث الكاش الديناميكي
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// مزامنة الخلفية
async function doBackgroundSync() {
  try {
    // تحديث مواقيت الصلاة
    await updatePrayerTimes();
    
    // تحديث المحتوى اليومي
    await updateDailyContent();
    
    console.log('[SW] Background sync completed');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// تحديث مواقيت الصلاة
async function updatePrayerTimes() {
  try {
    const response = await fetch('/api/prayer-times');
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put('/api/prayer-times', response.clone());
    }
  } catch (error) {
    console.error('[SW] Failed to update prayer times:', error);
  }
}

// تحديث المحتوى اليومي
async function updateDailyContent() {
  try {
    const response = await fetch('/api/daily-content');
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put('/api/daily-content', response.clone());
    }
  } catch (error) {
    console.error('[SW] Failed to update daily content:', error);
  }
}

// معالجة الإشعارات الفورية
self.addEventListener('push', event => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'لديك إشعار جديد',
      icon: '/assets/images/icon-192.png',
      badge: '/assets/images/badge-72.png',
      dir: 'rtl',
      lang: 'ar',
      tag: data.tag || 'default',
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [
        {
          action: 'open',
          title: 'فتح',
          icon: '/assets/images/action-open.png'
        },
        {
          action: 'close',
          title: 'إغلاق',
          icon: '/assets/images/action-close.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'المكتبة الإسلامية', options)
    );
  } catch (error) {
    console.error('[SW] Push notification error:', error);
  }
});

// معالجة النقر على الإشعارات
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const action = event.action;
  
  if (action === 'close') {
    return;
  }
  
  // فتح التطبيق
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // البحث عن نافذة مفتوحة
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      
      // فتح نافذة جديدة إذا لم توجد
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// معالجة الأخطاء
self.addEventListener('error', event => {
  console.error('[SW] Service Worker error:', event.error);
});

// إحصائيات الاستخدام
let usageStats = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  lastUpdated: Date.now()
};

// تتبع الإحصائيات
function trackStats(type) {
  usageStats[type]++;
  
  // حفظ الإحصائيات كل 100 طلب
  if (usageStats.networkRequests % 100 === 0) {
    saveStats();
  }
}

// حفظ الإحصائيات
async function saveStats() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const response = new Response(JSON.stringify(usageStats));
    await cache.put('/sw-stats', response);
  } catch (error) {
    console.error('[SW] Failed to save stats:', error);
  }
}

console.log('[SW] Service Worker loaded successfully');
console.log('[SW] Cache names:', {
  static: STATIC_CACHE_NAME,
  dynamic: DYNAMIC_CACHE_NAME
});