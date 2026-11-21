/**
 * RewardEngine.js - Logika Pemetaan Lengkap Seluruh Gift TikTok Indonesia & Global
 * Mendukung deteksi berbasis Nama Gift (ID & EN) dan Nilai Koin (Diamond Count)
 */

// ================= TABEL LENGKAP GIFT TIKTOK INDONESIA & GLOBAL =================
const GIFT_RULES = {
    // Tier 1: 1 Koin (Mawar, TikTok, Kopi, Love Letter)
    'Rose': {
        addPoints: 5,
        addTimer: 5,
        action: '5050',
        label: '🌹 Mawar',
        sound: 'rose',
        toast: (u) => `🌹 @${u} MENGIRIM MAWAR! 2 Opsi Salah Dicoret & Timer +5s!`
    },
    'Mawar': {
        addPoints: 5,
        addTimer: 5,
        action: '5050',
        label: '🌹 Mawar',
        sound: 'rose',
        toast: (u) => `🌹 @${u} MENGIRIM MAWAR! 2 Opsi Salah Dicoret & Timer +5s!`
    },
    'TikTok': {
        addPoints: 5,
        addTimer: 5,
        action: '5050',
        label: '🎵 TikTok',
        sound: 'rose',
        toast: (u) => `🎵 @${u} MENGIRIM TIKTOK! Bantuan 50:50 Aktif!`
    },
    'Coffee': {
        addPoints: 15,
        addTimer: 20,
        action: 'TIMER_BOOST',
        label: '☕ Kopi',
        sound: 'coffee',
        toast: (u) => `☕ @${u} MENGIRIM KOPI! Waktu Ujian Ditambah +20 Detik!`
    },
    'Kopi': {
        addPoints: 15,
        addTimer: 20,
        action: 'TIMER_BOOST',
        label: '☕ Kopi',
        sound: 'coffee',
        toast: (u) => `☕ @${u} MENGIRIM KOPI! Waktu Ujian Ditambah +20 Detik!`
    },

    // Tier 2: 5 - 10 Koin (Finger Heart, Panda, Rosa, Hi Bear)
    'Finger Heart': {
        addPoints: 25,
        addTimer: 15,
        action: 'TIMER_BOOST',
        label: '💖 Jari Hati',
        sound: 'heart',
        toast: (u) => `💖 @${u} MENGIRIM JARI HATI! Poin +25 & Timer +15s!`
    },
    'Jari Hati': {
        addPoints: 25,
        addTimer: 15,
        action: 'TIMER_BOOST',
        label: '💖 Jari Hati',
        sound: 'heart',
        toast: (u) => `💖 @${u} MENGIRIM JARI HATI! Poin +25 & Timer +15s!`
    },
    'Panda': {
        addPoints: 30,
        addTimer: 20,
        action: 'TIMER_BOOST',
        label: '🐼 Panda',
        sound: 'heart',
        toast: (u) => `🐼 @${u} MENGIRIM PANDA! Poin +30 & Timer +20s!`
    },
    'Rosa': {
        addPoints: 30,
        addTimer: 20,
        action: 'TIMER_BOOST',
        label: '🌺 Rosa',
        sound: 'rose',
        toast: (u) => `🌺 @${u} MENGIRIM ROSA! Poin +30 & Timer +20s!`
    },

    // Tier 3: 20 - 30 Koin (Donat, Parfum, Buket Bunga) -> BONUS 2X POIN UNTUK SEMUA ORANG
    'Doughnut': {
        action: 'DOUBLE_POINTS',
        label: '🍩 Donat',
        sound: 'donut',
        toast: (u) => `🍩 SULTAN @${u} MENGIRIM DONAT! 2X POIN AKTIF UNTUK SEMUA PESERTA!`
    },
    'Donut': {
        action: 'DOUBLE_POINTS',
        label: '🍩 Donat',
        sound: 'donut',
        toast: (u) => `🍩 SULTAN @${u} MENGIRIM DONAT! 2X POIN AKTIF UNTUK SEMUA PESERTA!`
    },
    'Donat': {
        action: 'DOUBLE_POINTS',
        label: '🍩 Donat',
        sound: 'donut',
        toast: (u) => `🍩 SULTAN @${u} MENGIRIM DONAT! 2X POIN AKTIF UNTUK SEMUA PESERTA!`
    },
    'Perfume': {
        addTimer: 15,
        action: 'DOUBLE_POINTS',
        label: '🌸 Parfum',
        sound: 'donut',
        toast: (u) => `🌸 SULTAN @${u} MENGIRIM PARFUM! 2X Poin & Waktu +15s untuk Semua Peserta!`
    },
    'Bouquet': {
        action: 'DOUBLE_POINTS',
        label: '💐 Buket Bunga',
        sound: 'donut',
        toast: (u) => `💐 SULTAN @${u} MENGIRIM BUKET! 2X Poin Aktif untuk Semua Peserta!`
    },

    // Tier 4: 99 - 199 Koin (Topi, Mahkota, Kacamata, Konfeti) -> MULTIPLIER 2X LIPAT
    'Sunglasses': {
        addPoints: 150,
        addTimer: 45,
        action: 'DOUBLE_POINTS',
        label: '🕶️ Kacamata',
        sound: 'sultan',
        toast: (u) => `🕶️ SULTAN @${u} MENGIRIM KACAMATA! Poin Ronde 2X LIPAT & Timer +45s!`
    },
    'Kacamata': {
        addPoints: 150,
        addTimer: 45,
        action: 'DOUBLE_POINTS',
        label: '🕶️ Kacamata',
        sound: 'sultan',
        toast: (u) => `🕶️ SULTAN @${u} MENGIRIM KACAMATA! Poin Ronde 2X LIPAT & Timer +45s!`
    },
    'Crown': {
        addPoints: 200,
        addTimer: 45,
        action: 'DOUBLE_POINTS',
        label: '👑 Mahkota',
        sound: 'sultan',
        toast: (u) => `👑 @${u} MENGIRIM MAHKOTA! Poin Ronde Bernilai 2X Lipat!`
    },
    'Mahkota': {
        addPoints: 200,
        addTimer: 45,
        action: 'DOUBLE_POINTS',
        label: '👑 Mahkota',
        sound: 'sultan',
        toast: (u) => `👑 @${u} MENGIRIM MAHKOTA! Poin Ronde Bernilai 2X Lipat!`
    },
    'Confetti': {
        addPoints: 150,
        addTimer: 30,
        action: 'TIMER_BOOST',
        label: '🎉 Konfeti',
        sound: 'heart',
        toast: (u) => `🎉 @${u} MENGIRIM KONFETI PESTA! Poin +150 & Timer +30s!`
    },

    // Tier 5: 300 - 500 Koin (Cincin, Nasi Tumpeng, Hujan Uang)
    'Diamond Ring': {
        addPoints: 400,
        addTimer: 60,
        action: 'DOUBLE_POINTS',
        label: '💍 Cincin Berlian',
        sound: 'sultan',
        toast: (u) => `💍 SULTAN BESAR @${u} MENGIRIM CINCIN BERLIAN! Poin +400!`
    },
    'Money Rain': {
        addPoints: 500,
        addTimer: 60,
        action: 'DOUBLE_POINTS',
        label: '💸 Hujan Uang',
        sound: 'sultan',
        toast: (u) => `💸 SULTAN @${u} MENGIRIM HUJAN UANG! Bonus Poin +500!`
    },

    // Tier 6: 1.000 - 35.000 Koin (Paus, Singa, Bunderan HI, Universe - DEWA SULTAN)
    'Whale': {
        addPoints: 1000,
        addTimer: 90,
        action: 'SULTAN_TAKEOVER',
        label: '🐋 Paus Biru',
        sound: 'sultan',
        toast: (u) => `🐋 DEWA SULTAN @${u} MENGIRIM PAUS! Auto Juara #1 (+1000 Pts)!`
    },
    'Paus': {
        addPoints: 1000,
        addTimer: 90,
        action: 'SULTAN_TAKEOVER',
        label: '🐋 Paus Biru',
        sound: 'sultan',
        toast: (u) => `🐋 DEWA SULTAN @${u} MENGIRIM PAUS! Auto Juara #1 (+1000 Pts)!`
    },
    'Lion': {
        addPoints: 3000,
        addTimer: 120,
        action: 'SULTAN_TAKEOVER',
        label: '🦁 Singa Emas',
        sound: 'sultan',
        toast: (u) => `🦁 MAHA SULTAN @${u} MENGIRIM SINGA EMAS! PENGUASA LIVE (+3000 Pts)!`
    },
    'Singa': {
        addPoints: 3000,
        addTimer: 120,
        action: 'SULTAN_TAKEOVER',
        label: '🦁 Singa Emas',
        sound: 'sultan',
        toast: (u) => `🦁 MAHA SULTAN @${u} MENGIRIM SINGA EMAS! PENGUASA LIVE (+3000 Pts)!`
    },
    'Jakarta Roundabout': {
        addPoints: 2000,
        addTimer: 100,
        action: 'SULTAN_TAKEOVER',
        label: '🏛️ Bunderan HI',
        sound: 'sultan',
        toast: (u) => `🏛️ SULTAN INDONESIA @${u} MENGIRIM BUNDERAN HI (+2000 Pts)!`
    },
    'TikTok Universe': {
        addPoints: 5000,
        addTimer: 180,
        action: 'SULTAN_TAKEOVER',
        label: '🌌 TikTok Universe',
        sound: 'sultan',
        toast: (u) => `🌌 SULTAN TERTINGGI @${u} MENGIRIM TIKTOK UNIVERSE (+5000 Pts)!`
    }
};

class RewardEngine {
    constructor(gameEngine, io) {
        this.gameEngine = gameEngine;
        this.io = io;
        this.totalLikes = 1250; // Angka awal wajar untuk siaran live aktif
    }

    /**
     * Memproses Like / Tap Layar dari Penonton TikTok
     */
    processLike(likeData) {
        const user = likeData.user || 'Penonton';
        const count = likeData.likeCount || 1;
        this.totalLikes += count;

        this.io.emit('LIKE_EVENT', {
            user: user,
            likeCount: count,
            totalLikes: this.totalLikes
        });
    }

    /**
     * Memproses Follower Baru saat Live Berlangsung
     */
    processFollow(followData) {
        const user = followData.user || 'Sahabat_Baru';
        console.log(`[FOLLOW] @${user} mulai mengikuti siaran!`);

        this.gameEngine.addSultanDonation(user, 5, 'Follower');
        this.io.emit('FOLLOW_EVENT', {
            user: user,
            message: `🌟 @${user} mulai mengikuti siaran live! Terima kasih pejuang CPNS!`
        });
    }

    /**
     * Memproses Share Siaran Live ke Teman / Grup
     */
    processShare(shareData) {
        const user = shareData.user || 'Penyebar_Kebaikan';
        console.log(`[SHARE] @${user} membagikan siaran live!`);

        this.gameEngine.addSultanDonation(user, 10, 'Share');
        this.io.emit('SHARE_EVENT', {
            user: user,
            message: `↗️ @${user} membagikan siaran live ini ke teman-teman!`
        });
    }

    /**
     * Memproses Gift TikTok yang masuk secara dinamis berdasarkan Nama & Koin
     * 100% FAIR PLAY: Gift tidak bisa membeli nilai akademik, tapi membantu komunitas!
     */
    processGift(giftData) {
        const { user, uniqueId, giftName, diamondCount, repeatCount } = giftData;
        const sender = user || uniqueId || 'Sultan_Anonim';
        const coins = diamondCount || 1;
        const count = repeatCount || 1;
        const totalCoins = coins * count;

        console.log(`[REWARD] Gift Diterima: ${sender} -> ${count}x ${giftName} (${totalCoins} koin)`);

        // 1. Cek kecocokan nama langsung di tabel
        let rule = GIFT_RULES[giftName];

        // 2. Jika nama gift belum ada di tabel, klasifikasikan otomatis berdasarkan JUMLAH KOIN:
        if (!rule) {
            if (coins >= 1000) {
                // Tier Dewa Sultan (Paus, Singa, Mobil, Bunderan HI, dll.)
                rule = {
                    addTimer: 15,
                    action: 'SULTAN_TAKEOVER',
                    label: `👑 ${giftName}`,
                    sound: 'sultan',
                    toast: (u) => `👑 MAHA SULTAN @${u} MENGIRIM ${count}x ${giftName}! Pesta 2X Poin & Target Komunitas Meledak!`
                };
            } else if (coins >= 99) {
                // Tier Multiplier 2X Lipat (Kacamata, Mahkota, Cincin)
                rule = {
                    addTimer: 15,
                    action: 'DOUBLE_POINTS',
                    label: `🕶️ ${giftName}`,
                    sound: 'sultan',
                    toast: (u) => `🕶️ SULTAN @${u} MENGIRIM ${count}x ${giftName}! 2X POIN untuk SEMUA PESERTA!`
                };
            } else if (coins >= 25) {
                // Tier Booster Komunitas (Donat, Parfum, Buket Bunga)
                rule = {
                    addTimer: 0,
                    action: 'DOUBLE_POINTS',
                    label: `🍩 ${giftName}`,
                    sound: 'donut',
                    toast: (u) => `🍩 SULTAN @${u} MENGIRIM ${count}x ${giftName}! 2X POIN AKTIF UNTUK SEMUA PESERTA!`
                };
            } else {
                // Tier 1 - 24 Koin (Mawar, Kopi, Jari Hati, dll.)
                rule = {
                    addTimer: Math.min(15, totalCoins * 2),
                    action: '5050',
                    label: `🎁 ${giftName}`,
                    sound: 'rose',
                    toast: (u) => `🎁 @${u} MENGIRIM ${count}x ${giftName}! Bantuan 50:50 Diaktifkan!`
                };
            }
        }

        const timerToAdd = rule.addTimer || 0;

        // 1. Catat ke Papan Peringkat Sultan (Nilai ujian murni tidak tersentuh)
        this.gameEngine.addSultanDonation(sender, totalCoins, giftName);

        // 2. Eksekusi Timer Tambahan (Kolektif dengan Hard Cap)
        if (timerToAdd > 0) {
            this.gameEngine.addTimer(timerToAdd, sender);
        }

        // 3. Eksekusi Aksi Khusus Kolektif
        if (rule.action === '5050') {
            this.gameEngine.trigger5050(sender);
        } else if (rule.action === 'DOUBLE_POINTS') {
            this.gameEngine.setMultiplier(2, sender);
        } else if (rule.action === 'SULTAN_TAKEOVER') {
            this.gameEngine.triggerSultanTakeover(sender, totalCoins);
        }

        // 4. Tampilkan Banner Notifikasi Apresiasi di Layar Kuis
        const message = rule.toast ? rule.toast(sender) : `🎁 SULTAN @${sender} MENGIRIM ${count}x ${giftName}!`;
        this.io.emit('REWARD_GIFT_EVENT', {
            sender: sender,
            giftName: giftName,
            totalCoins: totalCoins,
            message: message,
            sound: rule.sound || 'rose',
            sultanLeaderboard: this.gameEngine.getTopSultans()
        });
    }
}

module.exports = RewardEngine;
