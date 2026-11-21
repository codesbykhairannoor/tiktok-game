const socket = io();

// Elemen DOM
const stageEl = document.getElementById('vtuber-stage');
const audioPlayer = document.getElementById('tts-audio-player');
const dialogueBox = document.getElementById('dialogue-box');
const dialogueText = document.getElementById('dialogue-text');
const speakerTag = document.getElementById('speaker-tag');
const donationToast = document.getElementById('donation-toast');
const dtoastIcon = document.getElementById('dtoast-icon');
const dtoastTitle = document.getElementById('dtoast-title');
const dtoastDesc = document.getElementById('dtoast-desc');
const dtoastMsg = document.getElementById('dtoast-msg');
const chatFeed = document.getElementById('chat-feed');
const valBpm = document.getElementById('val-bpm');
const streamTimerEl = document.getElementById('stream-timer');

const goalFill = document.getElementById('goal-fill');
const goalPct = document.getElementById('goal-pct');
const goalCurrent = document.getElementById('goal-current');
const goalTarget = document.getElementById('goal-target');

let currentGoal = 3084;
let targetGoal = 5000;

// ===================================================================
// 0. RESPONSIVE VIEWPORT AUTO-SCALE (Fit 1080x1920 di Desktop & OBS)
// ===================================================================
function fitStageToViewport() {
    if (!stageEl) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Jika di OBS 1080x1920 pas, scale = 1; jika di layar PC/laptop, perkecil proporsional
    const scale = Math.min(vw / 1080, vh / 1920);
    stageEl.style.transform = `scale(${scale})`;
}
window.addEventListener('resize', fitStageToViewport);
fitStageToViewport();

// Mode VTube Studio / VSeeFace (?vtube=1)
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('vtube') === '1' || urlParams.get('hidechar') === '1') {
    const vrmCanvas = document.getElementById('vrm-canvas');
    const loadingEl = document.getElementById('live2d-loading');
    const vtubeHint = document.getElementById('vtube-hint');
    if (vrmCanvas) vrmCanvas.style.display = 'none';
    if (loadingEl) loadingEl.style.display = 'none';
    if (vtubeHint) vtubeHint.style.display = 'block';
}

// ===================================================================
// 1. AUDIO & REAL-TIME LIP-SYNC ENGINE
// ===================================================================
let audioCtx = null;
let analyserNode = null;
let audioSourceNode = null;
let audioFreqData = null;
let isAudioContextAttached = false;

function unlockAudio() {
    const banner = document.getElementById('audio-unlock-overlay');
    if (banner) banner.style.display = 'none';

    try {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) audioCtx = new AudioContextClass();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().then(() => attachMediaSourceIfReady());
        } else if (audioCtx && audioCtx.state === 'running') {
            attachMediaSourceIfReady();
        }
    } catch (e) {}
}

function attachMediaSourceIfReady() {
    if (isAudioContextAttached || !audioCtx || audioCtx.state !== 'running') return;
    try {
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 128;
        analyserNode.smoothingTimeConstant = 0.78;
        audioSourceNode = audioCtx.createMediaElementSource(audioPlayer);
        audioSourceNode.connect(analyserNode);
        analyserNode.connect(audioCtx.destination);
        audioFreqData = new Uint8Array(analyserNode.frequencyBinCount);
        isAudioContextAttached = true;
    } catch (e) {}
}

document.addEventListener('click', unlockAudio, { once: false });
document.addEventListener('keydown', unlockAudio, { once: false });

function setupLipSyncLoop() {
    function animateLip() {
        if (!audioPlayer.paused && audioPlayer.currentTime > 0) {
            let mouthOpen = 0;

            if (isAudioContextAttached && analyserNode && audioFreqData) {
                analyserNode.getByteFrequencyData(audioFreqData);
                let sum = 0;
                for (let i = 0; i < audioFreqData.length; i++) {
                    sum += audioFreqData[i];
                }
                const avg = sum / audioFreqData.length;
                mouthOpen = Math.min(1.0, Math.max(0.0, (avg - 6) / 26));
            } else {
                const t = Date.now() / 1000;
                mouthOpen = Math.max(0.0, Math.sin(t * 18) * 0.48 + Math.sin(t * 9) * 0.28);
            }

            if (typeof window.setVrmMouthOpen === 'function') {
                window.setVrmMouthOpen(mouthOpen);
            }
        } else if (audioPlayer.paused) {
            if (typeof window.setVrmMouthOpen === 'function') {
                window.setVrmMouthOpen(0);
            }
        }
        requestAnimationFrame(animateLip);
    }
    requestAnimationFrame(animateLip);
}
setupLipSyncLoop();

// ===================================================================
// 2. TIMER STREAM
// ===================================================================
let streamSeconds = 11879;
setInterval(() => {
    streamSeconds++;
    const hrs = String(Math.floor(streamSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((streamSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(streamSeconds % 60).padStart(2, '0');
    if (streamTimerEl) streamTimerEl.innerText = `${hrs}:${mins}:${secs}`;
}, 1000);

// ===================================================================
// 3. SOCKET EVENTS (SUARA, ANIMASI VRMA, KACAMATA, CHAT, SAWERIA)
// ===================================================================
socket.on('VTUBER_SPEAK', (data) => {
    if (!data.audioUrl) return;

    if (dialogueBox && dialogueText) {
        speakerTag.innerText = `✨ ${data.sender ? data.sender : 'Sasha'}:`;
        dialogueText.innerText = data.text;
        dialogueBox.style.display = 'block';
    }

    // Mainkan animasi VRMA & ekspresi 3D serentak dengan suara!
    if (typeof window.playVrmMotion === 'function' && data.motion) {
        window.playVrmMotion(data.motion, 4200);
    }
    if (typeof window.setVrmExpression === 'function') {
        const expr = data.expression || (data.type === 'saweria' || data.type === 'gift' ? 'happy' : 'happy');
        window.setVrmExpression(expr, 3800);
    }

    audioPlayer.volume = 1.0;
    audioPlayer.muted = false;
    audioPlayer.src = data.audioUrl;

    const playPromise = audioPlayer.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            const banner = document.getElementById('audio-unlock-overlay');
            if (banner) banner.style.display = 'none';
        }).catch(() => {
            const banner = document.getElementById('audio-unlock-overlay');
            if (banner) banner.style.display = 'flex';
        });
    }

    audioPlayer.onended = () => {
        setTimeout(() => {
            if (dialogueBox) dialogueBox.style.display = 'none';
        }, 1200);
    };
});

// Kontrol Motion / Kacamata / Model langsung dari Admin
socket.on('VTUBER_MOTION', (data) => {
    if (data.motion && typeof window.playVrmMotion === 'function') {
        window.playVrmMotion(data.motion, 3500);
    }
    if (data.expression && typeof window.setVrmExpression === 'function') {
        window.setVrmExpression(data.expression, 3500);
    }
});

socket.on('VTUBER_GLASSES', (data) => {
    if (typeof window.setGlassesVisible === 'function') {
        window.setGlassesVisible(data.visible);
    }
});

socket.on('VTUBER_SWITCH_MODEL', (data) => {
    if (data.model && typeof window.switchVrmModel === 'function') {
        window.switchVrmModel(data.model);
    }
});

socket.on('VTUBER_HEART_RATE', (data) => {
    if (valBpm && data.bpm) {
        valBpm.innerText = data.bpm;
    }
});

socket.on('SAWERIA_ALERT', (data) => {
    if (!donationToast) return;

    dtoastIcon.innerText = '💎';
    dtoastTitle.innerText = 'SAWERIA MASUK!';
    dtoastDesc.innerText = `${data.donator} donasi Rp ${Number(data.amount).toLocaleString('id-ID')}`;
    dtoastMsg.innerText = data.message ? `"${data.message}"` : '';

    donationToast.style.display = 'block';
    currentGoal += Math.round((Number(data.amount) || 1000) / 100);
    updateGoalUI();

    setTimeout(() => {
        donationToast.style.display = 'none';
    }, 6000);
});

socket.on('TIKTOK_GIFT', (data) => {
    if (!donationToast) return;

    dtoastIcon.innerText = '🎁';
    dtoastTitle.innerText = 'GIFT TIKTOK!';
    dtoastDesc.innerText = `@${data.sender} kirim ${data.giftName} (${data.diamonds}💎)`;
    dtoastMsg.innerText = '';

    donationToast.style.display = 'block';
    currentGoal += Number(data.diamonds) * 10 || 50;
    updateGoalUI();

    setTimeout(() => {
        donationToast.style.display = 'none';
    }, 5000);
});

// FIX: Listen event yang benar ('TIKTOK_CHAT') & class CSS yang cocok ('.chat-bubble-item')
function renderChatBubble(data) {
    if (!chatFeed) return;
    const text = data.comment || data.message || '';
    if (!text) return;

    const item = document.createElement('div');
    item.className = 'chat-bubble-item';
    item.innerHTML = `
        <span class="chat-sender">@${escapeHtml(data.sender)}:</span>
        <span class="chat-comment">${escapeHtml(text)}</span>
    `;

    chatFeed.appendChild(item);
    while (chatFeed.children.length > 6) {
        chatFeed.removeChild(chatFeed.firstChild);
    }
    chatFeed.scrollTop = chatFeed.scrollHeight;
}

socket.on('TIKTOK_CHAT', renderChatBubble);
socket.on('TIKTOK_COMMENT', renderChatBubble);

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function updateGoalUI() {
    if (!goalFill || !goalPct || !goalCurrent || !goalTarget) return;
    const pct = Math.min(100, Math.round((currentGoal / targetGoal) * 100));
    goalFill.style.width = `${pct}%`;
    goalPct.innerText = `${pct}%`;
    goalCurrent.innerText = currentGoal.toLocaleString('id-ID');
    goalTarget.innerText = targetGoal.toLocaleString('id-ID');
}

updateGoalUI();
console.log('[OVERLAY] ✅ Studio Overlay V2 (Pastel Room + VRMA + Fixed Chat Ticker) Siap!');
