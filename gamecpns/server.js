/**
 * server.js - Master Orchestrator Simulasi CAT SKD CPNS 2026
 * Menghubungkan GameEngine, RewardEngine, ChatParser, dan TikTokBridge
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const ChatParser = require('./src/ChatParser');
const RewardEngine = require('./src/RewardEngine');
const GameEngine = require('./src/GameEngine');
const TikTokBridge = require('./src/TikTokBridge');
const TTSEngine = require('./src/TTSEngine');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Routes khusus untuk Streamer / Admin Control Panel (Terpisah dari Broadcast OBS)
app.get('/streamer', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'streamer.html'));
});
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'streamer.html'));
});

// 1. Load Bank Soal CPNS MTK (102 Soal Matematika & Berhitung TIU CPNS)
let questions = [];
try {
    const mtkPath = path.join(__dirname, 'soal_cpns_mtk.json');
    const rawData = fs.readFileSync(fs.existsSync(mtkPath) ? mtkPath : path.join(__dirname, 'soal_cpns.json'), 'utf8');
    questions = JSON.parse(rawData);
    console.log(`[INIT] Berhasil memuat ${questions.length} bank soal resmi CPNS MTK / TIU Berhitung Cepat.`);
} catch (err) {
    console.error('[ERROR] Gagal membaca file soal:', err.message);
}

// 2. Inisialisasi Modul & Engine
const chatParser = new ChatParser();
const gameEngine = new GameEngine(questions, io);
const rewardEngine = new RewardEngine(gameEngine, io);
const ttsEngine = new TTSEngine(io);
const tiktokBridge = new TikTokBridge(gameEngine, rewardEngine, chatParser, io, ttsEngine);

// Hubungkan Event GameEngine ke ChatParser & TTSEngine
const originalStartQuestion = gameEngine.startQuestion.bind(gameEngine);
gameEngine.startQuestion = function (index) {
    chatParser.resetRound();
    originalStartQuestion(index);
    if (gameEngine.currentQuestion) {
        ttsEngine.handleNewQuestion(gameEngine.currentQuestion, (gameEngine.currentIndex || 0) + 1);
    }
};

const originalRevealAnswer = gameEngine.revealAnswer.bind(gameEngine);
gameEngine.revealAnswer = function (reason) {
    originalRevealAnswer(reason);
    if (gameEngine.currentQuestion) {
        const topLb = gameEngine.getTopLeaderboard();
        const topUser = topLb && topLb.length > 0 ? topLb[0].user : null;
        ttsEngine.handleReveal(gameEngine.currentQuestion.jawaban, topUser);
    }
};

// Endpoint HTTP untuk TTS Direct Stream
app.get('/api/tts', async (req, res) => {
    const text = req.query.text || '';
    const voice = req.query.voice || ttsEngine.currentVoice;
    if (!text) return res.status(400).send('Parameter text wajib diisi');
    const result = await ttsEngine.generateAudio(text, voice);
    if (result && fs.existsSync(result.filePath)) {
        res.setHeader('Content-Type', 'audio/mpeg');
        fs.createReadStream(result.filePath).pipe(res);
    } else {
        res.status(500).send('Gagal membuat audio TTS');
    }
});

// 3. Socket.IO Gateway untuk Browser Frontend / OBS
io.on('connection', socket => {
    console.log(`[CLIENT] Terhubung ke dashboard: ${socket.id}`);

    // Kirim Data Awal ke Browser/OBS saat baru dibuka
    socket.emit('INIT_STATE', {
        tiktokStatus: tiktokBridge.isConnected ? 'CONNECTED' : (tiktokBridge.isConnecting ? 'CONNECTING' : 'WAITING_LIVE'),
        tiktokUser: tiktokBridge.currentUsername,
        tiktokProfile: tiktokBridge.profile,
        currentQuestion: gameEngine.currentQuestion ? {
            index: gameEngine.currentIndex + 1,
            total: (gameEngine.sessionQuestions || []).length,
            id: gameEngine.currentQuestion.id,
            kategori: gameEngine.currentQuestion.kategori,
            soal: gameEngine.currentQuestion.soal,
            opsi: gameEngine.currentQuestion.opsi,
            jawaban: gameEngine.roundState === 'REVEAL' ? gameEngine.currentQuestion.jawaban : null,
            pembahasan: gameEngine.roundState === 'REVEAL' ? gameEngine.currentQuestion.pembahasan : null
        } : null,
        roundState: gameEngine.roundState,
        timer: gameEngine.roundTimer,
        multiplier: gameEngine.pointMultiplier,
        eliminated: gameEngine.eliminatedOptions,
        leaderboard: gameEngine.getTopLeaderboard(),
        sultanLeaderboard: gameEngine.getTopSultans(),
        answeredStatus: gameEngine.getAnsweredSheetSummary(),
        totalAnswered: gameEngine.totalAnsweredCount,
        voteStats: gameEngine.getVoteStats(),
        totalLikes: rewardEngine.totalLikes || 1250,
        communityGoal: {
            current: gameEngine.communityGoalCurrent || 0,
            target: gameEngine.communityGoalTarget || 50
        }
    });

    // Perintah dari Kontrol Streamer
    socket.on('CMD_CONNECT_TIKTOK', username => {
        tiktokBridge.connect(username);
    });

    socket.on('CMD_PLAY_SOUNDPAD', effect => {
        io.emit('PLAY_SOUNDPAD_EFFECT', { effect });
    });

    socket.on('CMD_SET_BGM_VOLUME', vol => {
        io.emit('SET_BGM_VOLUME', { volume: vol });
    });

    socket.on('CMD_SET_BGM_TRACK', track => {
        io.emit('SET_BGM_TRACK', { track: track });
    });

    socket.on('CMD_TOGGLE_BGM', () => {
        io.emit('TOGGLE_BGM');
    });

    // Kontrol Human Announcer Voice Pack (Klip Studio Suara Manusia)
    socket.on('CMD_PLAY_VOICEPACK', data => {
        io.emit('PLAY_VOICEPACK_CLIP', { clip: data.clip });
    });

    socket.on('CMD_SET_VOICEPACK_ENABLED', data => {
        io.emit('SET_VOICEPACK_ENABLED', { enabled: data.enabled });
    });

    // Kontrol Suara AI Presenter (Microsoft Neural TTS)
    socket.on('CMD_SET_TTS_SETTINGS', settings => {
        ttsEngine.updateSettings(settings);
        io.emit('TTS_SETTINGS_UPDATE', {
            autoGreeting: ttsEngine.autoGreeting,
            autoReadQuestion: ttsEngine.autoReadQuestion,
            autoAnnounceReveal: ttsEngine.autoAnnounceReveal,
            voice: ttsEngine.currentVoice
        });
    });

    socket.on('CMD_TEST_TTS', data => {
        const text = (data && data.text) ? data.text : "Halo pejuang CPNS! Selamat datang di live simulasi CAT SKD bersama Mbak Gadis!";
        ttsEngine.queueSpeak(text, 'test', true);
    });

    socket.on('CMD_NEXT_QUESTION', () => {
        gameEngine.startQuestion();
    });

    socket.on('CMD_PREV_QUESTION', () => {
        const total = (gameEngine.sessionQuestions || []).length;
        const prevIdx = gameEngine.currentIndex > 0 ? gameEngine.currentIndex - 1 : (total > 0 ? total - 1 : 0);
        gameEngine.startQuestion(prevIdx);
    });

    socket.on('CMD_TRIGGER_5050', () => {
        gameEngine.trigger5050('TEST_SULTAN');
    });

    socket.on('CMD_RESET_LEADERBOARD', () => {
        gameEngine.resetLeaderboard();
    });

    // Simulasi Event (Untuk Tes Offline)
    socket.on('CMD_SIMULATE_CHAT', data => {
        const u = data && data.user ? data.user : null;
        const t = data && data.text ? data.text : null;
        tiktokBridge.simulateChat(u, t);
    });

    socket.on('CMD_SIMULATE_GIFT', data => {
        tiktokBridge.simulateGift(data.user || 'Sultan_Demo', data.giftName || 'Rose', data.diamonds || 1);
    });

    socket.on('CMD_SIMULATE_LIKE', () => {
        tiktokBridge.simulateLike();
    });

    socket.on('CMD_SIMULATE_MASS_VOTES', () => {
        tiktokBridge.simulateMassVotes(25);
    });
});

// 4. Jalankan Game di Soal Pertama
gameEngine.startQuestion(0);

// 5. Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🇮🇩 SIMULASI CAT SKD CPNS 2026 - TIKTOK LIVE FRAMEWORK`);
    console.log(`🌐 Server Berjalan di: http://localhost:${PORT}`);
    console.log(`=======================================================`);
});
