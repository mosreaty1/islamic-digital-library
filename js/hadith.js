// ملف وظائف الأحاديث النبوية - المكتبة الإسلامية الرقمية

// متغيرات عامة للأحاديث
let hadithCollections = [];
let currentHadiths = [];
let currentPage = 1;
let totalPages = 1;
let itemsPerPage = 20;
let currentFilters = {
    collection: '',
    narrator: '',
    grade: '',
    search: ''
};

// مجموعات الأحاديث
const collections = {
    'bukhari': {
        name: 'صحيح البخاري',
        arabic_name: 'صحيح البخاري',
        description: 'أصح الكتب بعد كتاب الله',
        total_hadith: 7563,
        author: 'الإمام البخاري'
    },
    'muslim': {
        name: 'صحيح مسلم',
        arabic_name: 'صحيح مسلم',
        description: 'ثاني أصح الكتب بعد البخاري',
        total_hadith: 5362,
        author: 'الإمام مسلم'
    },
    'abudawud': {
        name: 'سنن أبي داود',
        arabic_name: 'سنن أبي داود',
        description: 'من كتب السنن الأربعة',
        total_hadith: 4800,
        author: 'الإمام أبو داود'
    },
    'tirmidhi': {
        name: 'سنن الترمذي',
        arabic_name: 'سنن الترمذي',
        description: 'جامع الإمام الترمذي',
        total_hadith: 3956,
        author: 'الإمام الترمذي'
    },
    'nasai': {
        name: 'سنن النسائي',
        arabic_name: 'سنن النسائي',
        description: 'المجتبى من السنن',
        total_hadith: 5761,
        author: 'الإمام النسائي'
    },
    'ibnmajah': {
        name: 'سنن ابن ماجه',
        arabic_name: 'سنن ابن ماجه',
        description: 'آخر كتب السنن الستة',
        total_hadith: 4341,
        author: 'الإمام ابن ماجه'
    },
    'ahmad': {
        name: 'مسند أحمد',
        arabic_name: 'مسند الإمام أحمد',
        description: 'أكبر مجموعة أحاديث',
        total_hadith: 30000,
        author: 'الإمام أحمد بن حنبل'
    }
};

// الرواة المشهورون
const famousNarrators = {
    'abuhurayra': 'أبو هريرة',
    'aisha': 'عائشة رضي الله عنها',
    'abdullah': 'عبد الله بن عمر',
    'anas': 'أنس بن مالك',
    'abu-bakr': 'أبو بكر الصديق',
    'umar': 'عمر بن الخطاب',
    'ali': 'علي بن أبي طالب',
    'jabir': 'جابر بن عبد الله'
};

// تهيئة صفحة الأحاديث
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('hadith')) {
        initializeHadithPage();
    }
});

// تهيئة صفحة الأحاديث
async function initializeHadithPage() {
    try {
        loadHadithCollections();
        loadDailyHadith();
        initializeHadithSearch();
        initializeHadithFilters();
        
        console.log('تم تهيئة صفحة الأحاديث بنجاح');
    } catch (error) {
        console.error('خطأ في تهيئة صفحة الأحاديث:', error);
        showNotification('حدث خطأ في تحميل الأحاديث', 'error');
    }
}

// تحميل مجموعات الأحاديث
function loadHadithCollections() {
    const collectionsContainer = document.querySelector('.collections-grid');
    if (!collectionsContainer) return;
    
    // إضافة أحداث النقر على بطاقات المجموعات
    const collectionCards = document.querySelectorAll('.collection-card');
    collectionCards.forEach(card => {
        card.addEventListener('click', function() {
            const collection = this.getAttribute('data-collection');
            if (collection) {
                loadHadithsByCollection(collection);
            }
        });
    });
    
    // تحديث عدد الأحاديث في البطاقات
    updateCollectionCounts();
}

// تحديث عدد الأحاديث في البطاقات
function updateCollectionCounts() {
    Object.entries(collections).forEach(([key, collection]) => {
        const card = document.querySelector(`[data-collection="${key}"]`);
        if (card) {
            const countElement = card.querySelector('.hadith-count');
            if (countElement) {
                countElement.textContent = `${collection.total_hadith.toLocaleString()} حديث`;
            }
        }
    });
}

// تحميل الأحاديث حسب المجموعة
async function loadHadithsByCollection(collectionName) {
    try {
        showLoading();
        
        currentFilters.collection = collectionName;
        currentPage = 1;
        
        // محاولة تحميل من API
        const hadiths = await fetchHadithsFromAPI(collectionName);
        
        if (hadiths.length > 0) {
            currentHadiths = hadiths;
            displayHadiths();
            showHadithResults();
        } else {
            // استخدام بيانات تجريبية
            currentHadiths = getMockHadiths(collectionName);
            displayHadiths();
            showHadithResults();
        }
        
    } catch (error) {
        console.error('خطأ في تحميل الأحاديث:', error);
        
        // استخدام بيانات تجريبية عند الخطأ
        currentHadiths = getMockHadiths(collectionName);
        displayHadiths();
        showHadithResults();
    } finally {
        hideLoading();
    }
}

// جلب الأحاديث من API
async function fetchHadithsFromAPI(collectionName) {
    try {
        const response = await fetch(`https://api.sunnah.com/v1/collections/${collectionName}/hadiths?limit=${itemsPerPage}&page=${currentPage}`);
        
        if (!response.ok) {
            throw new Error('API not available');
        }
        
        const data = await response.json();
        return data.hadiths || [];
    } catch (error) {
        console.error('خطأ في API:', error);
        return [];
    }
}

// الحصول على أحاديث تجريبية
function getMockHadiths(collectionName) {
    const mockHadiths = [
        {
            id: 1,
            text: 'إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى، فمن كانت هجرته إلى الله ورسوله فهجرته إلى الله ورسوله، ومن كانت هجرته لدنيا يصيبها أو امرأة ينكحها فهجرته إلى ما هاجر إليه',
            narrator: 'عمر بن الخطاب',
            source: collections[collectionName]?.arabic_name || 'صحيح البخاري',
            grade: 'صحيح',
            number: 1,
            book: 'كتاب بدء الوحي',
            chapter: 'باب كيف كان بدء الوحي'
        },
        {
            id: 2,
            text: 'بينما نحن عند رسول الله صلى الله عليه وسلم ذات يوم، إذ طلع علينا رجل شديد بياض الثياب، شديد سواد الشعر، لا يرى عليه أثر السفر، ولا يعرفه منا أحد',
            narrator: 'عمر بن الخطاب',
            source: collections[collectionName]?.arabic_name || 'صحيح مسلم',
            grade: 'صحيح',
            number: 2,
            book: 'كتاب الإيمان',
            chapter: 'باب معرفة الإيمان والإسلام والقدر'
        },
        {
            id: 3,
            text: 'من كان يؤمن بالله واليوم الآخر فليقل خيراً أو ليصمت، ومن كان يؤمن بالله واليوم الآخر فليكرم جاره، ومن كان يؤمن بالله واليوم الآخر فليكرم ضيفه',
            narrator: 'أبو هريرة',
            source: collections[collectionName]?.arabic_name || 'صحيح البخاري',
            grade: 'صحيح',
            number: 3,
            book: 'كتاب الأدب',
            chapter: 'باب من كان يؤمن بالله واليوم الآخر'
        },
        {
            id: 4,
            text: 'المسلم من سلم المسلمون من لسانه ويده، والمهاجر من هجر ما نهى الله عنه',
            narrator: 'عبد الله بن عمرو',
            source: collections[collectionName]?.arabic_name || 'صحيح البخاري',
            grade: 'صحيح',
            number: 4,
            book: 'كتاب الإيمان',
            chapter: 'باب المسلم من سلم المسلمون'
        },
        {
            id: 5,
            text: 'لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه',
            narrator: 'أنس بن مالك',
            source: collections[collectionName]?.arabic_name || 'صحيح البخاري',
            grade: 'صحيح',
            number: 5,
            book: 'كتاب الإيمان',
            chapter: 'باب من الإيمان أن يحب لأخيه'
        }
    ];
    
    return mockHadiths;
}

// عرض الأحاديث
function displayHadiths() {
    const hadithList = document.getElementById('hadith-list');
    if (!hadithList) return;
    
    hadithList.innerHTML = currentHadiths.map(hadith => `
        <div class="hadith-card" data-hadith-id="${hadith.id}">
            <div class="hadith-header">
                <span class="hadith-number">#${hadith.number}</span>
                <span class="hadith-grade ${hadith.grade.toLowerCase()}">${hadith.grade}</span>
            </div>
            <div class="hadith-text" onclick="showHadithModal(${hadith.id})">
                ${hadith.text}
            </div>
            <div class="hadith-info">
                <div class="hadith-narrator">
                    <i class="fas fa-user"></i>
                    <span>الراوي: ${hadith.narrator}</span>
                </div>
                <div class="hadith-source">
                    <i class="fas fa-book"></i>
                    <span>المصدر: ${hadith.source}</span>
                </div>
                ${hadith.book ? `
                    <div class="hadith-book">
                        <i class="fas fa-bookmark"></i>
                        <span>${hadith.book}</span>
                    </div>
                ` : ''}
            </div>
            <div class="hadith-actions">
                <button onclick="bookmarkHadith(${hadith.id})" class="btn btn-secondary btn-small">
                    <i class="fas fa-bookmark"></i>
                    حفظ
                </button>
                <button onclick="shareHadith(${hadith.id})" class="btn btn-secondary btn-small">
                    <i class="fas fa-share"></i>
                    مشاركة
                </button>
                <button onclick="showHadithModal(${hadith.id})" class="btn btn-primary btn-small">
                    <i class="fas fa-eye"></i>
                    عرض
                </button>
            </div>
        </div>
    `).join('');
    
    // تحديث عدد النتائج
    updateResultsCount();
    
    // تحديث أزرار الصفحات
    updatePagination();
}

// إظهار نتائج الأحاديث
function showHadithResults() {
    const resultsSection = document.getElementById('hadith-results');
    if (resultsSection) {
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// تحديث عدد النتائج
function updateResultsCount() {
    const countElement = document.getElementById('results-count');
    if (countElement) {
        countElement.textContent = `${currentHadiths.length} حديث`;
    }
}

// تحديث أزرار الصفحات
function updatePagination() {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;
    
    // حساب عدد الصفحات
    totalPages = Math.ceil(currentHadiths.length / itemsPerPage);
    
    let paginationHTML = '';
    
    // زر الصفحة السابقة
    if (currentPage > 1) {
        paginationHTML += `
            <button onclick="changePage(${currentPage - 1})" class="btn btn-secondary">
                <i class="fas fa-chevron-right"></i>
                السابق
            </button>
        `;
    }
    
    // أرقام الصفحات
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="btn btn-primary">${i}</button>`;
        } else {
            paginationHTML += `<button onclick="changePage(${i})" class="btn btn-secondary">${i}</button>`;
        }
    }
    
    // زر الصفحة التالية
    if (currentPage < totalPages) {
        paginationHTML += `
            <button onclick="changePage(${currentPage + 1})" class="btn btn-secondary">
                التالي
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
    }
    
    paginationContainer.innerHTML = paginationHTML;
}

// تغيير الصفحة
function changePage(page) {
    currentPage = page;
    displayHadiths();
    
    // التمرير إلى أعلى النتائج
    const resultsSection = document.getElementById('hadith-results');
    if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// تهيئة البحث في الأحاديث
function initializeHadithSearch() {
    const searchInput = document.getElementById('hadith-search');
    const searchButton = document.getElementById('search-hadith-btn');
    
    if (searchInput && searchButton) {
        searchButton.addEventListener('click', performHadithSearch);
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performHadithSearch();
            }
        });
    }
}

// تنفيذ البحث في الأحاديث
async function performHadithSearch() {
    const searchInput = document.getElementById('hadith-search');
    if (!searchInput) return;
    
    const query = searchInput.value.trim();
    if (!query) {
        showNotification('يرجى إدخال كلمة البحث', 'warning');
        return;
    }
    
    try {
        showLoading();
        
        currentFilters.search = query;
        currentPage = 1;
        
        // البحث في البيانات المحملة
        const filteredHadiths = searchInHadiths(query);
        
        if (filteredHadiths.length > 0) {
            currentHadiths = filteredHadiths;
            displayHadiths();
            showHadithResults();
        } else {
            showNotification('لم يتم العثور على نتائج للبحث', 'info');
        }
        
    } catch (error) {
        console.error('خطأ في البحث:', error);
        showNotification('حدث خطأ أثناء البحث', 'error');
    } finally {
        hideLoading();
    }
}

// البحث في الأحاديث
function searchInHadiths(query) {
    return currentHadiths.filter(hadith => 
        hadith.text.includes(query) ||
        hadith.narrator.includes(query) ||
        hadith.source.includes(query) ||
        (hadith.book && hadith.book.includes(query))
    );
}

// تهيئة المرشحات
function initializeHadithFilters() {
    const collectionFilter = document.getElementById('collection-filter');
    const narratorFilter = document.getElementById('narrator-filter');
    const gradeFilter = document.getElementById('grade-filter');
    
    if (collectionFilter) {
        collectionFilter.addEventListener('change', applyFilters);
    }
    
    if (narratorFilter) {
        narratorFilter.addEventListener('change', applyFilters);
    }
    
    if (gradeFilter) {
        gradeFilter.addEventListener('change', applyFilters);
    }
}

// تطبيق المرشحات
function applyFilters() {
    const collectionFilter = document.getElementById('collection-filter');
    const narratorFilter = document.getElementById('narrator-filter');
    const gradeFilter = document.getElementById('grade-filter');
    
    currentFilters.collection = collectionFilter ? collectionFilter.value : '';
    currentFilters.narrator = narratorFilter ? narratorFilter.value : '';
    currentFilters.grade = gradeFilter ? gradeFilter.value : '';
    
    let filteredHadiths = [...currentHadiths];
    
    if (currentFilters.collection) {
        filteredHadiths = filteredHadiths.filter(hadith => 
            hadith.source.includes(collections[currentFilters.collection]?.arabic_name || '')
        );
    }
    
    if (currentFilters.narrator) {
        filteredHadiths = filteredHadiths.filter(hadith => 
            hadith.narrator.includes(famousNarrators[currentFilters.narrator] || currentFilters.narrator)
        );
    }
    
    if (currentFilters.grade) {
        filteredHadiths = filteredHadiths.filter(hadith => 
            hadith.grade === currentFilters.grade
        );
    }
    
    currentHadiths = filteredHadiths;
    currentPage = 1;
    displayHadiths();
    
    if (filteredHadiths.length === 0) {
        showNotification('لا توجد أحاديث تطابق المرشحات المحددة', 'info');
    }
}

// تحميل حديث اليوم
function loadDailyHadith() {
    const dailyHadiths = [
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
        },
        {
            text: 'المسلم من سلم المسلمون من لسانه ويده',
            narrator: 'عبد الله بن عمرو',
            source: 'صحيح البخاري',
            grade: 'صحيح'
        },
        {
            text: 'لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه',
            narrator: 'أنس بن مالك',
            source: 'صحيح البخاري',
            grade: 'صحيح'
        }
    ];
    
    const today = new Date();
    const hadithIndex = today.getDate() % dailyHadiths.length;
    const dailyHadith = dailyHadiths[hadithIndex];
    
    // تحديث عرض حديث اليوم
    const elements = {
        'daily-hadith-text': dailyHadith.text,
        'daily-hadith-narrator': `الراوي: ${dailyHadith.narrator}`,
        'daily-hadith-source': `المصدر: ${dailyHadith.source}`
    };
    
    Object.entries(elements).forEach(([id, content]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    });
}

// إظهار نافذة تفاصيل الحديث
function showHadithModal(hadithId) {
    const hadith = currentHadiths.find(h => h.id === hadithId);
    if (!hadith) return;
    
    const modal = document.getElementById('hadith-modal');
    if (!modal) return;
    
    // تحديث محتوى النافذة
    document.getElementById('hadith-modal-text').textContent = hadith.text;
    document.getElementById('hadith-modal-narrator').textContent = hadith.narrator;
    document.getElementById('hadith-modal-source').textContent = hadith.source;
    document.getElementById('hadith-modal-number').textContent = hadith.number;
    document.getElementById('hadith-modal-grade').textContent = hadith.grade;
    
    // تحديث class للدرجة
    const gradeElement = document.getElementById('hadith-modal-grade');
    if (gradeElement) {
        gradeElement.className = `hadith-grade ${hadith.grade.toLowerCase()}`;
    }
    
    // تحميل الشرح إذا كان متاحاً
    loadHadithExplanation(hadithId);
    
    // إظهار النافذة
    modal.style.display = 'flex';
    modal.classList.add('show');
}

// تحميل شرح الحديث
function loadHadithExplanation(hadithId) {
    const explanationElement = document.getElementById('hadith-modal-explanation');
    if (!explanationElement) return;
    
    // شرح تجريبي
    const explanations = {
        1: 'هذا الحديث أصل عظيم من أصول الدين، وهو أن العبرة في الأعمال بالنيات والمقاصد، فمن نوى بعمله وجه الله تعالى أُجر عليه، ومن نوى به الدنيا فله ما نوى.',
        2: 'هذا حديث جبريل المشهور في تعليم الدين، وفيه بيان أركان الإسلام والإيمان والإحسان.',
        3: 'هذا الحديث يجمع آداب المسلم مع الناس، وفيه الحث على الكلام الطيب وإكرام الجار والضيف.',
        4: 'هذا الحديث يبين حقيقة الإسلام وأنه السلامة من الأذى، والهجرة الحقيقية هي ترك المعاصي.',
        5: 'هذا الحديث يبين كمال الإيمان وأنه لا يكمل إلا بمحبة الخير للآخرين.'
    };
    
    const explanation = explanations[hadithId] || 'الشرح غير متوفر حالياً';
    explanationElement.innerHTML = `
        <h4>شرح الحديث:</h4>
        <p>${explanation}</p>
    `;
}

// حفظ الحديث في المفضلة
function bookmarkHadith(hadithId) {
    const bookmarks = JSON.parse(localStorage.getItem('hadith-bookmarks') || '[]');
    
    const hadith = currentHadiths.find(h => h.id === hadithId);
    if (!hadith) return;
    
    const bookmark = {
        id: hadithId,
        text: hadith.text,
        narrator: hadith.narrator,
        source: hadith.source,
        timestamp: new Date().toISOString()
    };
    
    const exists = bookmarks.some(b => b.id === hadithId);
    
    if (!exists) {
        bookmarks.push(bookmark);
        localStorage.setItem('hadith-bookmarks', JSON.stringify(bookmarks));
        showNotification('تم حفظ الحديث في المفضلة', 'success');
    } else {
        showNotification('الحديث محفوظ مسبقاً في المفضلة', 'info');
    }
}

// مشاركة الحديث
function shareHadith(hadithId) {
    const hadith = currentHadiths.find(h => h.id === hadithId);
    if (!hadith) return;
    
    const shareText = `${hadith.text}\n\n📚 الراوي: ${hadith.narrator}\n📖 المصدر: ${hadith.source}\n✅ الدرجة: ${hadith.grade}`;
    
    if (navigator.share) {
        navigator.share({
            title: `حديث شريف - ${hadith.narrator}`,
            text: shareText,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('تم نسخ الحديث إلى الحافظة', 'success');
        }).catch(() => {
            showNotification('لم يتم نسخ الحديث', 'error');
        });
    }
}

// أحداث أزرار حديث اليوم
document.addEventListener('click', function(e) {
    if (e.target.id === 'share-daily-hadith') {
        const hadithText = document.getElementById('daily-hadith-text').textContent;
        const hadithNarrator = document.getElementById('daily-hadith-narrator').textContent;
        const hadithSource = document.getElementById('daily-hadith-source').textContent;
        
        const shareText = `${hadithText}\n\n📚 ${hadithNarrator}\n📖 ${hadithSource}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'حديث اليوم',
                text: shareText,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                showNotification('تم نسخ حديث اليوم إلى الحافظة', 'success');
            });
        }
    }
    
    if (e.target.id === 'bookmark-daily-hadith') {
        const hadithText = document.getElementById('daily-hadith-text').textContent;
        const hadithNarrator = document.getElementById('daily-hadith-narrator').textContent.replace('الراوي: ', '');
        const hadithSource = document.getElementById('daily-hadith-source').textContent.replace('المصدر: ', '');
        
        const bookmarks = JSON.parse(localStorage.getItem('daily-hadith-bookmarks') || '[]');
        const bookmark = {
            text: hadithText,
            narrator: hadithNarrator,
            source: hadithSource,
            date: new Date().toISOString(),
            timestamp: new Date().toISOString()
        };
        
        bookmarks.push(bookmark);
        localStorage.setItem('daily-hadith-bookmarks', JSON.stringify(bookmarks));
        showNotification('تم حفظ حديث اليوم في المفضلة', 'success');
    }
});

// إغلاق النوافذ المنبثقة
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

// أحداث أزرار النافذة المنبثقة
document.addEventListener('click', function(e) {
    if (e.target.id === 'share-hadith-modal') {
        const hadithText = document.getElementById('hadith-modal-text').textContent;
        const hadithNarrator = document.getElementById('hadith-modal-narrator').textContent;
        const hadithSource = document.getElementById('hadith-modal-source').textContent;
        
        const shareText = `${hadithText}\n\n📚 الراوي: ${hadithNarrator}\n📖 المصدر: ${hadithSource}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'حديث شريف',
                text: shareText,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                showNotification('تم نسخ الحديث إلى الحافظة', 'success');
            });
        }
    }
    
    if (e.target.id === 'bookmark-hadith-modal') {
        const hadithText = document.getElementById('hadith-modal-text').textContent;
        const hadithNarrator = document.getElementById('hadith-modal-narrator').textContent;
        const hadithSource = document.getElementById('hadith-modal-source').textContent;
        
        const bookmarks = JSON.parse(localStorage.getItem('hadith-bookmarks') || '[]');
        const bookmark = {
            text: hadithText,
            narrator: hadithNarrator,
            source: hadithSource,
            timestamp: new Date().toISOString()
        };
        
        bookmarks.push(bookmark);
        localStorage.setItem('hadith-bookmarks', JSON.stringify(bookmarks));
        showNotification('تم حفظ الحديث في المفضلة', 'success');
    }
});
