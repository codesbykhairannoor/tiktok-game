const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const TTSService = require('./src/TTSService');
const BattleGame = require('./src/BattleGame');
const TikTokListener = require('./src/TikTokListener');

const configPath = path.join(__dirname, 'config.json');
let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

const PORT = config.port || 3004;
const audioDir = path.join(__dirname, 'public', 'audio');

const ttsService = new TTSService(
    audioDir,
    config.voice || 'ja-JP-NanamiNeural',
    config.voicePitch || '+8Hz',
    config.voiceRate || '+4%'
);

const battleGame = new BattleGame(io, ttsService, config);
const tiktokListener = new TikTokListener(config.tiktokUsername, battleGame, io);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Vendor dependencies untuk 3D VRM Engine di browser
app.use('/vendor/three', express.static(path.join(__dirname, 'node_modules', 'three')));
app.use('/vendor/three-vrm', express.static(path.join(__dirname, 'node_modules', '@pixiv', 'three-vrm')));
app.use('/vendor/three-vrm-animation', express.static(path.join(__dirname, 'node_modules', '@pixiv', 'three-vrm-animation')));

// OBS Overlay Utama (Vertical Split Screen 1080x1920)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Panel Kontrol & Simulator Streamer
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/api/state', (req, res) => {
    res.json(battleGame.getState());
});

app.post('/api/simulate', async (req, res) => {
    const { username, giftName, coins, type, comment } = req.body;

    if (type === 'chat') {
        const sender = username || 'Penonton';
        const text = comment || 'Halo Mika!';
        const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(sender)}`;

        io.emit('TIKTOK_CHAT', {
            sender,
            comment: text,
            avatar
        });

        const chatResult = battleGame.processChat({
            username: sender,
            comment: text,
            profilePictureUrl: avatar
        });

        return res.json({ status: 'ok', type: 'chat', result: chatResult });
    }

    await battleGame.processGift({
        username: username || 'Sultan_Budi',
        giftName: giftName || 'Mawar',
        coins: Number(coins) || 1
    });

    res.json({ status: 'queued', king: battleGame.currentKing });
});

app.post('/api/reset', (req, res) => {
    battleGame.currentKing = {
        name: config.throne?.initialKing || 'Sultan Pertama',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SultanPertama',
        reignSeconds: 0,
        totalCoins: 10,
        crownedAt: Date.now()
    };
    battleGame.previousKing = null;
    io.emit('THRONE_RESET', battleGame.currentKing);
    res.json({ status: 'reset', currentKing: battleGame.currentKing });
});

app.post('/api/concert', (req, res) => {
    const { username, giftName, coins, songId } = req.body;
    if (!battleGame.songService) {
        return res.status(400).json({ error: 'SongService tidak tersedia' });
    }

    battleGame.songService.startConcert({
        username: username || 'Sultan_Spesial',
        giftName: giftName || 'Mic Emas',
        coins: Number(coins) || 20,
        songId: songId || null
    });

    res.json({ status: 'concert_started', songId });
});

app.post('/api/config', (req, res) => {
    const { tiktokUsername, minCoinsToUsurp, chatEnabled, chatCooldownMs, chatReadMode, concertEnabled, minCoinsToSing } = req.body;
    if (tiktokUsername !== undefined) config.tiktokUsername = tiktokUsername;
    if (minCoinsToUsurp !== undefined) {
        if (!config.throne) config.throne = {};
        config.throne.minCoinsToUsurp = Number(minCoinsToUsurp) || 1;
    }
    if (chatEnabled !== undefined) {
        if (!config.chat) config.chat = {};
        config.chat.enabled = Boolean(chatEnabled);
        if (battleGame.chatReader) battleGame.chatReader.enabled = Boolean(chatEnabled);
    }
    if (chatCooldownMs !== undefined) {
        if (!config.chat) config.chat = {};
        config.chat.cooldownMs = Number(chatCooldownMs);
        if (battleGame.chatReader) battleGame.chatReader.cooldownMs = Number(chatCooldownMs);
    }
    if (chatReadMode !== undefined) {
        if (!config.chat) config.chat = {};
        config.chat.readMode = chatReadMode;
        if (battleGame.chatReader) battleGame.chatReader.readMode = chatReadMode;
    }
    if (concertEnabled !== undefined) {
        if (!config.concert) config.concert = {};
        config.concert.enabled = Boolean(concertEnabled);
        if (battleGame.songService) battleGame.songService.enabled = Boolean(concertEnabled);
    }
    if (minCoinsToSing !== undefined) {
        if (!config.concert) config.concert = {};
        config.concert.minCoinsToSing = Number(minCoinsToSing) || 20;
        if (battleGame.songService) battleGame.songService.minCoinsToSing = Number(minCoinsToSing) || 20;
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    res.json({ status: 'saved', config, chatConfig: battleGame.getState().chatConfig, concertConfig: battleGame.getState().concertConfig });
});

io.on('connection', (socket) => {
    socket.emit('INIT_STATE', battleGame.getState());
});

server.listen(PORT, () => {
    console.log(`
======================================================
👑 MIKA VTUBER x SINGGASANA SULTAN (KING OF THE HILL)
======================================================
📺 OBS Stream Overlay   : http://localhost:${PORT}
🎛️  Panel Kontrol Admin : http://localhost:${PORT}/admin
🎮  Format Layar        : Split Screen Vertikal (1080x1920)
======================================================
    `);
    tiktokListener.start();
});
