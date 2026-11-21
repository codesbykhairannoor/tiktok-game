const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIBrain {
    constructor(config, ttsService, io, vtubeStudio = null, voicePack = null) {
        this.config = config;
        this.ttsService = ttsService;
        this.io = io;
        this.vtubeStudio = vtubeStudio;
        this.voicePack = voicePack;

        this.queue = [];
        this.isProcessing = false;
        this.recentResponses = [];
        this.lastActivityAt = Date.now();

        this.genAI = null;
        this.model = null;
        if (config.geminiApiKey) {
            this.setApiKey(config.geminiApiKey);
        } else {
            console.log('[AI BRAIN] ℹ️ Mode Standalone Smart + Voice Pack aktif (Isi geminiApiKey di /admin untuk LLM Gemini 2.5 Flash).');
        }

        // Auto Idle Chatter & Gerakan agar livestream tidak pernah terlihat beku/sepi
        this.idleInterval = setInterval(() => this.checkIdleActivity(), 15000);
    }

    setApiKey(key) {
        this.config.geminiApiKey = (key || '').trim();
        if (!this.config.geminiApiKey) {
            this.genAI = null;
            this.model = null;
            return;
        }
        try {
            this.genAI = new GoogleGenerativeAI(this.config.geminiApiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            console.log('[AI BRAIN] 🧠 Gemini 2.5 Flash aktif!');
        } catch (err) {
            console.warn('[AI BRAIN] ⚠️ Gagal inisialisasi Gemini:', err.message);
        }
    }

    checkIdleActivity() {
        if (this.isProcessing || this.queue.length > 0) return;
        const idleMs = Date.now() - this.lastActivityAt;

        // Setiap ~22 detik diam, mainkan gerakan kecil (LookAround / Thinking / Relax)
        if (idleMs > 22000 && idleMs < 42000) {
            const idleMotions = ['LookAround', 'Thinking', 'Relax'];
            const pick = idleMotions[Math.floor(Math.random() * idleMotions.length)];
            this.io.emit('VTUBER_MOTION', { motion: pick, expression: 'relaxed' });
        }

        // Jika autoIdleEnabled aktif dan sepi > 45 detik, celetuk suara manis dari Voice Pack
        if (this.config.autoIdleEnabled !== false && idleMs > 45000) {
            this.lastActivityAt = Date.now();
            if (this.voicePack) {
                const idleClip = this.voicePack.pickRandom('idle') || this.voicePack.pickRandom('kawaii');
                if (idleClip) {
                    this.enqueue({
                        type: 'voicepack_direct',
                        sender: this.config.vtuberName || 'Sasha',
                        clip: idleClip
                    });
                }
            }
        }
    }

    /**
     * Tambahkan event ke antrean prioritas:
     * saweria > gift > chat > member_join / voicepack_direct
     */
    enqueue(item) {
        this.lastActivityAt = Date.now();

        if (item.type === 'saweria') {
            this.queue.unshift(item);
        } else if (item.type === 'gift') {
            const firstChatIdx = this.queue.findIndex(q => q.type === 'chat' || q.type === 'voicepack_direct');
            if (firstChatIdx >= 0) {
                this.queue.splice(firstChatIdx, 0, item);
            } else {
                this.queue.push(item);
            }
        } else {
            if (this.queue.length < 15) {
                this.queue.push(item);
            }
        }

        this.processQueue();
    }

    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;

        this.isProcessing = true;
        this.lastActivityAt = Date.now();
        const currentTask = this.queue.shift();

        try {
            // Naikkan heart rate saat donasi / gift
            if (currentTask.type === 'saweria' || currentTask.type === 'gift') {
                this.io.emit('VTUBER_HEART_RATE', { bpm: this.config.heartRate?.excited || 128 });
            }

            // 1. Jika memutar Voice Pack langsung (0ms latency!)
            if (currentTask.type === 'voicepack_direct' && currentTask.clip) {
                const clip = currentTask.clip;
                console.log(`[VOICEPACK 🔊] "${clip.text}" (${clip.audioUrl})`);
                this.io.emit('VTUBER_SPEAK', {
                    text: clip.text,
                    audioUrl: clip.audioUrl,
                    sender: currentTask.sender || this.config.vtuberName || 'Sasha',
                    type: clip.category,
                    expression: clip.expression || 'happy',
                    motion: clip.motion || 'Clapping'
                });
                const waitMs = Math.max(4800, (clip.text.length * 95) + 1800);
                await new Promise(r => setTimeout(r, waitMs));
                return;
            }

            // 1b. Per-Gift Trigger langsung ke Voice Pack (instan 0ms, suara super gemas)
            if (currentTask.type === 'gift' && this.config.giftTriggerMode !== false && this.voicePack) {
                const giftClip = this.voicePack.pickForGift(currentTask.giftName);
                if (giftClip) {
                    const spokenDisplay = `🎁 ${currentTask.sender} (${currentTask.giftName || 'Gift'}): ${giftClip.text}`;
                    console.log(`[VOICEPACK 🔊] ${spokenDisplay} (${giftClip.audioUrl})`);
                    this.io.emit('VTUBER_SPEAK', {
                        text: spokenDisplay,
                        audioUrl: giftClip.audioUrl,
                        sender: currentTask.sender || 'Sultan',
                        type: 'gift',
                        expression: giftClip.expression || 'happy',
                        motion: giftClip.motion || 'Jump'
                    });
                    const waitMs = Math.max(4800, (giftClip.text.length * 95) + 1800);
                    await new Promise(r => setTimeout(r, waitMs));
                    return;
                }
            }

            // 2. Hasilkan teks balasan & emosi/animasi
            const { text: responseText, motion, expression } = await this.generateResponse(currentTask);

            if (responseText) {
                console.log(`[VTUBER 💬] [${motion}] "${responseText}"`);

                // Ambil klip opener imut dari voice pack hanya untuk Saweria jika mode hybrid diaktifkan eksplisit
                let introClipPath = null;
                if (this.config.hybridVoicePack === true && this.voicePack && currentTask.type !== 'gift') {
                    if (currentTask.type === 'saweria') {
                        const sfx = this.voicePack.pickRandom('kawaii');
                        if (sfx && sfx.filePath) introClipPath = sfx.filePath;
                    }
                }

                // Generate Audio TTS (Edge-TTS + FFmpeg polish + optional intro stitch)
                const speechResult = await this.ttsService.speak(responseText, { introClipPath });

                if (speechResult) {
                    this.io.emit('VTUBER_SPEAK', {
                        text: responseText,
                        audioUrl: speechResult.audioUrl,
                        sender: currentTask.sender,
                        type: currentTask.type,
                        amount: currentTask.amount,
                        expression,
                        motion
                    });

                    if (this.vtubeStudio) {
                        if (currentTask.type === 'saweria') this.vtubeStudio.setExpression('blush');
                        else if (currentTask.type === 'gift') this.vtubeStudio.setExpression('happy');
                    }

                    const waitDurationMs = Math.max(4800, (responseText.length * 95) + 1800);
                    await new Promise(r => setTimeout(r, waitDurationMs));
                }
            }
        } catch (err) {
            console.error('[AI BRAIN] Error saat memproses antrean:', err);
        } finally {
            this.io.emit('VTUBER_HEART_RATE', { bpm: this.config.heartRate?.normal || 82 });
            this.isProcessing = false;
            this.lastActivityAt = Date.now();
            setTimeout(() => this.processQueue(), 450);
        }
    }

    /**
     * Tentukan motion VRMA & ekspresi yang cocok dari teks/event
     */
    inferMotionAndExpression(task, text) {
        const lower = (text || '').toLowerCase();
        if (task.type === 'saweria') {
            return { motion: 'Jump', expression: 'happy' };
        }
        if (task.type === 'gift') {
            return { motion: 'Clapping', expression: 'happy' };
        }
        if (lower.includes('halo') || lower.includes('selamat datang') || lower.includes('dadah') || lower.includes('bye')) {
            return { motion: 'Goodbye', expression: 'happy' };
        }
        if (lower.includes('malu') || lower.includes('deg-degan') || lower.includes('sayang') || lower.includes('kacamata')) {
            return { motion: 'Blush', expression: 'happy' };
        }
        if (lower.includes('hah') || lower.includes('serius') || lower.includes('kaget') || lower.includes('template meme')) {
            return { motion: 'Surprised', expression: 'surprised' };
        }
        if (lower.includes('hmm') || lower.includes('mikir') || lower.includes('menarik')) {
            return { motion: 'Thinking', expression: 'relaxed' };
        }
        return { motion: 'Clapping', expression: 'happy' };
    }

    async generateResponse(task) {
        if (this.model && this.config.geminiApiKey) {
            try {
                let prompt = `${this.config.persona}\n`;
                prompt += `ATURAN OUTPUT: Tulis balasan singkat (1-2 kalimat pendek saja, gaya bicara natural untuk dibaca TTS, hindari emoji berlebihan). Di paling awal baris, sertakan tag emosi pilih salah satu: [Jump], [Clapping], [Blush], [Goodbye], [Thinking], atau [Surprised].\n\n`;

                if (task.type === 'saweria') {
                    prompt += `PENONTON "${task.sender}" DONASI SAWERIA Rp ${task.amount.toLocaleString('id-ID')} dengan pesan: "${task.message}". Berikan reaksi heboh manis dan balas pesannya!`;
                } else if (task.type === 'gift') {
                    prompt += `PENONTON "${task.sender}" KIRIM GIFT TIKTOK: ${task.giftName} (${task.diamonds} Diamond). Ucapkan terima kasih dengan super imut!`;
                } else {
                    prompt += `PENONTON "${task.sender}" KOMEN: "${task.message}". Balas komentarnya dengan lucu, imut, dan akrab!`;
                }

                const result = await this.model.generateContent(prompt);
                let raw = result.response.text().trim();

                let motion = null;
                const tagMatch = raw.match(/^\[(Jump|Clapping|Blush|Goodbye|Thinking|Surprised)\]\s*/i);
                if (tagMatch) {
                    motion = tagMatch[1].charAt(0).toUpperCase() + tagMatch[1].slice(1).toLowerCase();
                    raw = raw.replace(tagMatch[0], '').trim();
                }

                const inferred = this.inferMotionAndExpression(task, raw);
                return {
                    text: raw,
                    motion: motion || inferred.motion,
                    expression: inferred.expression
                };
            } catch (err) {
                console.warn('[AI BRAIN] Gemini API error, menggunakan Smart Fallback:', err.message);
            }
        }

        const fallbackText = this.generateSmartFallback(task);
        const inferred = this.inferMotionAndExpression(task, fallbackText);
        return {
            text: fallbackText,
            motion: inferred.motion,
            expression: inferred.expression
        };
    }

    generateSmartFallback(task) {
        const cleanSender = task.sender || 'kaka manis';

        if (task.type === 'saweria') {
            const responses = [
                `Uwaa makasii banyaa kaka ${cleanSender} buat sawerannya Rp ${task.amount.toLocaleString('id-ID')}! Pas banget buat tambahan uang jajan ngampus Sasha nih, daisuki~!`,
                `Kyaa sugoi! Kaka sultan ${cleanSender} kasih saweran buat Sasha, makasii banyaa kaka sayang, bikin semangat sepulang kuliah nih!`,
                `Ehehe makasii banyaa kaka ${cleanSender}! Pesannya: ${task.message || 'Semangat kuliah Sasha'}. Sasha doain rezekinya makin lancar yaa!`
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }

        if (task.type === 'gift') {
            const responses = [
                `Uwaa ureshii! Makasii banyaa kaka ${cleanSender} udah kirim ${task.giftName}, Sasha seneng banget, daisuki~!`,
                `Ehehe dapet ${task.giftName} dari kaka ${cleanSender}! Pas banget nemenin Sasha santai habis pulang kuliah nih!`,
                `Kyaa makasii banyaa ${task.giftName}-nya kaka sayang ${cleanSender}, kamu perhatian banget sama Sasha!`
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }

        const msg = (task.message || '').toLowerCase();
        if (msg.includes('konnichiwa') || msg.includes('ohayou') || msg.includes('konbanwa') || msg.includes('こんにちは') || msg.includes('こんばんは')) {
            return `Konnichiwa kaka ${cleanSender} sayang! Selamat datang di live Sasha, Sasha no haishin e youkoso, daisuki yo~!`;
        }
        if (msg.includes('kawaii') || msg.includes('可愛い') || msg.includes('かわいい') || msg.includes('daisuki') || msg.includes('大好き')) {
            return `Kyaa ureshii! Kaka ${cleanSender} bilang Sasha kawaii, arigatou ne kaka sayang, Sasha mo daisuki da yo~!`;
        }
        if (msg.includes('halo') || msg.includes('hai') || msg.includes('hi')) {
            return `Halo kaka ${cleanSender} sayang! Selamat datang di live Sasha, baru pulang kuliah langsung nemenin kamu ngobrol nih, ehehe!`;
        }
        if (msg.includes('cantik') || msg.includes('imut') || msg.includes('kacamata') || msg.includes('lucu') || msg.includes('rambut')) {
            return `Ehehe makasii kaka ${cleanSender}, penampilan Sasha hari ini manis dan bikin betah ngobrol kan? Daisuki~!`;
        }
        if (msg.includes('roasting') || msg.includes('hina')) {
            return `Iih kaka ${cleanSender} jangan godain Sasha terus dong, nanti Sasha salah tingkah nih depan kamera kuliah!`;
        }
        if (msg.includes('nyanyi') || msg.includes('suara')) {
            return `Ehehe suara Sasha udah manis dan lembut banget kan kaka ${cleanSender}? Sini ngobrol santai bareng Sasha~!`;
        }

        const randomChats = [
            `Ehehe kata kaka ${cleanSender}: ${task.message}. Makasii banyaa udah nemenin Sasha live habis ngampus yaa kaka sayang!`,
            `Sasha baca nih kaka ${cleanSender}: ${task.message}. Jangan lupa ngopi dan senyum malam ini yaa, daisuki~!`,
            `Uwaa kaka ${cleanSender} komen: ${task.message}. Asyik banget diajak ngobrol, jangan kemana-mana yaa!`
        ];
        return randomChats[Math.floor(Math.random() * randomChats.length)];
    }
}

module.exports = AIBrain;
