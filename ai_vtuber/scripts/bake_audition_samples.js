const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const TTSService = require('../src/TTSService');
const VoicePackService = require('../src/VoicePackService');

const execFileAsync = promisify(execFile);

const baseDir = path.join(__dirname, '..');
const audioDir = path.join(baseDir, 'public', 'audio');
const voicepackDir = path.join(baseDir, 'public', 'voicepack');
const venvPython = path.join(baseDir, 'tts_venv', 'Scripts', 'python.exe');
const kokoroScript = path.join(baseDir, 'scripts', 'kokoro_tts.py');

const tts = new TTSService(audioDir, 'id-ID-GadisNeural', 'kawaii-hybrid');
const vp = new VoicePackService(voicepackDir);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const AUDITION_SAMPLES = [
    {
        num: 1,
        type: 'voicevox',
        speaker: 0,
        category: 'gift',
        label: '[AUDISI METAN #1] Gift Mawar (Metan Sweet)',
        repoSource: 'VOICEVOX/voicevox (Speaker 0: Shikoku Metan Sweet)',
        jpText: 'きゃあー、まかしーばにゃーまわるめらーにゃ、かかさやん、にたすなんばんげー、だいすきよー',
        displayText: 'Kyaa~, makasii banyaa mawar merahnya kaka sayang, Nita seneng bangeet, daisuki yo~!',
        giftTrigger: 'rose',
        motion: 'Jump',
        expression: 'happy',
        engine: 'voicevox-metan'
    },
    {
        num: 2,
        type: 'voicevox',
        speaker: 0,
        category: 'gift',
        label: '[AUDISI METAN #2] Gift Donat & Es Krim (Metan Sweet)',
        repoSource: 'VOICEVOX/voicevox (Speaker 0: Shikoku Metan Sweet)',
        jpText: 'わあー、あしーくだぱっとどなっとさまえすくりむ、まかしーやーかかすーたん',
        displayText: 'Waa~, asiiik dapet donat sama es krim, makasii yaa kaka sultan!',
        giftTrigger: 'doughnut',
        motion: 'Clapping',
        expression: 'happy',
        engine: 'voicevox-metan'
    },
    {
        num: 3,
        type: 'voicevox',
        speaker: 0,
        category: 'saweria',
        label: '[AUDISI METAN #3] Saweria / Sultan (Metan Sweet)',
        repoSource: 'VOICEVOX/voicevox (Speaker 0: Shikoku Metan Sweet)',
        jpText: 'えへへ、にたじゃでぃどぅぐどぅぐにーだぱっとさうぇらん、まかしーばにゃーかかさやん、あいしてるよー',
        displayText: 'Ehehe, Nita jadi deg-degan nih dapet saweran, makasii banyaa kaka sayang, aishiteru yo~!',
        giftTrigger: 'whale',
        motion: 'Blush',
        expression: 'happy',
        engine: 'voicevox-metan'
    },
    {
        num: 4,
        type: 'nanami',
        voice: 'ja-JP-NanamiNeural',
        pitch: '+12Hz',
        rate: '+5%',
        category: 'gift',
        label: '[AUDISI NANAMI #1] Gift Heart (JA Nanami)',
        repoSource: 'rany2/edge-tts (ja-JP-NanamiNeural +12Hz/+5%)',
        jpText: 'うわあ、うれしい！まかしーばにゃーはーとにゃ、かかさやん、だいすきー！',
        displayText: 'Uwaa ureshii! Makasii banyaa heart-nya kaka sayang, daisuki~!',
        giftTrigger: 'heart',
        motion: 'Blush',
        expression: 'happy',
        engine: 'edge-ja-soft'
    },
    {
        num: 5,
        type: 'nanami',
        voice: 'ja-JP-NanamiNeural',
        pitch: '+12Hz',
        rate: '+5%',
        category: 'gift',
        label: '[AUDISI NANAMI #2] Gift Paus Sultan (JA Nanami)',
        repoSource: 'rany2/edge-tts (ja-JP-NanamiNeural +12Hz/+5%)',
        jpText: 'きゃあー、すごーい！まかしーばにゃーぱうすにゃ、かかすーたん、にたさやんかむー！',
        displayText: 'Kyaa sugoi! Makasii banyaa pausnya kaka sultan, Nita sayang kamu~!',
        giftTrigger: 'whale',
        motion: 'Jump',
        expression: 'happy',
        engine: 'edge-ja-soft'
    },
    {
        num: 6,
        type: 'nanami',
        voice: 'ja-JP-NanamiNeural',
        pitch: '+12Hz',
        rate: '+5%',
        category: 'greetings',
        label: '[AUDISI NANAMI #3] Sapaan Masuk (JA Nanami)',
        repoSource: 'rany2/edge-tts (ja-JP-NanamiNeural +12Hz/+5%)',
        jpText: 'えへへ、はろーかかさやん、すらまっとだたんやー、じゃんがんるぱたっぷたっぷらいやるー！',
        displayText: 'Ehehe, halo kaka sayang, selamat datang yaa, jangan lupa tap-tap layar~!',
        giftTrigger: 'any',
        motion: 'Goodbye',
        expression: 'happy',
        engine: 'edge-ja-soft'
    }
];

async function curlJson(url) {
    const { stdout } = await execFileAsync('curl.exe', ['-sS', '--max-time', '20', url], { timeout: 25000 });
    return JSON.parse(stdout);
}

async function synthVoicevox(item, targetPath) {
    const synthUrl = `https://api.tts.quest/v3/voicevox/synthesis?speaker=${item.speaker}&text=${encodeURIComponent(item.jpText)}`;
    const init = await curlJson(synthUrl);
    if (!init.success || !init.audioStatusUrl || !init.mp3DownloadUrl) {
        throw new Error(`VOICEVOX init gagal: ${JSON.stringify(init)}`);
    }

    let ready = false;
    for (let i = 0; i < 35; i++) {
        await sleep(1000);
        try {
            const st = await curlJson(init.audioStatusUrl);
            if (st.isAudioError) throw new Error('VOICEVOX status isAudioError');
            if (st.isAudioReady) {
                ready = true;
                break;
            }
        } catch (err) {
            if (i === 34) throw err;
        }
    }
    if (!ready) throw new Error('VOICEVOX timeout menunggu audioStatusUrl');

    const tmpRaw = targetPath + '.vv.mp3';
    await execFileAsync('curl.exe', ['-sSL', '--max-time', '30', '-o', tmpRaw, init.mp3DownloadUrl], { timeout: 35000 });
    if (!fs.existsSync(tmpRaw) || fs.statSync(tmpRaw).size < 1000) {
        throw new Error('File download VOICEVOX kosong/terlalu kecil');
    }

    await execFileAsync('ffmpeg', [
        '-y', '-i', tmpRaw,
        '-af', 'highpass=f=100,loudnorm=I=-15:TP=-1.5:LRA=11',
        '-ar', '24000', '-ac', '1',
        '-c:a', 'libmp3lame', '-b:a', '128k',
        targetPath
    ], { timeout: 20000 });

    if (fs.existsSync(tmpRaw)) fs.unlinkSync(tmpRaw);
}

async function synthKokoro(item, targetPath) {
    if (!fs.existsSync(venvPython) || !fs.existsSync(kokoroScript)) {
        throw new Error('Kokoro venv/script tidak ditemukan');
    }
    const tmpWav = targetPath + '.kokoro.wav';
    await execFileAsync(venvPython, [
        kokoroScript,
        '--text', item.displayText,
        '--voice', item.kokoroVoice,
        '--lang', item.lang || 'id',
        '--speed', item.speed || '1.06',
        '--out', tmpWav
    ], { timeout: 60000 });

    await execFileAsync('ffmpeg', [
        '-y', '-i', tmpWav,
        '-af', item.af || 'highpass=f=110,loudnorm=I=-15:TP=-1.5:LRA=11',
        '-ar', '24000', '-ac', '1',
        '-c:a', 'libmp3lame', '-b:a', '128k',
        targetPath
    ], { timeout: 20000 });

    if (fs.existsSync(tmpWav)) fs.unlinkSync(tmpWav);
}

async function synthEdgeMultilingual(item, targetPath) {
    const tmpRaw = targetPath + '.edge.mp3';
    let afFilter = item.af;

    try {
        await tts.synthesizeEdgeRaw(item.displayText, tmpRaw, item.voice, item.pitch, item.rate);
        if (!fs.existsSync(tmpRaw) || fs.statSync(tmpRaw).size < 500) {
            throw new Error('Output Edge multilingual terlalu kecil');
        }
    } catch (err) {
        console.warn(`[AUDISI] ⚠️ ${item.voice} gagal (${err.message}), fallback ke ${item.fallbackVoice} + pitch shift...`);
        await tts.synthesizeEdgeRaw(item.fallbackText, tmpRaw, item.fallbackVoice, '+14Hz', '+8%');
        afFilter = 'asetrate=24000*1.12,aresample=24000,atempo=0.95,' + item.af;
    }

    await execFileAsync('ffmpeg', [
        '-y', '-i', tmpRaw,
        '-af', afFilter,
        '-ar', '24000', '-ac', '1',
        '-c:a', 'libmp3lame', '-b:a', '128k',
        targetPath
    ], { timeout: 20000 });

    if (fs.existsSync(tmpRaw)) fs.unlinkSync(tmpRaw);
}

async function synthNanami(item, targetPath) {
    const tmpRaw = targetPath + '.nanami.mp3';
    await tts.synthesizeEdgeRaw(
        item.jpText,
        tmpRaw,
        item.voice || 'ja-JP-NanamiNeural',
        item.pitch || '+12Hz',
        item.rate || '+5%'
    );
    if (!fs.existsSync(tmpRaw) || fs.statSync(tmpRaw).size < 500) {
        throw new Error('Output Edge Nanami kosong/terlalu kecil');
    }

    await execFileAsync('ffmpeg', [
        '-y', '-i', tmpRaw,
        '-af', 'highpass=f=100,loudnorm=I=-15:TP=-1.5:LRA=11',
        '-ar', '24000', '-ac', '1',
        '-c:a', 'libmp3lame', '-b:a', '128k',
        targetPath
    ], { timeout: 20000 });

    if (fs.existsSync(tmpRaw)) fs.unlinkSync(tmpRaw);
}

(async () => {
    console.log('[AUDISI BAKER] 🎙️ Membuat 6 variasi kata baru (Shikoku Metan Sweet + JA Nanami)...');
    let ok = 0;

    for (const item of AUDITION_SAMPLES) {
        const targetCat = item.category || 'gift';
        if (vp.list(targetCat).some((c) => c.label === item.label)) {
            console.log(`[AUDISI BAKER] ⏭️ Skip (sudah ada): ${item.label}`);
            ok++;
            continue;
        }

        const catDir = path.join(voicepackDir, targetCat);
        if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });

        const filename = `vp_audisi_${targetCat}_${item.num}_${Date.now()}.mp3`;
        const targetPath = path.join(catDir, filename);

        try {
            if (item.type === 'voicevox') {
                await synthVoicevox(item, targetPath);
                await sleep(1500);
            } else if (item.type === 'nanami') {
                await synthNanami(item, targetPath);
            } else if (item.type === 'kokoro') {
                await synthKokoro(item, targetPath);
            } else if (item.type === 'edge-multilingual') {
                await synthEdgeMultilingual(item, targetPath);
            }

            const size = fs.existsSync(targetPath) ? fs.statSync(targetPath).size : 0;
            if (size < 1000) throw new Error(`Hasil audio terlalu kecil (${size} bytes)`);

            vp.addClip({
                category: targetCat,
                label: item.label,
                text: item.displayText,
                filename,
                engine: item.engine,
                motion: item.motion,
                expression: item.expression,
                giftTrigger: item.giftTrigger,
                repoSource: item.repoSource
            });

            ok++;
            console.log(`[AUDISI BAKER] ✅ (#${item.num}) [${targetCat}] ${item.label} -> ${filename} (${size} bytes)`);
        } catch (err) {
            console.error(`[AUDISI BAKER] ❌ (#${item.num}) Gagal ${item.label}:`, err.message);
        }
    }

    console.log(`[AUDISI BAKER] 🎉 Selesai! ${ok}/${AUDITION_SAMPLES.length} variasi baru tersedia (Total VoicePack: ${vp.list().length}).`);
})();
