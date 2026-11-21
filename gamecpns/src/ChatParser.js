/**
 * ChatParser.js - Natural Language & Single-Vote-Per-Round Parser
 * Menangani ribuan komentar penonton sekaligus, mengunci tebakan pertama penonton,
 * dan mengabaikan komentar berulang (double) pada ronde soal yang sama.
 */

class ChatParser {
    constructor() {
        // Map: userId -> { letter, remainingTimer, username, timestamp }
        this.roundVotes = new Map();
        // Cooldown mikro (mencegah bot spam flood 100 req/detik dari 1 ID)
        this.userCooldowns = new Map();
    }

    /**
     * Dijalankan setiap kali soal baru dimulai (Reset semua komentar penonton)
     */
    resetRound() {
        this.roundVotes.clear();
        this.userCooldowns.clear();
    }

    /**
     * Mem-parsing teks komentar penonton
     * @param {string} rawText 
     * @param {string} userId 
     * @param {string} username 
     * @param {number} remainingTimer Sisa detik timer saat komentar masuk
     * @returns {Object|null} { letter, remainingTimer, username, isFirstVote }
     */
    parseAnswer(rawText, userId, username, remainingTimer) {
        if (!rawText || typeof rawText !== 'string') return null;

        const uid = String(userId || username).trim();

        // 1. SYARAT: JIKA PENONTON SUDAH JAWAB DI RONDE INI, KOMEN BERIKUTNYA DIABAIKAN
        // (Komen terawal yang dipilih & dikunci)
        if (this.roundVotes.has(uid)) {
            return null; // Sudah vote, ignore double comments
        }

        const now = Date.now();
        const lastChat = this.userCooldowns.get(uid) || 0;
        if (now - lastChat < 500) {
            return null; // Spam flood guard
        }
        this.userCooldowns.set(uid, now);

        const clean = rawText.trim().toUpperCase();
        let detected = null;

        // Pola 1: Murni 1 huruf ("A", "B", "C", "D", "E")
        if (/^[A-E]$/.test(clean)) {
            detected = clean;
        }
        // Pola 2: Dengan tanda baca ("A.", "B)", "(C)", "[D]", "A-")
        else if (/^[\(\[]?([A-E])[\)\]\.\-\s]?$/.test(clean)) {
            detected = clean.match(/([A-E])/)[1];
        }
        // Pola 3: Frasa khas Indo ("jawabannya A", "opsi B", "pilih C", "fiks D", "pasti E", "A dong")
        else {
            const phraseMatch = clean.match(/(?:JAWABANNYA|JAWABAN|OPSI|PILIH|PILIHAN|FIKS|FIX|PASTI|KAYAKNYA|GUE|GW|AKU)?\s*([A-E])(?:\s*(?:DONG|KAK|BANG|MIN|DEH|YA|NIH))?$/);
            if (phraseMatch && phraseMatch[1]) {
                detected = phraseMatch[1];
            }
        }

        // Pola 4: Angka 1-5 dikonversi ke A-E ("1" -> A, "2" -> B, dst.)
        if (!detected) {
            const numMap = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E' };
            if (/^[1-5]$/.test(clean)) {
                detected = numMap[clean];
            }
        }

        if (detected) {
            const voteData = {
                userId: uid,
                username: username || uid,
                letter: detected,
                remainingTimer: remainingTimer || 0,
                timestamp: now
            };

            // Kunci tebakan pertama penonton di ronde ini
            this.roundVotes.set(uid, voteData);
            return voteData;
        }

        return null;
    }

    getAllVotes() {
        return Array.from(this.roundVotes.values());
    }

    getTotalVotesCount() {
        return this.roundVotes.size;
    }
}

module.exports = ChatParser;
