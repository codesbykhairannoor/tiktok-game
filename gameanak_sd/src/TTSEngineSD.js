/**
 * TTSEngineSD.js - Suara AI Presenter Cewek Menggoda & Seksi (Tanpa Kata "Sayang")
 * Menggunakan Microsoft Azure Neural Voice: 'id-ID-GadisNeural' via msedge-tts
 * Fitur:
 * - Suara cewek lembut, sensual, dan playful khas presenter kuis game show
 * - STRICT FILTER: 100% TIDAK ADA KATA "SAYANG" (sesuai arahan streamer)
 * - Auto-Read Soal, Sapa Penonton (Greeting), Umumkan Jawaban & Juara Tercepat
 * - Local MD5 Caching di public/audio_cache/ untuk latency 0ms pada audio berulang
 */

const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class TTSEngineSD {
    constructor(io) {
        this.io = io;
        this.cacheDir = path.join(__dirname, '..', 'public', 'audio_cache');
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }

        this.currentVoice = 'id-ID-GadisNeural';
        this.enabled = false; // DINONAKTIFKAN TOTAL: Digantikan sepenuhnya oleh Gemini Voiceover
        this.autoGreeting = false;
        this.autoReadQuestion = false;
        this.autoAnnounceReveal = false;

        // Anti-Spam & Debounce
        this.lastGreetingTime = 0;
        this.minGreetingIntervalMs = 12000; // Minimal jeda 12 detik antar sapaan agar tidak berisik
        this.greetedUsers = new Map(); // username -> timestamp terakhir disapa
        this.greetingUserCooldownMs = 15 * 60 * 1000; // Sapa orang yang sama maks 1x per 15 menit

        // Queue manajemen agar audio antre dengan rapi
        this.isSpeaking = false;
        this.speechQueue = [];
    }

    /**
     * Konfigurasi dari Streamer Control Panel
     */
    updateSettings(settings = {}) {
        if (typeof settings.enabled === 'boolean') this.enabled = settings.enabled;
        if (typeof settings.autoGreeting === 'boolean') this.autoGreeting = settings.autoGreeting;
        if (typeof settings.autoReadQuestion === 'boolean') this.autoReadQuestion = settings.autoReadQuestion;
        if (typeof settings.autoAnnounceReveal === 'boolean') this.autoAnnounceReveal = settings.autoAnnounceReveal;
        console.log(`[TTS] ⚙️ Pengaturan Suara AI: Enabled=${this.enabled}, Sapa=${this.autoGreeting}, Soal=${this.autoReadQuestion}, Reveal=${this.autoAnnounceReveal}`);
    }

    /**
     * Filter ketat memastikan kata "sayang" tidak pernah diucapkan
     */
    sanitizeText(text) {
        if (!text) return '';
        // Sensor variasi kata sayang: sayang, syg, ayang, sayangg
        return text
            .replace(/\b(sayang|sayangg|syg|ayang|ayank|bby|baby)\b/gi, 'kakak')
            .replace(/[*_#`~]/g, '')
            .trim();
    }

    /**
     * Generate file MP3 audio via MsEdgeTTS
     */
    async generateAudio(rawText) {
        const cleanText = this.sanitizeText(rawText);
        if (!cleanText) return null;

        // MD5 Hash filename
        const hash = crypto.createHash('md5').update(`gadis_sexy_${cleanText}`).digest('hex');
        const filename = `tts_${hash}.mp3`;
        const filePath = path.join(this.cacheDir, filename);
        const publicUrl = `/audio_cache/${filename}`;

        // Jika sudah ada di cache lokal, langsung pakai (0ms delay)
        if (fs.existsSync(filePath) && fs.statSync(filePath).size > 800) {
            return { url: publicUrl, filePath, cached: true };
        }

        return new Promise(async (resolve) => {
            try {
                const tts = new MsEdgeTTS();
                await tts.setMetadata(this.currentVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

                // Sedikit sentuhan pitch halus untuk nada lebih sensual & manis
                const { audioStream } = tts.toStream(cleanText, {
                    pitch: '+2Hz',
                    rate: '-2%'
                });

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
                console.error(`[TTS ERROR] Gagal sintesis: "${cleanText}" ->`, err.message);
                resolve(null);
            }
        });
    }

    /**
     * Memasukkan ucapan ke antrean bicara
     */
    async queueSpeak(rawText, type = 'general', priority = false) {
        if (!this.enabled && type !== 'test') return;
        const text = this.sanitizeText(rawText);
        if (!text) return;

        const item = { text, type, priority, time: Date.now() };
        if (priority) {
            this.speechQueue.unshift(item);
        } else {
            if (this.speechQueue.length >= 4) {
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
            const audioData = await this.generateAudio(current.text);
            if (audioData) {
                this.io.emit('TTS_SPEAK', {
                    audioUrl: audioData.url,
                    text: current.text,
                    type: current.type
                });
            }
        } catch (e) {
            console.error('[TTS QUEUE ERROR]:', e.message);
        } finally {
            // Estimasi durasi bicara (75ms per huruf + 1200ms nafas/jeda)
            const estimatedDuration = Math.max(3000, current.text.length * 80 + 1200);
            setTimeout(() => {
                this.isSpeaking = false;
                this.processQueue();
            }, estimatedDuration);
        }
    }

    /**
     * Sapa penonton dengan gaya seksi, ramah, dan menggoda (Tanpa kata "sayang")
     */
    handleUserJoin(username) {
        if (!this.autoGreeting || !username) return;

        const now = Date.now();
        if (now - this.lastGreetingTime < this.minGreetingIntervalMs) return;

        const lastGreeted = this.greetedUsers.get(username.toLowerCase()) || 0;
        if (now - lastGreeted < this.greetingUserCooldownMs) return;

        // Bersihkan nama penonton agar enak diucapkan AI
        const cleanName = username.replace(/[@._\d]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 16);
        if (!cleanName || cleanName.length < 2) return;

        this.greetedUsers.set(username.toLowerCase(), now);
        this.lastGreetingTime = now;

        const greetings = [
            `Halo Kak ${cleanName}... Temenin Mbak Gadis tebak soal anak es de yuk!`,
            `Hai Kak ${cleanName}... Jangan cuma melamun dong, coba tebak soal ini!`,
            `Wah ada Kak ${cleanName} yang ganteng nih... Coba tunjukin kamu lebih pintar dari bocah es de!`,
            `Selamat datang Kak ${cleanName}! Menurut kamu, jawaban yang benar apa nih?`,
            `Halo Kak ${cleanName}... Ayo dong jawab, Mbak Gadis udah nungguin nih...`
        ];

        const phrase = greetings[Math.floor(Math.random() * greetings.length)];
        this.queueSpeak(phrase, 'greeting');
    }

    /**
     * Bacakan soal saat baru berganti dengan intonasi jelas & memikat
     */
    handleNewQuestion(questionData, number = 1) {
        if (!this.autoReadQuestion || !questionData) return;

        let brief = (questionData.soal || '').trim();
        if (brief.length > 130) {
            brief = brief.substring(0, 127) + '...';
        }

        const intros = [
            `Soal nomor ${number}. ${brief}`,
            `Pertanyaan nomor ${number}... ${brief}`,
            `Ayo fokus! Soal nomor ${number}. ${brief}`
        ];

        const phrase = intros[Math.floor(Math.random() * intros.length)];
        this.queueSpeak(phrase, 'question', true);
    }

    /**
     * Bacakan kunci jawaban & puji pemenang tercepat
     */
    handleReveal(correctLetter, correctText, topWinner = null) {
        if (!this.autoAnnounceReveal || !correctLetter) return;

        let phrase = `Waktu habis! Jawabannya adalah pilihan ${correctLetter}, ${correctText || ''}.`;

        if (topWinner && (topWinner.nickname || topWinner.username)) {
            const rawWinner = topWinner.nickname || topWinner.username;
            const cleanWinner = rawWinner.replace(/[@._\d]/g, ' ').trim().slice(0, 15);
            const compliments = [
                `Selamat buat Kak ${cleanWinner}, gercep banget dan pintar deh kamu...`,
                `Keren banget Kak ${cleanWinner}! Kamu yang paling cepat kali ini...`,
                `Wah, Kak ${cleanWinner} emang jagoan ya, langsung nomor satu!`
            ];
            phrase += ` ` + compliments[Math.floor(Math.random() * compliments.length)];
        } else {
            const teasers = [
                `Duh, masa soal bocah es de gini aja kalian pada salah sih...?`,
                `Ayo lebih gesit lagi ya di soal berikutnya!`,
                `Mbak Gadis tungguin yang bisa jawab paling cepat di soal berikutnya ya...`
            ];
            phrase += ` ` + teasers[Math.floor(Math.random() * teasers.length)];
        }

        this.queueSpeak(phrase, 'reveal', true);
    }

    /**
     * Ucapan terima kasih manis saat penonton mengirim Gift
     */
    handleGift(username, giftName) {
        const cleanName = (username || 'kakak').replace(/[@._\d]/g, ' ').trim().slice(0, 16);
        const thanks = [
            `Makasih banyak Kak ${cleanName} buat kiriman ${giftName} nya! Bikin Mbak Gadis makin semangat...`,
            `Wah terima kasih ${giftName} nya Kak ${cleanName}! Kamu emang yang paling baik deh...`,
            `Makasih ya Kak ${cleanName}! Semoga rezeki kamu makin berlimpah!`
        ];
        const phrase = thanks[Math.floor(Math.random() * thanks.length)];
        this.queueSpeak(phrase, 'gift', true);
    }
}

module.exports = TTSEngineSD;
