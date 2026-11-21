const { TikTokLiveConnection } = require('tiktok-live-connector');

class TikTokListener {
    constructor(username, aiBrain, io) {
        this.username = username || '';
        this.aiBrain = aiBrain;
        this.io = io;
        this.connection = null;
        this.isConnected = false;
        this.retryTimer = null;
        this.lastMemberGreetAt = 0;

        if (this.username) {
            this.connect(this.username);
        }
    }

    connect(username) {
        if (!username) return;
        this.username = username.replace('@', '').trim();

        if (this.connection) {
            try { this.connection.disconnect(); } catch (e) { }
        }

        console.log(`[TIKTOK] 🔄 Menghubungkan ke LIVE TikTok @${this.username}...`);

        this.connection = new TikTokLiveConnection(this.username, {
            processInitialData: false,
            enableExtendedGiftInfo: false,
            requestPollingIntervalMs: 2000,
            clientParams: {
                app_language: 'id-ID',
                webcast_language: 'id-ID'
            }
        });

        this.connection.connect()
            .then(state => {
                this.isConnected = true;
                console.log(`[TIKTOK] ✅ Terhubung ke room @${this.username} (Room ID: ${state.roomId})`);
                this.io.emit('TIKTOK_STATUS', { connected: true, username: this.username });
            })
            .catch(err => {
                this.isConnected = false;
                console.warn(`[TIKTOK] ⚠️ Stream offline atau gagal connect ke @${this.username}:`, err.message);
                this.io.emit('TIKTOK_STATUS', { connected: false, username: this.username });

                clearTimeout(this.retryTimer);
                this.retryTimer = setTimeout(() => {
                    this.connect(this.username);
                }, 45000);
            });

        // Event Komentar (kirim comment & message agar konsisten dengan overlay)
        this.connection.on('chat', data => {
            const comment = data.comment?.trim();
            const sender = data.nickname || data.uniqueId || 'Penonton';

            if (!comment || comment.length < 2) return;

            this.io.emit('TIKTOK_CHAT', {
                sender,
                comment,
                message: comment,
                avatar: data.profilePictureUrl
            });

            this.aiBrain.enqueue({
                type: 'chat',
                sender,
                message: comment
            });
        });

        // Event Gift
        this.connection.on('gift', data => {
            if (data.giftType === 1 && !data.repeatEnd) return;

            const sender = data.nickname || data.uniqueId || 'Sultan';
            const giftName = data.giftName || data.gift?.name || 'Gift';
            const diamonds = (data.diamondCount || 1) * (data.repeatCount || 1);

            console.log(`[TIKTOK 🎁] @${sender} kirim ${giftName} (${diamonds}💎)`);

            this.io.emit('TIKTOK_GIFT', {
                sender,
                giftName,
                diamonds,
                avatar: data.profilePictureUrl
            });

            this.aiBrain.enqueue({
                type: 'gift',
                sender,
                giftName,
                diamonds
            });
        });

        // Event Penonton Join (Rate-limited 1x tiap 25 detik agar tidak spam)
        this.connection.on('member', data => {
            const now = Date.now();
            if (now - this.lastMemberGreetAt < 25000) return;
            this.lastMemberGreetAt = now;

            const sender = data.nickname || data.uniqueId || 'Kakak';
            if (this.aiBrain.voicePack) {
                const greet = this.aiBrain.voicePack.pickRandom('greetings');
                if (greet) {
                    this.aiBrain.enqueue({
                        type: 'voicepack_direct',
                        sender,
                        clip: greet
                    });
                }
            }
        });

        this.connection.on('disconnected', () => {
            this.isConnected = false;
            console.warn('[TIKTOK] ⚠️ Koneksi terputus.');
            this.io.emit('TIKTOK_STATUS', { connected: false, username: this.username });
        });
    }
}

module.exports = TikTokListener;
