const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const TTSService = require('./src/TTSService');
const VoicePackService = require('./src/VoicePackService');
const AIBrain = require('./src/AIBrain');
const TikTokListener = require('./src/TikTokListener');
const SaweriaListener = require('./src/SaweriaListener');
const VTubeStudioBridge = require('./src/VTubeStudioBridge');

// Load Config
const configPath = path.join(__dirname, 'config.json');
let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = config.port || 3003;
const audioDir = path.join(__dirname, 'public', 'audio');
const voicepackDir = path.join(__dirname, 'public', 'voicepack');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Sajikan library 3D secara lokal (100% offline-ready, bebas masalah CDN)
app.use('/vendor/three', express.static(path.join(__dirname, 'node_modules', 'three')));
app.use('/vendor/three-vrm', express.static(path.join(__dirname, 'node_modules', '@pixiv', 'three-vrm')));
app.use('/vendor/three-vrm-animation', express.static(path.join(__dirname, 'node_modules', '@pixiv', 'three-vrm-animation')));

// Inisialisasi Modul
const voicePack = new VoicePackService(voicepackDir);
const ttsService = new TTSService(
    audioDir,
    config.voice || 'ja-JP-NanamiNeural',
    config.voicePreset || 'kawaii-hybrid'
);
const vtubeStudio = new VTubeStudioBridge(config.vtubeStudio?.port || 8001);
const aiBrain = new AIBrain(config, ttsService, io, vtubeStudio, voicePack);
const tiktokListener = new TikTokListener(config.tiktokUsername, aiBrain, io);
const saweriaListener = new SaweriaListener(config.saweriaStreamKey, aiBrain, io);

// Multer setup untuk upload audio custom (.mp3 / .wav / .ogg) ke Voice Pack
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const cat = ['greetings', 'saweria', 'gift', 'kawaii', 'roast', 'idle', 'custom'].includes(req.body.category)
                ? req.body.category
                : 'custom';
            const targetDir = path.join(voicepackDir, cat);
            fs.mkdirSync(targetDir, { recursive: true });
            cb(null, targetDir);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname) || '.mp3';
            const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
            cb(null, `${cleanBase}_${Date.now()}${ext}`);
        }
    }),
    limits: { fileSize: 15 * 1024 * 1024 }
});

// ===================================================================
// API ENDPOINTS
// ===================================================================
app.get('/api/config', (req, res) => {
    res.json({
        ...config,
        voicePresets: ttsService.getPresets()
    });
});

app.post('/api/config', (req, res) => {
    const newConfig = { ...config, ...req.body };
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    config = newConfig;

    if (req.body.geminiApiKey !== undefined) {
        aiBrain.setApiKey(req.body.geminiApiKey);
    }
    if (req.body.voice !== undefined || req.body.voicePreset !== undefined) {
        ttsService.setVoiceConfig(req.body.voice, req.body.voicePreset);
    }
    if (req.body.tiktokUsername !== undefined && req.body.tiktokUsername !== tiktokListener.username) {
        tiktokListener.connect(req.body.tiktokUsername);
    }
    if (req.body.saweriaStreamKey !== undefined && req.body.saweriaStreamKey !== saweriaListener.streamKey) {
        saweriaListener.connect(req.body.saweriaStreamKey);
    }

    io.emit('CONFIG_UPDATED', config);
    res.json({ status: 'ok', config });
});

// Simulator Interaksi
app.post('/api/simulate', (req, res) => {
    const { type, sender, message, amount, giftName } = req.body;

    if (type === 'saweria') {
        const payload = {
            type: 'saweria',
            sender: sender || 'Sultan Budi',
            amount: Number(amount) || 10000,
            message: message || 'Keren banget Sasha!'
        };
        io.emit('SAWERIA_ALERT', { donator: payload.sender, amount: payload.amount, message: payload.message });
        aiBrain.enqueue(payload);
    } else if (type === 'gift') {
        const payload = {
            type: 'gift',
            sender: sender || 'Penonton Setia',
            giftName: giftName || 'Mawar',
            diamonds: Number(amount) || 1
        };
        io.emit('TIKTOK_GIFT', payload);
        aiBrain.enqueue(payload);
    } else {
        const payload = {
            type: 'chat',
            sender: sender || 'Netizen_Kepo',
            comment: message || 'Halo Sasha yang cantik!',
            message: message || 'Halo Sasha yang cantik!'
        };
        io.emit('TIKTOK_CHAT', payload);
        aiBrain.enqueue(payload);
    }

    res.json({ status: 'queued' });
});

// Kontrol Live 3D Avatar (Motion / Glasses / Model / Expression)
app.post('/api/avatar/action', (req, res) => {
    const { motion, expression, glasses, model } = req.body;
    if (glasses !== undefined) {
        io.emit('VTUBER_GLASSES', { visible: Boolean(glasses) });
    }
    if (model) {
        io.emit('VTUBER_SWITCH_MODEL', { model });
    }
    if (motion || expression) {
        io.emit('VTUBER_MOTION', { motion: motion || 'Relax', expression: expression || 'happy' });
    }
    res.json({ status: 'ok' });
});

// ===================================================================
// VOICE PACK STUDIO API ("PULUHAN SUARA" RP 0)
// ===================================================================
app.get('/api/voicepack', (req, res) => {
    res.json({
        clips: voicePack.list(req.query.category || null),
        counts: voicePack.getCategories()
    });
});

// Bake klip baru langsung via TTS + FFmpeg
app.post('/api/voicepack/bake', async (req, res) => {
    try {
        const { category = 'kawaii', label, text, engine = 'edge-ja-soft', motion = 'Clapping', expression = 'happy', kokoroVoice = 'af_heart' } = req.body;
        if (!text || !text.trim()) return res.status(400).json({ error: 'Teks wajib diisi' });

        const safeCat = ['greetings', 'saweria', 'gift', 'kawaii', 'roast', 'idle', 'custom'].includes(category) ? category : 'custom';
        const filename = `bake_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.mp3`;
        const targetPath = path.join(voicepackDir, safeCat, filename);

        let bakeOpts = { text, targetPath };
        let usedEngine = engine;
        if (engine === 'kokoro') {
            bakeOpts = { ...bakeOpts, useKokoro: true, kokoroVoice };
        } else {
            usedEngine = 'edge-ja-soft';
            bakeOpts = { ...bakeOpts, voice: 'ja-JP-NanamiNeural', pitch: '+8Hz', rate: '+4%' };
        }

        await ttsService.bakeClip(bakeOpts);
        const clip = voicePack.addClip({
            category: safeCat,
            label: label || text.slice(0, 32),
            text,
            filename,
            engine: usedEngine,
            motion,
            expression
        });

        res.json({ status: 'ok', clip });
    } catch (err) {
        console.error('[VOICEPACK] Bake error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Upload file MP3/WAV custom (misal hasil Google Colab RVC / GPT-SoVITS)
app.post('/api/voicepack/upload', upload.single('audio'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'File audio tidak ditemukan' });

    const category = ['greetings', 'saweria', 'gift', 'kawaii', 'roast', 'idle', 'custom'].includes(req.body.category)
        ? req.body.category
        : 'custom';

    const clip = voicePack.addClip({
        category,
        label: req.body.label || req.file.originalname,
        text: req.body.text || req.body.label || 'Custom Voice Clip',
        filename: req.file.filename,
        engine: 'custom-upload',
        motion: req.body.motion || 'Clapping',
        expression: req.body.expression || 'happy'
    });

    res.json({ status: 'ok', clip });
});

// Putar langsung klip Voice Pack ke Overlay + Admin (0ms delay!)
app.post('/api/voicepack/play/:id', (req, res) => {
    const clip = voicePack.list().find(c => c.id === req.params.id);
    if (!clip) return res.status(404).json({ error: 'Klip tidak ditemukan' });

    aiBrain.enqueue({
        type: 'voicepack_direct',
        sender: config.vtuberName || 'Sasha',
        clip: { ...clip, filePath: voicePack.getClipFilePath(clip) }
    });
    res.json({ status: 'playing', clip });
});

app.delete('/api/voicepack/:id', (req, res) => {
    const ok = voicePack.deleteClip(req.params.id);
    res.json({ status: ok ? 'deleted' : 'not_found' });
});

// Admin Route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Socket.io Events
io.on('connection', (socket) => {
    socket.emit('INIT_STATE', {
        config,
        tiktokConnected: tiktokListener.isConnected,
        saweriaConnected: saweriaListener.isConnected
    });

    socket.on('MANUAL_SPEAK', async (text) => {
        aiBrain.enqueue({
            type: 'chat',
            sender: 'Streamer Host',
            message: text
        });
    });
});

server.listen(PORT, () => {
    console.log(`
======================================================
🤖 AI VTUBER INTERACTIVE LIVESTREAM (STUDIO V2)
======================================================
📺 OBS Stream Overlay   : http://localhost:${PORT}
🎛️  Panel Kontrol Admin : http://localhost:${PORT}/admin
🎙️  Voice Pack Loaded   : ${voicePack.list().length} klip suara imut siap pakai!
======================================================
    `);
});
