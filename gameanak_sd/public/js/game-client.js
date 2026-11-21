/**
 * game-client.js - Client Controller Kuis Kilat SD
 * Menghadirkan transisi 3 Halaman Terpisah:
 * - Halaman 1: Layar Soal Aktif (Menjawab)
 * - Halaman 2: Layar Pembahasan & Top 3 Penjawab Tercepat Soal Ini
 * - Halaman 3: Layar Juara Akbar Akhir Ronde
 */

const socket = io();

// ==========================================================================
// Web Audio Synthesizer
// ==========================================================================
class SoundFX {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.25) {
        try {
            this.init();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) { }
    }

    playTick() {
        this.playTone(880, 'sine', 0.05, 0.08);
    }

    playPop() {
        this.playTone(520, 'triangle', 0.1, 0.15);
    }

    playCorrect() {
        this.init();
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            setTimeout(() => this.playTone(freq, 'sine', 0.25, 0.25), idx * 80);
        });
    }

    playWinner() {
        this.init();
        const notes = [587.33, 880, 1174.66];
        notes.forEach((freq, idx) => {
            setTimeout(() => this.playTone(freq, 'triangle', 0.3, 0.3), idx * 90);
        });
    }

    playFanfare() {
        this.init();
        const chords = [
            [523.25, 659.25, 783.99],
            [587.33, 739.99, 880.00],
            [659.25, 830.61, 987.77],
            [783.99, 987.77, 1174.66, 1567.98]
        ];
        chords.forEach((chord, step) => {
            setTimeout(() => {
                chord.forEach(freq => this.playTone(freq, 'triangle', 0.5, 0.22));
            }, step * 220);
        });
    }

    playGift() {
        this.init();
        const arpeggio = [440, 554.37, 659.25, 830.61, 880];
        arpeggio.forEach((f, i) => {
            setTimeout(() => this.playTone(f, 'sine', 0.2, 0.25), i * 60);
        });
    }
}

const sfx = new SoundFX();
window.addEventListener('click', () => sfx.init(), { once: true });
window.addEventListener('keydown', () => sfx.init(), { once: true });

// ==========================================================================
// 🎵 Background Music (BGM) & Suara AI Presenter Manager
// ==========================================================================
const bgmPlayer = document.getElementById('bgm-player');
const ttsPlayer = document.getElementById('tts-player');
const audioStarterPill = document.getElementById('audio-starter-pill');
const btnAudioStart = document.getElementById('btn-audio-start');

let currentBgmVolume = 0.55; // default 55% agar terdengar pas & jelas
let isBgmPlaying = true;

function unlockAndStartAudio() {
    sfx.init();
    if (bgmPlayer) {
        bgmPlayer.volume = currentBgmVolume;
        if (isBgmPlaying) {
            bgmPlayer.play().then(() => {
                if (audioStarterPill) audioStarterPill.style.display = 'none';
            }).catch(e => {
                console.log('[BGM] Autoplay blocked, but user interaction listener is ready:', e.message);
            });
        }
    }
    if (audioStarterPill) audioStarterPill.style.display = 'none';
}

if (btnAudioStart) {
    btnAudioStart.addEventListener('click', unlockAndStartAudio);
}

window.addEventListener('click', unlockAndStartAudio, { once: true });
window.addEventListener('keydown', unlockAndStartAudio, { once: true });

// Coba langsung play (OBS Studio Browser Source mengizinkan autoplay langsung tanpa klik)
setTimeout(() => {
    if (bgmPlayer && isBgmPlaying) {
        bgmPlayer.play().then(() => {
            if (audioStarterPill) audioStarterPill.style.display = 'none';
        }).catch(() => { });
    }
}, 800);

// ==========================================================================
// DOM Elements: 3 Pages
// ==========================================================================
const pageQuestion = document.getElementById('page-question');
const pageReveal = document.getElementById('page-reveal');
const pageRoundPodium = document.getElementById('page-round-podium');
const pageClosing = document.getElementById('page-closing');
const closingAlertBanner = document.getElementById('closing-alert-banner');

// Header Elements
const catIcon = document.getElementById('cat-icon');
const catText = document.getElementById('cat-text');
const soalNum = document.getElementById('soal-num');
const soalTotal = document.getElementById('soal-total');

// Page 1 Elements (Soal Aktif)
const timerVal = document.getElementById('timer-val');
const questionText = document.getElementById('question-text');
const partCount = document.getElementById('part-count');
const partAvatars = document.getElementById('part-avatars');

// Page 2 Elements (Pembahasan & Top 3)
const revealCountdownNum = document.getElementById('reveal-countdown-num');
const revealCorrectLetter = document.getElementById('reveal-correct-letter');
const revealCorrectText = document.getElementById('reveal-correct-text');
const revealPembahasanText = document.getElementById('reveal-pembahasan-text');
const qtopList = document.getElementById('qtop-list');
const qtopEmptyMsg = document.getElementById('qtop-empty-msg');

// Page 3 Elements (Juara Akhir Ronde)
const rpCategoryName = document.getElementById('rp-category-name');
const rpR1Avatar = document.getElementById('rp-r1-avatar');
const rpR1Name = document.getElementById('rp-r1-name');
const rpR1Pts = document.getElementById('rp-r1-pts');
const rpR2Avatar = document.getElementById('rp-r2-avatar');
const rpR2Name = document.getElementById('rp-r2-name');
const rpR2Pts = document.getElementById('rp-r2-pts');
const rpR3Avatar = document.getElementById('rp-r3-avatar');
const rpR3Name = document.getElementById('rp-r3-name');
const rpR3Pts = document.getElementById('rp-r3-pts');

const glbP1 = document.getElementById('glb-p1');
const glbP2 = document.getElementById('glb-p2');
const glbP3 = document.getElementById('glb-p3');
const rpCountdown = document.getElementById('rp-countdown');

// Gift Toast
const giftToast = document.getElementById('gift-toast');
const giftToastAvatar = document.getElementById('gift-toast-avatar');
const giftToastUser = document.getElementById('gift-toast-user');
const giftToastGift = document.getElementById('gift-toast-gift');

// Category Icon Mapper
function getCategoryIcon(cat = '') {
    const c = String(cat).toLowerCase();
    if (c.includes('geografi') || c.includes('peta')) return '🌍';
    if (c.includes('hewan') || c.includes('sains')) return '🦁';
    if (c.includes('tata surya') || c.includes('angkasa')) return '🚀';
    if (c.includes('matematika') || c.includes('hitung')) return '📐';
    if (c.includes('receh') || c.includes('tebak')) return '🤪';
    if (c.includes('tubuh') || c.includes('kesehatan')) return '🫀';
    if (c.includes('bahasa') || c.includes('peribahasa')) return '📚';
    if (c.includes('sejarah') || c.includes('pahlawan')) return '🇮🇩';
    if (c.includes('budaya') || c.includes('adat') || c.includes('musik')) return '🎭';
    if (c.includes('ppkn') || c.includes('garuda') || c.includes('pancasila')) return '🦅';
    if (c.includes('benda') || c.includes('alat')) return '🔬';
    if (c.includes('olahraga') || c.includes('permainan')) return '⚽';
    return '🎒';
}

// ==========================================================================
// Page Switcher Function (Ganti Halaman)
// ==========================================================================
function switchPage(activePageId) {
    if (pageQuestion) pageQuestion.style.display = (activePageId === 'page-question') ? 'flex' : 'none';
    if (pageReveal) pageReveal.style.display = (activePageId === 'page-reveal') ? 'flex' : 'none';
    if (pageRoundPodium) pageRoundPodium.style.display = (activePageId === 'page-round-podium') ? 'flex' : 'none';
    if (pageClosing) pageClosing.style.display = (activePageId === 'page-closing') ? 'flex' : 'none';
}

// Update Opsi Soal (Halaman 1)
function updateOptions(opsi, percentages = {}) {
    if (!opsi) return;
    ['A', 'B', 'C', 'D', 'E'].forEach(opt => {
        const textEl = document.getElementById(`text-${opt}`);
        const pctEl = document.getElementById(`pct-${opt}`);
        const fillEl = document.getElementById(`fill-${opt}`);

        if (textEl && opsi[opt]) {
            textEl.innerText = opsi[opt];
        }

        const pct = (percentages && percentages[opt]) || 0;
        if (pctEl) pctEl.innerText = `${pct}%`;
        if (fillEl) fillEl.style.width = `${pct}%`;
    });
}

// Update Avatar Penonton (Halaman 1)
function updateAvatars(avatars = [], count = 0) {
    if (partCount) partCount.innerText = count || 0;
    if (partAvatars) {
        partAvatars.innerHTML = '';
        if (Array.isArray(avatars)) {
            avatars.forEach(av => {
                if (av && av.avatar) {
                    const img = document.createElement('img');
                    img.src = av.avatar;
                    img.alt = av.nickname || 'Viewer';
                    partAvatars.appendChild(img);
                }
            });
        }
    }
}

// Default avatar silhouette SVG when slot is empty
const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2364748b'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

// Update Klasemen Ganda: Top 3 Ronde Saat Ini & Top 3 Total Live (Layout 2 - 1 - 3)
function updateDualLeaderboard(roundLb = [], globalLb = [], roundNum = 1) {
    const lbRoundTitle = document.getElementById('lb-round-title');
    if (lbRoundTitle) lbRoundTitle.innerText = `RONDE ${roundNum || 1}`;

    function fillSlot(prefix, rank, item) {
        const nameEl = document.getElementById(`${prefix}-r${rank}-name`);
        const ptsEl = document.getElementById(`${prefix}-r${rank}-pts`);
        const avatarEl = document.getElementById(`${prefix}-r${rank}-avatar`);

        if (item && item.points > 0) {
            if (nameEl) nameEl.innerText = item.nickname || item.username;
            if (ptsEl) ptsEl.innerText = `${item.points.toLocaleString('id-ID')} poin`;
            if (avatarEl) avatarEl.src = item.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(item.username)}`;
        } else {
            if (nameEl) nameEl.innerText = '-';
            if (ptsEl) ptsEl.innerText = '0 poin';
            if (avatarEl) avatarEl.src = DEFAULT_AVATAR;
        }
    }

    // 1. Papan Ronde: Slot 1 (Emas), Slot 2 (Perak), Slot 3 (Perunggu)
    const r1 = roundLb?.[0];
    const r2 = roundLb?.[1];
    const r3 = roundLb?.[2];
    fillSlot('lrb', 1, r1);
    fillSlot('lrb', 2, r2);
    fillSlot('lrb', 3, r3);

    // 2. Papan Global Total Live: Slot 1 (Emas), Slot 2 (Perak), Slot 3 (Perunggu)
    const g1 = globalLb?.[0];
    const g2 = globalLb?.[1];
    const g3 = globalLb?.[2];
    fillSlot('glb', 1, g1);
    fillSlot('glb', 2, g2);
    fillSlot('glb', 3, g3);
}

// ==========================================================================
// 💎 Leaderboard Tabs Manager (Kuis SD vs Top Sultan Donatur)
// ==========================================================================
const tabBtnQuiz = document.getElementById('tab-btn-quiz');
const tabBtnDonors = document.getElementById('tab-btn-donors');
const panelQuizLb = document.getElementById('panel-quiz-leaderboard');
const panelDonorsLb = document.getElementById('panel-donors-leaderboard');
const tabDonorBadge = document.getElementById('tab-donor-badge');

let currentLbTab = 'quiz';
let tabCycleTimer = null;
let manualOverrideActive = false;
let manualOverrideTimer = null;

// Durasi rotasi: Kuis 24 detik, Top Sultan 8 detik (santai & tidak terlalu sering)
const TIME_SHOW_QUIZ_MS = 24000;   // 24 detik untuk Klasemen Kuis
const TIME_SHOW_DONORS_MS = 8000;  // 8 detik untuk Top Sultan Donatur

function switchLeaderboardTab(tab, isManual = false) {
    currentLbTab = tab;
    if (tab === 'donors') {
        if (tabBtnDonors) tabBtnDonors.classList.add('active');
        if (tabBtnQuiz) tabBtnQuiz.classList.remove('active');
        if (panelDonorsLb) panelDonorsLb.style.display = 'flex';
        if (panelQuizLb) panelQuizLb.style.display = 'none';
    } else {
        if (tabBtnQuiz) tabBtnQuiz.classList.add('active');
        if (tabBtnDonors) tabBtnDonors.classList.remove('active');
        if (panelQuizLb) panelQuizLb.style.display = 'flex';
        if (panelDonorsLb) panelDonorsLb.style.display = 'none';
    }

    if (isManual) {
        // Jika diklik manual, tahan pilihan selama 25 detik sebelum melanjutkan auto-rotasi
        manualOverrideActive = true;
        if (manualOverrideTimer) clearTimeout(manualOverrideTimer);
        manualOverrideTimer = setTimeout(() => {
            manualOverrideActive = false;
            scheduleNextTabCycle();
        }, 25000);
    }
}

function scheduleNextTabCycle() {
    if (tabCycleTimer) clearTimeout(tabCycleTimer);
    if (manualOverrideActive) return;

    const delay = (currentLbTab === 'quiz') ? TIME_SHOW_QUIZ_MS : TIME_SHOW_DONORS_MS;

    tabCycleTimer = setTimeout(() => {
        if (!manualOverrideActive) {
            const nextTab = (currentLbTab === 'quiz') ? 'donors' : 'quiz';
            switchLeaderboardTab(nextTab, false);
        }
        scheduleNextTabCycle();
    }, delay);
}

// Jalankan siklus otomatis awal
scheduleNextTabCycle();

if (tabBtnQuiz) {
    tabBtnQuiz.addEventListener('click', () => switchLeaderboardTab('quiz', true));
}
if (tabBtnDonors) {
    tabBtnDonors.addEventListener('click', () => switchLeaderboardTab('donors', true));
}

// Update Top Sultan Donatur Leaderboard
function updateDonorLeaderboard(donorList = []) {
    hasActiveDonors = Array.isArray(donorList) && donorList.length > 0;
    if (tabDonorBadge) {
        tabDonorBadge.innerText = hasActiveDonors ? donorList.length : '0';
    }

    function fillDonorSlot(rank, item) {
        const nameEl = document.getElementById(`sdlb-r${rank}-name`);
        const ptsEl = document.getElementById(`sdlb-r${rank}-pts`);
        const avatarEl = document.getElementById(`sdlb-r${rank}-avatar`);

        if (item && item.diamonds > 0) {
            if (nameEl) nameEl.innerText = item.nickname || item.username;
            if (ptsEl) ptsEl.innerText = `💎 ${item.diamonds.toLocaleString('id-ID')}`;
            if (avatarEl) avatarEl.src = item.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(item.username)}`;
        } else {
            if (nameEl) nameEl.innerText = '-';
            if (ptsEl) ptsEl.innerText = '💎 0';
            if (avatarEl) avatarEl.src = DEFAULT_AVATAR;
        }
    }

    const d1 = donorList?.[0];
    const d2 = donorList?.[1];
    const d3 = donorList?.[2];
    fillDonorSlot(1, d1);
    fillDonorSlot(2, d2);
    fillDonorSlot(3, d3);
}

// 🚀 Munculkan Animasi Avatar Penonton dari Bawah dengan Tombol Centang Hijau ✓
function spawnAnswerBubble(userAnswer) {
    const streamContainer = document.getElementById('floating-answers-layer');
    if (!streamContainer || !userAnswer) return;

    const pill = document.createElement('div');
    pill.className = 'floating-answer-pill';

    // Posisi acak horizontal di area layar (antara 8% s/d 68%) agar terlihat dinamis & tidak kaku
    const randomLeft = Math.floor(Math.random() * 60 + 8);
    pill.style.left = `${randomLeft}%`;

    // Sedikit variasi posisi spawn tepat di batas atas area chat TikTok
    const randomBottom = Math.floor(Math.random() * 30 + 510);
    pill.style.bottom = `${randomBottom}px`;

    const avatarUrl = userAnswer.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userAnswer.username || 'user')}`;
    const displayName = userAnswer.nickname || userAnswer.username || 'Penonton';
    const choiceText = userAnswer.choice ? `Opsi ${userAnswer.choice}` : 'Menjawab!';

    pill.innerHTML = `
        <div class="fap-avatar-wrap">
            <img src="${avatarUrl}" class="fap-avatar" alt="">
            <span class="fap-check">✓</span>
        </div>
        <div class="fap-content">
            <div class="fap-name">${displayName}</div>
            <div class="fap-badge">${choiceText} ✓</div>
        </div>
    `;

    streamContainer.appendChild(pill);

    // Hapus otomatis dari DOM setelah animasi melayang selesai (3.4 detik)
    setTimeout(() => {
        if (pill.parentNode) {
            pill.parentNode.removeChild(pill);
        }
    }, 3400);
}

// Render Top 3 Penjawab Tercepat Soal Ini (Halaman 2)
function renderQuestionTopWinners(winners = []) {
    if (!Array.isArray(winners) || winners.length === 0) {
        if (qtopList) qtopList.style.display = 'none';
        if (qtopEmptyMsg) qtopEmptyMsg.style.display = 'block';
        return;
    }

    if (qtopList) qtopList.style.display = 'flex';
    if (qtopEmptyMsg) qtopEmptyMsg.style.display = 'none';

    // Juara 1
    const w1 = winners[0];
    const r1Row = document.getElementById('qtop-rank-1');
    if (w1 && r1Row) {
        r1Row.style.display = 'flex';
        document.getElementById('qtop-r1-name').innerText = w1.nickname || w1.username;
        document.getElementById('qtop-r1-time').innerText = `⚡ ${w1.timeTaken}`;
        document.getElementById('qtop-r1-avatar').src = w1.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=r1`;
    } else if (r1Row) {
        r1Row.style.display = 'none';
    }

    // Juara 2
    const w2 = winners[1];
    const r2Row = document.getElementById('qtop-rank-2');
    if (w2 && r2Row) {
        r2Row.style.display = 'flex';
        document.getElementById('qtop-r2-name').innerText = w2.nickname || w2.username;
        document.getElementById('qtop-r2-time').innerText = `⚡ ${w2.timeTaken}`;
        document.getElementById('qtop-r2-avatar').src = w2.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=r2`;
    } else if (r2Row) {
        r2Row.style.display = 'none';
    }

    // Juara 3
    const w3 = winners[2];
    const r3Row = document.getElementById('qtop-rank-3');
    if (w3 && r3Row) {
        r3Row.style.display = 'flex';
        document.getElementById('qtop-r3-name').innerText = w3.nickname || w3.username;
        document.getElementById('qtop-r3-time').innerText = `⚡ ${w3.timeTaken}`;
        document.getElementById('qtop-r3-avatar').src = w3.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=r3`;
    } else if (r3Row) {
        r3Row.style.display = 'none';
    }
}

// Master State Applier
function applyState(data) {
    if (!data) return;

    // 1. Update Header Bersama
    if (data.kategori) {
        if (catText) catText.innerText = data.kategori;
        if (catIcon) catIcon.innerText = getCategoryIcon(data.kategori);
    }
    if (data.questionNumber && soalNum) {
        soalNum.innerText = data.questionNumber;
    }
    if (data.totalQuestionsInRound && soalTotal) {
        soalTotal.innerText = data.totalQuestionsInRound;
    }

    // 2. Routing Halaman
    if (data.state === 'QUESTION_ACTIVE') {
        switchPage('page-question');
        if (questionText && data.soal) questionText.innerText = data.soal;
        if (timerVal && data.timer !== undefined) timerVal.innerText = data.timer;
        if (data.opsi) updateOptions(data.opsi, data.votePercentages || {});
        updateAvatars(data.answeringAvatars || [], data.totalVotes || 0);
        updateDualLeaderboard(data.roundLeaderboard, data.globalLeaderboard, data.roundNumber);
        if (data.donorLeaderboard) {
            updateDonorLeaderboard(data.donorLeaderboard);
        }

    } else if (data.state === 'QUESTION_REVEAL') {
        switchPage('page-reveal');
        if (revealCountdownNum && data.timer !== undefined) revealCountdownNum.innerText = data.timer;

        const corrLetter = data.correctAnswer || data.jawaban || 'A';
        if (revealCorrectLetter) revealCorrectLetter.innerText = corrLetter;

        const corrText = data.correctAnswerText || (data.opsi ? data.opsi[corrLetter] : '');
        if (revealCorrectText) revealCorrectText.innerText = corrText || 'Jawaban Benar';

        if (revealPembahasanText) {
            revealPembahasanText.innerText = data.pembahasan || 'Pembahasan kuis untuk soal ini.';
        }

        renderQuestionTopWinners(data.questionTopWinners || (data.fastestWinner ? [data.fastestWinner] : []));

    } else if (data.state === 'ROUND_SUMMARY') {
        switchPage('page-round-podium');
        if (rpCategoryName) rpCategoryName.innerText = `Ronde ${data.roundNumber}: ${data.roundCategory || ''}`;

        const r1 = data.roundWinners?.[0];
        const r2 = data.roundWinners?.[1];
        const r3 = data.roundWinners?.[2];

        if (rpR1Name) rpR1Name.innerText = r1 ? (r1.nickname || r1.username) : '-';
        if (rpR1Pts) rpR1Pts.innerText = r1 ? `${r1.points.toLocaleString('id-ID')} Poin` : '0 Poin';
        if (rpR1Avatar) rpR1Avatar.src = r1?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=r1`;

        if (rpR2Name) rpR2Name.innerText = r2 ? (r2.nickname || r2.username) : '-';
        if (rpR2Pts) rpR2Pts.innerText = r2 ? `${r2.points.toLocaleString('id-ID')} Poin` : '0 Poin';
        if (rpR2Avatar) rpR2Avatar.src = r2?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=r2`;

        if (rpR3Name) rpR3Name.innerText = r3 ? (r3.nickname || r3.username) : '-';
        if (rpR3Pts) rpR3Pts.innerText = r3 ? `${r3.points.toLocaleString('id-ID')} Poin` : '0 Poin';
        if (rpR3Avatar) rpR3Avatar.src = r3?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=r3`;

        const g1 = data.globalWinners?.[0];
        const g2 = data.globalWinners?.[1];
        const g3 = data.globalWinners?.[2];
        if (glbP1) glbP1.innerText = g1 ? `${g1.nickname} (${g1.points}p)` : '-';
        if (glbP2) glbP2.innerText = g2 ? `${g2.nickname} (${g2.points}p)` : '-';
        if (glbP3) glbP3.innerText = g3 ? `${g3.nickname} (${g3.points}p)` : '-';

        if (rpCountdown && data.timer !== undefined) rpCountdown.innerText = data.timer;
    }
}

// Fallback HTTP Fetch on Load
async function fetchCurrentState() {
    try {
        const res = await fetch('/api/state');
        if (res.ok) {
            const data = await res.json();
            if (data && data.state) {
                console.log('[CLIENT] ✅ Initial State Loaded via API:', data.state);
                applyState(data);
            }
        }
    } catch (e) {
        console.log('[CLIENT] API sync info:', e.message);
    }
}

fetchCurrentState();

// ==========================================================================
// Socket.IO Events
// ==========================================================================

socket.on('connect', () => {
    console.log('[CLIENT] 🟢 Terhubung ke WebSocket server!');
    fetchCurrentState();
});

socket.on('SYNC_STATE', (data) => {
    applyState(data);
});

socket.on('QUESTION_START', (data) => {
    applyState(data);
    sfx.playPop();
});

socket.on('TIMER_TICK', (data) => {
    if (data.state === 'QUESTION_ACTIVE' && timerVal) {
        timerVal.innerText = data.timer;
        if (data.timer <= 3 && data.timer > 0) sfx.playTick();
    } else if (data.state === 'QUESTION_REVEAL' && revealCountdownNum) {
        revealCountdownNum.innerText = data.timer;
    } else if (data.state === 'ROUND_SUMMARY' && rpCountdown) {
        rpCountdown.innerText = data.timer;
    }
});

socket.on('VOTE_UPDATE', (data) => {
    if (data.votePercentages) {
        ['A', 'B', 'C', 'D'].forEach(opt => {
            const pct = data.votePercentages[opt] || 0;
            const pctEl = document.getElementById(`pct-${opt}`);
            const fillEl = document.getElementById(`fill-${opt}`);
            if (pctEl) pctEl.innerText = `${pct}%`;
            if (fillEl) fillEl.style.width = `${pct}%`;
        });
    }
    updateAvatars(data.answeringAvatars, data.totalVotes);
    updateDualLeaderboard(data.roundLeaderboard, data.globalLeaderboard, data.roundNumber);
    if (data.donorLeaderboard) updateDonorLeaderboard(data.donorLeaderboard);
});

// Update Leaderboard & Donatur realtime
socket.on('LEADERBOARD_UPDATE', (data) => {
    if (data.roundLeaderboard || data.globalLeaderboard) {
        updateDualLeaderboard(data.roundLeaderboard, data.globalLeaderboard);
    }
    if (data.donorLeaderboard) {
        updateDonorLeaderboard(data.donorLeaderboard);
    }
});

// Event saat ada penonton yang menjawab -> Muncul animasi avatar + centang hijau dari bawah!
socket.on('USER_ANSWERED', (data) => {
    spawnAnswerBubble(data);
    sfx.playPop();
});

socket.on('QUESTION_REVEAL', (data) => {
    applyState(data);
    if (data.questionTopWinners && data.questionTopWinners.length > 0) {
        sfx.playWinner();
    } else {
        sfx.playCorrect();
    }
});

socket.on('ROUND_SUMMARY', (data) => {
    applyState(data);
    sfx.playFanfare();
});

socket.on('GIFT_EVENT', (data) => {
    if (giftToast && giftToastUser && giftToastGift) {
        giftToastUser.innerText = `@${data.user}`;
        giftToastGift.innerText = `${data.giftName} (+${data.diamonds || 1}💎)`;
        if (giftToastAvatar) {
            giftToastAvatar.src = data.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.user)}`;
        }
        giftToast.style.display = 'flex';
        setTimeout(() => { giftToast.style.display = 'none'; }, 4500);
    }
    sfx.playGift();

    // Sorot tab Top Sultan selama 8 detik saat ada gift baru
    switchLeaderboardTab('donors', false);
    if (tabCycleTimer) clearTimeout(tabCycleTimer);
    tabCycleTimer = setTimeout(() => {
        switchLeaderboardTab('quiz', false);
        scheduleNextTabCycle();
    }, 8000);
});

// Listener ganti tab dari streamer control
socket.on('SWITCH_LEADERBOARD_TAB', (tabName) => {
    switchLeaderboardTab(tabName, true);
});

socket.on('PLAY_SOUND', (data) => {
    if (data.sound === 'correct') sfx.playCorrect();
    else if (data.sound === 'winner') sfx.playWinner();
    else if (data.sound === 'fanfare') sfx.playFanfare();
    else if (data.sound === 'gift') sfx.playGift();
    else if (data.sound === 'tick') sfx.playTick();
});

// Sync BGM State from Streamer Control
socket.on('BGM_STATE_UPDATE', (state) => {
    if (!bgmPlayer || !state) return;
    if (state.volume !== undefined) {
        currentBgmVolume = state.volume;
        bgmPlayer.volume = currentBgmVolume;
    }
    if (state.playing !== undefined) {
        isBgmPlaying = state.playing;
        if (isBgmPlaying) {
            bgmPlayer.play().catch(() => { });
        } else {
            bgmPlayer.pause();
        }
    }
});

// 🎙️ Gemini Studio Voiceover (Mbak Gadis Seksi, Natural & No Sayang) dengan BGM Ducking
socket.on('PLAY_VOICE', (data) => {
    if (!data || !data.clip) return;
    const clipUrl = `/sounds/vo_gemini/${data.clip}.wav`;
    console.log('[VOICE] 🎙️ Mbak Gadis Voiceover:', data.clip, data.label || '');

    // Audio Ducking: Turunkan volume BGM ke 10% agar suara terdengar jernih
    if (bgmPlayer && isBgmPlaying) {
        bgmPlayer.volume = 0.10;
    }

    if (!ttsPlayer) return;
    ttsPlayer.src = clipUrl;
    ttsPlayer.play().then(() => {
        if (audioStarterPill) audioStarterPill.style.display = 'none';
    }).catch(e => {
        console.log('[VOICE Play Info]:', e.message);
        if (bgmPlayer && isBgmPlaying) bgmPlayer.volume = currentBgmVolume;
    });

    // Saat selesai berbicara, kembalikan volume BGM ke volume normal
    ttsPlayer.onended = () => {
        if (bgmPlayer && isBgmPlaying) {
            bgmPlayer.volume = currentBgmVolume;
        }
    };
});

// ==========================================================================
// 🛑 Mode Penutupan Siaran (Ending Live) Event Handlers
// ==========================================================================

// 1. Alert Banner Soal Terakhir
socket.on('TRIGGER_LAST_SOAL_ALERT', () => {
    if (closingAlertBanner) {
        closingAlertBanner.style.display = 'block';
        sfx.playFanfare();
    }
});

// 2. Tampilkan Layar Penutupan Akbar & Podium Final
socket.on('SHOW_CLOSING_SCREEN', (data) => {
    if (!data) return;
    switchPage('page-closing');
    sfx.playFanfare();

    const quizList = document.getElementById('closing-quiz-list');
    const donorList = document.getElementById('closing-donor-list');

    // Render Juara Kuis
    if (quizList) {
        quizList.innerHTML = '';
        const winners = data.globalWinners && data.globalWinners.length > 0
            ? data.globalWinners.slice(0, 3)
            : [];
        if (winners.length === 0) {
            quizList.innerHTML = '<div style="color: #94a3b8; font-size: 13px; text-align: center; padding: 10px;">Belum ada data juara</div>';
        } else {
            const medals = ['🥇', '🥈', '🥉'];
            winners.forEach((w, idx) => {
                const card = document.createElement('div');
                card.className = `closing-winner-card ${idx === 0 ? 'rank-1' : ''}`;
                card.innerHTML = `
                    <div class="closing-winner-badge">${medals[idx] || (idx + 1)}</div>
                    <img class="closing-winner-avatar" src="${w.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${w.username}`}" alt="">
                    <div class="closing-winner-info">
                        <div class="closing-winner-name">${w.nickname || w.username}</div>
                        <div class="closing-winner-pts">${(w.points || 0).toLocaleString('id-ID')} Poin</div>
                    </div>
                `;
                quizList.appendChild(card);
            });
        }
    }

    // Render Juara Sultan Donatur
    if (donorList) {
        donorList.innerHTML = '';
        const donors = data.topDonors && data.topDonors.length > 0
            ? data.topDonors.slice(0, 3)
            : [];
        if (donors.length === 0) {
            donorList.innerHTML = '<div style="color: #94a3b8; font-size: 13px; text-align: center; padding: 10px;">Belum ada donatur</div>';
        } else {
            const donorMedals = ['👑', '💎', '⭐'];
            donors.forEach((d, idx) => {
                const card = document.createElement('div');
                card.className = `closing-winner-card ${idx === 0 ? 'rank-1' : ''}`;
                card.innerHTML = `
                    <div class="closing-winner-badge">${donorMedals[idx] || (idx + 1)}</div>
                    <img class="closing-winner-avatar" src="${d.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${d.username}`}" alt="">
                    <div class="closing-winner-info">
                        <div class="closing-winner-name">${d.nickname || d.username}</div>
                        <div class="closing-winner-pts">${(d.diamonds || 0).toLocaleString('id-ID')} 💎 Diamonds</div>
                    </div>
                `;
                donorList.appendChild(card);
            });
        }
    }
});

// 3. Dismiss Closing Screen (Kembali ke soal)
socket.on('DISMISS_CLOSING_SCREEN', () => {
    switchPage('page-question');
    if (closingAlertBanner) closingAlertBanner.style.display = 'none';
});
