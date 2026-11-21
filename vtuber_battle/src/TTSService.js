const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

class TTSService {
    constructor(audioDir, voice = 'ja-JP-NanamiNeural', pitch = '+8Hz', rate = '+4%') {
        this.audioDir = audioDir;
        this.voice = voice;
        this.pitch = pitch;
        this.rate = rate;
        this.hasFfmpeg = null;
        this.speakCounter = 0;

        if (!fs.existsSync(this.audioDir)) {
            fs.mkdirSync(this.audioDir, { recursive: true });
        }
        this.cleanupOldAudio(180 * 1000);
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
        } catch { }
    }

    cleanText(rawText) {
        if (!rawText) return '';
        return rawText
            .replace(/\*[^*]+\*/g, '')
            .replace(/\[[^\]]+\]/g, '')
            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu, '')
            .replace(/https?:\/\/\S+/g, '')
            .replace(/[_/\\|]+/g, ' ')
            .replace(/[~〜]+/g, 'ー')
            .replace(/[…]+/g, '、')
            .replace(/!+(?=\s+\S)/g, ',')
            .replace(/\s+/g, ' ')
            .trim();
    }

    indonesianToPhonetics(rawText) {
        if (!rawText) return '';

        let s = String(rawText).toLowerCase();
        s = s
            .replace(/rp\.?\s*(\d[\d.]*)/gi, (_, d) => 'rupiah ' + d.replace(/\./g, ''))
            .replace(/[_/\\|]+/g, ' ')
            .replace(/[~〜]+/g, 'ー');

        const phraseDict = [
            [/\bterima\s+kasih\b/gi, 'マカシー'],
            [/\bselamat\s+datang\b/gi, 'スラマット ダタン'],
            [/\bmakasii+\b|\bmakasih\b/gi, 'マカシー'],
            [/\bbanyaa+\b|\bbanyak\b/gi, 'ばにゃー'],
            [/\bkakak\b|\bkaka\b|\bkak\b/gi, 'カカ'],
            [/\bsayang\b/gi, 'さやん'],
            [/\bsultan\b/gi, 'スータン'],
            [/\bbangee+t\b|\bbanget\b/gi, 'ばんげー'],
            [/\bbaginda\b/gi, 'バギンダ'],
            [/\btahta\b/gi, 'タハタ'],
            [/\braja\b/gi, 'ラジャ'],
            [/\bmahkota\b/gi, 'マホコタ'],
            [/\btendang\b|\bnendang\b/gi, 'テンダン'],
            [/\bkalah\b/gi, 'カラー'],
            [/\bmenang\b/gi, 'メナン'],
            [/\bampun\b/gi, 'アンプン'],
            [/\bsemangat\b/gi, 'スマンガット'],
            [/\bsenang\b|\bseneng\b/gi, 'スナン'],
            [/\bdaisuki\b/gi, '大好きー'],
            [/\bureshii+\b/gi, '嬉しい'],
            [/\bsugoi+\b/gi, 'すごい'],
            [/\bkyaa+\b/gi, 'きゃあー'],
            [/\buwaa+\b|\bwaa+\b/gi, 'うわあ'],
            [/\behehe+\b|\behe+\b/gi, 'えへへ'],
            [/\bhalo+\b|\bhai+\b/gi, 'ハロー'],
            [/\blive\b/gi, 'ライブ'],
            [/\bmika\b|\bmikachan\b/gi, 'ミカ'],
            [/\bsasha\b|\bsasya\b/gi, 'ミカ'],
            [/\bnita\b/gi, 'ミカ'],
            [/\bkopi\b/gi, 'コーヒー'],
            [/\bdonat\b/gi, 'ドーナツ'],
            [/\bmawar\b/gi, 'まわる'],
            [/\bpaus\b/gi, 'パウス'],
            [/\bsinggasana\b/gi, 'シンガサナ'],
            [/\barigatou\b/gi, 'ありがとう']
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
            kya: 'きゃ', kyu: 'きゅ', kyo: 'きょ'
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
            la: 'ら', li: 'り', lu: 'る', le: 'れ', lo: 'ろ'
        };

        const vowelMap = { a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お' };
        const soloConsonant = {
            n: 'ん', m: 'ん', r: 'る', s: 'す', l: 'る',
            b: 'ぶ', d: 'ど', g: 'ぐ', j: 'じ', c: 'ち',
            f: 'ふ', p: 'ぷ', v: 'ぶ', w: 'う', y: 'い', z: 'ず'
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

    async synthesizeEdgeRaw(text, outPath) {
        const synthText = /[a-zA-Z]/.test(text)
            ? (this.indonesianToPhonetics(text) || text)
            : text;

        const tts = new MsEdgeTTS();
        await tts.setMetadata(this.voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

        return new Promise((resolve, reject) => {
            try {
                const { audioStream } = tts.toStream(synthText, {
                    pitch: this.pitch,
                    rate: this.rate
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

    async polishAndSave(rawSpeechPath, finalPath) {
        const ffmpegOk = await this.checkFfmpeg();
        if (!ffmpegOk) {
            fs.copyFileSync(rawSpeechPath, finalPath);
            return finalPath;
        }
        try {
            await execFileAsync('ffmpeg', [
                '-y',
                '-i', rawSpeechPath,
                '-af', 'highpass=f=100,loudnorm=I=-15:TP=-1.5:LRA=11',
                '-ar', '24000',
                '-ac', '1',
                '-c:a', 'libmp3lame',
                '-b:a', '128k',
                finalPath
            ], { timeout: 12000 });
            return finalPath;
        } catch {
            fs.copyFileSync(rawSpeechPath, finalPath);
            return finalPath;
        }
    }

    async speak(text) {
        const cleaned = this.cleanText(text);
        if (!cleaned) return null;

        this.speakCounter++;
        if (this.speakCounter % 10 === 0) {
            this.cleanupOldAudio(180 * 1000);
        }

        const hash = crypto.createHash('md5').update(cleaned + Date.now() + Math.random()).digest('hex').slice(0, 10);
        const rawFilename = `raw_${hash}.mp3`;
        const finalFilename = `speech_${hash}.mp3`;
        const rawPath = path.join(this.audioDir, rawFilename);
        const finalPath = path.join(this.audioDir, finalFilename);

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                await this.synthesizeEdgeRaw(cleaned, rawPath);
                await this.polishAndSave(rawPath, finalPath);
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
                if (fs.existsSync(rawPath)) {
                    try { fs.unlinkSync(rawPath); } catch { }
                }
                if (attempt === 3) {
                    console.error('[TTS] Gagal sintesis:', err.message);
                    return null;
                }
                await new Promise((r) => setTimeout(r, 1500));
            }
        }
        return null;
    }
}

module.exports = TTSService;
