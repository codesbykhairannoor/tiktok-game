const path = require('path');
const VoicePackService = require('./VoicePackService');
const ChatReaderService = require('./ChatReaderService');
const SongService = require('./SongService');

class BattleGame {
    constructor(io, ttsService, config) {
        this.io = io;
        this.tts = ttsService;
        this.config = config;

        // Service VoicePack siap saji (0ms delay, suara asli anime seiyuu)
        this.voicePack = new VoicePackService(path.join(__dirname, '..', 'public', 'voicepack'));

        // Service AI-VTuber Chat Reader (100% Free / Rp 0, anti-spam, suara seiyuu)
        this.chatReader = new ChatReaderService(this, config.chat || {});

        // Service Konser & Lagu Karaoke Jepang Mika
        this.songService = new SongService(this, config.concert || {});

        this.currentKing = {
            name: config.throne?.initialKing || 'Sultan Pertama',
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SultanPertama',
            reignSeconds: 0,
            totalCoins: 10,
            crownedAt: Date.now()
        };

        this.previousKing = null;
        this.leaderboard = [
            { name: this.currentKing.name, avatar: this.currentKing.avatar, reignSeconds: 0, coins: 10 }
        ];
        this.history = [];
        this.isProcessingEvent = false;
        this.eventQueue = [];

        // Sistem Mawar: Target Pesta (Goal Bar) & Kursi Pengawal (Top 4)
        this.roseGoal = {
            current: 0,
            target: config.roseGoalTarget || 100,
            celebrationActive: false,
            lastMvp: null
        };
        this.roseDonors = {};
        this.roseGuards = [];

        // Timer setiap detik untuk menghitung lama tahta bertahan
        this.timer = setInterval(() => {
            if (this.currentKing) {
                this.currentKing.reignSeconds++;
                this.updateLeaderboard(this.currentKing);
                this.io.emit('THRONE_TICK', {
                    currentKing: this.currentKing,
                    reignSeconds: this.currentKing.reignSeconds
                });
            }
        }, 1000);
    }

    updateLeaderboard(king) {
        const found = this.leaderboard.find((k) => k.name.toLowerCase() === king.name.toLowerCase());
        if (found) {
            found.reignSeconds = Math.max(found.reignSeconds, king.reignSeconds);
            found.coins = Math.max(found.coins, king.totalCoins);
        } else {
            this.leaderboard.push({
                name: king.name,
                avatar: king.avatar,
                reignSeconds: king.reignSeconds,
                coins: king.totalCoins
            });
        }
        this.leaderboard.sort((a, b) => (b.reignSeconds * 10 + b.coins) - (a.reignSeconds * 10 + a.coins));
        this.leaderboard = this.leaderboard.slice(0, 5);
    }

    updateRoseGuards() {
        const sorted = Object.values(this.roseDonors)
            .sort((a, b) => b.roseCount - a.roseCount || b.lastUpdated - a.lastUpdated)
            .slice(0, 4);

        const titles = [
            '👑 Jenderal Mawar',
            '🌹 Letnan Mawar',
            '🌹 Pengawal Kanan',
            '🌹 Pengawal Kiri'
        ];

        this.roseGuards = sorted.map((g, idx) => ({
            ...g,
            rank: idx + 1,
            title: titles[idx] || '🌹 Pengawal'
        }));

        this.io.emit('ROSE_GUARDS_UPDATE', this.roseGuards);
    }

    triggerRoseParty() {
        this.roseGoal.celebrationActive = true;
        const sorted = Object.values(this.roseDonors).sort((a, b) => b.roseCount - a.roseCount);
        const topDonor = sorted[0];
        const mvpName = topDonor ? topDonor.name : 'Pasukan Mawar';
        this.roseGoal.lastMvp = mvpName;

        console.log(`[ROSE PARTY 🎉] PESTA MAWAR TERCAPAI! MVP: ${mvpName} (${this.roseGoal.current} mawar)`);

        this.io.emit('ROSE_PARTY_START', {
            target: this.roseGoal.target,
            mvp: mvpName,
            totalRoses: this.roseGoal.current
        });

        const partyLines = [
            `Yattaaa! Sugoi! Pesta ${this.roseGoal.target} mawar tercapai! Makasih banyak semuanya, terutama Jenderal Mawar kita kaka ${mvpName}! Mika sayang kalian semua, daisuki~!`,
            `Kyaaa! Target ${this.roseGoal.target} mawar pecah rekor! Kaka ${mvpName} keren banget! Mika joget buat kalian semua yaa!`
        ];
        const chosenLine = partyLines[Math.floor(Math.random() * partyLines.length)];

        this.queueMikaVoice({
            type: 'rose_party',
            text: chosenLine,
            motion: 'Jump',
            expression: 'happy'
        });

        setTimeout(() => {
            this.roseGoal.current = 0;
            this.roseGoal.celebrationActive = false;
            this.io.emit('ROSE_GOAL_RESET', this.roseGoal);
        }, 12000);
    }

    getState() {
        return {
            currentKing: this.currentKing,
            previousKing: this.previousKing,
            leaderboard: this.leaderboard,
            history: this.history.slice(-10),
            roseGoal: this.roseGoal,
            roseGuards: this.roseGuards,
            chatConfig: {
                enabled: this.chatReader ? this.chatReader.enabled : true,
                cooldownMs: this.chatReader ? this.chatReader.cooldownMs : 6000,
                readMode: this.chatReader ? this.chatReader.readMode : 'smart',
                filterProfanity: this.chatReader ? this.chatReader.filterProfanity : true
            },
            concertConfig: {
                enabled: this.songService ? this.songService.enabled : true,
                minCoinsToSing: this.songService ? this.songService.minCoinsToSing : 20,
                isSinging: this.songService ? this.songService.isSinging : false,
                songs: this.songService ? this.songService.getSongs() : []
            }
        };
    }

    processChat({ username, comment, profilePictureUrl }) {
        if (!this.chatReader) return { processed: false, reason: 'no_reader' };
        return this.chatReader.processChat({
            username,
            comment,
            avatar: profilePictureUrl
        });
    }

    async processGift({ username, giftName, coins, profilePictureUrl, message }) {
        const giftCoins = Number(coins) || 1;
        const senderName = username || 'Sultan Misterius';
        const avatarUrl = profilePictureUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(senderName)}`;

        console.log(`[BATTLE ⚔️] Gift masuk dari "${senderName}": ${giftName} (${giftCoins} koin)`);

        // Emit notifikasi gift ke layar bawah
        this.io.emit('GIFT_ALERT', {
            username: senderName,
            giftName: giftName || 'Mawar',
            coins: giftCoins,
            avatar: avatarUrl
        });

        // 1. Logika Mawar: Nongkrong di Kursi Pengawal & Tambah Goal Pesta
        const isRose = (giftName || '').toLowerCase().includes('mawar') ||
            (giftName || '').toLowerCase().includes('rose') ||
            giftCoins === 1;

        if (isRose) {
            const addedRoses = giftCoins >= 1 ? giftCoins : 1;
            if (!this.roseDonors[senderName]) {
                this.roseDonors[senderName] = {
                    name: senderName,
                    avatar: avatarUrl,
                    roseCount: 0,
                    lastUpdated: Date.now()
                };
            }
            this.roseDonors[senderName].roseCount += addedRoses;
            this.roseDonors[senderName].avatar = avatarUrl;
            this.roseDonors[senderName].lastUpdated = Date.now();

            this.updateRoseGuards();

            this.roseGoal.current += addedRoses;
            this.io.emit('ROSE_GOAL_UPDATE', this.roseGoal);

            this.io.emit('ROSE_SPAWN_PARTICLES', {
                count: Math.min(addedRoses, 12),
                sender: senderName
            });

            // Respon suara: Cek apakah ada klip VoicePack siap saji untuk gift ini
            const vpClip = this.voicePack.pickForGift(giftName);
            if (vpClip && this.eventQueue.length === 0) {
                this.queueMikaVoice({
                    type: 'voicepack_gift',
                    audioUrl: vpClip.audioUrl,
                    text: vpClip.text,
                    motion: vpClip.motion || 'Blush',
                    expression: vpClip.expression || 'happy'
                });
            } else if (!vpClip && this.eventQueue.length === 0 && (addedRoses >= 5 || Math.random() < 0.25)) {
                this.queueMikaVoice({
                    type: 'rose_appreciation',
                    text: `Arigatou mawar nya kaka ${senderName}~!`,
                    motion: 'Blush',
                    expression: 'happy'
                });
            }

            if (this.roseGoal.current >= this.roseGoal.target && !this.roseGoal.celebrationActive) {
                this.triggerRoseParty();
            }
        }

        // 2. Jika pengirim adalah Raja saat ini, dia memperkuat pertahanan tahtanya
        if (this.currentKing && this.currentKing.name.toLowerCase() === senderName.toLowerCase()) {
            this.currentKing.totalCoins += giftCoins;
            this.updateLeaderboard(this.currentKing);

            this.io.emit('THRONE_DEFENDED', {
                king: this.currentKing,
                addedCoins: giftCoins,
                message: `Baginda ${senderName} memperkokoh tahtanya!`
            });

            this.queueMikaVoice({
                type: 'defend',
                text: `Uwaa sugoi! Baginda ${senderName} makin kuat di tahta, makasii ${giftName} nya kaka raja, daisuki~!`,
                motion: 'Clapping',
                expression: 'happy'
            });
            return;
        }

        // 3. Syarat merebut Tahta Utama: Gift minimal minCoinsToUsurp (default 5 koin)
        const minCoins = this.config.throne?.minCoinsToUsurp || 5;
        if (giftCoins >= minCoins) {
            const oldKing = { ...this.currentKing };
            const newKing = {
                name: senderName,
                avatar: avatarUrl,
                reignSeconds: 0,
                totalCoins: giftCoins,
                crownedAt: Date.now()
            };

            this.previousKing = oldKing;
            this.currentKing = newKing;
            this.updateLeaderboard(newKing);

            this.history.push({
                winner: newKing.name,
                loser: oldKing.name,
                gift: giftName,
                coins: giftCoins,
                time: new Date().toLocaleTimeString('id-ID')
            });

            console.log(`[BATTLE 👑] TAHTA DIREBUT! "${newKing.name}" MENENDANG "${oldKing.name}"!`);

            // Emit animasi perebutan tahta ke frontend (flying kick!)
            this.io.emit('THRONE_TAKEOVER', {
                newKing,
                oldKing,
                giftName,
                coins: giftCoins
            });

            // Respon heboh Mika
            const mikaLines = [
                `Kyaaa! Baginda ${newKing.name} baru saja merebut tahta dari ${oldKing.name}! Ampun Baginda ${newKing.name}, Mika sekarang milikmu, daisuki~!`,
                `Uwaaa sugoi! Baginda ${newKing.name} menendang ${oldKing.name} keluar dari singgasana! Kuat banget kaka sultan!`,
                `Waa! Ada Raja Baru di tahta! Selamat Baginda ${newKing.name}, makasii ${giftName} nya, jangan mau dikalahin yaa!`
            ];
            const chosenLine = mikaLines[Math.floor(Math.random() * mikaLines.length)];

            this.queueMikaVoice({
                type: 'takeover',
                text: chosenLine,
                motion: 'Jump',
                expression: 'happy'
            });
        }

        // 4. Trigger Konser Lagu Jepang Spesial Mika jika gift memenuhi syarat
        if (this.songService && this.songService.isSingTrigger(giftName, giftCoins)) {
            setTimeout(() => {
                this.songService.startConcert({
                    username: senderName,
                    giftName,
                    coins: giftCoins
                });
            }, 1200);
        }
    }

    queueMikaVoice(event) {
        // Event penting (rebut tahta / pertahankan tahta / pesta mawar) selalu prioritas tertinggi:
        // Bersihkan antrian respon chat yang belum sempat terucap agar event tahta langsung diproses!
        if (event.type === 'takeover' || event.type === 'defend' || event.type === 'rose_party') {
            this.eventQueue = this.eventQueue.filter(e => e.type !== 'chat_reply');
        }

        this.eventQueue.push(event);
        if (!this.isProcessingEvent) {
            this.processNextVoice();
        }
    }

    // Alias untuk backwards compatibility
    queueSashaVoice(event) {
        this.queueMikaVoice(event);
    }

    async processNextVoice() {
        if (this.eventQueue.length === 0) {
            this.isProcessingEvent = false;
            return;
        }

        this.isProcessingEvent = true;
        const event = this.eventQueue.shift();

        try {
            let audioUrl = event.audioUrl;
            if (!audioUrl && event.text) {
                console.log(`[MIKA 🎙️] Mensintesis suara seiyuu: "${event.text}"`);
                const audioResult = await this.tts.speak(event.text);
                if (audioResult && audioResult.audioUrl) {
                    audioUrl = audioResult.audioUrl;
                }
            } else if (audioUrl) {
                console.log(`[MIKA 🎙️] Memutar klip VoicePack siap saji: "${event.text}"`);
            }

            if (audioUrl) {
                this.io.emit('VTUBER_SPEAK', {
                    text: event.text,
                    audioUrl,
                    sender: 'Mika',
                    motion: event.motion || 'Jump',
                    expression: event.expression || 'happy',
                    chatInfo: event.chatInfo || null
                });
                const durationMs = Math.max(3500, (event.text?.length || 20) * 85 + 1000);
                await new Promise((r) => setTimeout(r, durationMs));
            }
        } catch (err) {
            console.error('[MIKA ⚠️] Gagal merespon suara:', err.message);
        }

        this.processNextVoice();
    }
}

module.exports = BattleGame;
