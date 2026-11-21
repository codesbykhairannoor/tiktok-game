const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const VALID_CATEGORIES = ['greetings', 'saweria', 'gift', 'kawaii', 'roast', 'idle', 'custom'];

class VoicePackService {
    constructor(voicepackDir) {
        this.voicepackDir = voicepackDir;
        this.manifestPath = path.join(voicepackDir, 'voicepack.json');
        this.clips = [];
        this.lastUsedByCategory = {};

        if (!fs.existsSync(this.voicepackDir)) {
            fs.mkdirSync(this.voicepackDir, { recursive: true });
        }
        for (const cat of VALID_CATEGORIES) {
            const catDir = path.join(this.voicepackDir, cat);
            if (!fs.existsSync(catDir)) {
                fs.mkdirSync(catDir, { recursive: true });
            }
        }

        this.load();
    }

    load() {
        if (fs.existsSync(this.manifestPath)) {
            try {
                const raw = JSON.parse(fs.readFileSync(this.manifestPath, 'utf8'));
                if (Array.isArray(raw)) {
                    // Filter hanya file yang benar-benar ada
                    this.clips = raw.filter(c => {
                        const filePath = path.join(this.voicepackDir, c.category, c.filename);
                        return fs.existsSync(filePath) && fs.statSync(filePath).size > 500;
                    });
                    return;
                }
            } catch (err) {
                console.warn('[VOICEPACK] Gagal baca manifest, membuat baru:', err.message);
            }
        }
        this.clips = [];
        this.save();
    }

    save() {
        fs.writeFileSync(this.manifestPath, JSON.stringify(this.clips, null, 2));
    }

    list(category = null) {
        if (!category) return this.clips;
        return this.clips.filter(c => c.category === category);
    }

    getCategories() {
        const counts = {};
        for (const cat of VALID_CATEGORIES) counts[cat] = 0;
        for (const clip of this.clips) {
            counts[clip.category] = (counts[clip.category] || 0) + 1;
        }
        return counts;
    }

    getClipFilePath(clip) {
        if (!clip) return null;
        return path.join(this.voicepackDir, clip.category, clip.filename);
    }

    /**
     * Pilih klip acak dari kategori tertentu tanpa mengulang klip terakhir berturut-turut
     */
    pickRandom(category) {
        const pool = this.list(category);
        if (pool.length === 0) return null;

        const lastId = this.lastUsedByCategory[category];
        let candidates = pool;
        if (pool.length > 1 && lastId) {
            candidates = pool.filter(c => c.id !== lastId);
        }

        const picked = candidates[Math.floor(Math.random() * candidates.length)];
        this.lastUsedByCategory[category] = picked.id;
        return {
            ...picked,
            filePath: this.getClipFilePath(picked)
        };
    }

    /**
     * Pilih klip spesial berdasarkan nama Gift TikTok (triger per gift, 0ms latency)
     */
    pickForGift(giftName = '') {
        const g = (giftName || '').toLowerCase();
        const triggerAliases = {
            rose: ['rose', 'mawar', 'bunga'],
            coffee: ['coffee', 'kopi', 'gg', 'tea', 'teh'],
            doughnut: ['doughnut', 'donut', 'donat', 'cake'],
            heart: ['heart', 'love', 'finger', 'hati', 'kiss'],
            icecream: ['ice', 'cream', 'eskrim', 'es krim', 'coklat', 'choco'],
            whale: ['whale', 'paus', 'lion', 'singa', 'galaxy', 'universe', 'sport', 'car', 'castle']
        };

        const matchedKeys = [];
        for (const [key, words] of Object.entries(triggerAliases)) {
            if (words.some(w => g.includes(w))) {
                matchedKeys.push(key);
            }
        }

        let candidates = [];
        if (matchedKeys.length > 0) {
            candidates = this.clips.filter(c => c.giftTrigger && matchedKeys.includes(c.giftTrigger.toLowerCase()));
        }
        if (candidates.length === 0) {
            candidates = this.clips.filter(c => c.category === 'gift' && c.giftTrigger === 'any');
        }
        if (candidates.length === 0) {
            candidates = this.clips.filter(c => c.category === 'gift' && c.giftTrigger);
        }
        if (candidates.length > 0) {
            const lastId = this.lastUsedByCategory['gift_trigger'];
            let pool = (candidates.length > 1 && lastId)
                ? candidates.filter(c => c.id !== lastId)
                : candidates;
            const picked = pool[Math.floor(Math.random() * pool.length)];
            this.lastUsedByCategory['gift_trigger'] = picked.id;
            return {
                ...picked,
                filePath: this.getClipFilePath(picked)
            };
        }

        return this.pickRandom('gift');
    }

    /**
     * Tambah / daftarkan klip baru ke manifest
     */
    addClip({ category, label, text, filename, engine = 'edge-tts', motion = 'Idle', expression = 'happy', giftTrigger = null, repoSource = null }) {
        const safeCat = VALID_CATEGORIES.includes(category) ? category : 'custom';
        const id = 'vp_' + crypto.randomBytes(5).toString('hex');

        const clip = {
            id,
            category: safeCat,
            label: label || text.slice(0, 32),
            text,
            filename,
            audioUrl: `/voicepack/${safeCat}/${filename}`,
            engine,
            motion,
            expression,
            ...(giftTrigger ? { giftTrigger } : {}),
            ...(repoSource ? { repoSource } : {}),
            createdAt: new Date().toISOString()
        };

        this.clips.push(clip);
        this.save();
        return clip;
    }

    deleteClip(id) {
        const idx = this.clips.findIndex(c => c.id === id);
        if (idx === -1) return false;

        const [removed] = this.clips.splice(idx, 1);
        const filePath = this.getClipFilePath(removed);
        if (filePath && fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch { }
        }
        this.save();
        return true;
    }
}

module.exports = VoicePackService;
