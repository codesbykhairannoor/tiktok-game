const socket = io();

// Elemen DOM
const viewport = document.getElementById('stream-viewport');
const speechBubble = document.getElementById('speech-bubble-container');
const speechText = document.getElementById('speech-text');
const kingNameEl = document.getElementById('king-name');
const kingAvatarEl = document.getElementById('king-avatar');
const kingTimerEl = document.getElementById('king-timer');
const hofListEl = document.getElementById('hof-list');
const giftToastContainer = document.getElementById('gift-toast-container');
const kickOverlay = document.getElementById('kick-animation-overlay');
const kickerImg = document.getElementById('kicker-img');
const kingThroneCard = document.getElementById('king-throne-card');
const bottomSection = document.getElementById('bottom-battle-section');
const audioPlayer = document.getElementById('audio-player');
const speechPlayer = document.getElementById('speech-player') || audioPlayer;
const musicPlayer = document.getElementById('music-player') || audioPlayer;
const unlockOverlay = document.getElementById('audio-unlock-overlay');

// Elemen Baru: Sistem Mawar (Goal Bar & 4 Kursi Pengawal)
const roseCurrentCountEl = document.getElementById('rose-current-count');
const roseTargetCountEl = document.getElementById('rose-target-count');
const rosePctPillEl = document.getElementById('rose-pct-pill');
const roseProgressFillEl = document.getElementById('rose-progress-fill');
const guardSlot1 = document.getElementById('guard-slot-1');
const guardSlot2 = document.getElementById('guard-slot-2');
const guardSlot3 = document.getElementById('guard-slot-3');
const guardSlot4 = document.getElementById('guard-slot-4');
const floatingRosesContainer = document.getElementById('floating-roses-container');
const partyOverlay = document.getElementById('party-celebration-overlay');
const partyMvpText = document.getElementById('party-mvp-text');
const liveChatListEl = document.getElementById('live-chat-list');

// Elemen Baru: Konser & Karaoke Lagu Jepang Mika
const concertOverlay = document.getElementById('concert-overlay');
const concertSongTitle = document.getElementById('concert-song-title');
const concertDonorName = document.getElementById('concert-donor-name');
const concertLyricsText = document.getElementById('concert-lyrics-text');
const concertNotesContainer = document.getElementById('concert-notes');

// Auto Scale Viewport agar muat di monitor/OBS apapun dengan resolusi vertikal 1080x1920
function autoScaleViewport() {
    const targetW = 1080;
    const targetH = 1920;
    const scale = Math.min(window.innerWidth / targetW, window.innerHeight / targetH);
    viewport.style.transform = `scale(${scale})`;
    viewport.style.transformOrigin = 'center center';
}
window.addEventListener('resize', autoScaleViewport);
autoScaleViewport();

// Audio Context & Unlock
let audioCtx = null;

function unlockAudio() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    [speechPlayer, musicPlayer, audioPlayer].forEach(p => {
        if (p) {
            p.volume = 1.0;
            p.muted = false;
        }
    });
    if (unlockOverlay) {
        unlockOverlay.style.display = 'none';
    }
    try {
        playRoseChime();
    } catch { }
}
if (unlockOverlay) unlockOverlay.addEventListener('click', unlockAudio);
document.body.addEventListener('click', unlockAudio);
document.addEventListener('keydown', unlockAudio);

// Lip Sync Loop (100% Reliable Procedural & Amplitude Sync)
function setupLipSync() {
    function tick() {
        const isSpeaking = (!speechPlayer.paused && speechPlayer.currentTime > 0);
        const isSinging = (!musicPlayer.paused && musicPlayer.currentTime > 0);

        if (isSpeaking || isSinging) {
            const t = Date.now() / 70;
            // Variasi bicara / nyanyi natural ala anime seiyuu
            const mouthOpen = Math.max(0.0, (Math.sin(t) * 0.35 + Math.sin(t * 1.8) * 0.25 + 0.2));
            if (typeof window.setVrmMouthOpen === 'function') {
                window.setVrmMouthOpen(Math.min(1.0, mouthOpen));
            }
        } else {
            if (typeof window.setVrmMouthOpen === 'function') {
                window.setVrmMouthOpen(0);
            }
        }
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}
setupLipSync();

// Synthesizer Efek Suara (WebAudio SFX: Fanfare & Impact)
function playImpactSound() {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.36);
    } catch { }
}

function playFanfareChime() {
    if (!audioCtx) return;
    try {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + idx * 0.1 + 0.5);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(audioCtx.currentTime + idx * 0.1);
            osc.stop(audioCtx.currentTime + idx * 0.1 + 0.55);
        });
    } catch { }
}

function playRoseChime() {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.32);
    } catch { }
}

function updateRoseGoalUI(goal) {
    if (!goal) return;
    const current = goal.current || 0;
    const target = goal.target || 100;
    const pct = Math.min(100, Math.round((current / target) * 100));

    if (roseCurrentCountEl) roseCurrentCountEl.innerText = current;
    if (roseTargetCountEl) roseTargetCountEl.innerText = target;
    if (rosePctPillEl) rosePctPillEl.innerText = `${pct}%`;
    if (roseProgressFillEl) roseProgressFillEl.style.width = `${pct}%`;
}

function updateRoseGuardsUI(guards) {
    if (!Array.isArray(guards)) return;
    const slots = [guardSlot1, guardSlot2, guardSlot3, guardSlot4];

    slots.forEach((slot, idx) => {
        if (!slot) return;
        const guard = guards[idx];
        if (guard) {
            slot.classList.remove('empty');
            const img = slot.querySelector('.guard-avatar');
            const name = slot.querySelector('.guard-name');
            const roses = slot.querySelector('.guard-roses');
            if (img) img.src = guard.avatar;
            if (name) name.innerText = guard.name;
            if (roses) roses.innerText = `🌹 ${guard.roseCount} Mawar`;

            slot.classList.remove('bounce-rose');
            void slot.offsetWidth;
            slot.classList.add('bounce-rose');
        } else {
            slot.classList.add('empty');
            const name = slot.querySelector('.guard-name');
            const roses = slot.querySelector('.guard-roses');
            if (name) name.innerText = 'Kosong';
            if (roses) roses.innerText = '🌹 0 Mawar';
        }
    });
}

function spawnFloatingRoses(count = 5) {
    if (!floatingRosesContainer) return;
    const icons = ['🌹', '🌸', '✨', '🌹', '💖'];
    for (let i = 0; i < count; i++) {
        const item = document.createElement('div');
        item.className = 'floating-rose-item';
        item.innerText = icons[Math.floor(Math.random() * icons.length)];
        const leftPct = 12 + Math.random() * 76;
        item.style.left = `${leftPct}%`;
        const delay = Math.random() * 0.45;
        item.style.animationDelay = `${delay}s`;
        floatingRosesContainer.appendChild(item);
        setTimeout(() => item.remove(), 3200);
    }
}

function formatTimer(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
}

function renderLeaderboard(list) {
    if (!hofListEl) return;
    hofListEl.innerHTML = list
        .map((k, idx) => `
            <div class="hof-item">
                <div>
                    <span class="rank">#${idx + 1}</span>
                    <span>${k.name}</span>
                </div>
                <span class="duration">${formatTimer(k.reignSeconds)}</span>
            </div>
        `)
        .join('');
}

// ===================================================================
// SOCKET.IO EVENT HANDLERS
// ===================================================================
socket.on('INIT_STATE', (state) => {
    if (state.currentKing) {
        kingNameEl.innerText = state.currentKing.name;
        kingAvatarEl.src = state.currentKing.avatar;
        kingTimerEl.innerText = formatTimer(state.currentKing.reignSeconds);
    }
    if (state.leaderboard) {
        renderLeaderboard(state.leaderboard);
    }
    if (state.roseGoal) {
        updateRoseGoalUI(state.roseGoal);
    }
    if (state.roseGuards) {
        updateRoseGuardsUI(state.roseGuards);
    }
});

socket.on('THRONE_TICK', (data) => {
    if (data.currentKing) {
        kingTimerEl.innerText = formatTimer(data.reignSeconds);
    }
});

socket.on('THRONE_TAKEOVER', (data) => {
    console.log('[TAKEOVER 💥]', data.newKing.name, 'menggeser', data.oldKing?.name);

    playImpactSound();
    setTimeout(playFanfareChime, 450);

    // Animasi Flying Kick
    kickerImg.src = data.newKing.avatar;
    kickOverlay.style.display = 'block';
    kickOverlay.classList.remove('flying-kick');
    void kickOverlay.offsetWidth;
    kickOverlay.classList.add('flying-kick');

    // Raja lama terlempar
    kingThroneCard.classList.add('king-fly-off');
    bottomSection.classList.add('shake-screen');

    setTimeout(() => {
        kingNameEl.innerText = data.newKing.name;
        kingAvatarEl.src = data.newKing.avatar;
        kingTimerEl.innerText = '00:00';

        kingThroneCard.classList.remove('king-fly-off');
        bottomSection.classList.remove('shake-screen');
        kickOverlay.style.display = 'none';
        kickOverlay.classList.remove('flying-kick');
    }, 900);
});

// ===================================================================
// SISTEM LIVE CHAT TICKER & AI-VTUBER PEMBACA KOMENTAR
// ===================================================================
function addLiveChatMessage(sender, comment, avatar, isSpeaking = false) {
    if (!liveChatListEl) return null;
    const item = document.createElement('div');
    item.className = 'live-chat-item' + (isSpeaking ? ' is-speaking' : '');
    item.dataset.sender = sender;
    item.dataset.comment = comment;

    const avatarUrl = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(sender)}`;
    item.innerHTML = `
        <div class="chat-avatar-wrap">
            <img src="${avatarUrl}" alt="${sender}" class="chat-avatar">
        </div>
        <div class="chat-content">
            <div class="chat-meta">
                <span class="chat-username">${sender}</span>
                ${isSpeaking ? '<span class="badge-speaking">✨ Dibaca Mika</span>' : ''}
            </div>
            <div class="chat-text">${comment}</div>
        </div>
    `;
    liveChatListEl.appendChild(item);

    // Batasi maksimal 4 chat di layar agar bersih dan tidak menutupi avatar Mika
    while (liveChatListEl.children.length > 4) {
        liveChatListEl.removeChild(liveChatListEl.children[0]);
    }

    // Auto remove setelah 12 detik jika tidak sedang dibaca Mika
    if (!isSpeaking) {
        setTimeout(() => {
            if (item.parentNode && !item.classList.contains('is-speaking')) {
                item.style.opacity = '0';
                item.style.transform = 'translateY(-10px)';
                item.style.transition = 'all 0.4s ease';
                setTimeout(() => item.remove(), 400);
            }
        }, 12000);
    }
    return item;
}

socket.on('TIKTOK_CHAT', (data) => {
    addLiveChatMessage(data.sender, data.comment, data.avatar);
});

socket.on('CHAT_READ', (data) => {
    // Beri efek highlight "Dibaca Mika" ke chat yang sesuai
    let matched = null;
    if (liveChatListEl) {
        const items = liveChatListEl.querySelectorAll('.live-chat-item');
        for (const it of items) {
            if (it.dataset.sender === data.username || it.dataset.comment === data.comment) {
                matched = it;
                break;
            }
        }
    }
    if (matched) {
        matched.classList.add('is-speaking');
        const meta = matched.querySelector('.chat-meta');
        if (meta && !meta.querySelector('.badge-speaking')) {
            const badge = document.createElement('span');
            badge.className = 'badge-speaking';
            badge.innerText = '✨ Dibaca Mika';
            meta.appendChild(badge);
        }
    } else {
        addLiveChatMessage(data.username, data.comment, data.avatar, true);
    }
});

socket.on('VTUBER_SPEAK', (data) => {
    if (!data.audioUrl) return;

    speechText.innerText = data.text;
    speechBubble.style.display = 'block';

    if (typeof window.playVrmMotion === 'function' && data.motion) {
        window.playVrmMotion(data.motion, 4200);
    }
    if (typeof window.setVrmExpression === 'function') {
        window.setVrmExpression(data.expression || 'happy');
    }

    const player = speechPlayer || audioPlayer;
    player.src = data.audioUrl;
    player.volume = 1.0;
    player.muted = false;
    const playPromise = player.play();
    if (playPromise !== undefined) {
        playPromise.catch((err) => {
            console.warn('[AUDIO] Autoplay bicara tertahan:', err.message);
            if (unlockOverlay) unlockOverlay.style.display = 'flex';
        });
    }

    player.onended = () => {
        setTimeout(() => {
            speechBubble.style.display = 'none';
            // Lepas highlight pada chat yang sudah selesai dibaca
            if (liveChatListEl) {
                const speakingItems = liveChatListEl.querySelectorAll('.live-chat-item.is-speaking');
                speakingItems.forEach(it => {
                    it.classList.remove('is-speaking');
                    const b = it.querySelector('.badge-speaking');
                    if (b) b.remove();
                });
            }
        }, 1500);
    };
});

socket.on('GIFT_ALERT', (data) => {
    const toast = document.createElement('div');
    toast.className = 'gift-toast';
    toast.innerHTML = `
        <img src="${data.avatar}" alt="${data.username}">
        <div class="gift-toast-info">
            <div class="sender">${data.username}</div>
            <div class="action">Kirim ${data.giftName} (${data.coins} 🪙)</div>
        </div>
    `;
    giftToastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, 4500);
});

socket.on('THRONE_RESET', (newKing) => {
    kingNameEl.innerText = newKing.name;
    kingAvatarEl.src = newKing.avatar;
    kingTimerEl.innerText = '00:00';
});

// ===================================================================
// EVENT HANDLERS SISTEM MAWAR (GOAL BAR & PENGAWAL)
// ===================================================================
socket.on('ROSE_GOAL_UPDATE', (goal) => {
    updateRoseGoalUI(goal);
    playRoseChime();
});

socket.on('ROSE_GOAL_RESET', (goal) => {
    updateRoseGoalUI(goal);
    if (partyOverlay) partyOverlay.style.display = 'none';
});

socket.on('ROSE_GUARDS_UPDATE', (guards) => {
    updateRoseGuardsUI(guards);
});

socket.on('ROSE_SPAWN_PARTICLES', (data) => {
    spawnFloatingRoses(data.count || 6);
});

socket.on('ROSE_PARTY_START', (data) => {
    if (partyOverlay) {
        if (partyMvpText) partyMvpText.innerText = `👑 MVP PESTA: ${data.mvp}`;
        partyOverlay.style.display = 'flex';
        playFanfareChime();
        spawnFloatingRoses(24);
        setTimeout(() => {
            partyOverlay.style.display = 'none';
        }, 11000);
    }
});

// ===================================================================
// EVENT HANDLERS KONSER & KARAOKE LAGU JEPANG MIKA
// ===================================================================
let concertNotesTimer = null;
function startFloatingNotes() {
    if (!concertNotesContainer) return;
    const icons = ['🎵', '🎶', '✨', '💖', '⭐', '🌸', '🎤', '🎸'];
    if (concertNotesTimer) clearInterval(concertNotesTimer);
    concertNotesTimer = setInterval(() => {
        const item = document.createElement('div');
        item.className = 'floating-note-item';
        item.innerText = icons[Math.floor(Math.random() * icons.length)];
        const leftPct = 15 + Math.random() * 70;
        item.style.left = `${leftPct}%`;
        concertNotesContainer.appendChild(item);
        setTimeout(() => item.remove(), 3600);
    }, 450);
}

function stopFloatingNotes() {
    if (concertNotesTimer) {
        clearInterval(concertNotesTimer);
        concertNotesTimer = null;
    }
}

socket.on('CONCERT_START', (data) => {
    if (concertOverlay) {
        if (concertSongTitle) concertSongTitle.innerText = data.song.title;
        if (concertDonorName) concertDonorName.innerText = data.donor;
        if (concertLyricsText) concertLyricsText.innerText = data.song.lyrics;
        concertOverlay.style.display = 'block';
        concertOverlay.style.opacity = '1';
        startFloatingNotes();
        playFanfareChime();
    }
});

let danceInterval = null;
socket.on('CONCERT_SING', (data) => {
    if (concertOverlay) {
        concertOverlay.style.display = 'block';
        concertOverlay.style.opacity = '1';
    }
    if (concertLyricsText) concertLyricsText.innerText = data.lyrics;

    // Putar audio lagu karaoke pada musicPlayer
    const player = musicPlayer || audioPlayer;
    player.src = data.audioUrl + (data.audioUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
    player.volume = 1.0;
    player.muted = false;
    player.play().catch(e => {
        console.warn('[AUDIO] Autoplay musik tertahan:', e.message);
        if (unlockOverlay) unlockOverlay.style.display = 'flex';
    });

    // Dance loop Mika (Jump & Clapping berselang-seling)
    if (danceInterval) clearInterval(danceInterval);
    let toggle = false;
    const dance = () => {
        if (typeof window.playVrmMotion === 'function') {
            window.playVrmMotion(toggle ? 'Jump' : 'Clapping', 3000);
            toggle = !toggle;
        }
        if (typeof window.setVrmExpression === 'function') {
            window.setVrmExpression('happy');
        }
    };
    dance();
    danceInterval = setInterval(dance, 2800);
});

socket.on('CONCERT_END', (data) => {
    if (danceInterval) {
        clearInterval(danceInterval);
        danceInterval = null;
    }
    stopFloatingNotes();
    if (musicPlayer && !musicPlayer.paused) {
        musicPlayer.pause();
    }
    if (concertOverlay) {
        concertOverlay.style.opacity = '0';
        concertOverlay.style.transition = 'opacity 0.8s ease';
        setTimeout(() => {
            concertOverlay.style.display = 'none';
            concertOverlay.style.opacity = '1';
        }, 800);
    }
});
