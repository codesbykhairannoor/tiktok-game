/**
 * SongService.js
 * Modul Karaoke & Konser Spesial Mika VTuber
 * Berisi lagu-lagu Jepang viral (Kawaikute Gomen, Renai Circulation, YOASOBI Idol)
 * Terpicu saat gift tertentu masuk (Paus, Singa, Mic, Gitar, Mahkota, atau koin >= minCoins)
 */

const SONGS = [
    {
        id: 'kawaikute_gomen',
        title: 'Kawaikute Gomen (Mika AI Cover)',
        romajiTitle: 'Chu! Kawaikute Gomen',
        audioUrl: '/songs/song_kawaikute_gomen.mp3',
        durationMs: 27000,
        lyrics: 'Chu! Kawaikute gomen! 💕 Umarete kichatte gomen! ✨',
        motion: 'Jump',
        expression: 'happy'
    },
    {
        id: 'renai_circulation',
        title: 'Renai Circulation (Mika AI Cover)',
        romajiTitle: 'Renai Circulation',
        audioUrl: '/songs/song_renai_circulation.mp3',
        durationMs: 27000,
        lyrics: 'Se~no! Demo sonnan ja dame, mou sonnan ja hora... 🌸',
        motion: 'Clapping',
        expression: 'happy'
    },
    {
        id: 'yoasobi_idol',
        title: 'YOASOBI - Idol (Mika AI Cover)',
        romajiTitle: 'YOASOBI - Idol',
        audioUrl: '/songs/song_yoasobi_idol.mp3',
        durationMs: 26000,
        lyrics: 'Kimi wa kanpeki de kyuukyoku no AIDORU! ⭐ ⭐',
        motion: 'Jump',
        expression: 'happy'
    }
];

class SongService {
    constructor(game, options = {}) {
        this.game = game;
        this.enabled = options.enabled !== undefined ? options.enabled : true;
        this.minCoinsToSing = options.minCoinsToSing || 20; // Default koin untuk memicu konser
        this.isSinging = false;
        this.lastSongIndex = -1;

        // Kata kunci gift yang langsung memicu Mika bernyanyi tanpa memandang koin
        this.singGifts = [
            'mic', 'microphone', 'gitar', 'guitar', 'piano', 'konser', 'sing',
            'paus', 'whale', 'singa', 'lion', 'mahkota', 'crown', 'disko',
            'disco', 'speaker', 'bintang', 'star', 'pesawat', 'jet', 'kereta'
        ];
    }

    getSongs() {
        return SONGS;
    }

    isSingTrigger(giftName, coins) {
        if (!this.enabled) return false;
        if (this.isSinging) return false;

        const g = (giftName || '').toLowerCase();
        for (const trigger of this.singGifts) {
            if (g.includes(trigger)) return true;
        }

        if (Number(coins) >= this.minCoinsToSing) return true;

        return false;
    }

    pickSong(songId = null) {
        if (songId) {
            const found = SONGS.find(s => s.id === songId);
            if (found) return found;
        }

        // Pilih lagu secara acak bergantian
        let idx = Math.floor(Math.random() * SONGS.length);
        if (SONGS.length > 1 && idx === this.lastSongIndex) {
            idx = (idx + 1) % SONGS.length;
        }
        this.lastSongIndex = idx;
        return SONGS[idx];
    }

    /**
     * Memulai konser Mika
     */
    async startConcert({ username, giftName, coins, songId = null }) {
        if (this.isSinging) return false;
        this.isSinging = true;

        const song = this.pickSong(songId);
        const donor = username || 'Sultan Misterius';
        const gift = giftName || 'Gift Spesial';

        console.log(`[CONCERT 🎤] Memulai Konser Mika! Lagu: "${song.title}" untuk "${donor}" (${gift})`);

        // 1. Notifikasi UI Konser ke Layar OBS
        this.game.io.emit('CONCERT_START', {
            song,
            donor,
            giftName: gift,
            coins: coins || 0,
            durationMs: song.durationMs
        });

        // 2. Mika mengumumkan lagu dengan suara seiyuu singkat & energik
        const introLines = [
            `Kyaaa! Arigatou kaka ${donor}! Ini dia lagu ${song.title}! Ikuzooo~!`,
            `Uwaaa! Spesial buat kaka ${donor}, konser ${song.title}! Ayo nyanyi bareng Mika~!`,
            `Yattaaa! Makasih kaka ${donor}! Nikmatin lagu ${song.title} dari Mika yaa~!`
        ];
        const introText = introLines[Math.floor(Math.random() * introLines.length)];

        // Synthesize / Bicara intro terlebih dahulu
        try {
            console.log(`[CONCERT 🎙️] Mika mengumumkan intro: "${introText}"`);
            const audioResult = await this.game.tts.speak(introText);
            if (audioResult && audioResult.audioUrl) {
                this.game.io.emit('VTUBER_SPEAK', {
                    text: introText,
                    audioUrl: audioResult.audioUrl,
                    sender: 'Mika',
                    motion: 'Jump',
                    expression: 'happy'
                });
                const introDuration = Math.max(2500, (introText.length || 20) * 80 + 300);
                await new Promise(r => setTimeout(r, introDuration));
            }
        } catch (err) {
            console.warn('[CONCERT ⚠️] Gagal intro TTS:', err.message);
        }

        // 3. Putar Lagu Karaoke & Aktifkan Animasi Bernyanyi di Layar
        this.game.io.emit('CONCERT_SING', {
            song,
            donor,
            audioUrl: song.audioUrl,
            durationMs: song.durationMs,
            lyrics: song.lyrics,
            motion: song.motion
        });

        // Tunggu durasi lagu selesai
        await new Promise(r => setTimeout(r, song.durationMs + 1000));

        // 4. Outro Mika berterima kasih
        const outroLines = [
            `Ehehe makasih banyak semuanya udah dengerin Mika nyanyi! Gimana, suara Mika kawaii kan? Daisuki yo kaka ${donor}~!`,
            `Waa seru banget konsernya! Makasih kaka ${donor} udah bikin Mika nyanyi malam ini! Arigatou gozaimasu~!`
        ];
        const outroText = outroLines[Math.floor(Math.random() * outroLines.length)];

        try {
            const outroResult = await this.game.tts.speak(outroText);
            if (outroResult && outroResult.audioUrl) {
                this.game.io.emit('VTUBER_SPEAK', {
                    text: outroText,
                    audioUrl: outroResult.audioUrl,
                    sender: 'Mika',
                    motion: 'Blush',
                    expression: 'happy'
                });
                await new Promise(r => setTimeout(r, 4500));
            }
        } catch (e) { }

        // Selesai konser
        this.isSinging = false;
        this.game.io.emit('CONCERT_END', { song, donor });

        return true;
    }
}

module.exports = SongService;
