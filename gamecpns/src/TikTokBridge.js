/**
 * TikTokBridge.js - Jembatan Koneksi TikTok LIVE Stream
 * Menghubungkan ribuan komentar chat ke ChatParser & GameEngine
 * Dilengkapi AUTO-CONNECT & AUTO-PROFILE FETCH resmi TikTok @maritumbuhbersama
 */

const { TikTokLiveConnection } = require('tiktok-live-connector');

class TikTokBridge {
    constructor(gameEngine, rewardEngine, chatParser, io, ttsEngine = null) {
        this.gameEngine = gameEngine;
        this.rewardEngine = rewardEngine;
        this.chatParser = chatParser;
        this.io = io;
        this.ttsEngine = ttsEngine;

        this.connection = null;
        this.currentUsername = 'spillsabi.id'; // Akun resmi TikTok LIVE Studio user (@spillsabi.id / maritumbuhbersama)
        this.profile = {
            username: 'spillsabi.id',
            nickname: 'maritumbuhbersama',
            avatar: 'https://p16-common-sign.tiktokcdn.com/tos-alisg-avt-0068/6e658634da730ba65fa01a5b7afb9e88~tplv-tiktokx-cropcenter:100:100.jpeg?dr=14579&refresh_token=1cc24fa2&x-expires=1794211200&x-signature=onqnWrGd%2BA%2BURGTOIhIX9G56hYA%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2',
            roomId: '7683898513680190215'
        };
        this.isConnected = false;
        this.isConnecting = false;
        this.autoConnectInterval = null;

        // Ambil data profil resmi akun TikTok langsung dari server TikTok
        this.fetchProfileInfo(this.currentUsername);

        // Mulai pemantauan otomatis: akan otomatis menyambung begitu streamer klik "Go LIVE"
        this.startAutoConnector(8000);
    }

    async fetchProfileInfo(username) {
        if (!username) return;
        const cleanUser = username.replace('@', '').trim();
        try {
            const probe = new TikTokLiveConnection(cleanUser, {});
            const roomId = await probe.fetchRoomId();
            const roomInfo = await probe.fetchRoomInfo();
            const d = roomInfo.data || roomInfo;
            if (d && d.owner) {
                const avatarUrl = d.owner.avatar_thumb?.url_list?.[0] || d.owner.avatar_medium?.url_list?.[0] || '';
                this.profile = {
                    username: d.owner.display_id || cleanUser,
                    nickname: d.owner.nickname || cleanUser,
                    avatar: avatarUrl,
                    roomId: roomId
                };
                console.log(`[TIKTOK] ✅ Data Profil Asli Ditemukan: "${this.profile.nickname}" (@${this.profile.username})`);
                this.io.emit('TIKTOK_PROFILE', this.profile);
            }
        } catch (e) {
            console.log('[TIKTOK] Info profil:', e.message);
        }
    }

    startAutoConnector(intervalMs = 8000) {
        if (this.autoConnectInterval) clearInterval(this.autoConnectInterval);

        // Coba koneksi perdana saat startup
        setTimeout(() => {
            if (!this.isConnected && !this.isConnecting) {
                this.connect(this.currentUsername);
            }
        }, 1500);

        this.autoConnectInterval = setInterval(() => {
            if (!this.isConnected && !this.isConnecting && this.currentUsername) {
                this.connect(this.currentUsername);
            }
        }, intervalMs);
    }

    connect(username) {
        if (!username) return;
        this.currentUsername = username.replace('@', '').trim();

        if (this.isConnecting) return;
        this.isConnecting = true;

        if (this.connection) {
            try { this.connection.disconnect(); } catch (e) { }
            this.connection = null;
        }

        console.log(`[TIKTOK] Memeriksa status siaran @${this.currentUsername}...`);
        this.io.emit('TIKTOK_STATUS', {
            status: 'CONNECTING',
            username: this.currentUsername,
            profile: this.profile,
            message: `Memeriksa siaran live @${this.currentUsername}...`
        });

        try {
            this.connection = new TikTokLiveConnection(this.currentUsername, {
                processInitialData: false,
                enableExtendedGiftInfo: false
            });
        } catch (e) {
            this.isConnecting = false;
            console.error('[TIKTOK] Gagal inisialisasi koneksi:', e.message);
            this.io.emit('TIKTOK_STATUS', {
                status: 'OFFLINE',
                error: e.message,
                username: this.currentUsername,
                profile: this.profile
            });
            return;
        }

        // ================= 1. EVENT CHAT =================
        this.connection.on('chat', data => {
            const sender = data.user?.nickname || data.user?.displayId || data.nickname || data.uniqueId || 'Anonim';
            const text = data.content || data.comment || '';
            const userId = data.user?.id || data.user?.displayId || data.userId || sender;
            const avatar = data.user?.avatarThumb?.urlList?.[0] || data.profilePictureUrl || '';

            console.log(`[LIVE CHAT] @${sender}: ${text}`);

            this.io.emit('CHAT_MESSAGE', {
                user: sender,
                text: text,
                avatar: avatar
            });

            // Auto-Greeting AI: Sapa penonton baru yang berkomentar
            if (this.ttsEngine) {
                this.ttsEngine.handleUserJoin(sender, (this.gameEngine.currentIndex || 0) + 1);
            }

            // Parse tebakan dan kunci komen pertama jika valid (A, B, C, D, E)
            const voteData = this.chatParser.parseAnswer(text, userId, sender, this.gameEngine.roundTimer);
            if (voteData) {
                console.log(`[VOTE DETECTED] ✅ @${sender} menjawab pilihan [ ${voteData.letter} ]`);
                this.gameEngine.registerVote(voteData);
            }
        });

        // ================= 2. EVENT GIFT =================
        this.connection.on('gift', data => {
            const sender = data.user?.nickname || data.user?.displayId || data.nickname || data.uniqueId || 'Sultan';
            const uniqueId = data.user?.displayId || data.uniqueId || sender;
            const giftName = data.gift?.name || data.giftName || 'Gift';
            const giftId = data.gift?.id || data.giftId || 0;
            const diamondCount = data.gift?.diamondCount || data.diamondCount || 1;
            const repeatCount = data.repeatCount || 1;
            const repeatEnd = data.repeatEnd ?? true;

            console.log(`[LIVE GIFT] 🎁 @${sender} mengirim ${repeatCount}x ${giftName} (${diamondCount} diamond)`);

            this.rewardEngine.processGift({
                user: sender,
                uniqueId: uniqueId,
                giftName: giftName,
                giftId: giftId,
                diamondCount: diamondCount,
                repeatCount: repeatCount,
                repeatEnd: repeatEnd
            });
        });

        // ================= 3. EVENT LIKE =================
        this.connection.on('like', data => {
            const sender = data.user?.nickname || data.user?.displayId || data.nickname || data.uniqueId || 'Penonton';
            const totalLikes = data.totalLikeCount || data.totalLikes || 1;
            const likeCount = data.likeCount || 1;

            this.rewardEngine.processLike({
                totalLikes: totalLikes,
                likeCount: likeCount,
                user: sender
            });
        });

        // ================= 4. EVENT FOLLOW =================
        this.connection.on('follow', data => {
            this.rewardEngine.processFollow({
                user: data.nickname || data.uniqueId
            });
        });

        // ================= 5. EVENT SHARE =================
        this.connection.on('share', data => {
            this.rewardEngine.processShare({
                user: data.nickname || data.uniqueId
            });
        });

        // ================= 6. EVENT MEMBER JOIN =================
        this.connection.on('member', data => {
            const sender = data.user?.nickname || data.user?.displayId || data.nickname || data.uniqueId;
            if (sender && this.ttsEngine) {
                this.ttsEngine.handleUserJoin(sender, (this.gameEngine.currentIndex || 0) + 1);
            }
        });

        // ================= 7. EVENT VIEWER COUNT =================
        this.connection.on('roomUser', data => {
            this.io.emit('VIEWER_UPDATE', {
                viewers: data.viewerCount
            });
        });

        // ================= 8. EVENT DISCONNECT =================
        this.connection.on('disconnected', () => {
            this.isConnected = false;
            this.isConnecting = false;
            console.log('[TIKTOK] Terputus dari siaran. Menunggu live aktif kembali...');
            this.io.emit('TIKTOK_STATUS', {
                status: 'DISCONNECTED',
                username: this.currentUsername,
                profile: this.profile,
                message: 'Terputus dari siaran.'
            });
        });

        // Eksekusi Sambungan ke Webcast TikTok
        this.connection.connect().then(state => {
            this.isConnected = true;
            this.isConnecting = false;
            console.log(`[TIKTOK] ✅ TERHUBUNG KE LIVE @${this.currentUsername} (Room ID: ${state.roomId})`);
            this.io.emit('TIKTOK_STATUS', {
                status: 'CONNECTED',
                roomId: state.roomId,
                username: this.currentUsername,
                profile: this.profile,
                message: `Terhubung ke Live @${this.currentUsername}`
            });
        }).catch(err => {
            this.isConnected = false;
            this.isConnecting = false;
            const isNotOnline = err.message && err.message.includes("isn't online");
            if (isNotOnline) {
                console.log(`[TIKTOK] ⏳ Akun @${this.currentUsername} (${this.profile.nickname}) belum Go LIVE. Standby...`);
            } else {
                console.log(`[TIKTOK] Status koneksi: ${err.message}`);
            }

            this.io.emit('TIKTOK_STATUS', {
                status: isNotOnline ? 'WAITING_LIVE' : 'OFFLINE',
                error: err.message,
                username: this.currentUsername,
                profile: this.profile,
                message: isNotOnline ? `Menunggu siaran @${this.currentUsername} aktif (Klik Go LIVE)` : err.message
            });
        });
    }

    /**
     * Mode Simulasi Lokal (Untuk Pengujian Offline di OBS / Streamer)
     */
    simulateChat(username = null, message = null) {
        const sampleComments = [
            "Bismillah tahun ini NIP CPNS 2026 tembus! 🤲",
            "Pasti C min, trik 7 detiknya kepake banget!",
            "Semangat kawan-kawan pejuang SKD!",
            "Soal TIU CPNS berhitung cepat ini sering keluar di tryout BKN!",
            "Kak bahas rumus deret bertingkat dong!",
            "Ayo dong jawab bareng-bareng!",
            "Fokus hitung desimalnya gaes!",
            "Mudah banget ini mah kalau tahu polanya!"
        ];
        const user = username || 'Pejuang_NIP_' + Math.floor(Math.random() * 900 + 100);
        const text = message || sampleComments[Math.floor(Math.random() * sampleComments.length)];

        this.io.emit('CHAT_MESSAGE', { user: user, text: text });
        if (this.ttsEngine) {
            this.ttsEngine.handleUserJoin(user, (this.gameEngine.currentIndex || 0) + 1);
        }
        const voteData = this.chatParser.parseAnswer(text, user, user, this.gameEngine.roundTimer);
        if (voteData) {
            this.gameEngine.registerVote(voteData);
        }
    }

    simulateGift(username, giftName, diamonds) {
        this.rewardEngine.processGift({
            user: username,
            uniqueId: username,
            giftName: giftName,
            diamondCount: diamonds,
            repeatCount: 1,
            repeatEnd: true
        });
    }

    simulateLike(count = 25, user = null) {
        const sampleNames = ['Rian_Solo', 'Siti_Aisyah', 'Budi_PNS', 'Dewi_Lestari', 'Farhan_Jaya'];
        const randomUser = user || sampleNames[Math.floor(Math.random() * sampleNames.length)];
        this.rewardEngine.processLike({
            likeCount: count,
            user: randomUser
        });
    }

    /**
     * Simulasi Masal: Mensimulasikan puluhan penonton menjawab sekaligus
     */
    simulateMassVotes(count = 25) {
        const letters = ['A', 'B', 'C', 'D', 'E'];
        const sampleNames = ['Rian_Solo', 'Budi_PNS', 'Siti_Aisyah', 'Dimas_Arya', 'Dewi_Lestari', 'Eko_Prasetyo', 'Nurul_Hidayah', 'Rizky_Ramadhan', 'Mega_Utami', 'Farhan_Jaya'];

        for (let i = 0; i < count; i++) {
            const randomUser = sampleNames[i % sampleNames.length] + '_' + Math.floor(Math.random() * 900 + 100);
            const randomLetter = letters[Math.floor(Math.random() * letters.length)];

            setTimeout(() => {
                const voteData = this.chatParser.parseAnswer(randomLetter, randomUser, randomUser, this.gameEngine.roundTimer);
                if (voteData) {
                    this.gameEngine.registerVote(voteData);
                }
            }, Math.random() * 1200);
        }
    }
}

module.exports = TikTokBridge;
