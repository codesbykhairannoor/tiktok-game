const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const VOICE_PRESETS = {
    'kawaii-hybrid': {
        label: 'Sasha Kuliah Manis (ja-JP-NanamiNeural)',
        edgeVoice: 'ja-JP-NanamiNeural',
        pitch: '+8Hz',
        rate: '+4%',
        ffmpegFilter: 'highpass=f=100,loudnorm=I=-15:TP=-1.5:LRA=11'
    },
    'manja-pastel': {
        label: 'Sasha Manja Lembut (Remaja Kuliah)',
        edgeVoice: 'ja-JP-NanamiNeural',
        pitch: '+6Hz',
        rate: '+0%',
        ffmpegFilter: 'highpass=f=100,loudnorm=I=-15:TP=-1.5:LRA=11'
    },
    'tsundere-ceria': {
        label: 'Sasha Ceria Kampus (Remaja Kuliah)',
        edgeVoice: 'ja-JP-NanamiNeural',
        pitch: '+11Hz',
        rate: '+8%',
        ffmpegFilter: 'highpass=f=100,loudnorm=I=-15:TP=-1.5:LRA=11'
    },
    'ja-anime': {
        label: 'Japanese Anime Pure (ja-JP-NanamiNeural)',
        edgeVoice: 'ja-JP-NanamiNeural',
        pitch: '+10Hz',
        rate: '+5%',
        ffmpegFilter: 'highpass=f=100,loudnorm=I=-15:TP=-1.5:LRA=11'
    },
    'natural-id': {
        label: 'Natural Santai (id-ID-GadisNeural)',
        edgeVoice: 'id-ID-GadisNeural',
        pitch: '+4Hz',
        rate: '+2%',
        ffmpegFilter: 'highpass=f=90,loudnorm=I=-16:TP=-1.5:LRA=11'
    },
    'male-santai': {
        label: 'Cowok Santai (id-ID-ArdiNeural)',
        edgeVoice: 'id-ID-ArdiNeural',
        pitch: '+0Hz',
        rate: '+4%',
        ffmpegFilter: 'highpass=f=85,loudnorm=I=-16:TP=-1.5:LRA=11'
    }
};

class TTSService {
    constructor(audioDir, voice = 'ja-JP-NanamiNeural', preset = 'kawaii-hybrid') {
        this.audioDir = audioDir;
        this.voice = voice;
        this.preset = preset;
        this.hasFfmpeg = null;
        this.speakCounter = 0;

        if (!fs.existsSync(this.audioDir)) {
            fs.mkdirSync(this.audioDir, { recursive: true });
        }

        // Bersihkan file audio temp lama saat startup
        this.cleanupOldAudio(180 * 1000);
    }

    setVoiceConfig(voice, preset) {
        if (voice) this.voice = voice;
        if (preset && VOICE_PRESETS[preset]) this.preset = preset;
    }

    getPresets() {
        return Object.entries(VOICE_PRESETS).map(([id, p]) => ({ id, label: p.label, edgeVoice: p.edgeVoice }));
    }

    async checkFfmpeg() {
        if (this.hasFfmpeg !== null) return this.hasFfmpeg;
        try {
            await execFileAsync('ffmpeg', ['-version'], { timeout: 3000 });
            this.hasFfmpeg = true;
        } catch {
            this.hasFfmpeg = false;
        }
        return this.hasFfmpeg;
    }

    /**
     * Hapus file speech_*.mp3 sementara yang usianya melebihi maxAgeMs
     */
    cleanupOldAudio(maxAgeMs = 180 * 1000) {
        try {
            const now = Date.now();
            const files = fs.readdirSync(this.audioDir);
            for (const file of files) {
                if (!file.startsWith('speech_') || !file.endsWith('.mp3')) continue;
                const fullPath = path.join(this.audioDir, file);
                const stat = fs.statSync(fullPath);
                if (stat.size === 0 || (now - stat.mtimeMs) > maxAgeMs) {
                    fs.unlinkSync(fullPath);
                }
            }
        } catch (err) {
            // Abaikan error cleanup ringan
        }
    }

    /**
     * Bersihkan teks dari emoji, tag aksi, atau karakter aneh sebelum TTS
     */
    cleanText(rawText) {
        if (!rawText) return '';
        return rawText
            .replace(/\*[^*]+\*/g, '')
            .replace(/\[[^\]]+\]/g, '')
            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu, '')
            .replace(/https?:\/\/\S+/g, '')
            .replace(/[~〜]+/g, 'ー')
            .replace(/[…]+/g, '、')
            .replace(/\bkakak\b/gi, 'kaka')
            .replace(/\bmakasih\b/gi, 'makasii')
            .replace(/\bbanyak\b/gi, 'banyaa')
            .replace(/!+(?=\s+\S)/g, ',')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Ubah angka menjadi kata Bahasa Indonesia agar mudah dibaca menjadi Hiragana
     */
    _numberToIndoWords(num) {
        const n = parseInt(num, 10);
        if (!Number.isFinite(n) || n < 0) return '';
        if (n === 0) return 'nol';
        const ones = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
        const convert = (val) => {
            if (val < 10) return ones[val];
            if (val === 10) return 'sepuluh';
            if (val === 11) return 'sebelas';
            if (val < 20) return ones[val - 10] + ' belas';
            if (val < 100) return ones[Math.floor(val / 10)] + ' puluh' + (val % 10 ? ' ' + convert(val % 10) : '');
            if (val < 200) return 'seratus' + (val % 100 ? ' ' + convert(val % 100) : '');
            if (val < 1000) return ones[Math.floor(val / 100)] + ' ratus' + (val % 100 ? ' ' + convert(val % 100) : '');
            if (val < 2000) return 'seribu' + (val % 1000 ? ' ' + convert(val % 1000) : '');
            if (val < 1000000) return convert(Math.floor(val / 1000)) + ' ribu' + (val % 1000 ? ' ' + convert(val % 1000) : '');
            return convert(Math.floor(val / 1000000)) + ' juta' + (val % 1000000 ? ' ' + convert(val % 1000000) : '');
        };
        return convert(n);
    }

    /**
     * Konversi teks Bahasa Indonesia menjadi Hiragana kontinu (tanpa spasi / glottal stop ッ)
     * agar ja-JP-NanamiNeural membacanya dengan intonasi anime Indonesia-Jepang yang mulus.
     */
    indonesianToHiragana(rawText) {
        if (!rawText) return '';

        let s = String(rawText).toLowerCase();
        s = s
            .replace(/rp\.?\s*(\d[\d.]*)/gi, (_, d) => 'rupiah ' + this._numberToIndoWords(d.replace(/\./g, '')))
            .replace(/(\d+)\.(\d{3})(?!\d)/g, (_, a, b) => this._numberToIndoWords(a + b))
            .replace(/\d+/g, (d) => ' ' + this._numberToIndoWords(d) + ' ')
            .replace(/[_/\\|]+/g, ' ')
            .replace(/[~]+/g, 'ー');

        // Normalisasi frase & kata umum ke Katakana/Kanji/Hiragana dengan intonasi seiyuu natural
        const phraseDict = [
            [/\bterima\s+kasih\b/gi, 'マカシー'],
            [/\bselamat\s+datang\b/gi, 'スラマット ダタン'],
            [/\bselamat\s+malam\b/gi, 'スラマット マラム'],
            [/\bselamat\s+pagi\b/gi, 'スラマット パギ'],
            [/\bselamat\s+siang\b/gi, 'スラマット シアン'],
            [/\bmakasii+\b|\bmakasih\b/gi, 'マカシー'],
            [/\bbanyaa+\b|\bbanyak\b/gi, 'ばにゃー'],
            [/\bkakak\b|\bkaka\b|\bkak\b/gi, 'カカ'],
            [/\bsayang\b/gi, 'さやん'],
            [/\bsultan\b/gi, 'スータン'],
            [/\bbangee+t\b|\bbanget\b/gi, 'ばんげー'],
            [/\bsenang\b|\bseneng\b/gi, 'スナン'],
            [/\bsemangat\b/gi, 'スマンガット'],
            [/\bdaisuki\b/gi, '大好きー'],
            [/\bureshii+\b/gi, '嬉しい'],
            [/\bsugoi+\b/gi, 'すごい'],
            [/\bkyaa+\b/gi, 'きゃあー'],
            [/\buwaa+\b|\bwaa+\b/gi, 'うわあ'],
            [/\behehe+\b|\behe+\b/gi, 'えへへ'],
            [/\bufufu+\b/gi, 'うふふ'],
            [/\bhalo+\b|\bhai+\b/gi, 'ハロー'],
            [/\blive\b/gi, 'ライブ'],
            [/\bkonnichiwa\b/gi, 'こんにちは'],
            [/\bkonbanwa\b/gi, 'こんばんは'],
            [/\bohayou\b/gi, 'おはよう'],
            [/\botsukaresama\b/gi, 'おつかれさま'],
            [/\bkawaii\b/gi, 'かわいい'],
            [/\baishiteru\b/gi, 'あいしてるー'],
            [/\bminna\b/gi, 'みんな'],
            [/\bganbatte\b/gi, 'がんばって'],
            [/\bgomen\s*ne\b/gi, 'ごめんね'],
            [/\bmata\s*ne\b/gi, 'またねー'],
            [/\bkopi\b/gi, 'コーヒー'],
            [/\bmawar\b/gi, 'まわる'],
            [/\bdonat\b/gi, 'ドーナツ'],
            [/\bkuliah\b/gi, 'クリアー'],
            [/\bngampus\b/gi, 'ンガンプス'],
            [/\bnugas\b/gi, 'ヌガス'],
            [/\bsasha\b|\bsasya\b/gi, 'サーシャ'],
            [/\bnita\b/gi, 'サーシャ'],
            [/\bsaweran\b|\bsaweria\b/gi, 'サウェラン'],
            [/\bkacamata\b/gi, 'メガネ'],
            [/\bblonde\b/gi, 'ブロンド'],
            [/\barigatou\b/gi, 'ありがとう'],
            [/\bmahasiswi\b/gi, 'マハシスウィ'],
            [/\bhihi+\b|\bwkwk+\b/gi, 'ひひ'],
            [/\buwu+\b/gi, 'うう']
        ];
        for (const [re, rep] of phraseDict) {
            s = s.replace(re, rep);
        }

        const digraphVowels = {
            nya: 'にゃ', nyi: 'にぃ', nyu: 'にゅ', nye: 'にぇ', nyo: 'にょ',
            sya: 'しゃ', syi: 'し', syu: 'しゅ', sye: 'しぇ', syo: 'しょ',
            sha: 'しゃ', shi: 'し', shu: 'しゅ', she: 'しぇ', sho: 'しょ',
            cha: 'ちゃ', chi: 'ち', chu: 'ちゅ', che: 'ちぇ', cho: 'ちょ',
            nga: 'んが', ngi: 'んぎ', ngu: 'んぐ', nge: 'んげ', ngo: 'んご',
            kya: 'きゃ', kyu: 'きゅ', kyo: 'きょ',
            gya: 'ぎゃ', gyu: 'ぎゅ', gyo: 'ぎょ',
            hya: 'ひゃ', hyu: 'ひゅ', hyo: 'ひょ',
            mya: 'みゃ', myu: 'みゅ', myo: 'みょ',
            rya: 'りゃ', ryu: 'りゅ', ryo: 'りょ',
            bya: 'びゃ', byu: 'びゅ', byo: 'びょ',
            pya: 'ぴゃ', pyu: 'ぴゅ', pyo: 'ぴょ'
        };

        const cvMap = {
            ka: 'か', ki: 'き', ku: 'く', ke: 'け', ko: 'こ',
            sa: 'さ', si: 'し', su: 'す', se: 'せ', so: 'そ',
            ta: 'た', ti: 'てぃ', tu: 'とぅ', te: 'て', to: 'と',
            na: 'な', ni: 'に', nu: 'ぬ', ne: 'ね', no: 'の',
            ha: 'は', hi: 'ひ', hu: 'ふ', he: 'へ', ho: 'ほ',
            ma: 'ま', mi: 'み', mu: 'む', me: 'め', mo: 'も',
            ya: 'や', yi: 'い', yu: 'ゆ', ye: 'いぇ', yo: 'よ',
            ra: 'ら', ri: 'り', ru: 'る', re: 'れ', ro: 'ろ',
            wa: 'わ', wi: 'うぃ', wu: 'う', we: 'うぇ', wo: 'を',
            ga: 'が', gi: 'ぎ', gu: 'ぐ', ge: 'げ', go: 'ご',
            za: 'ざ', zi: 'じ', zu: 'ず', ze: 'ぜ', zo: 'ぞ',
            ja: 'じゃ', ji: 'じ', ju: 'じゅ', je: 'じぇ', jo: 'じょ',
            da: 'だ', di: 'でぃ', du: 'どぅ', de: 'で', do: 'ど',
            ba: 'ば', bi: 'び', bu: 'ぶ', be: 'べ', bo: 'ぼ',
            pa: 'ぱ', pi: 'ぴ', pu: 'ぷ', pe: 'ぺ', po: 'ぽ',
            fa: 'ふぁ', fi: 'ふぃ', fu: 'ふ', fe: 'ふぇ', fo: 'ふぉ',
            la: 'ら', li: 'り', lu: 'る', le: 'れ', lo: 'ろ',
            va: 'ば', vi: 'び', vu: 'ぶ', ve: 'べ', vo: 'ぼ',
            ca: 'ちゃ', ci: 'ち', cu: 'ちゅ', ce: 'ちぇ', co: 'ちょ',
            xa: 'くさ', xi: 'くし', xu: 'くす', xe: 'くせ', xo: 'くそ',
            qa: 'くぁ', qi: 'き', qu: 'く', qe: 'け', qo: 'こ'
        };

        const vowelMap = { a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お' };
        const soloConsonant = {
            n: 'ん', m: 'ん', r: 'る', s: 'す', l: 'る',
            b: 'ぶ', d: 'ど', g: 'ぐ', j: 'じ', c: 'ち',
            f: 'ふ', p: 'ぷ', v: 'ぶ', w: 'う', y: 'い', z: 'ず', x: 'くす', q: 'く'
        };

        const punctMap = { ',': '、', '.': '。', '!': '！', '?': '？' };
        const parts = s.match(/[a-z]+|[\u3040-\u30FF\u4E00-\u9FAFー]+|[,!.?]/g) || [];
        let out = '';

        for (const token of parts) {
            if (punctMap[token]) {
                out += punctMap[token];
                continue;
            }
                if (/^[\u3040-\u30FF\u4E00-\u9FAFー]+$/.test(token)) {
                    out += (out && !/[、。！？\s]$/.test(out) ? ' ' : '') + token.replace(/ッ/g, '');
                    continue;
                }

                let wordStr = '';
                let i = 0;
                while (i < token.length) {
                    const sub3 = token.slice(i, i + 3);
                    if (sub3.length === 3 && digraphVowels[sub3]) {
                        wordStr += digraphVowels[sub3];
                        i += 3;
                        continue;
                    }
                    const sub2 = token.slice(i, i + 2);
                    if (sub2 === 'ng') {
                        wordStr += 'ん';
                        i += 2;
                        continue;
                    }
                    if (sub2.length === 2 && cvMap[sub2]) {
                        wordStr += cvMap[sub2];
                        i += 2;
                        continue;
                    }

                    const ch = token[i];
                    if (vowelMap[ch]) {
                        wordStr += vowelMap[ch];
                        i += 1;
                        continue;
                    }

                    const isWordEnd = i === token.length - 1;
                    if (ch === 'k') {
                        const prev = i > 0 ? token[i - 1] : '';
                        wordStr += (isWordEnd && vowelMap[prev]) ? 'ー' : 'く';
                    } else if (ch === 't') {
                        wordStr += isWordEnd ? 'っと' : 'と';
                    } else if (ch === 'h') {
                        wordStr += 'ー';
                    } else if (soloConsonant[ch]) {
                        wordStr += soloConsonant[ch];
                    }
                    i += 1;
                }
                out += (out && !/[、。！？\s]$/.test(out) ? ' ' : '') + wordStr;
            }

            return out
                .replace(/[ \t]+/g, ' ')
                .replace(/\s*([、。！？])\s*/g, '$1')
                .replace(/、{2,}/g, '、')
                .replace(/。{2,}/g, '。')
                .replace(/^[、。！？\s]+/, '')
                .trim();
        }

    /**
     * Generate raw MP3 via Edge-TTS
     */
    async synthesizeEdgeRaw(text, outPath, voiceOverride = null, pitchOverride = null, rateOverride = null) {
            const presetCfg = VOICE_PRESETS[this.preset] || VOICE_PRESETS['kawaii-hybrid'];
            const chosenVoice = voiceOverride || this.voice || presetCfg.edgeVoice;
            const chosenPitch = pitchOverride || presetCfg.pitch;
            const chosenRate = rateOverride || presetCfg.rate;

            const synthText = (chosenVoice.startsWith('ja-JP-') && /[a-zA-Z]/.test(text))
                ? (this.indonesianToHiragana(text) || text)
                : text;

            const tts = new MsEdgeTTS();
            await tts.setMetadata(chosenVoice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

            return new Promise((resolve, reject) => {
                try {
                    const { audioStream } = tts.toStream(synthText, {
                        pitch: chosenPitch,
                        rate: chosenRate
                    });
                    const writeStream = fs.createWriteStream(outPath);
                    audioStream.pipe(writeStream);

                    writeStream.on('finish', () => resolve(outPath));
                    writeStream.on('error', reject);
                    audioStream.on('error', reject);
                } catch (err) {
                    reject(err);
                }
            });
        }

    /**
     * Polish audio dengan FFmpeg EQ + Kompresor + Loudnorm (opsional stitch intro clip)
     */
    async polishAndSave(rawSpeechPath, finalPath, introClipPath = null) {
            const ffmpegOk = await this.checkFfmpeg();
            if (!ffmpegOk) {
                fs.copyFileSync(rawSpeechPath, finalPath);
                return finalPath;
            }

            const presetCfg = VOICE_PRESETS[this.preset] || VOICE_PRESETS['kawaii-hybrid'];
            const filterChain = presetCfg.ffmpegFilter || 'loudnorm=I=-16:TP=-1.5:LRA=11';

            try {
                if (introClipPath && fs.existsSync(introClipPath)) {
                    // Stitch intro voicepack + speech dalam 1 file mulus
                    await execFileAsync('ffmpeg', [
                        '-y',
                        '-i', introClipPath,
                        '-i', rawSpeechPath,
                        '-filter_complex',
                        `[0:a]aresample=24000,aformat=sample_fmts=fltp:channel_layouts=mono,loudnorm=I=-16:TP=-1.5:LRA=11[a0];` +
                        `[1:a]aresample=24000,aformat=sample_fmts=fltp:channel_layouts=mono,${filterChain}[a1];` +
                        `[a0][a1]concat=n=2:v=0:a=1[out]`,
                        '-map', '[out]',
                        '-c:a', 'libmp3lame',
                        '-b:a', '128k',
                        finalPath
                    ], { timeout: 15000 });
                } else {
                    await execFileAsync('ffmpeg', [
                        '-y',
                        '-i', rawSpeechPath,
                        '-af', filterChain,
                        '-c:a', 'libmp3lame',
                        '-b:a', '128k',
                        finalPath
                    ], { timeout: 12000 });
                }
                return finalPath;
            } catch (err) {
                console.warn('[TTS] FFmpeg polish fallback ke raw audio:', err.message);
                fs.copyFileSync(rawSpeechPath, finalPath);
                return finalPath;
            }
        }

    /**
     * Konversi teks menjadi file MP3 (mendukung optional introClipPath dari Voice Pack!)
     */
    async speak(text, options = {}) {
            const cleaned = this.cleanText(text);
            if (!cleaned) return null;

            this.speakCounter++;
            if (this.speakCounter % 10 === 0) {
                this.cleanupOldAudio(180 * 1000);
            }

            const hash = crypto.createHash('md5').update(cleaned + Date.now() + Math.random()).digest('hex').slice(0, 12);
            const rawFilename = `raw_${hash}.mp3`;
            const finalFilename = `speech_${hash}.mp3`;
            const rawPath = path.join(this.audioDir, rawFilename);
            const finalPath = path.join(this.audioDir, finalFilename);

            try {
                await this.synthesizeEdgeRaw(
                    cleaned,
                    rawPath,
                    options.voice || null,
                    options.pitch || null,
                    options.rate || null
                );

                await this.polishAndSave(rawPath, finalPath, options.introClipPath || null);

                // Hapus file mentah sementara
                if (fs.existsSync(rawPath)) {
                    try { fs.unlinkSync(rawPath); } catch { }
                }

                return {
                    audioUrl: `/audio/${finalFilename}`,
                    cleanText: cleaned,
                    filename: finalFilename,
                    filePath: finalPath
                };
            } catch (err) {
                console.error('[TTS] ⚠️ Gagal sintesis audio:', err.message);
                if (fs.existsSync(rawPath)) {
                    try { fs.unlinkSync(rawPath); } catch { }
                }
                return null;
            }
        }

    /**
     * Bake klip permanen ke target path (untuk Voice Pack puluhan suara)
     */
    async bakeClip({ text, targetPath, voice = null, pitch = null, rate = null, useKokoro = false, kokoroVoice = 'jf_alpha' }) {
            const cleaned = this.cleanText(text);
            if (!cleaned) throw new Error('Teks kosong');

            const dir = path.dirname(targetPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            const tmpRaw = targetPath + '.tmp.mp3';

            if (useKokoro) {
                const tmpWav = targetPath + '.tmp.wav';
                const venvPython = path.join(__dirname, '..', 'tts_venv', 'Scripts', 'python.exe');
                const kokoroScript = path.join(__dirname, '..', 'scripts', 'kokoro_tts.py');
                if (!fs.existsSync(venvPython) || !fs.existsSync(kokoroScript)) {
                    throw new Error('Kokoro-ONNX venv belum siap');
                }
                await execFileAsync(venvPython, [kokoroScript, '--text', cleaned, '--voice', kokoroVoice, '--out', tmpWav], { timeout: 60000 });
                await execFileAsync('ffmpeg', [
                    '-y', '-i', tmpWav,
                    '-af', 'highpass=f=110,loudnorm=I=-15:TP=-1.5:LRA=11',
                    '-c:a', 'libmp3lame', '-b:a', '128k',
                    targetPath
                ], { timeout: 15000 });
                if (fs.existsSync(tmpWav)) fs.unlinkSync(tmpWav);
                return targetPath;
            }

            await this.synthesizeEdgeRaw(cleaned, tmpRaw, voice, pitch, rate);
            await this.polishAndSave(tmpRaw, targetPath, null);
            if (fs.existsSync(tmpRaw)) fs.unlinkSync(tmpRaw);
            return targetPath;
        }
    }

module.exports = TTSService;
