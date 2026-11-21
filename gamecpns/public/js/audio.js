/**
 * audio.js - Master Broadcast Audio Engine & Human Announcer Voice Pack
 * Mendukung BGM Asli (Monkeys Spinning, Sneaky Snitch, Lofi Study), Audio Ducking, dan Human Studio Voice Pack.
 */

class QuizBgmEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.compressor = null;
        this.isPlaying = false;
        this.baseVolume = 0.50;
        this.currentVolume = 0.50;
        this.isDucked = false;

        this.tracks = {
            'monkeys': '/bgm/monkeys-spinning.mp3',
            'sneaky': '/bgm/sneaky-snitch.mp3',
            'lofi': '/bgm/lofi-study.mp3',
            'default': '/bgm.mp3'
        };
        this.currentTrackKey = 'monkeys';

        this.audioEl = new Audio(this.tracks.monkeys);
        this.audioEl.loop = true;
        this.audioEl.preload = 'auto';
        this.audioEl.volume = this.currentVolume;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setTrack(trackKey) {
        if (this.tracks[trackKey]) {
            this.currentTrackKey = trackKey;
            const wasPlaying = this.isPlaying;
            this.audioEl.pause();
            this.audioEl.src = this.tracks[trackKey];
            this.audioEl.currentTime = 0;
            this.audioEl.volume = this.currentVolume;
            if (wasPlaying || bgmActive) {
                this.start();
            }
        }
    }

    start() {
        this.init();
        this.audioEl.volume = this.currentVolume;
        const playPromise = this.audioEl.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isPlaying = true;
                const banner = document.getElementById('audio-unlock-overlay');
                if (banner) banner.style.display = 'none';
            }).catch(err => {
                this.isPlaying = false;
                console.log('[AUDIO BGM] Browser menolak autoplay. Perlu 1x klik:', err.message);
                const banner = document.getElementById('audio-unlock-overlay');
                if (banner) {
                    banner.style.display = 'flex';
                }
            });
        }
    }

    stop() {
        this.isPlaying = false;
        this.audioEl.pause();
    }

    setVolume(val) {
        this.baseVolume = Math.max(0, Math.min(1, val));
        if (!this.isDucked) {
            this.currentVolume = this.baseVolume;
            this.audioEl.volume = this.currentVolume;
        }
    }

    /**
     * Audio Ducking: Mengecilkan musik latar saat AI atau Announcer berbicara
     */
    duck(duckRatio = 0.20) {
        this.isDucked = true;
        this.currentVolume = this.baseVolume * duckRatio;
        this.fadeVolume(this.currentVolume, 250);
    }

    unduck() {
        this.isDucked = false;
        this.currentVolume = this.baseVolume;
        this.fadeVolume(this.currentVolume, 400);
    }

    fadeVolume(targetVol, durationMs = 300) {
        const startVol = this.audioEl.volume;
        const diff = targetVol - startVol;
        const steps = 15;
        const stepTime = durationMs / steps;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            const newVol = Math.max(0, Math.min(1, startVol + (diff * (step / steps))));
            this.audioEl.volume = newVol;
            if (step >= steps) {
                clearInterval(timer);
                this.audioEl.volume = targetVol;
            }
        }, stepTime);
    }
}

// Global BGM Engine
const bgmEngine = new QuizBgmEngine();
let bgmActive = true;

function toggleBGM() {
    bgmActive = !bgmActive;
    if (bgmActive) {
        bgmEngine.start();
    } else {
        bgmEngine.stop();
    }
}

function unlockAudioDirect() {
    bgmActive = true;
    bgmEngine.init();
    bgmEngine.start();
    const banner = document.getElementById('audio-unlock-overlay');
    if (banner) banner.style.display = 'none';
}

function ensureAudioRunning() {
    try {
        bgmEngine.init();
        if (bgmActive && !bgmEngine.isPlaying) {
            bgmEngine.start();
        }
    } catch (e) { }
}

// Auto unlock audio pada klik pertama di layar
['click', 'touchstart', 'keydown'].forEach(evt => {
    document.addEventListener(evt, () => {
        ensureAudioRunning();
    }, { passive: true });
});

window.addEventListener('DOMContentLoaded', () => { ensureAudioRunning(); });
window.addEventListener('load', () => { ensureAudioRunning(); });

/**
 * =========================================================================
 * HUMAN ANNOUNCER VOICE PACK COORDINATOR (Klip Suara Studio Manusia)
 * 100% Bebas Kesan AI, Bebas Hak Cipta, 0ms Delay, & Bisa Diganti Suara Sendiri
 * =========================================================================
 */
class VoicePackCoordinator {
    constructor() {
        this.enabled = true; // Aktif secara default untuk klip presenter manusia
        this.volume = 0.95;
        this.queue = [];
        this.isPlaying = false;
        this.currentAudio = null;
    }

    play(clipName, callback = null) {
        if (!this.enabled) return;
        this.queue.push({ clipName, callback });
        this.processQueue();
    }

    playSequence(clip1, clip2) {
        this.play(clip1, () => {
            if (clip2) {
                setTimeout(() => {
                    this.play(clip2);
                }, 350);
            }
        });
    }

    processQueue() {
        if (this.isPlaying || this.queue.length === 0) return;
        this.isPlaying = true;

        const item = this.queue.shift();
        ensureAudioRunning();

        // Duck BGM ke 15% agar suara presenter manusia terdengar lantang & jernih
        bgmEngine.duck(0.15);

        const audioPath = `/voicepack/${item.clipName}.mp3`;
        const audio = new Audio(audioPath);
        this.currentAudio = audio;
        audio.volume = this.volume;

        const onDone = () => {
            bgmEngine.unduck();
            this.currentAudio = null;
            this.isPlaying = false;
            if (item.callback) item.callback();
            setTimeout(() => {
                this.processQueue();
            }, 250);
        };

        audio.onended = onDone;
        audio.onerror = () => {
            console.log('[VOICEPACK] Klip tidak ditemukan:', audioPath);
            onDone();
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                console.log('[VOICEPACK] Playback dicegah browser:', err.message);
                onDone();
            });
        }
    }
}

const voicePack = new VoicePackCoordinator();

/**
 * =========================================================================
 * MICROSOFT NEURAL TTS BROADCAST COORDINATOR (OPSIONAL)
 * =========================================================================
 */
class VoiceCoordinator {
    constructor() {
        this.currentAudio = null;
        this.queue = [];
        this.isPlaying = false;
        this.captionEl = null;
    }

    initCaption() {
        if (!this.captionEl) {
            let el = document.getElementById('voice-caption-pill');
            if (!el) {
                el = document.createElement('div');
                el.id = 'voice-caption-pill';
                el.style.cssText = `
                    position: fixed;
                    bottom: 25px;
                    left: 50%;
                    transform: translateX(-50%) translateY(50px);
                    background: rgba(15, 23, 42, 0.95);
                    border: 2px solid #38bdf8;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.7);
                    color: #ffffff;
                    padding: 9px 20px;
                    border-radius: 999px;
                    font-size: 16px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    z-index: 99999;
                    pointer-events: none;
                    opacity: 0;
                    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
                    max-width: 90%;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                `;
                document.body.appendChild(el);
            }
            this.captionEl = el;
        }
    }

    showCaption(text) {
        this.initCaption();
        if (this.captionEl) {
            this.captionEl.innerHTML = `<span style="font-size: 19px;">🎙️</span> <span>${text}</span>`;
            this.captionEl.style.opacity = '1';
            this.captionEl.style.transform = 'translateX(-50%) translateY(0)';
        }
    }

    hideCaption() {
        if (this.captionEl) {
            this.captionEl.style.opacity = '0';
            this.captionEl.style.transform = 'translateX(-50%) translateY(40px)';
        }
    }

    play(audioUrl, text) {
        this.queue.push({ audioUrl, text });
        this.processQueue();
    }

    processQueue() {
        if (this.isPlaying || this.queue.length === 0) return;
        this.isPlaying = true;

        const item = this.queue.shift();
        ensureAudioRunning();

        // Duck BGM
        bgmEngine.duck(0.15);
        this.showCaption(item.text);

        const audio = new Audio(item.audioUrl);
        this.currentAudio = audio;
        audio.volume = 1.0;

        const onFinish = () => {
            this.hideCaption();
            bgmEngine.unduck();
            this.currentAudio = null;
            this.isPlaying = false;
            setTimeout(() => {
                this.processQueue();
            }, 400);
        };

        audio.onended = onFinish;
        audio.onerror = () => {
            console.log('[TTS] Error memuat audio:', item.audioUrl);
            onFinish();
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                console.log('[TTS] Auto-play dicegah browser:', err.message);
                onFinish();
            });
        }
    }
}

const voiceCoordinator = new VoiceCoordinator();

// Hubungkan socket event audio ke client
if (typeof io !== 'undefined') {
    const clientSocket = (typeof socket !== 'undefined' && socket) ? socket : io();

    // 1. Voice Pack Announcer Otomatis Berdasarkan Alur Game
    clientSocket.on('QUESTION_START', () => {
        voicePack.play('round_start');
    });

    clientSocket.on('TIMER_TICK', t => {
        if (t && t.timer === 10) {
            voicePack.play('countdown_10s');
        }
    });

    clientSocket.on('QUESTION_REVEAL', rev => {
        const letter = (rev.correctAnswer || rev.jawaban || '').toLowerCase();
        if (letter && ['a', 'b', 'c', 'd', 'e'].includes(letter)) {
            voicePack.playSequence('time_up', 'opt_' + letter);
        } else {
            voicePack.play('time_up');
        }
    });

    clientSocket.on('REWARD_GIFT_EVENT', () => {
        voicePack.play('gift_thanks');
    });

    // 2. Kontrol Manual dari Streamer
    clientSocket.on('PLAY_VOICEPACK_CLIP', data => {
        if (data && data.clip) {
            voicePack.play(data.clip);
        }
    });

    clientSocket.on('SET_VOICEPACK_ENABLED', data => {
        if (data && typeof data.enabled === 'boolean') {
            voicePack.enabled = data.enabled;
        }
    });

    clientSocket.on('TTS_SPEAK', data => {
        if (data && data.audioUrl) {
            voiceCoordinator.play(data.audioUrl, data.text || '');
        }
    });

    clientSocket.on('SET_BGM_TRACK', data => {
        if (data && data.track) {
            bgmEngine.setTrack(data.track);
        }
    });

    clientSocket.on('SET_BGM_VOLUME', data => {
        if (data && typeof data.volume === 'number') {
            bgmEngine.setVolume(data.volume);
        }
    });

    clientSocket.on('TOGGLE_BGM', () => {
        toggleBGM();
    });

    clientSocket.on('PLAY_SOUNDPAD_EFFECT', data => {
        if (data && data.effect) {
            playStudioFX(data.effect);
        }
    });
}

/**
 * Soundpad FX Studio (Ding, Buzzer, Applause, Drumroll)
 */
function playStudioFX(type) {
    try {
        bgmEngine.init();
        const ctx = bgmEngine.ctx;
        if (!ctx) return;
        const now = ctx.currentTime;

        if (type === 'ding') {
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                gain.gain.setValueAtTime(0.25, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.45);
            });
        } else if (type === 'buzzer') {
            [130, 123].forEach(freq => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0.28, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.5);
            });
        } else if (type === 'applause') {
            const bufferSize = ctx.sampleRate * 1.5;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1000, now);
            filter.Q.setValueAtTime(1.5, now);
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            noise.start(now);
            noise.stop(now + 1.5);
        } else if (type === 'drumroll') {
            for (let i = 0; i < 20; i++) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(120 + Math.random() * 40, now + i * 0.05);
                gain.gain.setValueAtTime(0.18 + (i * 0.01), now + i * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.04);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.05);
                osc.stop(now + i * 0.05 + 0.04);
            }
        }
    } catch (e) { }
}
