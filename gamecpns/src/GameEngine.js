/**
 * GameEngine.js - Paket Tryout 100 Soal CAT SKD CPNS 2026 (Durasi 60 Detik / 1 Menit per Soal)
 */

class GameEngine {
    constructor(allQuestions, io) {
        this.allBankQuestions = allQuestions || []; // Total 221 soal
        this.sessionQuestions = []; // 100 soal pilihan untuk sesi ujian aktif
        this.io = io;
        this.currentIndex = 0;
        this.currentQuestion = null;
        this.roundState = 'QUESTION'; // 'QUESTION' | 'REVEAL' | 'COMPLETED'
        this.roundTimer = 45; // 45 DETIK PER SOAL (Waktu pas untuk berhitung & interaksi penonton)
        this.timerInterval = null;
        this.eliminatedOptions = [];
        this.pointMultiplier = 1;

        // Data Voting Ronde Ini
        this.currentVotes = new Map();
        this.voteDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0 };

        // 1. Papan Peringkat MURNI AKADEMIS (100% Hanya dari Skor Jawaban Benar & Kecepatan)
        this.academicLeaderboard = {};
        this.userStreaks = {};

        // 2. Papan Peringkat SULTAN / DONATUR (Khusus Apresiasi Penonton yang Kirim Gift Koin)
        this.sultanLeaderboard = {};

        this.answeredStatus = {}; // { 0..99: true/false }
        this.totalAnsweredCount = 0;
        this.is5050UsedThisRound = false; // Anti-Spam 50:50 (Maksimal 1x per Soal)

        // Target Komunitas Live (e.g. 50 jawaban benar bersama)
        this.communityGoalTarget = 50;
        this.communityGoalCurrent = 0;

        // Buat Paket 100 Soal Pertama
        this.init100QuestionsSession();
    }

    get questions() {
        return this.sessionQuestions;
    }

    /**
     * Memilih 100 Soal Acak dari 221 Bank Soal (Paket Resmi Tryout CAT BKN)
     */
    init100QuestionsSession() {
        if (this.allBankQuestions.length === 0) return;
        // Acak bank soal dan ambil 100 soal
        const shuffled = [...this.allBankQuestions].sort(() => 0.5 - Math.random());
        this.sessionQuestions = shuffled.slice(0, Math.min(100, shuffled.length));
        this.currentIndex = 0;
        this.answeredStatus = {};
        this.totalAnsweredCount = 0;
        console.log(`[GAME] Paket 100 Soal Resmi CAT SKD CPNS Siap Dimulai!`);
    }

    startQuestion(index = null) {
        if (this.sessionQuestions.length === 0) return;

        clearInterval(this.timerInterval);

        if (index !== null) {
            this.currentIndex = index;
        } else {
            this.currentIndex++;
        }

        // Cek jika sudah selesai 100 Soal
        if (this.currentIndex >= this.sessionQuestions.length) {
            this.completeSession();
            return;
        }

        this.currentQuestion = this.sessionQuestions[this.currentIndex];
        this.roundState = 'QUESTION';
        this.roundTimer = 45; // 45 Detik per ronde menjawab
        this.eliminatedOptions = [];
        this.pointMultiplier = 1; // Reset Multiplier tiap soal baru
        this.is5050UsedThisRound = false; // Reset status 50:50 untuk soal baru

        // Bersihkan timer pembahasan jika ada
        if (this.revealInterval) {
            clearInterval(this.revealInterval);
            this.revealInterval = null;
        }

        // Reset Suara Ronde Baru (Komen ter-reset untuk soal baru)
        this.currentVotes.clear();
        this.voteDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0 };

        console.log(`[GAME] 🚀 Soal #${this.currentIndex + 1} Dimulai: "${this.currentQuestion.soal}" (Kunci: [ ${this.currentQuestion.jawaban} ])`);

        this.io.emit('QUESTION_START', {
            index: this.currentIndex + 1,
            total: this.sessionQuestions.length, // Tepat 100 Soal
            id: this.currentQuestion.id,
            kategori: this.currentQuestion.kategori,
            soal: this.currentQuestion.soal,
            opsi: this.currentQuestion.opsi,
            timer: this.roundTimer,
            multiplier: this.pointMultiplier,
            answeredStatus: this.getAnsweredSheetSummary(),
            totalAnswered: this.totalAnsweredCount,
            voteStats: this.getVoteStats(),
            leaderboard: this.getTopLeaderboard(),
            sultanLeaderboard: this.getTopSultans(),
            communityGoal: {
                current: this.communityGoalCurrent,
                target: this.communityGoalTarget
            }
        });

        // Jalankan Timer 60 Detik Mundur
        this.timerInterval = setInterval(() => {
            this.roundTimer--;
            this.io.emit('TIMER_TICK', { timer: this.roundTimer });

            if (this.roundTimer <= 0) {
                clearInterval(this.timerInterval);
                this.revealAnswer('WAKTU_HABIS');
            }
        }, 1000);
    }

    registerVote(voteData) {
        if (this.roundState !== 'QUESTION' || !this.currentQuestion) return;

        const { userId, username, letter } = voteData;

        if (this.eliminatedOptions.includes(letter)) return;

        if (!this.currentVotes.has(userId)) {
            this.currentVotes.set(userId, {
                userId,
                username,
                letter,
                remainingTimer: this.roundTimer, // Sisa detik (0-60 detik)
                timestamp: Date.now()
            });

            if (this.voteDistribution[letter] !== undefined) {
                this.voteDistribution[letter]++;
            }

            this.io.emit('VOTE_UPDATE', {
                ...this.getVoteStats(),
                lastVoter: {
                    user: username,
                    letter: letter
                }
            });
        }
    }

    getVoteStats() {
        const total = this.currentVotes.size;
        const percentages = {};
        for (const [k, count] of Object.entries(this.voteDistribution)) {
            percentages[k] = total > 0 ? Math.round((count / total) * 100) : 0;
        }
        return {
            totalVotes: total,
            distribution: this.voteDistribution,
            percentages: percentages
        };
    }

    revealAnswer(reason = 'WAKTU_HABIS') {
        if (this.roundState !== 'QUESTION') return;
        this.roundState = 'REVEAL';
        clearInterval(this.timerInterval);

        this.answeredStatus[this.currentIndex] = true;
        this.totalAnsweredCount++;

        const correctAnswer = this.currentQuestion.jawaban;
        const allVotes = Array.from(this.currentVotes.values());

        const correctParticipants = [];
        const wrongParticipants = [];

        // Evaluasi SEMUA penonton yang ikut menjawab di ronde 60 detik ini (MURNI PRESTASI)
        for (const vote of allVotes) {
            const user = vote.username;

            if (!this.academicLeaderboard[user]) {
                this.academicLeaderboard[user] = { score: 0, correctCount: 0, wrongCount: 0, streak: 0 };
            }

            if (vote.letter === correctAnswer) {
                // RUMUS KECEPATAN MURNI:
                // Base Point = 10 Poin
                // Speed Bonus = Sisa Waktu detik (Maksimal +60 Poin jika jawab secepat kilat!)
                const basePoint = 10;
                const speedBonus = Math.max(0, vote.remainingTimer);
                let totalEarned = (basePoint + speedBonus) * this.pointMultiplier;

                this.userStreaks[user] = (this.userStreaks[user] || 0) + 1;
                const streak = this.userStreaks[user];
                if (streak >= 3) {
                    totalEarned += 5; // Bonus Combo Pintar
                }

                this.academicLeaderboard[user].score += totalEarned;
                this.academicLeaderboard[user].correctCount += 1;
                this.academicLeaderboard[user].streak = streak;

                correctParticipants.push({
                    user: user,
                    speedRemaining: vote.remainingTimer,
                    speedSeconds: Math.max(1, 35 - vote.remainingTimer),
                    earned: totalEarned,
                    scoreEarned: totalEarned,
                    streak: streak
                });
            } else {
                this.academicLeaderboard[user].wrongCount = (this.academicLeaderboard[user].wrongCount || 0) + 1;
                this.userStreaks[user] = 0;
                wrongParticipants.push(user);
            }
        }

        // Urutkan Penjawab Tercepat
        correctParticipants.sort((a, b) => b.speedRemaining - a.speedRemaining);
        const topFastest = correctParticipants.slice(0, 3);

        this.pointMultiplier = 1;

        // Progress Community Goal
        this.communityGoalCurrent += correctParticipants.length;
        let goalReached = false;
        if (this.communityGoalCurrent >= this.communityGoalTarget) {
            goalReached = true;
            this.communityGoalCurrent = 0;
        }

        const topLb = this.getTopLeaderboard();
        const topSultans = this.getTopSultans();

        console.log(`[GAME] 🏁 Ronde Selesai! Kunci: [ ${correctAnswer} ]. Peserta: ${allVotes.length}, Benar: ${correctParticipants.length}, Salah: ${wrongParticipants.length}`);
        if (topLb.length > 0) {
            console.log(`[LEADERBOARD]`, topLb.map(u => `@${u.user}: ${u.score} pts`).join(' | '));
        }

        this.io.emit('QUESTION_REVEAL', {
            correctAnswer: correctAnswer,
            jawaban: correctAnswer,
            pembahasan: this.currentQuestion.pembahasan,
            reason: reason,
            totalParticipants: allVotes.length,
            correctCount: correctParticipants.length,
            wrongCount: wrongParticipants.length,
            fastestAnswerers: topFastest,
            fastestUsers: topFastest,
            leaderboard: topLb,
            sultanLeaderboard: topSultans,
            answeredStatus: this.getAnsweredSheetSummary(),
            totalAnswered: this.totalAnsweredCount,
            voteStats: this.getVoteStats(),
            communityGoal: {
                current: this.communityGoalCurrent,
                target: this.communityGoalTarget,
                goalReached: goalReached
            }
        });

        // Jeda 10 detik: Memberi waktu pas 10 detik untuk membaca pembahasan
        this.revealTimer = 10;
        if (this.revealInterval) clearInterval(this.revealInterval);

        this.io.emit('REVEAL_TIMER_TICK', {
            remaining: this.revealTimer,
            total: 10
        });

        this.revealInterval = setInterval(() => {
            this.revealTimer--;
            this.io.emit('REVEAL_TIMER_TICK', {
                remaining: this.revealTimer,
                total: 10
            });

            if (this.revealTimer <= 0) {
                clearInterval(this.revealInterval);
                this.revealInterval = null;
                this.startQuestion();
            }
        }, 1000);
    }

    completeSession() {
        this.roundState = 'COMPLETED';
        clearInterval(this.timerInterval);

        this.io.emit('SESSION_COMPLETED', {
            message: '🎉 SELAMAT! SIMULASI 100 SOAL SKD CPNS TELAH SELESAI!',
            leaderboard: this.getTopLeaderboard(),
            totalQuestions: 100
        });

        // Mulai sesi 100 soal baru setelah jeda 15 detik
        setTimeout(() => {
            this.init100QuestionsSession();
            this.startQuestion(0);
        }, 15000);
    }

    /**
     * Bantuan 50:50 Kolektif (Coret 2 Opsi Salah)
     * HARD CAP: Hanya bisa aktif 1 KALI per soal. Spam mawar tidak akan merusak kuis!
     */
    trigger5050(senderName) {
        if (this.roundState !== 'QUESTION' || !this.currentQuestion) return false;
        if (this.is5050UsedThisRound) return false; // Sudah aktif di ronde ini

        const wrongKeys = Object.keys(this.currentQuestion.opsi).filter(k => k !== this.currentQuestion.jawaban && !this.eliminatedOptions.includes(k));
        const shuffled = wrongKeys.sort(() => 0.5 - Math.random());
        this.eliminatedOptions = shuffled.slice(0, 2);
        this.is5050UsedThisRound = true;

        this.io.emit('OPTIONS_ELIMINATED', {
            eliminated: this.eliminatedOptions,
            helper: senderName
        });
        return true;
    }

    /**
     * Tambah Waktu Ujian Kolektif (Kopi)
     * HARD CAP: Maksimal waktu tidak boleh lebih dari 75 detik agar kuis tetap seru!
     */
    addTimer(seconds, sender = '') {
        if (this.roundState === 'QUESTION') {
            const maxCap = 75; // Batas maksimal timer (agar spam kopi tidak bikin 10 menit)
            const allowedAdd = Math.max(0, Math.min(seconds, maxCap - this.roundTimer));
            if (allowedAdd > 0) {
                this.roundTimer += allowedAdd;
                this.io.emit('TIMER_BOOSTED', {
                    timer: this.roundTimer,
                    extraAdded: allowedAdd,
                    sender: sender
                });
            }
        }
    }

    /**
     * Donasi Sultan (Mawar, Kopi, Donat, Paus, dll)
     * 100% MASUK KE PAPAN SULTAN, TIDAK MENCEMARI NILAI UJIAN MURNI!
     */
    addSultanDonation(username, coins, giftName) {
        if (!this.sultanLeaderboard[username]) {
            this.sultanLeaderboard[username] = { coins: 0, giftCount: 0, lastGift: giftName };
        }
        this.sultanLeaderboard[username].coins += coins;
        this.sultanLeaderboard[username].giftCount += 1;
        this.sultanLeaderboard[username].lastGift = giftName;

        // Kontribusi ke Target Komunitas (1 kemajuan per 10 koin)
        const goalBonus = Math.max(1, Math.floor(coins / 10));
        this.communityGoalCurrent = Math.min(this.communityGoalTarget, this.communityGoalCurrent + goalBonus);

        this.io.emit('SULTAN_UPDATE', {
            sultan: username,
            coinsAdded: coins,
            totalCoins: this.sultanLeaderboard[username].coins,
            giftName: giftName,
            sultanLeaderboard: this.getTopSultans(),
            communityGoal: {
                current: this.communityGoalCurrent,
                target: this.communityGoalTarget
            }
        });
    }

    setMultiplier(mult, sender = '') {
        this.pointMultiplier = mult;
        this.io.emit('MULTIPLIER_SET', {
            multiplier: mult,
            sponsor: sender
        });
    }

    triggerSultanTakeover(sender, totalCoins) {
        this.addSultanDonation(sender, totalCoins, 'Mega_Gift');
        this.setMultiplier(2, sender); // Hadiah untuk SEMUA penonton: Poin 2X Lipat ronde ini!
        this.io.emit('SULTAN_TAKEOVER_EFFECT', {
            sultan: sender,
            coins: totalCoins,
            sultanLeaderboard: this.getTopSultans()
        });
    }

    /**
     * Papan Peringkat MURNI (Hanya dari Kecepatan & Jawaban Benar)
     */
    getTopLeaderboard() {
        return Object.entries(this.academicLeaderboard)
            .sort(([, a], [, b]) => b.score - a.score)
            .slice(0, 7)
            .map(([user, data], index) => ({
                rank: index + 1,
                user: user,
                score: data.score,
                correct: data.correctCount,
                wrong: data.wrongCount || 0,
                streak: data.streak || 0
            }));
    }

    /**
     * Papan Peringkat SULTAN / DONATUR (Khusus Penonton yang Menyumbang Koin/Gift)
     */
    getTopSultans() {
        return Object.entries(this.sultanLeaderboard)
            .sort(([, a], [, b]) => b.coins - a.coins)
            .slice(0, 5)
            .map(([user, data], index) => ({
                rank: index + 1,
                user: user,
                coins: data.coins,
                giftCount: data.giftCount,
                lastGift: data.lastGift
            }));
    }

    resetLeaderboard() {
        this.academicLeaderboard = {};
        this.sultanLeaderboard = {};
        this.userStreaks = {};
        this.io.emit('LEADERBOARD_RESET', {
            leaderboard: [],
            sultanLeaderboard: []
        });
        console.log('[GAME] Papan Peringkat Murni & Papan Sultan Direset Bersih.');
    }

    /**
     * Lembar Jawaban 100 Soal CAT BKN Penuh
     */
    getAnsweredSheetSummary() {
        const summary = [];
        const total = this.sessionQuestions.length || 100;
        for (let i = 0; i < total; i++) {
            summary.push({
                num: i + 1,
                answered: !!this.answeredStatus[i],
                isCurrent: i === this.currentIndex
            });
        }
        return summary;
    }
}

module.exports = GameEngine;
