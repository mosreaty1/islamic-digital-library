// ملف وظائف مكتبة التلاوات الصوتية - المكتبة الإسلامية الرقمية

// متغيرات عامة للصوتيات
let audioSurahs = [];
let currentAudio = null;
let currentSurahId = null;
let currentReciter = 'mishary';
let isAudioPlaying = false;
let currentVolume = 0.7;
let playbackSpeed = 1.0;
let playlistItems = [];
let currentPlaylistIndex = 0;
let isShuffleEnabled = false;
let isRepeatEnabled = false;
let audioProgress = 0;

// بيانات القراء
const reciters = {
    'mishary': {
        name: 'مشاري راشد العفاسي',
        country: 'الكويت',
        style: 'مرتل',
        baseUrl: 'https://everyayah.com/data/Mishary_Rashid_Alafasy_128kbps'
    },
    'sudais': {
        name: 'عبد الرحمن السديس',
        country: 'السعودية',
        style: 'مرتل',
        baseUrl: 'https://everyayah.com/data/Abdul_Basit_Murattal_192kbps'
    },
    'hudhaify': {
        name: 'علي بن عبد الرحمن الحذيفي',
        country: 'السعودية',
        style: 'مرتل',
        baseUrl: 'https://everyayah.com/data/Hudhaify_128kbps'
    },
    'ajmi': {
        name: 'أحمد بن علي العجمي',
        country: 'السعودية',
        style: 'مرتل',
        baseUrl: 'https://everyayah.com/data/Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net'
    },
    'minshawi': {
        name: 'محمد صديق المنشاوي',
        country: 'مصر',
        style: 'مجود',
        baseUrl: 'https://everyayah.com/data/Minshawi_Murattal_128kbps'
    },
    'husary': {
        name: 'محمود خليل الحصري',
        country: 'مصر',
        style: 'مجود',
        baseUrl: 'https://everyayah.com/data/Husary_128kbps'
    }
};

// تهيئة صفحة الصوتيات
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('audio')) {
        initializeAudioPage();
    }
});

// تهيئة صفحة الصوتيات
async function initializeAudioPage() {
    try {
        await loadAudioSurahs();
        initializeAudioPlayer();
        initializeAudioControls();
        initializePlaylist();
        
        // تحقق من الرابط المباشر
        const hash = window.location.hash;
        if (hash.startsWith('#surah-')) {
            const surahId = hash.replace('#surah-', '');
            loadSurahAudio(parseInt(surahId));
        }
        
        console.log('تم تهيئة صفحة الصوتيات بنجاح');
    } catch (error) {
        console.error('خطأ في تهيئة صفحة الصوتيات:', error);
        showNotification('حدث خطأ في تحميل مكتبة الصوتيات', 'error');
    }
}

// تحميل قائمة السور للصوتيات
async function loadAudioSurahs() {
    try {
        // محاولة تحميل من الملف المحلي
        let response = await fetch('/data/surahs.json');
        
        if (!response.ok) {
            // استخدام API كبديل
            response = await fetch('https://api.quran.com/api/v4/chapters?language=ar');
        }
        
        const data = await response.json();
        audioSurahs = data.chapters || data;
        
        displayAudioSurahs();
        
    } catch (error) {
        console.error('خطأ في تحميل السور:', error);
        // استخدام بيانات افتراضية
        audioSurahs = getDefaultAudioSurahs();
        displayAudioSurahs();
    }
}

// عرض قائمة السور للصوتيات
function displayAudioSurahs() {
    const surahsList = document.getElementById('surahs-audio-list');
    if (!surahsList) return;
    
    surahsList.innerHTML = audioSurahs.map(surah => `
        <div class="audio-surah-card" data-surah-id="${surah.id}">
            <div class="surah-info">
                <h3 class="surah-name">${surah.name_arabic}</h3>
                <div class="surah-details">
                    <span class="surah-number">#${surah.id}</span>
                    <span class="surah-verses">${surah.verses_count} آية</span>
                    <span class="surah-type">${surah.revelation_place || 'مكية'}</span>
                </div>
            </div>
            <div class="surah-actions">
                <button onclick="loadSurahAudio(${surah.id})" class="btn btn-primary btn-small">
                    <i class="fas fa-play"></i>
                    تشغيل
                </button>
                <button onclick="addToPlaylist(${surah.id})" class="btn btn-secondary btn-small">
                    <i class="fas fa-plus"></i>
                    إضافة للقائمة
                </button>
                <button onclick="downloadSurah(${surah.id})" class="btn btn-secondary btn-small">
                    <i class="fas fa-download"></i>
                    تحميل
                </button>
            </div>
        </div>
    `).join('');
}

// بيانات السور الافتراضية
function getDefaultAudioSurahs() {
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

// تحميل تلاوة السورة
function loadSurahAudio(surahId) {
    const surah = audioSurahs.find(s => s.id === surahId);
    if (!surah) return;
    
    currentSurahId = surahId;
    
    // تحديث معلومات المشغل
    updatePlayerInfo(surah);
    
    // بناء رابط الصوت
    const audioUrl = buildAudioUrl(surahId);
    
    // تحميل وتشغيل الصوت
    loadAndPlayAudio(audioUrl);
    
    // تحديث URL
    window.history.pushState({}, '', `#surah-${surahId}`);
    
    // إظهار المشغل
    showMainPlayer();
}

// بناء رابط الصوت
function buildAudioUrl(surahId) {
    const reciter = reciters[currentReciter];
    const paddedSurahId = surahId.toString().padStart(3, '0');
    
    // للسور الكاملة، نستخدم ملف واحد إذا كان متاحاً
    // وإلا نستخدم الآية الأولى
    return `${reciter.baseUrl}/${paddedSurahId}001.mp3`;
}

// تحميل وتشغيل الصوت
function loadAndPlayAudio(audioUrl) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
    
    currentAudio = document.getElementById('main-audio');
    if (!currentAudio) return;
    
    currentAudio.src = audioUrl;
    currentAudio.playbackRate = playbackSpeed;
    currentAudio.volume = currentVolume;
    
    currentAudio.load();
    
    currentAudio.play().then(() => {
        isAudioPlaying = true;
        updatePlayPauseButton();
        showNotification('بدأ التشغيل', 'success');
    }).catch(error => {
        console.error('خطأ في تشغيل الصوت:', error);
        showNotification('حدث خطأ في تشغيل الصوت', 'error');
    });
}

// تحديث معلومات المشغل
function updatePlayerInfo(surah) {
    const surahNameElement = document.getElementById('current-surah-name');
    const reciterNameElement = document.getElementById('current-reciter-name');
    const surahImageElement = document.getElementById('current-surah-image');
    
    if (surahNameElement) {
        surahNameElement.textContent = surah.name_arabic;
    }
    
    if (reciterNameElement) {
        reciterNameElement.textContent = reciters[currentReciter].name;
    }
    
    if (surahImageElement) {
        surahImageElement.src = `/assets/images/surahs/surah-${surah.id}.png`;
        surahImageElement.alt = surah.name_arabic;
    }
}

// إظهار المشغل الرئيسي
function showMainPlayer() {
    const player = document.getElementById('main-audio-player');
    if (player) {
        player.style.display = 'block';
        player.classList.add('active');
        
        // التمرير إلى المشغل
        player.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// تهيئة المشغل الصوتي
function initializeAudioPlayer() {
    currentAudio = document.getElementById('main-audio');
    if (!currentAudio) return;
    
    // أحداث المشغل
    currentAudio.addEventListener('timeupdate', updateAudioProgress);
    currentAudio.addEventListener('ended', handleAudioEnded);
    currentAudio.addEventListener('loadstart', showAudioBuffering);
    currentAudio.addEventListener('canplay', hideAudioBuffering);
    currentAudio.addEventListener('error', handleAudioError);
    
    // تحديث الصوت والسرعة
    currentAudio.volume = currentVolume;
    currentAudio.playbackRate = playbackSpeed;
}

// تهيئة أدوات التحكم
function initializeAudioControls() {
    // تشغيل/إيقاف
    const playPauseBtn = document.getElementById('play-pause-btn');
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', togglePlayPause);
    }
    
    // السورة السابقة
    const prevBtn = document.getElementById('prev-surah-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', playPreviousSurah);
    }
    
    // السورة التالية
    const nextBtn = document.getElementById('next-surah-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', playNextSurah);
    }
    
    // العشوائي
    const shuffleBtn = document.getElementById('shuffle-btn');
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', toggleShuffle);
    }
    
    // التكرار
    const repeatBtn = document.getElementById('repeat-btn');
    if (repeatBtn) {
        repeatBtn.addEventListener('click', toggleRepeat);
    }
    
    // شريط التقدم
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.addEventListener('click', seekAudio);
    }
    
    // مستوى الصوت
    const volumeRange = document.getElementById('volume-range');
    if (volumeRange) {
        volumeRange.addEventListener('input', updateVolume);
        volumeRange.value = currentVolume * 100;
    }
    
    // زر الصوت
    const volumeBtn = document.getElementById('volume-btn');
    if (volumeBtn) {
        volumeBtn.addEventListener('click', toggleMute);
    }
    
    // تحديد القارئ
    const reciterSelect = document.getElementById('reciter-select');
    if (reciterSelect) {
        reciterSelect.addEventListener('change', changeReciter);
    }
    
    // سرعة التشغيل
    const speedRange = document.getElementById('playback-speed');
    if (speedRange) {
        speedRange.addEventListener('input', updatePlaybackSpeed);
    }
}

// تبديل تشغيل/إيقاف
function togglePlayPause() {
    if (!currentAudio) return;
    
    if (isAudioPlaying) {
        currentAudio.pause();
        isAudioPlaying = false;
    } else {
        currentAudio.play();
        isAudioPlaying = true;
    }
    
    updatePlayPauseButton();
}

// تحديث زر التشغيل/الإيقاف
function updatePlayPauseButton() {
    const playPauseBtn = document.querySelector('#play-pause-btn i');
    if (playPauseBtn) {
        playPauseBtn.className = isAudioPlaying ? 'fas fa-pause' : 'fas fa-play';
    }
}

// تشغيل السورة السابقة
function playPreviousSurah() {
    if (playlistItems.length > 0) {
        currentPlaylistIndex = (currentPlaylistIndex - 1 + playlistItems.length) % playlistItems.length;
        const surahId = playlistItems[currentPlaylistIndex];
        loadSurahAudio(surahId);
    } else if (currentSurahId > 1) {
        loadSurahAudio(currentSurahId - 1);
    }
}

// تشغيل السورة التالية
function playNextSurah() {
    if (playlistItems.length > 0) {
        if (isShuffleEnabled) {
            currentPlaylistIndex = Math.floor(Math.random() * playlistItems.length);
        } else {
            currentPlaylistIndex = (currentPlaylistIndex + 1) % playlistItems.length;
        }
        const surahId = playlistItems[currentPlaylistIndex];
        loadSurahAudio(surahId);
    } else if (currentSurahId < audioSurahs.length) {
        loadSurahAudio(currentSurahId + 1);
    }
}

// تبديل العشوائي
function toggleShuffle() {
    isShuffleEnabled = !isShuffleEnabled;
    const shuffleBtn = document.getElementById('shuffle-btn');
    if (shuffleBtn) {
        shuffleBtn.classList.toggle('active', isShuffleEnabled);
    }
    
    showNotification(isShuffleEnabled ? 'تم تفعيل التشغيل العشوائي' : 'تم إلغاء التشغيل العشوائي', 'info');
}

// تبديل التكرار
function toggleRepeat() {
    isRepeatEnabled = !isRepeatEnabled;
    const repeatBtn = document.getElementById('repeat-btn');
    if (repeatBtn) {
        repeatBtn.classList.toggle('active', isRepeatEnabled);
    }
    
    showNotification(isRepeatEnabled ? 'تم تفعيل التكرار' : 'تم إلغاء التكرار', 'info');
}

// تحديث تقدم الصوت
function updateAudioProgress() {
    if (!currentAudio) return;
    
    const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
    audioProgress = progress;
    
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
        progressFill.style.width = progress + '%';
    }
    
    const progressHandle = document.getElementById('progress-handle');
    if (progressHandle) {
        progressHandle.style.left = progress + '%';
    }
    
    // تحديث عرض الوقت
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');
    
    if (currentTimeEl) {
        currentTimeEl.textContent = formatAudioTime(currentAudio.currentTime);
    }
    
    if (totalTimeEl) {
        totalTimeEl.textContent = formatAudioTime(currentAudio.duration);
    }
}

// تنسيق الوقت
function formatAudioTime(seconds) {
    if (isNaN(seconds) || seconds === 0) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

// البحث في الصوت
function seekAudio(event) {
    if (!currentAudio) return;
    
    const progressBar = event.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    
    const percentage = clickX / width;
    const seekTime = percentage * currentAudio.duration;
    
    currentAudio.currentTime = seekTime;
}

// تحديث مستوى الصوت
function updateVolume(event) {
    currentVolume = event.target.value / 100;
    
    if (currentAudio) {
        currentAudio.volume = currentVolume;
    }
    
    // تحديث أيقونة الصوت
    updateVolumeIcon();
}

// تحديث أيقونة الصوت
function updateVolumeIcon() {
    const volumeBtn = document.querySelector('#volume-btn i');
    if (!volumeBtn) return;
    
    if (currentVolume === 0) {
        volumeBtn.className = 'fas fa-volume-mute';
    } else if (currentVolume < 0.5) {
        volumeBtn.className = 'fas fa-volume-down';
    } else {
        volumeBtn.className = 'fas fa-volume-up';
    }
}

// تبديل كتم الصوت
function toggleMute() {
    if (currentVolume > 0) {
        // كتم الصوت
        currentAudio.volume = 0;
        document.getElementById('volume-range').value = 0;
        currentVolume = 0;
    } else {
        // إلغاء كتم الصوت
        currentVolume = 0.7;
        currentAudio.volume = currentVolume;
        document.getElementById('volume-range').value = currentVolume * 100;
    }
    
    updateVolumeIcon();
}

// تغيير القارئ
function changeReciter(event) {
    const newReciter = event.target.value;
    currentReciter = newReciter;
    
    // إذا كان هناك صوت يتم تشغيله، إعادة تحميله بصوت القارئ الجديد
    if (currentSurahId) {
        loadSurahAudio(currentSurahId);
    }
    
    showNotification(`تم تغيير القارئ إلى ${reciters[newReciter].name}`, 'success');
}

// تحديث سرعة التشغيل
function updatePlaybackSpeed(event) {
    playbackSpeed = parseFloat(event.target.value);
    
    if (currentAudio) {
        currentAudio.playbackRate = playbackSpeed;
    }
    
    const speedValue = document.getElementById('speed-value');
    if (speedValue) {
        speedValue.textContent = playbackSpeed + 'x';
    }
}

// معالجة انتهاء الصوت
function handleAudioEnded() {
    if (isRepeatEnabled) {
        // إعادة تشغيل نفس السورة
        currentAudio.currentTime = 0;
        currentAudio.play();
    } else {
        // الانتقال للسورة التالية
        playNextSurah();
    }
}

// إظهار تحميل الصوت
function showAudioBuffering() {
    const playPauseBtn = document.querySelector('#play-pause-btn i');
    if (playPauseBtn) {
        playPauseBtn.className = 'fas fa-spinner fa-spin';
    }
}

// إخفاء تحميل الصوت
function hideAudioBuffering() {
    updatePlayPauseButton();
}

// معالجة خطأ الصوت
function handleAudioError(event) {
    console.error('خطأ في الصوت:', event);
    showNotification('حدث خطأ في تشغيل الصوت', 'error');
    
    // محاولة تشغيل قارئ آخر
    const reciterKeys = Object.keys(reciters);
    const currentIndex = reciterKeys.indexOf(currentReciter);
    const nextIndex = (currentIndex + 1) % reciterKeys.length;
    const nextReciter = reciterKeys[nextIndex];
    
    if (nextReciter !== currentReciter) {
        currentReciter = nextReciter;
        showNotification(`جاري المحاولة مع ${reciters[nextReciter].name}`, 'info');
        setTimeout(() => {
            if (currentSurahId) {
                loadSurahAudio(currentSurahId);
            }
        }, 1000);
    }
}

// تهيئة قائمة التشغيل
function initializePlaylist() {
    // تحميل قائمة التشغيل المحفوظة
    const savedPlaylist = localStorage.getItem('audio-playlist');
    if (savedPlaylist) {
        playlistItems = JSON.parse(savedPlaylist);
        updatePlaylistDisplay();
    }
    
    // أحداث أزرار قائمة التشغيل
    const saveBtn = document.getElementById('save-playlist');
    const loadBtn = document.getElementById('load-playlist');
    const clearBtn = document.getElementById('clear-playlist');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', savePlaylist);
    }
    
    if (loadBtn) {
        loadBtn.addEventListener('click', loadPlaylist);
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearPlaylist);
    }
}

// إضافة سورة لقائمة التشغيل
function addToPlaylist(surahId) {
    if (!playlistItems.includes(surahId)) {
        playlistItems.push(surahId);
        updatePlaylistDisplay();
        savePlaylistToStorage();
        showNotification('تم إضافة السورة لقائمة التشغيل', 'success');
    } else {
        showNotification('السورة موجودة مسبقاً في قائمة التشغيل', 'info');
    }
}

// تحديث عرض قائمة التشغيل
function updatePlaylistDisplay() {
    const playlist = document.getElementById('playlist');
    if (!playlist) return;
    
    if (playlistItems.length === 0) {
        playlist.innerHTML = `
            <div class="playlist-empty">
                <i class="fas fa-music"></i>
                <p>قائمة التشغيل فارغة</p>
                <p>أضف سوراً من القائمة أعلاه</p>
            </div>
        `;
        return;
    }
    
    playlist.innerHTML = playlistItems.map((surahId, index) => {
        const surah = audioSurahs.find(s => s.id === surahId);
        if (!surah) return '';
        
        return `
            <div class="playlist-item ${index === currentPlaylistIndex ? 'active' : ''}" data-index="${index}">
                <div class="playlist-item-info">
                    <h4>${surah.name_arabic}</h4>
                    <p>${surah.verses_count} آية</p>
                </div>
                <div class="playlist-item-actions">
                    <button onclick="playFromPlaylist(${index})" class="btn-icon">
                        <i class="fas fa-play"></i>
                    </button>
                    <button onclick="removeFromPlaylist(${index})" class="btn-icon">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// تشغيل من قائمة التشغيل
function playFromPlaylist(index) {
    if (index >= 0 && index < playlistItems.length) {
        currentPlaylistIndex = index;
        const surahId = playlistItems[index];
        loadSurahAudio(surahId);
        updatePlaylistDisplay();
    }
}

// إزالة من قائمة التشغيل
function removeFromPlaylist(index) {
    if (index >= 0 && index < playlistItems.length) {
        playlistItems.splice(index, 1);
        
        // تحديث الفهرس الحالي
        if (currentPlaylistIndex >= index) {
            currentPlaylistIndex = Math.max(0, currentPlaylistIndex - 1);
        }
        
        updatePlaylistDisplay();
        savePlaylistToStorage();
        showNotification('تم إزالة السورة من قائمة التشغيل', 'success');
    }
}

// حفظ قائمة التشغيل
function savePlaylist() {
    if (playlistItems.length === 0) {
        showNotification('قائمة التشغيل فارغة', 'warning');
        return;
    }
    
    const playlistName = prompt('اسم قائمة التشغيل:');
    if (!playlistName) return;
    
    const playlists = JSON.parse(localStorage.getItem('saved-playlists') || '{}');
    playlists[playlistName] = [...playlistItems];
    
    localStorage.setItem('saved-playlists', JSON.stringify(playlists));
    showNotification(`تم حفظ قائمة التشغيل "${playlistName}"`, 'success');
}

// تحميل قائمة التشغيل
function loadPlaylist() {
    const playlists = JSON.parse(localStorage.getItem('saved-playlists') || '{}');
    const playlistNames = Object.keys(playlists);
    
    if (playlistNames.length === 0) {
        showNotification('لا توجد قوائم تشغيل محفوظة', 'info');
        return;
    }
    
    // إنشاء نافذة لاختيار قائمة التشغيل
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>اختر قائمة التشغيل</h3>
                <button class="close-modal" onclick="closeModal(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                ${playlistNames.map(name => `
                    <div class="playlist-option" onclick="loadSelectedPlaylist('${name}')">
                        <h4>${name}</h4>
                        <p>${playlists[name].length} سورة</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// تحميل قائمة التشغيل المحددة
function loadSelectedPlaylist(playlistName) {
    const playlists = JSON.parse(localStorage.getItem('saved-playlists') || '{}');
    
    if (playlists[playlistName]) {
        playlistItems = [...playlists[playlistName]];
        currentPlaylistIndex = 0;
        updatePlaylistDisplay();
        savePlaylistToStorage();
        showNotification(`تم تحميل قائمة التشغيل "${playlistName}"`, 'success');
    }
    
    // إغلاق النافذة
    const modal = document.querySelector('.modal.show');
    if (modal) {
        modal.remove();
    }
}

// مسح قائمة التشغيل
function clearPlaylist() {
    if (playlistItems.length === 0) {
        showNotification('قائمة التشغيل فارغة', 'info');
        return;
    }
    
    if (confirm('هل أنت متأكد من مسح قائمة التشغيل؟')) {
        playlistItems = [];
        currentPlaylistIndex = 0;
        updatePlaylistDisplay();
        savePlaylistToStorage();
        showNotification('تم مسح قائمة التشغيل', 'success');
    }
}

// حفظ قائمة التشغيل في التخزين المحلي
function savePlaylistToStorage() {
    localStorage.setItem('audio-playlist', JSON.stringify(playlistItems));
}

// تحميل سورة للتحميل
function downloadSurah(surahId) {
    const surah = audioSurahs.find(s => s.id === surahId);
    if (!surah) return;
    
    const audioUrl = buildAudioUrl(surahId);
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `${surah.name_arabic}.mp3`;
    link.click();
    
    showNotification(`جاري تحميل ${surah.name_arabic}`, 'info');
}

// إغلاق النافذة المنبثقة
function closeModal(button) {
    const modal = button.closest('.modal');
    if (modal) {
        modal.remove();
    }
}

// إظهار إشعار
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}