const surahNames = [
    "Al-Fatihah", "Al-Baqarah", "Ali 'Imran", "An-Nisa'", "Al-Ma'idah", "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Tawbah", "Yunus",
    "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Isra'", "Al-Kahf", "Maryam", "Ta-Ha",
    "Al-Anbiya'", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan", "Ash-Shu'ara'", "An-Naml", "Al-Qasas", "Al-'Ankabut", "Ar-Rum",
    "Luqman", "As-Sajdah", "Al-Ahzab", "Saba'", "Fatir", "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir",
    "Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah", "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf",
    "Adh-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid", "Al-Mujadilah", "Al-Hashr", "Al-Mumtahanah",
    "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij",
    "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat", "An-Naba'", "An-Nazi'at", "'Abasa",
    "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad",
    "Ash-Shams", "Al-Layl", "Ad-Duha", "Ash-Sharh", "At-Tin", "Al-'Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-'Adiyat",
    "Al-Qari'ah", "At-Takathur", "Al-'Asr", "Al-Humazah", "Al-Fil", "Quraysh", "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr",
    "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas"
];

const chapterSelect = document.getElementById('chapter-select');
const chapterInput = document.getElementById('chapter-input');
const fetchBtn = document.getElementById('fetch-btn');
const quranContent = document.getElementById('quran-content');
const loader = document.getElementById('loader');

let isInitialLoad = true;

// Populate Surah Dropdown
function populateSurahs() {
    surahNames.forEach((name, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = `${index + 1}. ${name}`;
        chapterSelect.appendChild(option);
    });
}

async function fetchChapter() {
    let chapterNum = chapterInput.value || chapterSelect.value;
    if (!chapterNum) return;

    // Ensure it's within 1-114
    chapterNum = Math.min(Math.max(parseInt(chapterNum), 1), 114);
    chapterInput.value = chapterNum;
    chapterSelect.value = chapterNum;
    quranContent.innerHTML = '';
    loader.style.display = 'block';

    try {
        const arabicUrl = `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-quranuthmanihaf/${chapterNum}.json`;
        const urduUrl = `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/urd-muhammadjunagar-la/${chapterNum}.json`;

        const [arabicRes, urduRes] = await Promise.all([
            fetch(arabicUrl),
            fetch(urduUrl)
        ]);

        if (!arabicRes.ok || !urduRes.ok) throw new Error('Failed to fetch data');

        const arabicData = await arabicRes.json();
        const urduData = await urduRes.json();

        renderVerses(arabicData.chapter, urduData.chapter, chapterNum);

        // If it's initial load, scroll to saved verse
        if (isInitialLoad) {
            const savedVerse = localStorage.getItem('lastReadVerse');
            if (savedVerse) {
                setTimeout(() => {
                    const targetCard = document.querySelector(`.verse-card[data-verse="${savedVerse}"]`);
                    if (targetCard) {
                        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        targetCard.classList.add('active');
                    }
                }, 500);
            }
            isInitialLoad = false;
        }
    } catch (error) {
        console.error(error);
        quranContent.innerHTML = `<p style="color: #ef4444; text-align: center; padding: 2rem;">Error: ${error.message}. Please check your connection and try again.</p>`;
    } finally {
        loader.style.display = 'none';
    }
}

function renderVerses(arabicVerses, urduVerses, chapterNum) {
    quranContent.innerHTML = '';

    // Add Bismillah Header (except for Surah 9)
    if (chapterNum != 9) {
        const bismillah = document.createElement('div');
        bismillah.className = 'bismillah';
        bismillah.innerHTML = `
            <div>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
            <div style="font-size: 1.1rem; font-family: var(--main-font); color: #cbd5e1; margin-top: 8px; font-weight: normal;">
                Bismillahir Rahmanir Raheem
            </div>
        `;
        quranContent.appendChild(bismillah);
    }

    const urduMap = new Map();
    urduVerses.forEach(v => urduMap.set(v.verse, v.text));

    // Special Handling for Surah 1 (Fatihah) mismatch
    if (chapterNum == 1) {
        // Arabic V1: Bismillah (already in header)
        // Arabic V2: Alhamdu -> Urdu V1
        // Arabic V3: Ar-Rahman -> Urdu V2
        // Arabic V4: Maliki -> Urdu V3
        // Arabic V5: Iyyaka -> Urdu V4
        // Arabic V6: Ihdina -> Urdu V5
        // Arabic V7: Siratalladhina -> Urdu V6 + V7

        for (let i = 1; i < 7; i++) {
            const aVerse = arabicVerses[i];
            let uText = "";
            if (i < 6) {
                uText = urduVerses[i - 1].text;
            } else {
                uText = urduVerses[5].text + " " + urduVerses[6].text;
            }
            createVerseCard(aVerse.verse, aVerse.text, uText, i - 1);
        }
        return;
    }

    arabicVerses.forEach((verse, index) => {
        const verseNum = verse.verse;
        const arabicText = verse.text;
        const romanUrduText = urduMap.get(verseNum) || "Translation not available for this verse.";
        createVerseCard(verseNum, arabicText, romanUrduText, index);
    });

    if (arabicVerses.length === 0) {
        quranContent.innerHTML = '<p style="text-align: center; padding: 2rem;">No verses found for this chapter.</p>';
    }
}

function createVerseCard(verseNum, arabicText, romanUrduText, index) {
    const card = document.createElement('div');
    card.className = 'verse-card';
    card.setAttribute('data-verse', verseNum);
    card.style.animationDelay = `${index * 50}ms`;

    card.innerHTML = `
        <div class="verse-header">
            <span class="verse-number" title="Click to bookmark this verse">${verseNum}</span>
        </div>
        <div class="arabic-text">${arabicText}</div>
        <div class="roman-urdu">${romanUrduText}</div>
    `;

    // Add Click listener to verse number to bookmark
    const vNumBadge = card.querySelector('.verse-number');
    vNumBadge.addEventListener('click', () => {
        // Remove active class from others
        document.querySelectorAll('.verse-card').forEach(c => c.classList.remove('active'));
        // Add to current
        card.classList.add('active');

        // Save to LocalStorage
        const currentChapter = chapterSelect.value;
        localStorage.setItem('lastReadChapter', currentChapter);
        localStorage.setItem('lastReadVerse', verseNum);

        // Visual feedback
        const originalText = vNumBadge.textContent;
        vNumBadge.textContent = '✓';
        setTimeout(() => {
            vNumBadge.textContent = originalText;
        }, 1000);
    });

    quranContent.appendChild(card);
}

function loadLastRead() {
    const savedChapter = localStorage.getItem('lastReadChapter');
    if (savedChapter) {
        chapterSelect.value = savedChapter;
        chapterInput.value = savedChapter;
        fetchChapter();
    }
}

fetchBtn.addEventListener('click', () => {
    isInitialLoad = false;
    fetchChapter();
});
chapterSelect.addEventListener('change', () => {
    isInitialLoad = false;
    chapterInput.value = chapterSelect.value;
    fetchChapter();
});
chapterInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        isInitialLoad = false;
        fetchChapter();
    }
});

// Initial focus
populateSurahs();
loadLastRead();
