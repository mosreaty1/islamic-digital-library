// ملف وظائف القرآن الكريم - المكتبة الإسلامية الرقمية

// متغيرات عامة للقرآن
let currentSurah = null;
let currentVerse = null;
let currentReciter = 'mishary';
let currentTranslation = 'ar';
let currentTafsir = 'none';
let audioPlayer = null;
let isPlaying = false;
let tajweedEnabled = false;
let surahs = [];
let verses = [];

// تهيئة صفحة القرآن
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('quran')) {
        initializeQuranPage();
    }
});

// تهيئة صفحة القرآن
async function initializeQuranPage() {
    try {
        await loadSurahs();
        initializeQuranControls();
        initializeQuranPlayer();
        
        // تحقق من الرابط المباشر للسورة
        const hash = window.location.hash;
        if (hash.startsWith('#surah-')) {
            const surahId = hash.replace('#surah-', '');
            loadSurah(parseInt(surahId));
        }
        
        console.log('تم تهيئة صفحة القرآن بنجاح');
    } catch (error) {
        console.error('خطأ في تهيئة صفحة القرآن:', error);
        showNotification('حدث خطأ في تحميل القرآن الكريم', 'error');
    }
}

// تحميل قائمة السور
async function loadSurahs() {
    try {
        // محاولة تحميل من الملف المحلي أولاً
        let response = await fetch('/data/surahs.json');
        
        if (!response.ok) {
            // إذا لم يكن متاحاً، استخدم API
            response = await fetch('https://api.quran.com/api/v4/chapters?language=ar');
        }
        
        const data = await response.json();
        surahs = data.chapters || data;
        
        displaySurahs();
        
    } catch (error) {
        console.error('خطأ في تحميل السور:', error);
        // استخدام بيانات افتراضية
        surahs = getDefaultSurahs();
        displaySurahs();
    }
}

// عرض قائمة السور
function displaySurahs() {
    const surahsList = document.getElementById('surahs-list');
    if (!surahsList) return;
    
    surahsList.innerHTML = surahs.map(surah => `
        <div class="surah-card" onclick="loadSurah(${surah.id})">
            <div class="surah-number">${surah.id}</div>
            <div class="surah-info">
                <h3 class="surah-name-arabic">${surah.name_arabic}</h3>
                <div class="surah-details">
                    <span class="surah-type">${surah.revelation_place || 'مكية'}</span>
                    <span class="surah-verses">${surah.verses_count} آية</span>
                </div>
            </div>
            <div class="surah-actions">
                <button onclick="event.stopPropagation(); playSurah(${surah.id})" class="btn-icon">
                    <i class="fas fa-play"></i>
                </button>
                <button onclick="event.stopPropagation(); bookmarkSurah(${surah.id})" class="btn-icon">
                    <i class="fas fa-bookmark"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// بيانات السور الافتراضية
function getDefaultSurahs() {
    return [
        { id: 1, name_arabic: "الفاتحة", verses_count: 7, revelation_place: "مكية" },
        { id: 2, name_arabic: "البقرة", verses_count: 286, revelation_place: "مدنية" },
        { id: 3, name_arabic: "آل عمران", verses_count: 200, revelation_place: "مدنية" },
        { id: 4, name_arabic: "النساء", verses_count: 176, revelation_place: "مدنية" },
        { id: 5, name_arabic: "المائدة", verses_count: 120, revelation_place: "مدنية" },
        { id: 6, name_arabic: "الأنعام", verses_count: 165, revelation_place: "مكية" },
        { id: 7, name_arabic: "الأعراف", verses_count: 206, revelation_place: "مكية" },
        { id: 8, name_arabic: "الأنفال", verses_count: 75, revelation_place: "مدنية" },
        { id: 9, name_arabic: "التوبة", verses_count: 129, revelation_place: "مدنية" },
        { id: 10, name_arabic: "يونس", verses_count: 109, revelation_place: "مكية" }
    ];
}

// تحميل سورة معينة
async function loadSurah(surahId) {
    try {
        showLoading();
        
        // تحميل آيات السورة
        const response = await fetch(`https://api.quran.com/api/v4/chapters/${surahId}/verses?language=ar&words=false&translation_key=131`);
        const data = await response.json();
        
        if (data.verses) {
            currentSurah = surahId;
            verses = data.verses;
            
            displaySurah(surahId);
            
            // تحديث URL
            window.history.pushState({}, '', `#surah-${surahId}`);
        }
        
    } catch (error) {
        console.error('خطأ في تحميل السورة:', error);
        showNotification('حدث خطأ في تحميل السورة', 'error');
    } finally {
        hideLoading();
    }
}

// عرض السورة
function displaySurah(surahId) {
    const surah = surahs.find(s => s.id === surahId);
    if (!surah) return;
    
    // تحديث معلومات السورة
    document.getElementById('surah-name').textContent = surah.name_arabic;
    document.getElementById('surah-type').textContent = surah.revelation_place || 'مكية';
    document.getElementById('surah-verses').textContent = `${surah.verses_count} آية`;
    
    // إظهار عرض السورة
    document.getElementById('surah-display').style.display = 'block';
    
    // إخفاء أو إظهار البسملة
    const basmala = document.getElementById('basmala');
    if (basmala) {
        basmala.style.display = (surahId === 1 || surahId === 9) ? 'none' : 'block';
    }
    
    // عرض الآيات
    displayVerses();
    
    // التمرير إلى السورة
    document.getElementById('surah-display').scrollIntoView({ behavior: 'smooth' });
}

// عرض الآيات
function displayVerses() {
    const container = document.getElementById('verses-container');
    if (!container) return;
    
    container.innerHTML = verses.map(verse => `
        <div class="verse-container" data-verse="${verse.verse_number}">
            <div class="verse-number">${verse.verse_number}</div>
            <div class="verse-content">
                <div class="verse-arabic ${tajweedEnabled ? 'tajweed-colors' : ''}" 
                     onclick="showVerseModal(${verse.verse_number})">
                    ${verse.text_uthmani || verse.text_imlaei}
                </div>
                ${verse.translations && verse.translations.length > 0 ? `
                    <div class="verse-translation">
                        ${verse.translations[0].text}
                    </div>
                ` : ''}
                <div class="verse-actions">
                    <button onclick="playVerse(${verse.verse_number})" class="btn-icon" title="تشغيل الآية">
                        <i class="fas fa-play"></i>
                    </button>
                    <button onclick="bookmarkVerse(${currentSurah}, ${verse.verse_number})" class="btn-icon" title="حفظ الآية">
                        <i class="fas fa-bookmark"></i>
                    </button>
                    <button onclick="shareVerse(${currentSurah}, ${verse.verse_number})" class="btn-icon" title="مشاركة الآية">
                        <i class="fas fa-share"></i>
                    </button>
                    <button onclick="showVerseModal(${verse.verse_number})" class="btn-icon" title="عرض التفاصيل">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// تهيئة أدوات التحكم
function initializeQuranControls() {
    // تبديل الترجمة
    const translationSelect = document.getElementById('translation-select');
    if (translationSelect) {
        translationSelect.addEventListener('change', function() {
            currentTranslation = this.value;
            if (currentSurah) {
                loadSurah(currentSurah);
            }
        });
    }
    
    // تبديل التفسير
    const tafsirSelect = document.getElementById('tafsir-select');
    if (tafsirSelect) {
        tafsirSelect.addEventListener('change', function() {
            currentTafsir = this.value;
            // تحديث عرض التفسير
            updateTafsirDisplay();
        });
    }
    
    // تبديل القارئ
    const reciterSelect = document.getElementById('reciter-select');
    if (reciterSelect) {
        reciterSelect.addEventListener('change', function() {
            currentReciter = this.value;
        });
    }
    
    // تبديل أحكام التجويد
    const tajweedToggle = document.getElementById('tajweed-toggle');
    if (tajweedToggle) {
        tajweedToggle.addEventListener('click', function() {
            tajweedEnabled = !tajweedEnabled;
            this.classList.toggle('active', tajweedEnabled);
            
            // تحديث عرض الآيات
            const arabicTexts = document.querySelectorAll('.verse-arabic');
            arabicTexts.forEach(text => {
                text.classList.toggle('tajweed-colors', tajweedEnabled);
            });
            
            showNotification(tajweedEnabled ? 'تم تفعيل ألوان التجويد' : 'تم إلغاء ألوان التجويد', 'success');
        });
    }
    
    // البحث في السور
    const surahSearch = document.getElementById('surah-search');
    if (surahSearch) {
        surahSearch.addEventListener('input', function() {
            filterSurahs(this.value);
        });
    }
}

// تصفية السور
function filterSurahs(query) {
    const filteredSurahs = surahs.filter(surah => 
        surah.name_arabic.includes(query) || 
        surah.id.toString().includes(query)
    );
    
    const surahsList = document.getElementById('surahs-list');
    if (surahsList) {
        surahsList.innerHTML = filteredSurahs.map(surah => `
            <div class="surah-card" onclick="loadSurah(${surah.id})">
                <div class="surah-number">${surah.id}</div>
                <div class="surah-info">
                    <h3 class="surah-name-arabic">${surah.name_arabic}</h3>
                    <div class="surah-details">
                        <span class="surah-type">${surah.revelation_place || 'مكية'}</span>
                        <span class="surah-verses">${surah.verses_count} آية</span>
                    </div>
                </div>
                <div class="surah-actions">
                    <button onclick="event.stopPropagation(); playSurah(${surah.id})" class="btn-icon">
                        <i class="fas fa-play"></i>
                    </button>
                    <button onclick="event.stopPropagation(); bookmarkSurah(${surah.id})" class="btn-icon">
                        <i class="fas fa-bookmark"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
}

// تهيئة مشغل الصوت
function initializeQuranPlayer() {
    audioPlayer = document.getElementById('audio-element');
    if (!audioPlayer) return;
    
    const playPauseBtn = document.getElementById('play-pause');
    const prevBtn = document.getElementById('prev-verse');
    const nextBtn = document.getElementById('next-verse');
    const progressBar = document.getElementById('progress-fill');
    
    // تشغيل/إيقاف
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', togglePlayPause);
    }
    
    // الآية السابقة
    if (prevBtn) {
        prevBtn.addEventListener('click', playPreviousVerse);
    }
    
    // الآية التالية
    if (nextBtn) {
        nextBtn.addEventListener('click', playNextVerse);
    }
    
    // تحديث التقدم
    if (audioPlayer) {
        audioPlayer.addEventListener('timeupdate', updateProgress);
        audioPlayer.addEventListener('ended', playNextVerse);
        audioPlayer.addEventListener('loadstart', showAudioLoading);
        audioPlayer.addEventListener('canplay', hideAudioLoading);
    }
}

// تشغيل السورة
function playSurah(surahId) {
    if (currentSurah !== surahId) {
        loadSurah(surahId).then(() => {
            playVerse(1);
        });
    } else {
        playVerse(1);
    }
}

// تشغيل آية معينة
function playVerse(verseNumber) {
    if (!currentSurah) return;
    
    currentVerse = verseNumber;
    
    // تحديث واجهة المشغل
    const audioPlayer = document.getElementById('audio-player');
    if (audioPlayer) {
        audioPlayer.style.display = 'block';
        audioPlayer.classList.add('active');
    }
    
    // بناء رابط الصوت
    const audioUrl = getAudioUrl(currentSurah, verseNumber);
    
    // تشغيل الصوت
    const audio = document.getElementById('audio-element');
    if (audio) {
        audio.src = audioUrl;
        audio.load();
        audio.play().then(() => {
            isPlaying = true;
            updatePlayButton();
            highlightCurrentVerse();
        }).catch(error => {
            console.error('خطأ في تشغيل الصوت:', error);
            showNotification('حدث خطأ في تشغيل الصوت', 'error');
        });
    }
}

// الحصول على رابط الصوت
function getAudioUrl(surahId, verseNumber) {
    const paddedSurah = surahId.toString().padStart(3, '0');
    const paddedVerse = verseNumber.toString().padStart(3, '0');
    
    // روابط القراء المختلفين
    const reciterUrls = {
        'mishary': `https://everyayah.com/data/Mishary_Rashid_Alafasy_128kbps/${paddedSurah}${paddedVerse}.mp3`,
        'sudais': `https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/${paddedSurah}${paddedVerse}.mp3`,
        'hudhaify': `https://everyayah.com/data/Hudhaify_128kbps/${paddedSurah}${paddedVerse}.mp3`,
        'ajmi': `https://everyayah.com/data/Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net/${paddedSurah}${paddedVerse}.mp3`,
        'minshawi': `https://everyayah.com/data/Minshawi_Murattal_128kbps/${paddedSurah}${paddedVerse}.mp3`
    };
    
    return reciterUrls[currentReciter] || reciterUrls['mishary'];
}

// تبديل تشغيل/إيقاف
function togglePlayPause() {
    const audio = document.getElementById('audio-element');
    if (!audio) return;
    
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
    } else {
        audio.play();
        isPlaying = true;
    }
    
    updatePlayButton();
}

// تحديث زر التشغيل
function updatePlayButton() {
    const playBtn = document.querySelector('#play-pause i');
    if (playBtn) {
        playBtn.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }
}

// تشغيل الآية السابقة
function playPreviousVerse() {
    if (currentVerse > 1) {
        playVerse(currentVerse - 1);
    }
}

// تشغيل الآية التالية
function playNextVerse() {
    const surah = surahs.find(s => s.id === currentSurah);
    if (surah && currentVerse < surah.verses_count) {
        playVerse(currentVerse + 1);
    } else {
        // انتهت السورة
        isPlaying = false;
        updatePlayButton();
        showNotification('انتهت السورة', 'info');
    }
}

// تحديث شريط التقدم
function updateProgress() {
    const audio = document.getElementById('audio-element');
    const progressFill = document.getElementById('progress-fill');
    const currentTime = document.getElementById('current-time');
    const totalTime = document.getElementById('total-time');
    
    if (!audio || !progressFill) return;
    
    const percent = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = percent + '%';
    
    if (currentTime) {
        currentTime.textContent = formatTime(audio.currentTime);
    }
    
    if (totalTime) {
        totalTime.textContent = formatTime(audio.duration);
    }
}

// تنسيق الوقت
function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// إبراز الآية الحالية
function highlightCurrentVerse() {
    // إزالة التمييز السابق
    const highlighted = document.querySelector('.verse-container.current');
    if (highlighted) {
        highlighted.classList.remove('current');
    }
    
    // إضافة التمييز للآية الحالية
    const currentVerseElement = document.querySelector(`[data-verse="${currentVerse}"]`);
    if (currentVerseElement) {
        currentVerseElement.classList.add('current');
        currentVerseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// إظهار تحميل الصوت
function showAudioLoading() {
    const playBtn = document.querySelector('#play-pause i');
    if (playBtn) {
        playBtn.className = 'fas fa-spinner fa-spin';
    }
}

// إخفاء تحميل الصوت
function hideAudioLoading() {
    updatePlayButton();
}

// إظهار نافذة تفاصيل الآية
function showVerseModal(verseNumber) {
    const verse = verses.find(v => v.verse_number === verseNumber);
    if (!verse) return;
    
    const modal = document.getElementById('verse-modal');
    if (!modal) return;
    
    // تحديث محتوى النافذة
    document.getElementById('verse-modal-title').textContent = `سورة ${surahs.find(s => s.id === currentSurah)?.name_arabic} - آية ${verseNumber}`;
    document.getElementById('verse-modal-arabic').textContent = verse.text_uthmani || verse.text_imlaei;
    
    if (verse.translations && verse.translations.length > 0) {
        document.getElementById('verse-modal-translation').textContent = verse.translations[0].text;
    }
    
    // تحميل التفسير إذا كان مطلوباً
    if (currentTafsir !== 'none') {
        loadTafsir(currentSurah, verseNumber);
    }
    
    // إظهار النافذة
    modal.style.display = 'flex';
    modal.classList.add('show');
}

// تحميل التفسير
async function loadTafsir(surahId, verseNumber) {
    try {
        // محاولة تحميل التفسير من API
        const response = await fetch(`https://api.quran.com/api/v4/verses/${surahId}:${verseNumber}/tafsirs/${currentTafsir}`);
        const data = await response.json();
        
        if (data.tafsir) {
            document.getElementById('verse-modal-tafsir').innerHTML = `
                <h4>التفسير:</h4>
                <p>${data.tafsir.text}</p>
            `;
        }
    } catch (error) {
        console.error('خطأ في تحميل التفسير:', error);
        document.getElementById('verse-modal-tafsir').innerHTML = `
            <p>التفسير غير متاح حالياً</p>
        `;
    }
}

// حفظ الآية في المفضلة
function bookmarkVerse(surahId, verseNumber) {
    const bookmarks = JSON.parse(localStorage.getItem('quran-bookmarks') || '[]');
    
    const bookmark = {
        surah: surahId,
        verse: verseNumber,
        timestamp: new Date().toISOString()
    };
    
    // التحقق من وجود العلامة المرجعية
    const exists = bookmarks.some(b => b.surah === surahId && b.verse === verseNumber);
    
    if (!exists) {
        bookmarks.push(bookmark);
        localStorage.setItem('quran-bookmarks', JSON.stringify(bookmarks));
        showNotification('تم حفظ الآية في المفضلة', 'success');
    } else {
        showNotification('الآية محفوظة مسبقاً في المفضلة', 'info');
    }
}

// حفظ السورة في المفضلة
function bookmarkSurah(surahId) {
    const bookmarks = JSON.parse(localStorage.getItem('surah-bookmarks') || '[]');
    
    const bookmark = {
        surah: surahId,
        timestamp: new Date().toISOString()
    };
    
    const exists = bookmarks.some(b => b.surah === surahId);
    
    if (!exists) {
        bookmarks.push(bookmark);
        localStorage.setItem('surah-bookmarks', JSON.stringify(bookmarks));
        showNotification('تم حفظ السورة في المفضلة', 'success');
    } else {
        showNotification('السورة محفوظة مسبقاً في المفضلة', 'info');
    }
}

// مشاركة الآية
function shareVerse(surahId, verseNumber) {
    const verse = verses.find(v => v.verse_number === verseNumber);
    const surah = surahs.find(s => s.id === surahId);
    
    if (!verse || !surah) return;
    
    const shareText = `${verse.text_uthmani || verse.text_imlaei}\n\n﴿ سورة ${surah.name_arabic} - آية ${verseNumber} ﴾`;
    
    if (navigator.share) {
        navigator.share({
            title: `سورة ${surah.name_arabic} - آية ${verseNumber}`,
            text: shareText,
            url: `${window.location.origin}/pages/quran.html#surah-${surahId}-verse-${verseNumber}`
        });
    } else {
        // نسخ إلى الحافظة
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('تم نسخ الآية إلى الحافظة', 'success');
        }).catch(() => {
            showNotification('لم يتم نسخ الآية', 'error');
        });
    }
}

// إغلاق نافذة الآية
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('close-modal')) {
        const modal = e.target.closest('.modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }
});

// دعم اختصارات لوحة المفاتيح
document.addEventListener('keydown', function(e) {
    if (document.querySelector('.modal.show')) {
        return; // لا تعمل الاختصارات في النوافذ المنبثقة
    }
    
    switch(e.key) {
        case ' ': // مسافة = تشغيل/إيقاف
            e.preventDefault();
            togglePlayPause();
            break;
        case 'ArrowLeft': // يمين = الآية السابقة
            e.preventDefault();
            playPreviousVerse();
            break;
        case 'ArrowRight': // يسار = الآية التالية
            e.preventDefault();
            playNextVerse();
            break;
    }
});

console.log('تم تحميل ملف وظائف القرآن الكريم');