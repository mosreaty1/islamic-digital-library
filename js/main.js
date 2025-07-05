// الملف الرئيسي للجافا سكريبت - المكتبة الإسلامية الرقمية

// متغيرات عامة
let currentLanguage = 'ar';
let currentTheme = localStorage.getItem('theme') || 'light';
let prayerTimes = {};
let currentLocation = null;

// تهيئة الموقع عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// تهيئة التطبيق
function initializeApp() {
    // تطبيق الثيم المحفوظ
    applyTheme(currentTheme);
    
    // تهيئة أحداث التحكم
    initializeEventListeners();
    
    // تحديد الموقع الجغرافي
    getCurrentLocation();
    
    // تحميل المحتوى اليومي
    loadDailyContent();
    
    // تحميل التقويم الهجري
    loadIslamicCalendar();
    
    // تهيئة البحث العام
    initializeGlobalSearch();
    
    // تهيئة الإشعارات
    initializeNotifications();
    
    console.log('تم تهيئة التطبيق بنجاح');
}

// تهيئة مستمعي الأحداث
function initializeEventListeners() {
    // تبديل الثيم
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // تبديل اللغة
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        langToggle.addEventListener('click', toggleLanguage);
    }
    
    // تبديل البحث
    const searchToggle = document.getElementById('search-toggle');
    if (searchToggle) {
        searchToggle.addEventListener('click', toggleSearch);
    }
    
    // قائمة الجوال
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // إغلاق البحث
    const searchClose = document.getElementById('search-close');
    if (searchClose) {
        searchClose.addEventListener('click', closeSearch);
    }
    
    // البحث العام
    const globalSearchBtn = document.getElementById('global-search-btn');
    if (globalSearchBtn) {
        globalSearchBtn.addEventListener('click', performGlobalSearch);
    }
    
    // البحث بالضغط على Enter
    const globalSearchInput = document.getElementById('global-search-input');
    if (globalSearchInput) {
        globalSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performGlobalSearch();
            }
        });
    }
    
    // إغلاق النوافذ المنبثقة بالضغط على Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// تبديل الثيم
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
    localStorage.setItem('theme', currentTheme);
}

// تطبيق الثيم
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeIcon = document.querySelector('#theme-toggle i');
    if (themeIcon) {
        themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// تبديل اللغة
function toggleLanguage() {
    // إظهار قائمة اللغات
    showLanguageSelector();
}

// إظهار منتقي اللغة
function showLanguageSelector() {
    const languages = [
        { code: 'ar', name: 'العربية' },
        { code: 'en', name: 'English' },
        { code: 'ur', name: 'اردو' },
        { code: 'fr', name: 'Français' },
        { code: 'tr', name: 'Türkçe' },
        { code: 'id', name: 'Bahasa Indonesia' }
    ];
    
    // إنشاء قائمة منسدلة مؤقتة
    const dropdown = document.createElement('div');
    dropdown.className = 'language-dropdown';
    dropdown.innerHTML = languages.map(lang => 
        `<button onclick="changeLanguage('${lang.code}')">${lang.name}</button>`
    ).join('');
    
    // إضافة القائمة إلى الصفحة
    document.body.appendChild(dropdown);
    
    // إزالة القائمة بعد 5 ثوان
    setTimeout(() => {
        if (document.body.contains(dropdown)) {
            document.body.removeChild(dropdown);
        }
    }, 5000);
}

// تغيير اللغة
function changeLanguage(langCode) {
    currentLanguage = langCode;
    localStorage.setItem('language', langCode);
    
    // تحديث نص زر اللغة
    const langText = document.querySelector('.lang-text');
    if (langText) {
        const langNames = {
            'ar': 'العربية',
            'en': 'English',
            'ur': 'اردو',
            'fr': 'Français',
            'tr': 'Türkçe',
            'id': 'Indonesia'
        };
        langText.textContent = langNames[langCode] || 'العربية';
    }
    
    // إعادة تحميل المحتوى بالغة الجديدة
    loadContentInLanguage(langCode);
    
    // إزالة قائمة اللغات
    const dropdown = document.querySelector('.language-dropdown');
    if (dropdown) {
        dropdown.remove();
    }
    
    showNotification('تم تغيير اللغة بنجاح', 'success');
}

// تبديل البحث
function toggleSearch() {
    const searchBar = document.getElementById('global-search');
    if (searchBar) {
        searchBar.classList.toggle('active');
        if (searchBar.classList.contains('active')) {
            document.getElementById('global-search-input').focus();
        }
    }
}

// إغلاق البحث
function closeSearch() {
    const searchBar = document.getElementById('global-search');
    if (searchBar) {
        searchBar.classList.remove('active');
        document.getElementById('global-search-input').value = '';
    }
}

// تبديل قائمة الجوال
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu-overlay');
    if (mobileMenu) {
        mobileMenu.classList.toggle('show');
    }
}

// الحصول على الموقع الجغرافي
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                currentLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                updateLocationDisplay();
                loadPrayerTimes();
            },
            error => {
                console.error('خطأ في تحديد الموقع:', error);
                // استخدام موقع افتراضي (مكة المكرمة)
                currentLocation = {
                    latitude: 21.4225,
                    longitude: 39.8262
                };
                updateLocationDisplay('مكة المكرمة، السعودية');
                loadPrayerTimes();
            }
        );
    } else {
        console.error('الموقع الجغرافي غير مدعوم');
        // استخدام موقع افتراضي
        currentLocation = {
            latitude: 21.4225,
            longitude: 39.8262
        };
        updateLocationDisplay('مكة المكرمة، السعودية');
        loadPrayerTimes();
    }
}

// تحديث عرض الموقع
function updateLocationDisplay(locationName = null) {
    const locationElement = document.getElementById('current-location');
    if (locationElement) {
        if (locationName) {
            locationElement.textContent = locationName;
        } else {
            locationElement.textContent = 'جاري تحديد الموقع...';
        }
    }
}

// تحميل مواقيت الصلاة
async function loadPrayerTimes() {
    if (!currentLocation) {
        console.error('الموقع الجغرافي غير متاح');
        return;
    }
    
    try {
        const today = new Date();
        const url = `https://api.aladhan.com/v1/timings/${Math.floor(today.getTime() / 1000)}?latitude=${currentLocation.latitude}&longitude=${currentLocation.longitude}&method=4`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 200) {
            prayerTimes = data.data.timings;
            updatePrayerTimesDisplay();
            
            // تحديث اسم المدينة
            if (data.data.meta.timezone) {
                const cityName = data.data.meta.timezone.split('/').pop().replace('_', ' ');
                updateLocationDisplay(cityName);
            }
        }
    } catch (error) {
        console.error('خطأ في تحميل مواقيت الصلاة:', error);
        // استخدام أوقات افتراضية
        prayerTimes = {
            Fajr: '05:30',
            Dhuhr: '12:00',
            Asr: '15:30',
            Maghrib: '18:00',
            Isha: '19:30'
        };
        updatePrayerTimesDisplay();
    }
}

// تحديث عرض مواقيت الصلاة
function updatePrayerTimesDisplay() {
    const prayerElements = {
        'fajr-time': 'Fajr',
        'dhuhr-time': 'Dhuhr',
        'asr-time': 'Asr',
        'maghrib-time': 'Maghrib',
        'isha-time': 'Isha'
    };
    
    Object.entries(prayerElements).forEach(([elementId, prayerKey]) => {
        const element = document.getElementById(elementId);
        if (element && prayerTimes[prayerKey]) {
            element.textContent = formatTime(prayerTimes[prayerKey]);
        }
    });
}

// تنسيق الوقت
function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'م' : 'ص';
    return `${hour12}:${minutes} ${ampm}`;
}

// تحميل المحتوى اليومي
async function loadDailyContent() {
    try {
        await Promise.all([
            loadDailySurah(),
            loadDailyHadith(),
            loadDailyRecitation()
        ]);
    } catch (error) {
        console.error('خطأ في تحميل المحتوى اليومي:', error);
    }
}

// تحميل سورة اليوم
async function loadDailySurah() {
    try {
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const surahNumber = (dayOfYear % 114) + 1;
        
        const response = await fetch(`https://api.quran.com/api/v4/chapters/${surahNumber}`);
        const data = await response.json();
        
        if (data.chapter) {
            const surahElement = document.getElementById('daily-surah');
            const linkElement = document.getElementById('daily-surah-link');
            
            if (surahElement) {
                surahElement.textContent = `سورة ${data.chapter.name_arabic}`;
            }
            
            if (linkElement) {
                linkElement.href = `/pages/quran.html#surah-${surahNumber}`;
            }
        }
    } catch (error) {
        console.error('خطأ في تحميل سورة اليوم:', error);
    }
}

// تحميل حديث اليوم
async function loadDailyHadith() {
    try {
        // استخدام حديث عشوائي من مجموعة محددة
        const hadiths = [
            {
                text: 'إنما الأعمال بالنيات وإنما لكل امرئ ما نوى',
                narrator: 'عمر بن الخطاب',
                source: 'صحيح البخاري'
            },
            {
                text: 'من كان يؤمن بالله واليوم الآخر فليقل خيراً أو ليصمت',
                narrator: 'أبو هريرة',
                source: 'صحيح البخاري'
            },
            {
                text: 'المسلم من سلم المسلمون من لسانه ويده',
                narrator: 'عبد الله بن عمرو',
                source: 'صحيح البخاري'
            }
        ];
        
        const today = new Date();
        const hadithIndex = today.getDate() % hadiths.length;
        const dailyHadith = hadiths[hadithIndex];
        
        const hadithElement = document.getElementById('daily-hadith');
        const linkElement = document.getElementById('daily-hadith-link');
        
        if (hadithElement) {
            hadithElement.textContent = dailyHadith.text;
        }
        
        if (linkElement) {
            linkElement.href = `/pages/hadith.html`;
        }
        
        // تحديث عرض حديث اليوم في صفحة الأحاديث
        updateDailyHadithDisplay(dailyHadith);
        
    } catch (error) {
        console.error('خطأ في تحميل حديث اليوم:', error);
    }
}

// تحديث عرض حديث اليوم
function updateDailyHadithDisplay(hadith) {
    const elements = {
        'daily-hadith-text': hadith.text,
        'daily-hadith-narrator': `الراوي: ${hadith.narrator}`,
        'daily-hadith-source': `المصدر: ${hadith.source}`
    };
    
    Object.entries(elements).forEach(([id, content]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    });
}

// تحميل تلاوة اليوم
async function loadDailyRecitation() {
    try {
        const today = new Date();
        const recitationIndex = today.getDate() % 3; // 3 تلاوات مميزة
        
        const recitations = [
            { name: 'سورة الفاتحة', reciter: 'مشاري العفاسي', surah: 1 },
            { name: 'سورة يس', reciter: 'عبد الرحمن السديس', surah: 36 },
            { name: 'سورة الملك', reciter: 'علي الحذيفي', surah: 67 }
        ];
        
        const dailyRecitation = recitations[recitationIndex];
        
        const recitationElement = document.getElementById('daily-recitation');
        const linkElement = document.getElementById('daily-recitation-link');
        
        if (recitationElement) {
            recitationElement.textContent = `${dailyRecitation.name} - ${dailyRecitation.reciter}`;
        }
        
        if (linkElement) {
            linkElement.href = `/pages/audio.html#surah-${dailyRecitation.surah}`;
        }
        
    } catch (error) {
        console.error('خطأ في تحميل تلاوة اليوم:', error);
    }
}

// تحميل التقويم الهجري
async function loadIslamicCalendar() {
    try {
        const today = new Date();
        const response = await fetch(`https://api.aladhan.com/v1/gToH/${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`);
        const data = await response.json();
        
        if (data.code === 200) {
            const hijriDate = data.data.hijri;
            const hijriString = `${hijriDate.day} ${hijriDate.month.ar} ${hijriDate.year} هـ`;
            
            const hijriElement = document.getElementById('hijri-date');
            if (hijriElement) {
                hijriElement.textContent = hijriString;
            }
        }
        
        // التاريخ الميلادي
        const gregorianString = today.toLocaleDateString('ar-SA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const gregorianElement = document.getElementById('gregorian-date');
        if (gregorianElement) {
            gregorianElement.textContent = gregorianString;
        }
        
    } catch (error) {
        console.error('خطأ في تحميل التقويم الهجري:', error);
    }
}

// تهيئة البحث العام
function initializeGlobalSearch() {
    // سيتم تطوير هذه الوظيفة لاحقاً
    console.log('تم تهيئة البحث العام');
}

// تنفيذ البحث العام
async function performGlobalSearch() {
    const searchInput = document.getElementById('global-search-input');
    const searchType = document.querySelector('input[name="search-type"]:checked');
    
    if (!searchInput || !searchInput.value.trim()) {
        showNotification('يرجى إدخال كلمة البحث', 'warning');
        return;
    }
    
    const query = searchInput.value.trim();
    const type = searchType ? searchType.value : 'quran';
    
    showLoading();
    
    try {
        let results = [];
        
        switch (type) {
            case 'quran':
                results = await searchQuran(query);
                break;
            case 'hadith':
                results = await searchHadith(query);
                break;
            case 'audio':
                results = await searchAudio(query);
                break;
        }
        
        displaySearchResults(results, type);
        
    } catch (error) {
        console.error('خطأ في البحث:', error);
        showNotification('حدث خطأ أثناء البحث، يرجى المحاولة مرة أخرى', 'error');
    } finally {
        hideLoading();
    }
}

// البحث في القرآن
async function searchQuran(query) {
    try {
        const response = await fetch(`https://api.quran.com/api/v4/search?q=${encodeURIComponent(query)}&size=20&language=ar`);
        const data = await response.json();
        
        if (data.search && data.search.results) {
            return data.search.results.map(result => ({
                type: 'quran',
                text: result.text,
                surah: result.verse_key.split(':')[0],
                verse: result.verse_key.split(':')[1],
                translation: result.translations ? result.translations[0].text : ''
            }));
        }
        
        return [];
    } catch (error) {
        console.error('خطأ في البحث في القرآن:', error);
        return [];
    }
}

// البحث في الأحاديث
async function searchHadith(query) {
    // محاكاة البحث في الأحاديث
    const mockHadiths = [
        {
            text: 'إنما الأعمال بالنيات وإنما لكل امرئ ما نوى',
            narrator: 'عمر بن الخطاب',
            source: 'صحيح البخاري',
            grade: 'صحيح'
        },
        {
            text: 'من كان يؤمن بالله واليوم الآخر فليقل خيراً أو ليصمت',
            narrator: 'أبو هريرة',
            source: 'صحيح البخاري',
            grade: 'صحيح'
        }
    ];
    
    return mockHadiths.filter(hadith => 
        hadith.text.includes(query) || 
        hadith.narrator.includes(query)
    ).map(hadith => ({
        type: 'hadith',
        ...hadith
    }));
}

// البحث في الصوتيات
async function searchAudio(query) {
    // محاكاة البحث في الصوتيات
    const mockAudio = [
        { name: 'سورة الفاتحة', reciter: 'مشاري العفاسي', surah: 1 },
        { name: 'سورة البقرة', reciter: 'عبد الرحمن السديس', surah: 2 },
        { name: 'سورة آل عمران', reciter: 'علي الحذيفي', surah: 3 }
    ];
    
    return mockAudio.filter(audio =>
        audio.name.includes(query) ||
        audio.reciter.includes(query)
    ).map(audio => ({
        type: 'audio',
        ...audio
    }));
}

// عرض نتائج البحث
function displaySearchResults(results, type) {
    // إنشاء نافذة النتائج
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>نتائج البحث</h3>
                <button class="close-modal" onclick="closeModal(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="search-results">
                    ${results.length === 0 ? '<p>لا توجد نتائج للبحث</p>' : 
                      results.map(result => formatSearchResult(result)).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // إضافة مستمع لإغلاق النافذة
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modal.querySelector('.close-modal'));
        }
    });
}

// تنسيق نتيجة البحث
function formatSearchResult(result) {
    switch (result.type) {
        case 'quran':
            return `
                <div class="search-result-item">
                    <div class="result-content">
                        <div class="arabic-text">${result.text}</div>
                        ${result.translation ? `<div class="translation">${result.translation}</div>` : ''}
                        <div class="result-info">
                            <span>سورة ${result.surah} - آية ${result.verse}</span>
                        </div>
                    </div>
                </div>
            `;
        case 'hadith':
            return `
                <div class="search-result-item">
                    <div class="result-content">
                        <div class="hadith-text">${result.text}</div>
                        <div class="result-info">
                            <span>الراوي: ${result.narrator}</span>
                            <span>المصدر: ${result.source}</span>
                            <span class="grade ${result.grade}">${result.grade}</span>
                        </div>
                    </div>
                </div>
            `;
        case 'audio':
            return `
                <div class="search-result-item">
                    <div class="result-content">
                        <div class="audio-title">${result.name}</div>
                        <div class="result-info">
                            <span>القارئ: ${result.reciter}</span>
                            <button class="btn btn-primary btn-small" onclick="playAudio(${result.surah})">
                                <i class="fas fa-play"></i> تشغيل
                            </button>
                        </div>
                    </div>
                </div>
            `;
        default:
            return '';
    }
}

// إغلاق النافذة المنبثقة
function closeModal(button) {
    const modal = button.closest('.modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300);
    }
}

// إغلاق جميع النوافذ المنبثقة
function closeAllModals() {
    const modals = document.querySelectorAll('.modal.show');
    modals.forEach(modal => {
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeModal(closeBtn);
        }
    });
    
    // إغلاق قائمة الجوال
    const mobileMenu = document.getElementById('mobile-menu-overlay');
    if (mobileMenu && mobileMenu.classList.contains('show')) {
        mobileMenu.classList.remove('show');
    }
}

// تشغيل الصوت
function playAudio(surahNumber) {
    // الانتقال لصفحة الصوتيات مع السورة المحددة
    window.location.href = `/pages/audio.html#surah-${surahNumber}`;
}

// إظهار التحميل
function showLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('show');
    }
}

// إخفاء التحميل
function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('show');
    }
}

// تهيئة الإشعارات
function initializeNotifications() {
    // إنشاء حاوي الإشعارات إذا لم يكن موجوداً
    if (!document.getElementById('notification-container')) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
}

// إظهار إشعار
function showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="closeNotification(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    // إظهار الإشعار
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // إخفاء الإشعار تلقائياً
    setTimeout(() => {
        closeNotification(notification.querySelector('.notification-close'));
    }, duration);
}

// الحصول على أيقونة الإشعار
function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// إغلاق الإشعار
function closeNotification(button) {
    const notification = button.closest('.notification');
    if (notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// تحميل المحتوى بلغة معينة
async function loadContentInLanguage(langCode) {
    try {
        // هذه وظيفة مستقبلية لتحميل المحتوى بلغات مختلفة
        console.log(`تحميل المحتوى باللغة: ${langCode}`);
        
        // يمكن هنا تحميل ملفات الترجمة أو المحتوى المترجم
        // وتحديث النصوص في الصفحة
        
    } catch (error) {
        console.error('خطأ في تحميل المحتوى:', error);
    }
}

// مساعدات عامة
const utils = {
    // تنسيق التاريخ
    formatDate(date) {
        return date.toLocaleDateString('ar-SA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    // تنسيق الوقت
    formatTime(time) {
        return formatTime(time);
    },
    
    // تحويل الأرقام للعربية
    toArabicNumbers(str) {
        const arabicNumbers = '٠١٢٣٤٥٦٧٨٩';
        return str.replace(/[0-9]/g, (match) => arabicNumbers[match]);
    },
    
    // تحويل الأرقام للإنجليزية
    toEnglishNumbers(str) {
        const englishNumbers = '0123456789';
        return str.replace(/[٠-٩]/g, (match) => englishNumbers['٠١٢٣٤٥٦٧٨٩'.indexOf(match)]);
    },
    
    // تنظيف النص
    cleanText(text) {
        return text.replace(/[؁-؏]/g, '').trim();
    },
    
    // تحقق من الاتصال بالإنترنت
    isOnline() {
        return navigator.onLine;
    },
    
    // حفظ البيانات محلياً
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('خطأ في حفظ البيانات:', error);
            return false;
        }
    },
    
    // استرجاع البيانات المحفوظة
    getFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('خطأ في استرجاع البيانات:', error);
            return null;
        }
    }
};

// تصدير الدوال للاستخدام في ملفات أخرى
window.IslamicLibrary = {
    showNotification,
    closeModal,
    showLoading,
    hideLoading,
    utils,
    currentLanguage,
    currentTheme,
    prayerTimes,
    currentLocation
};

// معالجة الأخطاء العامة
window.addEventListener('error', function(e) {
    console.error('خطأ في التطبيق:', e.error);
    showNotification('حدث خطأ في التطبيق، يرجى إعادة تحميل الصفحة', 'error');
});

// معالجة الأخطاء في الوعود
window.addEventListener('unhandledrejection', function(e) {
    console.error('خطأ في وعد غير معالج:', e.reason);
    showNotification('حدث خطأ في التطبيق، يرجى المحاولة مرة أخرى', 'error');
});

// تحديث حالة الاتصال
window.addEventListener('online', function() {
    showNotification('تم استعادة الاتصال بالإنترنت', 'success');
});

window.addEventListener('offline', function() {
    showNotification('تم قطع الاتصال بالإنترنت، العمل في وضع عدم الاتصال', 'warning');
});

console.log('تم تحميل الملف الرئيسي للمكتبة الإسلامية الرقمية');