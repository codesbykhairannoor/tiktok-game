const { TikTokLiveConnection } = require('tiktok-live-connector');

class TikTokListener {
    constructor(username, battleGame, io) {
        this.username = (username || '').replace('@', '').trim();
        this.game = battleGame;
        this.io = io;
        this.connection = null;
        this.isConnected = false;
        this.reconnectTimer = null;
    }

    start() {
        if (!this.username) {
            console.log('[TIKTOK] ⚠️ Username belum diatur di config.json');
            return;
        }

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

        this.connection
            .connect()
            .then((state) => {
                this.isConnected = true;
                console.log(`[TIKTOK] ✅ Terhubung ke LIVE @${this.username} (Room ID: ${state.roomId})`);
                this.io.emit('TIKTOK_STATUS', { connected: true, username: this.username });
            })
            .catch((err) => {
                this.isConnected = false;
                console.warn(`[TIKTOK] ⚠️ Stream offline atau gagal connect ke @${this.username}:`, err.message);
                this.io.emit('TIKTOK_STATUS', { connected: false, username: this.username, error: err.message });
                this.scheduleReconnect();
            });

        this.connection.on('gift', (data) => {
            if (data.giftType === 1 && !data.repeatEnd) {
                // Streak gift masih berjalan
                return;
            }
            const coins = (data.diamondCount || 1) * (data.repeatCount || 1);
            this.game.processGift({
                username: data.nickname || data.uniqueId,
                giftName: data.giftName || 'Gift',
                coins,
                profilePictureUrl: data.profilePictureUrl
            });
        });

        this.connection.on('chat', (data) => {
            const sender = data.nickname || data.uniqueId;
            const comment = data.comment;
            const avatar = data.profilePictureUrl;

            this.io.emit('TIKTOK_CHAT', {
                sender,
                comment,
                avatar
            });

            // Kirim ke engine AI-VTuber Chat Reader Mika
            this.game.processChat({
                username: sender,
                comment,
                profilePictureUrl: avatar
            });
        });

        this.connection.on('streamEnd', () => {
            console.log('[TIKTOK] ⏹️ LIVE TikTok telah berakhir.');
            this.isConnected = false;
            this.io.emit('TIKTOK_STATUS', { connected: false, username: this.username });
            this.scheduleReconnect();
        });

        this.connection.on('error', (err) => {
            console.warn('[TIKTOK] Error koneksi:', err.message);
        });
    }

    scheduleReconnect() {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
            console.log('[TIKTOK] 🔄 Mencoba reconnect otomatis...');
            this.start();
        }, 30000);
    }
}

module.exports = TikTokListener;
