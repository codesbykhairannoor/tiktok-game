/**
 * TTSEngine.js - Ultra-Realistic Microsoft Neural Voice (Azure Speech Engine)
 * Menggunakan model 'id-ID-GadisNeural' & 'id-ID-ArdiNeural' via msedge-tts
 * Dilengkapi Disk Caching (MD5) agar latency 0ms untuk kalimat berulang dan 100% GRATIS tanpa batas kuota.
 */

const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class TTSEngine {
    constructor(io) {
        this.io = io;
        this.cacheDir = path.join(__dirname, '..', 'public', 'audio_cache');
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }

        this.currentVoice = 'id-ID-GadisNeural'; // 'id-ID-GadisNeural' (Wanita) atau 'id-ID-ArdiNeural' (Pria)
        this.enabled = false; // DEFAULT MATI: Jangan pakai suara robot kaku saat live
        this.autoGreeting = false; // MATI: Jangan sapa ribuan penonton satu per satu (bikin rusuh & berisik)
        this.autoReadQuestion = false;
        this.autoAnnounceReveal = false;

        // Anti-Spam & Debounce
        this.lastGreetingTime = 0;
        this.minGreetingIntervalMs = 7000; // Minimal jeda 7 detik antar sapaan agar tidak tumpang tindih
        this.greetedUsers = new Map(); // username -> timestamp terakhir disapa
        this.greetingUserCooldownMs = 10 * 60 * 1000; // Jangan sapa user yang sama dalam 10 menit

        // Queue manajemen agar audio antre dengan rapi
        this.isSpeaking = false;
        this.speechQueue = [];
    }

    /**
     * Set konfigurasi dari Streamer Control Panel
     */
    updateSettings(settings = {}) {
        if (typeof settings.enabled === 'boolean') this.enabled = settings.enabled;
        if (typeof settings.autoGreeting === 'boolean') this.autoGreeting = settings.autoGreeting;
        if (typeof settings.autoReadQuestion === 'boolean') this.autoReadQuestion = settings.autoReadQuestion;
        if (typeof settings.autoAnnounceReveal === 'boolean') this.autoAnnounceReveal = settings.autoAnnounceReveal;
        if (settings.voice) this.currentVoice = settings.voice;
        console.log(`[TTS] ⚙️ Konfigurasi diperbarui: Enabled=${this.enabled}, Voice=${this.currentVoice}, Sapa=${this.autoGreeting}`);
    }

    /**
     * Menghasilkan file audio dari teks dan menyimpannya di cache lokal
     */
    async generateAudio(text, voice = null) {
        const selectedVoice = voice || this.currentVoice;
        const cleanText = text.replace(/[*_#`~]/g, '').trim();
        if (!cleanText) return null;

        // Hash filename berdasarkan teks dan voice
        const hash = crypto.createHash('md5').update(`${selectedVoice}_${cleanText}`).digest('hex');
        const filename = `${hash}.mp3`;
        const filePath = path.join(this.cacheDir, filename);
        const publicUrl = `/audio_cache/${filename}`;

        // Jika sudah ada di cache lokal, langsung pakai (0ms delay)
        if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1000) {
            return { url: publicUrl, filePath, cached: true };
        }

        return new Promise(async (resolve) => {
            try {
                const tts = new MsEdgeTTS();
                await tts.setMetadata(selectedVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

                const { audioStream } = tts.toStream(cleanText);
                const outStream = fs.createWriteStream(filePath);

                audioStream.pipe(outStream);

                outStream.on('finish', () => {
                    resolve({ url: publicUrl, filePath, cached: false });
                });

                audioStream.on('error', (err) => {
                    console.error('[TTS STREAM ERROR]:', err.message);
                    resolve(null);
                });

                outStream.on('error', (err) => {
                    console.error('[TTS WRITE ERROR]:', err.message);
                    resolve(null);
                });
            } catch (err) {
                console.error(`[TTS ERROR] Gagal sintesis: "${cleanText}" -> ${err.message}`);
                resolve(null);
            }
        });
    }

    /**
     * Memutar kalimat secara antrean broadcast ke semua penonton
     */
    async queueSpeak(text, type = 'general', priority = false) {
        if (!this.enabled && type !== 'test') return;
        const item = { text, type, priority, time: Date.now() };
        if (priority) {
            this.speechQueue.unshift(item);
        } else {
            if (this.speechQueue.length >= 5) {
                this.speechQueue.shift();
            }
            this.speechQueue.push(item);
        }
        this.processQueue();
    }

    async processQueue() {
        if (this.isSpeaking || this.speechQueue.length === 0) return;
        this.isSpeaking = true;

        const current = this.speechQueue.shift();
        try {
            const audioData = await this.generateAudio(current.text, this.currentVoice);
            if (audioData) {
                this.io.emit('TTS_SPEAK', {
                    audioUrl: audioData.url,
                    text: current.text,
                    type: current.type,
                    voice: this.currentVoice
                });
            }
        } catch (e) {
            console.error('[TTS QUEUE ERROR]:', e);
        } finally {
            // Beri jeda proporsional dengan panjang teks (estimasi 70ms per huruf + 800ms nafas)
            const estimatedDuration = Math.max(2500, current.text.length * 75);
            setTimeout(() => {
                this.isSpeaking = false;
                this.processQueue();
            }, estimatedDuration);
        }
    }

    /**
     * Sapa penonton baru yang bergabung atau pertama kali komentar
     */
    handleUserJoin(username, questionIndex = 1) {
        if (!this.autoGreeting || !username) return;

        const now = Date.now();
        // Cek jeda global antar sapaan
        if (now - this.lastGreetingTime < this.minGreetingIntervalMs) return;

        // Cek apakah user sudah pernah disapa baru-baru ini
        const lastGreeted = this.greetedUsers.get(username) || 0;
        if (now - lastGreeted < this.greetingUserCooldownMs) return;

        // Bersihkan nama agar enak didengar suara AI
        const cleanName = username.replace(/[._\d]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 18);
        if (!cleanName || cleanName.length < 2) return;

        this.greetedUsers.set(username, now);
        this.lastGreetingTime = now;

        const templates = [
            `Halo Kak ${cleanName}, selamat datang di kuis CPNS! Coba tebak nomor ${questionIndex} ya!`,
            `Selamat datang Kak ${cleanName}! Menurut kakak, nomor ${questionIndex} jawabannya apa nih?`,
            `Halo pejuang NIP Kak ${cleanName}! Yuk ikutan jawab nomor ${questionIndex}!`,
            `Wah ada Kak ${cleanName} yang baru gabung. Ketik A, B, C, D, atau E di komentar ya!`
        ];
        const phrase = templates[Math.floor(Math.random() * templates.length)];
        this.queueSpeak(phrase, 'greeting');
    }

    /**
     * Bacakan soal saat baru berganti
     */
    handleNewQuestion(questionData, index) {
        if (!this.autoReadQuestion || !questionData) return;

        let briefSoal = questionData.soal || '';
        if (briefSoal.length > 140) {
            briefSoal = briefSoal.substring(0, 137) + '...';
        }

        const phrase = `Soal nomor ${index}. ${briefSoal}`;
        this.queueSpeak(phrase, 'question', true);
    }

    /**
     * Bacakan kunci jawaban saat ronde selesai
     */
    handleReveal(correctLetter, mvpUser = null) {
        if (!this.autoAnnounceReveal || !correctLetter) return;

        let phrase = `Waktu habis! Kunci jawaban yang benar adalah pilihan ${correctLetter}.`;
        if (mvpUser) {
            const cleanMVP = mvpUser.replace(/[._\d]/g, ' ').trim().slice(0, 15);
            phrase += ` Selamat untuk Kak ${cleanMVP} tercepat!`;
        }
        this.queueSpeak(phrase, 'reveal', true);
    }
}

module.exports = TTSEngine;
