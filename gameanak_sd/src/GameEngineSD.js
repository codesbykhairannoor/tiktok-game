/**
 * GameEngineSD.js - State Machine & Core Game Logic
 * Kuis Cerdas Cermat Kilat SD (Fresh & Original Game Show)
 * Fitur:
 * - 3 Layar Terpisah (Screen 1: Soal Aktif -> Screen 2: Top 3 Jawaban & Pembahasan -> Screen 3: Juara Akbar Ronde)
 * - Deteksi Top 3 Penjawab Tercepat per Soal (+100 Pts, +75 Pts, +60 Pts)
 * - Papan Skor Ganda (Skor Ronde Ini vs Total Sesi Live)
 */

class GameEngineSD {
    constructor(questions, io) {
        this.allQuestions = questions || [];
        this.io = io;

        this.rounds = this.groupQuestionsByRound();
        this.currentRoundNumber = 1;
        this.questionInRoundIndex = 0; // 0..9

        // Game State: 'IDLE' | 'QUESTION_ACTIVE' | 'QUESTION_REVEAL' | 'ROUND_SUMMARY'
        this.state = 'IDLE';

        this.currentQuestion = null;
        this.questionStartTime = 0;
        this.timer = 0;
        this.timerInterval = null;

        // Config Timers (dalam detik)
        this.QUESTION_DURATION = 20; // 20 Detik sesuai arahan streamer
        this.REVEAL_DURATION = 6;         // Cukup waktu membaca pembahasan & top 3
        this.ROUND_SUMMARY_DURATION = 10; // Layar podium perayaan akhir ronde

        // Tracking Soal
        this.votes = { A: 0, B: 0, C: 0, D: 0, E: 0 };
        this.totalVotes = 0;
        this.answeringAvatars = [];
        this.questionTopWinners = []; // Top 3 tercepat menjawab benar di soal aktif
        this.fastestWinner = null;

        // Leaderboard: Kuis (Ronde & Global) & Top Donatur / Sultan
        this.roundScores = new Map();
        this.globalScores = new Map();
        this.donorScores = new Map(); // username -> { username, nickname, avatar, diamonds }
        this.roundChampionsHistory = [];
        this.lastTeasedQuestionIndex = -1;
    }

    groupQuestionsByRound() {
        const grouped = {};
        for (const q of this.allQuestions) {
            const r = q.ronde || 1;
            if (!grouped[r]) grouped[r] = [];
            grouped[r].push(q);
        }
        return grouped;
    }

    start() {
        this.currentRoundNumber = 1;
        this.questionInRoundIndex = 0;
        this.roundScores.clear();
        this.startQuestion();

        // Sapaan pembuka Mbak Gadis saat game dimulai
        setTimeout(() => {
            this.io.emit('PLAY_VOICE', { clip: 'vo_sapa', label: 'Sapaan Pembuka' });
        }, 1200);
    }

    startQuestion() {
        if (this.timerInterval) clearInterval(this.timerInterval);

        const currentRoundQuestions = this.rounds[this.currentRoundNumber] || this.rounds[1] || [];
        if (currentRoundQuestions.length === 0) {
            console.error('[GAME] Tidak ada soal untuk ronde:', this.currentRoundNumber);
            return;
        }

        this.currentQuestion = currentRoundQuestions[this.questionInRoundIndex];
        this.state = 'QUESTION_ACTIVE';
        this.questionStartTime = Date.now();
        this.timer = this.QUESTION_DURATION;

        // Reset tracking soal
        this.votes = { A: 0, B: 0, C: 0, D: 0, E: 0 };
        this.totalVotes = 0;
        this.answeringAvatars = [];
        this.questionTopWinners = [];
        this.fastestWinner = null;

        const payload = {
            state: this.state,
            roundNumber: this.currentRoundNumber,
            totalRounds: Object.keys(this.rounds).length,
            kategori: this.currentQuestion.kategori || 'Cerdas Cermat SD',
            questionNumber: this.questionInRoundIndex + 1,
            totalQuestionsInRound: currentRoundQuestions.length,
            soal: this.currentQuestion.soal,
            opsi: this.currentQuestion.opsi,
            timer: this.timer,
            votes: this.votes,
            votePercentages: this.getVotePercentages(),
            totalVotes: this.totalVotes,
            answeringAvatars: this.answeringAvatars,
            roundLeaderboard: this.getTopRound(3),
            globalLeaderboard: this.getTopGlobal(3),
            donorLeaderboard: this.getTopDonors(3)
        };

        console.log(`[GAME] 🏁 Ronde ${this.currentRoundNumber} Soal ${this.questionInRoundIndex + 1}/${currentRoundQuestions.length}: "${this.currentQuestion.soal.substring(0, 45)}..."`);
        this.io.emit('QUESTION_START', payload);

        this.timerInterval = setInterval(() => {
            this.timer--;
            this.io.emit('TIMER_TICK', { timer: this.timer, state: this.state });

            // Tease menggoda sesekali (di detik ke-10, sekitar 35% peluang atau setiap 3 soal)
            if (this.timer === 10 && this.lastTeasedQuestionIndex !== this.questionInRoundIndex) {
                if ((this.questionInRoundIndex % 3 === 0) || Math.random() < 0.35) {
                    this.lastTeasedQuestionIndex = this.questionInRoundIndex;
                    const teaseClips = ['vo_tease_1', 'vo_tease_2', 'vo_tease_3', 'vo_tease_4'];
                    const chosen = teaseClips[Math.floor(Math.random() * teaseClips.length)];
                    this.io.emit('PLAY_VOICE', { clip: chosen, label: 'Tease Menggoda' });
                }
            }

            if (this.timer <= 0) {
                clearInterval(this.timerInterval);
                this.revealAnswer();
            }
        }, 1000);
    }

    submitAnswer(user, choice) {
        if (this.state !== 'QUESTION_ACTIVE') return;
        if (!choice || !this.votes.hasOwnProperty(choice)) return;

        this.votes[choice]++;
        this.totalVotes++;

        // Update avatar penonton aktif (maks 8)
        if (user.avatar) {
            const exists = this.answeringAvatars.find(a => a.username === user.username);
            if (!exists) {
                this.answeringAvatars.unshift({
                    username: user.username,
                    nickname: user.nickname || user.username,
                    avatar: user.avatar
                });
                if (this.answeringAvatars.length > 8) {
                    this.answeringAvatars.pop();
                }
            }
        }

        const isCorrect = choice === this.currentQuestion.jawaban;
        let pointsEarned = 0;

        if (isCorrect) {
            const elapsedMs = Date.now() - this.questionStartTime;
            const reactionSec = (elapsedMs / 1000).toFixed(2);

            const rank = this.questionTopWinners.length + 1;

            if (rank === 1) {
                pointsEarned = 100; // Juara 1: +100
            } else if (rank === 2) {
                pointsEarned = 75;  // Juara 2: +75
            } else if (rank === 3) {
                pointsEarned = 60;  // Juara 3: +60
            } else {
                pointsEarned = 50;  // Benar reguler: +50
            }

            if (rank <= 3) {
                const winnerEntry = {
                    rank: rank,
                    username: user.username,
                    nickname: user.nickname || user.username,
                    avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`,
                    timeTaken: `${reactionSec} dtk`,
                    pointsEarned: pointsEarned
                };
                this.questionTopWinners.push(winnerEntry);
                if (rank === 1) this.fastestWinner = winnerEntry;
                console.log(`[WINNER] ⚡ TOP ${rank} SOAL: ${user.nickname} (${reactionSec} dtk) +${pointsEarned} Pts`);
            }

            this.addScore(this.roundScores, user, pointsEarned);
            this.addScore(this.globalScores, user, pointsEarned);
        }

        // 1. Pancarkan event avatar menjawab dengan centang
        this.io.emit('USER_ANSWERED', {
            username: user.username,
            nickname: user.nickname || user.username,
            avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`,
            choice: choice
        });

        // 2. Broadcast update suara & klasemen ronde terkini
        this.io.emit('VOTE_UPDATE', {
            roundNumber: this.currentRoundNumber,
            votes: this.votes,
            votePercentages: this.getVotePercentages(),
            totalVotes: this.totalVotes,
            answeringAvatars: this.answeringAvatars,
            roundLeaderboard: this.getTopRound(3),
            globalLeaderboard: this.getTopGlobal(3),
            donorLeaderboard: this.getTopDonors(3)
        });
    }

    addScore(scoreMap, user, points) {
        const uKey = user.username.toLowerCase();
        const current = scoreMap.get(uKey) || {
            username: user.username,
            nickname: user.nickname || user.username,
            avatar: user.avatar || '',
            points: 0
        };
        current.points += points;
        if (user.avatar) current.avatar = user.avatar;
        if (user.nickname) current.nickname = user.nickname;
        scoreMap.set(uKey, current);
    }

    getVotePercentages() {
        if (this.totalVotes === 0) {
            return { A: 0, B: 0, C: 0, D: 0, E: 0 };
        }
        return {
            A: Math.round((this.votes.A / this.totalVotes) * 100),
            B: Math.round((this.votes.B / this.totalVotes) * 100),
            C: Math.round((this.votes.C / this.totalVotes) * 100),
            D: Math.round((this.votes.D / this.totalVotes) * 100),
            E: Math.round((this.votes.E / this.totalVotes) * 100)
        };
    }

    revealAnswer() {
        if (this.timerInterval) clearInterval(this.timerInterval);

        this.state = 'QUESTION_REVEAL';
        this.timer = this.REVEAL_DURATION;

        const currentRoundQuestions = this.rounds[this.currentRoundNumber] || [];
        const isLastQuestionInRound = (this.questionInRoundIndex + 1) >= currentRoundQuestions.length;

        const correctAnswerKey = this.currentQuestion.jawaban;
        const correctAnswerText = this.currentQuestion.opsi ? this.currentQuestion.opsi[correctAnswerKey] : '';

        const payload = {
            state: this.state,
            soal: this.currentQuestion.soal,
            correctAnswer: correctAnswerKey,
            correctAnswerText: correctAnswerText,
            pembahasan: this.currentQuestion.pembahasan || '',
            questionTopWinners: this.questionTopWinners,
            fastestWinner: this.fastestWinner,
            votes: this.votes,
            votePercentages: this.getVotePercentages(),
            totalVotes: this.totalVotes,
            roundLeaderboard: this.getTopRound(3),
            globalLeaderboard: this.getTopGlobal(3),
            donorLeaderboard: this.getTopDonors(3),
            timer: this.timer,
            isLastQuestionInRound: isLastQuestionInRound
        };

        console.log(`[GAME] 📖 Kunci Terbuka: [${correctAnswerKey}] ${correctAnswerText}. Top 3:`, this.questionTopWinners.map(w => `${w.nickname} (${w.timeTaken})`).join(', ') || 'Nihil');
        this.io.emit('QUESTION_REVEAL', payload);

        // Suara Mbak Gadis sesekali saat jawaban terbuka (~30% peluang)
        if (this.questionTopWinners && this.questionTopWinners.length > 0) {
            if (Math.random() < 0.35) {
                const winClip = Math.random() > 0.5 ? 'vo_winner_1' : 'vo_winner_2';
                setTimeout(() => {
                    this.io.emit('PLAY_VOICE', { clip: winClip, label: 'Pujian Pemenang Tercepat' });
                }, 800);
            }
        } else {
            // Jika tidak ada yang menjawab benar dan waktu habis (~30% peluang)
            if (Math.random() < 0.30) {
                setTimeout(() => {
                    this.io.emit('PLAY_VOICE', { clip: 'vo_timeout', label: 'Waktu Habis' });
                }, 800);
            }
        }

        this.timerInterval = setInterval(() => {
            this.timer--;
            this.io.emit('TIMER_TICK', { timer: this.timer, state: this.state });

            if (this.timer <= 0) {
                clearInterval(this.timerInterval);

                if (isLastQuestionInRound) {
                    this.showRoundSummary();
                } else {
                    this.questionInRoundIndex++;
                    this.startQuestion();
                }
            }
        }, 1000);
    }

    showRoundSummary() {
        if (this.timerInterval) clearInterval(this.timerInterval);

        this.state = 'ROUND_SUMMARY';
        this.timer = this.ROUND_SUMMARY_DURATION;

        const roundWinners = this.getTopRound(3);
        const globalWinners = this.getTopGlobal(3);

        const currentRoundQuestions = this.rounds[this.currentRoundNumber] || [];
        const categoryName = currentRoundQuestions[0]?.kategori || `Ronde ${this.currentRoundNumber}`;

        this.roundChampionsHistory.push({
            roundNumber: this.currentRoundNumber,
            category: categoryName,
            winners: roundWinners,
            timestamp: new Date().toISOString()
        });

        const payload = {
            state: this.state,
            roundNumber: this.currentRoundNumber,
            roundCategory: categoryName,
            roundWinners: roundWinners,
            globalWinners: globalWinners,
            donorLeaderboard: this.getTopDonors(3),
            timer: this.timer
        };

        console.log(`[PODIUM] 🏆 JUARA AKHIR RONDE ${this.currentRoundNumber} (${categoryName}):`, roundWinners.map(w => `${w.nickname} (${w.points} pts)`).join(', '));
        this.io.emit('ROUND_SUMMARY', payload);

        this.timerInterval = setInterval(() => {
            this.timer--;
            this.io.emit('TIMER_TICK', { timer: this.timer, state: this.state });

            if (this.timer <= 0) {
                clearInterval(this.timerInterval);
                this.advanceToNextRound();
            }
        }, 1000);
    }

    advanceToNextRound() {
        const roundKeys = Object.keys(this.rounds).map(Number).sort((a, b) => a - b);
        const currentIndex = roundKeys.indexOf(this.currentRoundNumber);

        if (currentIndex !== -1 && currentIndex + 1 < roundKeys.length) {
            this.currentRoundNumber = roundKeys[currentIndex + 1];
        } else {
            this.currentRoundNumber = roundKeys[0] || 1;
        }

        this.questionInRoundIndex = 0;
        this.roundScores.clear();

        console.log(`[GAME] 🚀 Melangkah ke Ronde ${this.currentRoundNumber}`);
        this.startQuestion();
    }

    registerGift(user, giftName, diamonds = 1) {
        const bonusPoints = Math.max(diamonds * 50, 100);

        this.addScore(this.roundScores, user, bonusPoints);
        this.addScore(this.globalScores, user, bonusPoints);

        // Tracking Top Sultan / Peringkat Donatur
        const uKey = user.username.toLowerCase();
        const currentDonor = this.donorScores.get(uKey) || {
            username: user.username,
            nickname: user.nickname || user.username,
            avatar: user.avatar || '',
            diamonds: 0
        };
        currentDonor.diamonds += diamonds;
        if (user.avatar) currentDonor.avatar = user.avatar;
        if (user.nickname) currentDonor.nickname = user.nickname;
        this.donorScores.set(uKey, currentDonor);

        const payload = {
            user: user.nickname || user.username,
            avatar: user.avatar || '',
            giftName: giftName,
            diamonds: diamonds,
            bonusPoints: bonusPoints
        };

        console.log(`[GIFT] 🎁 ${user.nickname} kirim ${giftName} (+${bonusPoints} Pts / +${diamonds}💎)`);
        this.io.emit('GIFT_EVENT', payload);

        // Suara ucapan manis & seksi Mbak Gadis saat ada gift masuk
        this.io.emit('PLAY_VOICE', { clip: 'vo_gift', label: 'Terima Kasih Gift Sultan' });

        this.io.emit('LEADERBOARD_UPDATE', {
            roundLeaderboard: this.getTopRound(3),
            globalLeaderboard: this.getTopGlobal(3),
            donorLeaderboard: this.getTopDonors(3)
        });
    }

    getTopDonors(limit = 3) {
        return Array.from(this.donorScores.values())
            .sort((a, b) => b.diamonds - a.diamonds)
            .slice(0, limit)
            .map((item, index) => ({
                rank: index + 1,
                username: item.username,
                nickname: item.nickname,
                avatar: item.avatar,
                diamonds: item.diamonds
            }));
    }

    getTopRound(limit = 3) {
        return Array.from(this.roundScores.values())
            .sort((a, b) => b.points - a.points)
            .slice(0, limit)
            .map((item, index) => ({
                rank: index + 1,
                username: item.username,
                nickname: item.nickname,
                avatar: item.avatar,
                points: item.points
            }));
    }

    getTopGlobal(limit = 3) {
        return Array.from(this.globalScores.values())
            .sort((a, b) => b.points - a.points)
            .slice(0, limit)
            .map((item, index) => ({
                rank: index + 1,
                username: item.username,
                nickname: item.nickname,
                avatar: item.avatar,
                points: item.points
            }));
    }

    skipQuestion() {
        if (this.state === 'QUESTION_ACTIVE') {
            this.revealAnswer();
        } else if (this.state === 'QUESTION_REVEAL') {
            if (this.timerInterval) clearInterval(this.timerInterval);
            const currentRoundQuestions = this.rounds[this.currentRoundNumber] || [];
            if ((this.questionInRoundIndex + 1) >= currentRoundQuestions.length) {
                this.showRoundSummary();
            } else {
                this.questionInRoundIndex++;
                this.startQuestion();
            }
        } else if (this.state === 'ROUND_SUMMARY') {
            if (this.timerInterval) clearInterval(this.timerInterval);
            this.advanceToNextRound();
        }
    }

    jumpToRound(roundNumber) {
        if (!this.rounds[roundNumber]) return false;
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.currentRoundNumber = roundNumber;
        this.questionInRoundIndex = 0;
        this.roundScores.clear();
        this.startQuestion();
        return true;
    }
}

module.exports = GameEngineSD;
