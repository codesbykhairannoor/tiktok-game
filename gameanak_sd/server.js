/**
 * server.js - Master Orchestrator Kuis Cerdas Cermat Anak SD
 * Port: 3001
 * Arsitektur: Express + Socket.IO + TikTok Connector
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const ChatParserSD = require('./src/ChatParserSD');
const GameEngineSD = require('./src/GameEngineSD');
const TikTokBridgeSD = require('./src/TikTokBridgeSD');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

const PORT = process.env.PORT || 3002;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Endpoint Sinkronisasi State Game Instan
app.get('/api/state', (req, res) => {
    if (!gameEngine.currentQuestion) {
        return res.json({ state: 'IDLE' });
    }
    const currentRoundQuestions = gameEngine.rounds[gameEngine.currentRoundNumber] || [];
    res.json({
        state: gameEngine.state,
        roundNumber: gameEngine.currentRoundNumber,
        totalRounds: Object.keys(gameEngine.rounds).length,
        kategori: gameEngine.currentQuestion.kategori || 'Cerdas Cermat SD',
        questionNumber: gameEngine.questionInRoundIndex + 1,
        totalQuestionsInRound: currentRoundQuestions.length,
        soal: gameEngine.currentQuestion.soal,
        opsi: gameEngine.currentQuestion.opsi,
        jawaban: gameEngine.state === 'QUESTION_REVEAL' ? gameEngine.currentQuestion.jawaban : null,
        pembahasan: gameEngine.state === 'QUESTION_REVEAL' ? gameEngine.currentQuestion.pembahasan : '',
        timer: gameEngine.timer,
        votes: gameEngine.votes,
        votePercentages: gameEngine.getVotePercentages(),
        totalVotes: gameEngine.totalVotes,
        answeringAvatars: gameEngine.answeringAvatars,
        fastestWinner: gameEngine.fastestWinner,
        questionTopWinners: gameEngine.questionTopWinners,
        correctAnswerText: gameEngine.currentQuestion.opsi ? gameEngine.currentQuestion.opsi[gameEngine.currentQuestion.jawaban] : '',
        roundLeaderboard: gameEngine.getTopRound(3),
        globalLeaderboard: gameEngine.getTopGlobal(3),
        donorLeaderboard: gameEngine.getTopDonors(3)
    });
});

// Routes Panel Streamer
app.get('/streamer', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'streamer.html'));
});
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'streamer.html'));
});

// 1. Load Bank Soal Anak SD
let questions = [];
try {
    const rawData = fs.readFileSync(path.join(__dirname, 'soal_sd.json'), 'utf8');
    questions = JSON.parse(rawData);
    console.log(`[INIT] ✅ Berhasil memuat ${questions.length} bank soal Cerdas Cermat Anak SD.`);
} catch (err) {
    console.error('[ERROR] Gagal membaca soal_sd.json:', err.message);
}

// 2. Inisialisasi Engine Game & Konektor TikTok
const chatParser = new ChatParserSD();
const gameEngine = new GameEngineSD(questions, io);
const tiktokBridge = new TikTokBridgeSD(gameEngine, chatParser, io);

// Kaitkan reset chat parser saat Soal Baru dimulai
const originalStartQuestion = gameEngine.startQuestion.bind(gameEngine);
gameEngine.startQuestion = function () {
    chatParser.resetRound();
    originalStartQuestion();
};

// 3. Socket.IO Events
io.on('connection', (socket) => {
    console.log(`[SOCKET] Client terhubung: ${socket.id}`);

    // Kirim state game saat ini ke client baru
    if (gameEngine.currentQuestion) {
        const currentRoundQuestions = gameEngine.rounds[gameEngine.currentRoundNumber] || [];
        socket.emit('SYNC_STATE', {
            state: gameEngine.state,
            roundNumber: gameEngine.currentRoundNumber,
            totalRounds: Object.keys(gameEngine.rounds).length,
            kategori: gameEngine.currentQuestion.kategori || 'Cerdas Cermat SD',
            questionNumber: gameEngine.questionInRoundIndex + 1,
            totalQuestionsInRound: currentRoundQuestions.length,
            soal: gameEngine.currentQuestion.soal,
            opsi: gameEngine.currentQuestion.opsi,
            jawaban: gameEngine.state === 'QUESTION_REVEAL' ? gameEngine.currentQuestion.jawaban : null,
            pembahasan: gameEngine.state === 'QUESTION_REVEAL' ? gameEngine.currentQuestion.pembahasan : '',
            timer: gameEngine.timer,
            votes: gameEngine.votes,
            votePercentages: gameEngine.getVotePercentages(),
            totalVotes: gameEngine.totalVotes,
            answeringAvatars: gameEngine.answeringAvatars,
            fastestWinner: gameEngine.fastestWinner,
            questionTopWinners: gameEngine.questionTopWinners,
            correctAnswerText: gameEngine.currentQuestion.opsi ? gameEngine.currentQuestion.opsi[gameEngine.currentQuestion.jawaban] : '',
            roundLeaderboard: gameEngine.getTopRound(3),
            globalLeaderboard: gameEngine.getTopGlobal(3),
            donorLeaderboard: gameEngine.getTopDonors(3)
        });
    }

    // Kirim status BGM awal (default volume 55% agar terdengar jelas & pas)
    socket.emit('BGM_STATE_UPDATE', {
        playing: true,
        volume: 0.55,
        trackName: 'Piano Sedih Komedi SD',
        trackUrl: '/sounds/bgm_piano_sedih.webm'
    });

    // Kirim status TikTok Live
    socket.emit('TIKTOK_STATUS', {
        connected: tiktokBridge.isConnected,
        connecting: tiktokBridge.isConnecting,
        username: tiktokBridge.currentUsername,
        roomId: tiktokBridge.profile?.roomId || ''
    });

    if (tiktokBridge.profile) {
        socket.emit('TIKTOK_PROFILE', tiktokBridge.profile);
    }

    // Streamer Controls:
    socket.on('STREAMER_NEXT_QUESTION', () => {
        console.log('[CONTROL] Streamer menekan Next Question / Skip');
        gameEngine.skipQuestion();
    });

    socket.on('STREAMER_JUMP_ROUND', (roundNum) => {
        console.log(`[CONTROL] Streamer melompat ke Ronde ${roundNum}`);
        gameEngine.jumpToRound(Number(roundNum));
    });

    socket.on('STREAMER_CONNECT_TIKTOK', (username) => {
        console.log(`[CONTROL] Streamer meminta koneksi TikTok ke: @${username}`);
        tiktokBridge.connect(username);
    });

    socket.on('STREAMER_DISCONNECT_TIKTOK', () => {
        console.log('[CONTROL] Streamer memutus koneksi TikTok secara manual');
        tiktokBridge.disconnect(true);
    });

    socket.on('STREAMER_FORCE_RECONNECT_TIKTOK', (username) => {
        console.log(`[CONTROL] Streamer Watchdog memicu Reconnect ke: @${username}`);
        tiktokBridge.reconnect(username);
    });

    // Kontrol BGM dari Streamer
    socket.on('STREAMER_BGM_CONTROL', (data) => {
        io.emit('BGM_STATE_UPDATE', data);
    });

    socket.on('STREAMER_BGM_VOLUME', (vol) => {
        io.emit('BGM_STATE_UPDATE', { volume: parseFloat(vol) });
    });

    // Simulasi Chat & Jawaban
    socket.on('STREAMER_SIMULATE_COMMENT', (data) => {
        // data: { username, nickname, text }
        tiktokBridge.handleIncomingChat({
            username: data.username || 'penonton_' + Math.floor(Math.random() * 900 + 100),
            nickname: data.nickname || data.username || 'Penonton Setia',
            avatar: data.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.username || 'user')}`,
            text: data.text
        });
    });

    // Simulasi Otomatis 3 Penonton Menjawab Benar (Menguji Top 3 Tercepat)
    socket.on('STREAMER_SIMULATE_TOP3_CORRECT', () => {
        if (!gameEngine.currentQuestion || gameEngine.state !== 'QUESTION_ACTIVE') return;
        const correctChoice = gameEngine.currentQuestion.jawaban;
        const testers = [
            { username: 'budi_juara1', nickname: 'Budi Juara 1 ⚡' },
            { username: 'siti_cerdas', nickname: 'Siti Pintar ✨' },
            { username: 'rafi_kilat', nickname: 'Rafi Si Kilat 🚀' }
        ];
        testers.forEach((u, i) => {
            setTimeout(() => {
                tiktokBridge.handleIncomingChat({
                    username: u.username,
                    nickname: u.nickname,
                    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`,
                    text: correctChoice
                });
            }, i * 350);
        });
    });

    // Simulasi Gift
    socket.on('STREAMER_SIMULATE_GIFT', (data) => {
        gameEngine.registerGift({
            username: data.username || 'sultan_' + Math.floor(Math.random() * 900 + 100),
            nickname: data.nickname || 'Sultan Keren 💎',
            avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.username || 'sultan')}`
        }, data.giftName || 'Mawar', data.diamonds || 1);
    });

    // Trigger Gemini Studio Voiceover (Mbak Gadis)
    socket.on('STREAMER_PLAY_VOICE', (clipName) => {
        console.log(`[VOICE] 🎙️ Streamer memicu suara Gemini: ${clipName}`);
        io.emit('PLAY_VOICE', { clip: clipName });
    });

    // Kontrol Ganti Tab Klasemen dari Streamer
    socket.on('STREAMER_SWITCH_TAB', (tabName) => {
        console.log(`[CONTROL] Streamer beralih tab klasemen ke: ${tabName}`);
        io.emit('SWITCH_LEADERBOARD_TAB', tabName);
    });

    // Simulasi 3 Donatur Top Sultan
    socket.on('STREAMER_SIMULATE_TOP_DONORS', () => {
        console.log('[GIFT] 💎 Simulasi 3 Donatur Top Sultan dimulai...');
        const testDonors = [
            { username: 'sultan_andara', nickname: 'Raja Sultan 👑', giftName: 'Singa Emas', diamonds: 3000 },
            { username: 'juragan_kaya', nickname: 'Juragan Muda ✨', giftName: 'Paus Laut', diamonds: 1200 },
            { username: 'bos_dermawan', nickname: 'Bos Dermawan 💎', giftName: 'Pesawat Jet', diamonds: 500 }
        ];
        testDonors.forEach((d, idx) => {
            setTimeout(() => {
                gameEngine.registerGift({
                    username: d.username,
                    nickname: d.nickname,
                    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${d.username}`
                }, d.giftName, d.diamonds);
            }, idx * 600);
        });
    });

    // Streamer Soundpad
    socket.on('STREAMER_PLAY_SOUND', (soundName) => {
        io.emit('PLAY_SOUND', { sound: soundName });
    });

    // 🛑 Streamer Mode Penutupan Siaran (Ending Live)
    socket.on('STREAMER_TRIGGER_LAST_SOAL', () => {
        console.log('[CLOSING] ⚠️ Streamer mengumumkan SOAL TERAKHIR siaran hari ini!');
        io.emit('TRIGGER_LAST_SOAL_ALERT');
    });

    socket.on('STREAMER_TRIGGER_CLOSING_SCREEN', () => {
        console.log('[CLOSING] 🎬 Streamer memicu LAYAR PENUTUPAN AKBAR & PODIUM FINAL!');
        const globalWinners = gameEngine.getTopGlobal(5);
        const topDonors = gameEngine.getTopDonors(5);
        io.emit('SHOW_CLOSING_SCREEN', { globalWinners, topDonors });
        io.emit('PLAY_VOICE', { clip: 'vo_closing' });
    });

    socket.on('STREAMER_DISMISS_CLOSING', () => {
        console.log('[CLOSING] ↩️ Streamer menutup layar penutupan');
        io.emit('DISMISS_CLOSING_SCREEN');
    });
});

// 4. Jalankan Game & Server
server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🎮 KUIS CERDAS CERMAT ANAK SD (RUPAGAMES STYLE)`);
    console.log(`======================================================`);
    console.log(`📺 Layar OBS Broadcast  : http://localhost:${PORT}`);
    console.log(`🎛️  Panel Streamer / Admin: http://localhost:${PORT}/streamer`);
    console.log(`======================================================\n`);

    // Otomatis mulai soal pertama
    gameEngine.start();
});

