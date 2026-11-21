/**
 * ChatParserSD.js - Parser Jawaban Super Cerdas
 * Mendeteksi:
 * 1. Huruf A, B, C, D (termasuk huruf kecil, '#a', 'jawab a', 'opsi a', dll.)
 * 2. Kata kunci jawaban langsung / aliases (misal: 'sunda', 'bandung', 'karnivora', dll.)
 * 3. Teks opsi mana pun dari A/B/C/D yang diketik oleh penonton
 */

class ChatParserSD {
    constructor() {
        this.answeredUsers = new Set();
    }

    resetRound() {
        this.answeredUsers.clear();
    }

    /**
     * Membersihkan teks komentar dari tanda baca & spasi berlebih
     */
    cleanText(str) {
        if (!str || typeof str !== 'string') return '';
        return str
            .toLowerCase()
            .replace(/[^\w\s,.-]/gi, '') // hapus emoji/simbol aneh
            .trim();
    }

    /**
     * Parse pesan chat menjadi pilihan jawaban (A, B, C, D).
     * @param {string} rawText - Pesan dari penonton TikTok
     * @param {Object} currentQuestion - Objek soal aktif dengan opsi & aliases
     * @returns {string|null} - 'A', 'B', 'C', 'D' atau null
     */
    parseAnswer(rawText, currentQuestion) {
        if (!rawText) return null;

        const clean = this.cleanText(rawText);
        if (!clean) return null;

        // 1. Cek langsung 1 huruf (A, B, C, D, E) atau variasi awal (A., /A, #A, opsi A, dll.)
        const singleMatch = clean.match(/^([abcde])(?:\b|[.\s!?\-_])/i);
        if (singleMatch) {
            return singleMatch[1].toUpperCase();
        }

        const prefixMatch = clean.match(/^(?:jawab|jawaban|pilih|pilihan|opsi|huruf)\s+([abcde])\b/i);
        if (prefixMatch) {
            return prefixMatch[1].toUpperCase();
        }

        if (!currentQuestion) return null;

        // 2. Cek apakah ada di aliases soal (jawaban benar langsung)
        if (Array.isArray(currentQuestion.aliases)) {
            for (const alias of currentQuestion.aliases) {
                const aliasClean = this.cleanText(alias);
                if (aliasClean && (clean === aliasClean || clean.includes(aliasClean))) {
                    return currentQuestion.jawaban;
                }
            }
        }

        // 3. Cek kecocokan dengan seluruh teks opsi (A, B, C, D, E)
        // Jadi jika penonton ketik kata kunci opsi A, B, C, D, atau E, langsung kedetect!
        if (currentQuestion.opsi) {
            // Urutkan opsi dari yang teksnya paling panjang agar pencocokan presisi
            const sortedKeys = ['A', 'B', 'C', 'D', 'E'];
            for (const key of sortedKeys) {
                const optText = currentQuestion.opsi[key];
                if (!optText) continue;

                const optClean = this.cleanText(optText);
                if (optClean.length >= 3) {
                    // Cek apakah teks komentar persis sama atau mengandung teks opsi
                    if (clean === optClean || clean.includes(optClean)) {
                        return key;
                    }

                    // Cek kata-kata penting dalam teks opsi (misal "Selat Sunda" -> kata "sunda")
                    const words = optClean.split(/\s+/).filter(w => w.length >= 4);
                    for (const word of words) {
                        // Jangan match kata umum seperti "kota", "pulau", "derajat", "gunung" sendirian
                        const commonWords = ['kota', 'pulau', 'sungai', 'danau', 'gunung', 'derajat', 'selat'];
                        if (!commonWords.includes(word) && clean.includes(word)) {
                            return key;
                        }
                    }
                }
            }
        }

        return null;
    }

    /**
     * Memproses chat masuk dari TikTok
     * @param {Object} chatData - { username, text, ... }
     * @param {Object} currentQuestion - Objek soal aktif
     * @returns {Object|null} - { choice, isFirstAnswer }
     */
    processChat(chatData, currentQuestion) {
        if (!chatData || !chatData.username) return null;

        const username = chatData.username.toLowerCase();

        // 1 user hanya boleh 1x menjawab per soal (anti-spam)
        if (this.answeredUsers.has(username)) {
            return null;
        }

        const choice = this.parseAnswer(chatData.text, currentQuestion);
        if (choice) {
            this.answeredUsers.add(username);
            return {
                choice: choice,
                isFirstAnswer: true
            };
        }

        return null;
    }
}

module.exports = ChatParserSD;
