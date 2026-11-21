/**
 * TikTokBridgeSD.js - Jembatan Koneksi TikTok LIVE Stream untuk Game Anak SD
 * Menerima chat penonton, parsing jawaban via ChatParserSD, dan submit ke GameEngineSD.
 * 
 * 🛡️ Anti-Scraper-Ban & Anti-Flood Shield:
 * - 0 Redundant Probes: Mengambil data room/profil langsung dari handshake koneksi, tanpa probe terpisah.
 * - Exponential Reconnect Backoff: Menghindari spam/tembakan bertubi-tubi ke server TikTok agar IP tidak kena Captcha/Shadowban.
 * - Auto-Sleep Polling: Mematikan semua interval saat sudah terhubung.
 */

const { TikTokLiveConnection } = require('tiktok-live-connector');

class TikTokBridgeSD {
    constructor(gameEngine, chatParser, io, ttsEngine = null) {
        this.gameEngine = gameEngine;
        this.chatParser = chatParser;
        this.io = io;
        this.ttsEngine = ttsEngine;

        this.connection = null;
        this.currentUsername = 'spillsabi.id'; // default target username
        this.profile = {
            username: 'spillsabi.id',
            nickname: 'maritumbuhbersama',
            avatar: 'https://p16-common-sign.tiktokcdn.com/tos-alisg-avt-0068/6e658634da730ba65fa01a5b7afb9e88~tplv-tiktokx-cropcenter:100:100.jpeg?dr=14579&refresh_token=1cc24fa2&x-expires=1794211200&x-signature=onqnWrGd%2BA%2BURGTOIhIX9G56hYA%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2',
            roomId: ''
        };
        this.isConnected = false;
        this.isConnecting = false;
        this.manualDisconnect = false;

        // Reconnect Control (Exponential Backoff)
        this.reconnectTimer = null;
        this.retryAttempts = 0;
        this.offlinePollTimer = null;

        // Mulai koneksi awal dengan jeda santai
        setTimeout(() => {
            this.connect(this.currentUsername);
        }, 1200);
    }

    /**
     * Ambil data profil dari handshake roomInfo yang sudah diunduh konektor
     * (Nol HTTP request tambahan ke server TikTok!)
     */
    extractProfileFromRoom(roomInfo, roomId) {
        const d = roomInfo?.data || roomInfo;
        if (d && d.owner) {
            const avatarUrl = d.owner.avatar_thumb?.url_list?.[0] || d.owner.avatar_medium?.url_list?.[0] || '';
            this.profile = {
                username: d.owner.display_id || this.currentUsername,
                nickname: d.owner.nickname || this.currentUsername,
                avatar: avatarUrl || this.profile.avatar,
                roomId: roomId || this.profile.roomId
            };
            console.log(`[TIKTOK] ✅ Profil Host: "${this.profile.nickname}" (@${this.profile.username})`);
            this.io.emit('TIKTOK_PROFILE', this.profile);
        }
    }

    connect(username) {
        if (!username || this.isConnecting || this.isConnected) return;

        this.currentUsername = username.replace('@', '').trim();
        this.isConnecting = true;
        this.manualDisconnect = false;
        this.clearTimers();

        console.log(`[TIKTOK] 🔄 Menghubungkan ke LIVE TikTok: @${this.currentUsername}...`);
        this.io.emit('TIKTOK_STATUS', { connected: false, connecting: true, username: this.currentUsername });

        try {
            // Konfigurasi koneksi pasif & minim beban server
            this.connection = new TikTokLiveConnection(this.currentUsername, {
                processInitialData: false,
                enableExtendedGiftInfo: false,
                requestPollingIntervalMs: 1500
            });

            this.connection.connect().then(state => {
                this.isConnected = true;
                this.isConnecting = false;
                this.retryAttempts = 0; // Reset counter saat berhasil terhubung
                this.clearTimers();     // Stop semua polling background

                console.log(`[TIKTOK] 🟢 TERHUBUNG ke LIVE @${this.currentUsername}! Room ID: ${state.roomId}`);
                this.io.emit('TIKTOK_STATUS', {
                    connected: true,
                    connecting: false,
                    username: this.currentUsername,
                    roomId: state.roomId
                });

                // Ekstrak data profil langsung tanpa request HTTP tambahan
                if (this.connection.roomInfo) {
                    this.extractProfileFromRoom(this.connection.roomInfo, state.roomId);
                }
            }).catch(err => {
                this.isConnected = false;
                this.isConnecting = false;
                console.log(`[TIKTOK] ⚠️ Belum LIVE atau Stream Offline (@${this.currentUsername}): ${err.message}`);
                this.io.emit('TIKTOK_STATUS', {
                    connected: false,
                    connecting: false,
                    username: this.currentUsername,
                    error: err.message
                });

                // Coba lagi dengan interval santai (30 detik) agar IP tidak dicurigai TikTok
                this.scheduleOfflinePoll(30000);
            });

            // Handle CHAT Penonton
            this.connection.on('chat', data => {
                const username = data.uniqueId || data.user?.displayId || data.userId || 'penonton';
                const nickname = data.nickname || data.user?.nickname || username;
                const text = data.comment || data.content || '';
                const avatar = data.profilePictureUrl || data.user?.avatarThumb?.urlList?.[0] || '';

                console.log(`[TIKTOK CHAT] 💬 @${nickname} (${username}): "${text}"`);

                this.handleIncomingChat({
                    username: username,
                    nickname: nickname,
                    avatar: avatar,
                    text: text
                });
            });

            // Handle GIFT
            this.connection.on('gift', data => {
                if (data.giftType === 1 && !data.repeatEnd) return; // ignore streak non-final
                const sender = data.nickname || data.user?.nickname || data.uniqueId || data.user?.displayId || 'Sultan';
                const username = data.uniqueId || data.user?.displayId || sender;
                const giftName = data.giftName || data.gift?.name || 'Gift';
                const diamonds = (data.diamondCount || data.gift?.diamondCount || 1) * (data.repeatCount || 1);
                const avatar = data.profilePictureUrl || data.user?.avatarThumb?.urlList?.[0] || '';

                console.log(`[TIKTOK GIFT] 🎁 @${sender}: ${giftName} (${diamonds}💎)`);

                this.gameEngine.registerGift({
                    username: username,
                    nickname: sender,
                    avatar: avatar
                }, giftName, diamonds);
            });

            // Handle Disconnect
            this.connection.on('disconnected', () => {
                this.isConnected = false;
                this.isConnecting = false;
                const wasUnexpected = !this.manualDisconnect;
                console.log(`[TIKTOK] 🔴 Terputus dari TikTok Live. (Manual: ${this.manualDisconnect ? 'YA' : 'TIDAK'})`);
                this.io.emit('TIKTOK_STATUS', {
                    connected: false,
                    connecting: false,
                    username: this.currentUsername,
                    unexpected: wasUnexpected
                });

                // 🛡️ Safe Exponential Backoff: Reconnect santai tanpa spam server TikTok
                if (wasUnexpected) {
                    this.retryAttempts++;
                    // 1st retry: 5s, 2nd: 12s, 3rd+: 25s
                    const delayMs = this.retryAttempts === 1 ? 5000 : (this.retryAttempts === 2 ? 12000 : 25000);
                    console.log(`[WATCHDOG] 🛡️ Mencoba menyambung kembali dalam ${delayMs / 1000} detik (Percobaan ke-${this.retryAttempts})...`);

                    this.clearTimers();
                    this.reconnectTimer = setTimeout(() => {
                        if (!this.isConnected && !this.isConnecting && this.currentUsername) {
                            this.connect(this.currentUsername);
                        }
                    }, delayMs);
                }
            });

            this.connection.on('error', err => {
                if (err && err.message) console.error('[TIKTOK] Error:', err.message);
            });

        } catch (e) {
            this.isConnected = false;
            this.isConnecting = false;
            console.error('[TIKTOK] Exception koneksi:', e.message);
        }
    }

    scheduleOfflinePoll(delayMs = 30000) {
        this.clearTimers();
        this.offlinePollTimer = setTimeout(() => {
            if (!this.isConnected && !this.isConnecting && this.currentUsername) {
                this.connect(this.currentUsername);
            }
        }, delayMs);
    }

    clearTimers() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.offlinePollTimer) {
            clearTimeout(this.offlinePollTimer);
            this.offlinePollTimer = null;
        }
    }

    disconnect(isManual = true) {
        this.manualDisconnect = isManual;
        this.clearTimers();
        if (this.connection) {
            try {
                this.connection.disconnect();
            } catch (e) { }
            this.connection = null;
        }
        this.isConnected = false;
        this.isConnecting = false;
        this.retryAttempts = 0;
        this.io.emit('TIKTOK_STATUS', { connected: false, connecting: false, username: this.currentUsername, unexpected: false });
    }

    reconnect(username) {
        this.disconnect(false);
        setTimeout(() => {
            this.connect(username || this.currentUsername);
        }, 1000);
    }

    /**
     * Memproses chat masuk (dari TikTok Live atau Simulasi)
     */
    handleIncomingChat(chatData) {
        if (!chatData || !chatData.text) return;

        // Parse melalui ChatParserSD
        const result = this.chatParser.processChat(chatData, this.gameEngine.currentQuestion);
        if (result && result.choice) {
            this.gameEngine.submitAnswer({
                username: chatData.username,
                nickname: chatData.nickname || chatData.username,
                avatar: chatData.avatar || ''
            }, result.choice);
        }
    }
}

module.exports = TikTokBridgeSD;
