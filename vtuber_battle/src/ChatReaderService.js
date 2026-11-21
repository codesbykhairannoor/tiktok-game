/**
 * ChatReaderService.js
 * Modul pembaca komentar real-time ala AI-VTuber open source (Ikaros-521 / Open-LLM-VTuber)
 * 100% Free / Modal Rp 0, anti-spam, traffic cooldown, dan suara anime seiyuu natural.
 */

class ChatReaderService {
    constructor(game, options = {}) {
        this.game = game;
        this.enabled = options.enabled !== undefined ? options.enabled : true;
        this.cooldownMs = options.cooldownMs || 6000; // Minimal interval antar komentar (agar tidak macet)
        this.lastSpokenTime = 0;
        this.filterProfanity = options.filterProfanity !== undefined ? options.filterProfanity : true;
        this.maxCommentLength = options.maxCommentLength || 55;
        this.readMode = options.readMode || 'smart'; // 'smart' (intent response), 'echo' (baca persis), 'hybrid'

        // Blacklist kata kasar / vulgar Indonesia
        this.profanityList = [
            'anjing', 'babi', 'bangsat', 'kontol', 'memek', 'ngentot', 'perek', 'lonte',
            'bajingan', 'goblok', 'tolol', 'bego', 'asu', 'kampret', 'itil', 'pantek',
            'pepek', 'colmek', 'coli', 'bokep', 'porn', 'sex', 'titit', 'tete'
        ];

        // Indeks rotasi respon agar variatif
        this.lastResponseIndex = {};
    }

    /**
     * Sanitasi dan filter komentar
     */
    sanitizeComment(comment) {
        if (!comment || typeof comment !== 'string') return null;

        let clean = comment.trim();

        // 1. Abaikan jika mengandung URL/link
        if (/https?:\/\/|\.com|\.id|\.net|\.xyz|\.org|\.io|www\./i.test(clean)) {
            return null;
        }

        // 2. Filter kata kasar / toxic
        if (this.filterProfanity) {
            const lower = clean.toLowerCase();
            for (const bad of this.profanityList) {
                const regex = new RegExp(`\\b${bad}\\b`, 'i');
                if (regex.test(lower)) {
                    console.log(`[CHAT FILTER 🛡️] Komentar diblokir karena kata terlarang: "${clean}"`);
                    return null;
                }
            }
        }

        // 3. Bersihkan karakter repetitif (misal: "wkwkwkwkwk", "aaaaaaa", "wwwwww")
        clean = clean.replace(/(.)\1{4,}/g, '$1$1');

        // 4. Bersihkan emoji berlebihan, sisakan teks
        clean = clean.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
        clean = clean.replace(/\s+/g, ' ').trim();

        // 5. Harus ada huruf atau angka minimal 2 karakter
        if (clean.length < 2 || !/[a-zA-Z0-9]/.test(clean)) {
            return null;
        }

        // 6. Potong jika kepanjangan agar durasi bicara pas (tidak monolog panjang)
        if (clean.length > this.maxCommentLength) {
            clean = clean.substring(0, this.maxCommentLength) + '...';
        }

        return clean;
    }

    /**
     * Sanitasi nama akun pengirim (hilangkan simbol aneh)
     */
    sanitizeUsername(username) {
        if (!username) return 'Kawan';
        let clean = username.replace(/[@_.]+/g, ' ').trim();
        clean = clean.replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/gi, '').trim();
        if (!clean) return 'Kawan';
        // Ambil nama depan atau max 15 karakter
        const parts = clean.split(' ');
        return parts[0].substring(0, 15);
    }

    /**
     * Klasifikasi intent komentar menjadi respon cute Mika
     */
    classifyAndRespond(username, comment, currentKingName) {
        const u = this.sanitizeUsername(username);
        const lower = comment.toLowerCase();
        const kingName = currentKingName || 'Sultan Pertama';

        // 1. Sapaan (Greeting)
        if (/\b(halo|hai|hey|hei|pagi|siang|sore|malam|assalamu|konnichiwa|oy|hallo)\b/i.test(lower)) {
            const lines = [
                `Konnichiwa kaka ${u}! Selamat datang di live Mika yaa~ Jangan lupa tap-tap layarnya!`,
                `Halo kaka ${u}! Seneng banget kaka mampir nemenin Mika, arigatou gozaimasu!`,
                `Hai kaka ${u}! Welcome to live Mika! Betah-betah di sini yaa kaka manis!`
            ];
            return {
                text: this.pickLine('greeting', lines),
                motion: 'Goodbye',
                expression: 'happy',
                category: 'greeting'
            };
        }

        // 2. Pujian (Compliment)
        if (/\b(cantik|imut|lucu|gemes|kawaii|manis|cakep|anggun|bidadari|kece)\b/i.test(lower)) {
            const lines = [
                `Kyaaa makasih kaka ${u}! Mika jadi tersipu malu nih, arigatou gozaimasu~`,
                `Ehehe kaka ${u} bisa aja bikin Mika geer! Kaka juga baik banget lho!`,
                `Waa makasih banyak kaka ${u}! Mika makin semangat live kalau dipuji kaka, daisuki yo!`
            ];
            return {
                text: this.pickLine('compliment', lines),
                motion: 'Blush',
                expression: 'happy',
                category: 'compliment'
            };
        }

        // 3. Tanya Tahta / Raja (Throne / King Query)
        if (/\b(raja|tahta|sultan|siapa|pangeran|menang|kalah|juara|singgasana)\b/i.test(lower)) {
            const lines = [
                `Saat ini yang berkuasa di tahta adalah Baginda ${kingName}! Ayo siapa yang berani tendang kaka raja?`,
                `Tahta Mika masih dipegang Baginda ${kingName}! Kirim Donat atau Paus kalau mau rebut Mika dari baginda!`,
                `Baginda ${kingName} masih kokoh di singgasana! Yuk kirim gift buat ambil alih tahta!`
            ];
            return {
                text: this.pickLine('throne', lines),
                motion: 'Thinking',
                expression: 'happy',
                category: 'throne'
            };
        }

        // 4. Tanya Mawar / Gift
        if (/\b(mawar|rose|gift|donat|paus|sawer|pengawal|kursi|koin)\b/i.test(lower)) {
            const lines = [
                `Kirim satu mawar aja kaka langsung nongkrong di Kursi Pengawal Mika lho! Yuk cobain!`,
                `Ayo kumpulin mawar buat pesta joget Mika! Kalau kirim lima koin ke atas bisa tendang Raja lho!`,
                `Mawar buat dudukin kursi pengawal, donat buat rebut singgasana! Kaka mau pilih yang mana?`
            ];
            return {
                text: this.pickLine('rose', lines),
                motion: 'Clapping',
                expression: 'happy',
                category: 'rose'
            };
        }

        // 5. Rayuan / Gombalan (Flirt)
        if (/\b(nikah|jodoh|pacar|pacaran|sayang|cinta|lope|marry|love\s+you)\b/i.test(lower)) {
            const lines = [
                `Waa kaka ${u}! Kalau mau dapetin hati Mika, kaka harus jadi Raja Sultan terlama dulu dong, hehe~`,
                `Aduh kaka ${u} gombal banget deh! Mika jadi deg-degan nih di depan kamera, baka~`,
                `Ehehe Mika jadi salting kaka ${u}! Makanya rebut tahta dong biar jadi pendamping Mika!`
            ];
            return {
                text: this.pickLine('flirt', lines),
                motion: 'Blush',
                expression: 'surprised',
                category: 'flirt'
            };
        }

        // 6. Request Nyanyi / Lagu Jepang (Sing / Concert Request)
        if (/\b(nyanyi|sing|lagu|karaoke|konser|music|jepang|song)\b/i.test(lower)) {
            const lines = [
                `Kyaaa kaka ${u} mau denger Mika konser? Kirim gift Mic, Gitar, atau Paus dulu dong, nanti Mika nyanyiin lagu Jepang spesial buat kamu!`,
                `Waa! Mika punya lagu Kawaikute Gomen dan Renai Circulation lho! Kirim gift buat buka konser spesial Mika yaa kaka ${u}!`,
                `Ehehe kaka ${u} mau denger suara merdu Mika? Yuk kirim gift konser biar Mika langsung nyanyi lagu Jepang favorit kamu!`
            ];
            return {
                text: this.pickLine('sing_request', lines),
                motion: 'Clapping',
                expression: 'happy',
                category: 'sing_request'
            };
        }

        // 7. Komentar Umum (General Comment / Read Verbatim with Cute Frame)
        if (this.readMode === 'echo') {
            return {
                text: `Kaka ${u} bilang: ${comment}`,
                motion: 'Thinking',
                expression: 'relaxed',
                category: 'echo'
            };
        }

        const generalLines = [
            `Kaka ${u} bilang: ${comment}! Hehe makasih udah komen yaa kaka!`,
            `Wah ada kaka ${u} nih, katanya: ${comment}! Arigatou yaa udah nemenin Mika!`,
            `Kaka ${u} komen: ${comment}! Keren banget, semangat terus yaa kaka!`
        ];
        return {
            text: this.pickLine('general', generalLines),
            motion: 'Thinking',
            expression: 'happy',
            category: 'general'
        };
    }

    pickLine(category, pool) {
        if (!pool || pool.length === 0) return '';
        const lastIdx = this.lastResponseIndex[category];
        let idx = Math.floor(Math.random() * pool.length);
        if (pool.length > 1 && idx === lastIdx) {
            idx = (idx + 1) % pool.length;
        }
        this.lastResponseIndex[category] = idx;
        return pool[idx];
    }

    /**
     * Memproses chat masuk: sanitasi, cek cooldown, cek antrian gift, lalu eksekusi
     */
    processChat({ username, comment, avatar }) {
        if (!this.enabled) {
            return { processed: false, reason: 'disabled' };
        }

        const now = Date.now();
        if (now - this.lastSpokenTime < this.cooldownMs) {
            return { processed: false, reason: 'cooldown' };
        }

        // Cek antrian gift: GIFT SELALU PRIORITAS UTAMA (P0)
        // Jika sedang ada perebutan tahta atau pesta mawar, chat langsung mengalah
        if (this.game.isProcessingEvent || (this.game.eventQueue && this.game.eventQueue.length > 0)) {
            return { processed: false, reason: 'gift_priority' };
        }

        const cleanComment = this.sanitizeComment(comment);
        if (!cleanComment) {
            return { processed: false, reason: 'filtered' };
        }

        const currentKingName = this.game.currentKing ? this.game.currentKing.name : 'Sultan Pertama';
        const response = this.classifyAndRespond(username, cleanComment, currentKingName);

        if (!response || !response.text) {
            return { processed: false, reason: 'no_response' };
        }

        this.lastSpokenTime = now;

        console.log(`[CHAT READER 💬] (${response.category}) "${username}": "${cleanComment}" -> Mika: "${response.text}"`);

        // Masukkan ke antrian suara Mika
        this.game.queueMikaVoice({
            type: 'chat_reply',
            text: response.text,
            motion: response.motion || 'Thinking',
            expression: response.expression || 'happy',
            chatInfo: {
                username,
                cleanUsername: this.sanitizeUsername(username),
                comment: cleanComment,
                avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
                category: response.category
            }
        });

        // Emit ke frontend dan admin bahwa komentar ini terpilih untuk dibaca
        this.game.io.emit('CHAT_READ', {
            username,
            cleanUsername: this.sanitizeUsername(username),
            comment: cleanComment,
            replyText: response.text,
            category: response.category,
            avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`
        });

        return {
            processed: true,
            reply: response.text,
            category: response.category
        };
    }
}

module.exports = ChatReaderService;
