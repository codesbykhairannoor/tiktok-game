const path = require('path');
const fs = require('fs');
const TTSService = require('../src/TTSService');

const samplesDir = path.join(__dirname, '..', 'public', 'samples');
if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
}

// Bersihkan file sementara jika ada
['test_nanami.mp3', 'test_ja_pure.mp3', 'test_kokoro_ja.mp3', 'test_jp_indo_sample.mp3'].forEach(f => {
    const p = path.join(samplesDir, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
});

const tts = new TTSService(path.join(__dirname, '..', 'public', 'audio'));

// 1. JAPANESE SEIYUU NGOMONG INDO (HIGHLIGHT BARU: KATAKANA/KANJI/HIRAGANA FONETIK)
const SEIYUU_INDO_SAMPLES = [
    {
        filename: 'contoh_seiyuu_indo_1_sapaan.mp3',
        title: '1. Sapaan Ceria Live Stream (Aksen Anime Natural)',
        voice: 'ja-JP-NanamiNeural (Seiyuu Kanji/Katakana)',
        pitch: '+8Hz',
        rate: '+4%',
        kanjiScript: 'ハロー、カカ さやん！サーシャだよ〜！マカシー ばにゃー やあ、うだー マンピル でぃ ライブ サーシャ！大好き〜！',
        romaji: 'Halo, kaka sayang! Sasha da yo~! Makasii banyaa yaa, udah mampir di live Sasha! Daisuki~!',
        description: 'Suara Japanese Nanami berbicara Bahasa Indonesia dengan ejaan fonetik Katakana, Hiragana & Kanji. Menghasilkan aksen anime seiyuu yang gemas, hidup, dan tidak kaku!'
    },
    {
        filename: 'contoh_seiyuu_indo_2_saweria.mp3',
        title: '2. Reaksi Saweria & Sultan (Excited & Girang Manis)',
        voice: 'ja-JP-NanamiNeural (Seiyuu Kanji/Katakana)',
        pitch: '+9Hz',
        rate: '+5%',
        kanjiScript: 'わあー、すごい！マカシー ばにゃー、カカ スータン！サウェラン にゃ、るまやん ばにゃー ぶあっと ンガンプス サーシャ、大好きだよ〜！',
        romaji: 'Waa~ sugoi! Makasii banyaa, kaka sultan! Sawerannya lumayan banyaa buat ngampus Sasha, daisuki da yo~!',
        description: 'Reaksi heboh dan tersipu manis saat penonton menyawer. Intonasi memantul ceria khas VTuber top.'
    },
    {
        filename: 'contoh_seiyuu_indo_3_manja.mp3',
        title: '3. Manja & Nemenin Santai Malam (Soft & Intimate)',
        voice: 'ja-JP-NanamiNeural (Seiyuu Kanji/Katakana)',
        pitch: '+5Hz',
        rate: '-1%',
        kanjiScript: 'えへへ、カカ まにす、うだー まかん まらむ ぶるむ にー？しに てめにん サーシャ、じゃんがん ぶがだん すんでぃりあん やあ〜！',
        romaji: 'Ehehe, kaka manis, udah makan malam belum nih? Sini temenin Sasha, jangan begadang sendirian yaa~!',
        description: 'Suara santai, agak berbisik manja dan hangat. Cocok untuk live ngobrol santai malam hari sepulang kuliah.'
    }
];

// 2. JAPANESE MURNI (PURE JAPANESE SEIYUU)
const JAPANESE_PURE_SAMPLES = [
    {
        filename: 'contoh_4_sasha_japanese_kawaii.mp3',
        title: '4. Sasha Japanese Kawaii (Pure Anime Greeting)',
        voice: 'ja-JP-NanamiNeural',
        pitch: '+8Hz',
        rate: '+4%',
        kanjiScript: 'みんな、こんにちは！サーシャだよ〜！今日も配信に来てくれて本当にありがとう！いっぱいお話ししようね、大好きだよ〜！',
        romaji: 'Minna, konnichiwa! Sasha da yo~! Kyou mo haishin ni kite kurete hontou ni arigatou! Ippai ohanashi shiyou ne, daisuki da yo~!',
        description: '100% Bahasa Jepang asli dengan intonasi seiyuu anime ceria, ramah & manis menyapa penonton.'
    },
    {
        filename: 'contoh_5_sasha_japanese_tsundere.mp3',
        title: '5. Sasha Japanese Tsundere & Manja (Sweet & Teasing)',
        voice: 'ja-JP-NanamiNeural',
        pitch: '+11Hz',
        rate: '+6%',
        kanjiScript: 'もう〜、お兄ちゃん遅いよ！サーシャずっと待ってたんだからね！…でも、来てくれて嬉しい…えへへ、ぎゅーってして？',
        romaji: 'Mou~, onii-chan osoi yo! Sasha zutto matteta nda kara ne! ...Demo, kite kurete ureshii... ehehe, gyuu tte shite?',
        description: 'Gaya tsundere manis yang manja dan menggemaskan saat menyambut penonton yang baru datang.'
    },
    {
        filename: 'contoh_6_sasha_japanese_asmr.mp3',
        title: '6. Sasha Japanese ASMR / Healing (Soft Whispers)',
        voice: 'ja-JP-NanamiNeural',
        pitch: '+5Hz',
        rate: '-3%',
        kanjiScript: '今日も一日お疲れ様でした。温かいココアでも飲んで、ゆっくり休んでね。サーシャがずっとそばにいるからね、おやすみなさい。',
        romaji: 'Kyou mo ichinichi otsukaresama deshita. Atatakai kokoa demo nonde, yukkuri yasunde ne. Sasha ga zutto soba ni iru kara ne, oyasuminasai.',
        description: 'Suara lembut dan menenangkan (iyashikei/healing) untuk obrolan malam atau menemani tidur.'
    }
];

// 3. BAHASA INDONESIA STANDAR
const INDO_STANDARD_SAMPLES = [
    {
        filename: 'contoh_1_sasha_kawaii_ceria.mp3',
        title: '7. Sasha Kawaii Ceria (Hybrid Lama)',
        voice: 'ja-JP-NanamiNeural (Hybrid V1)',
        pitch: '+8Hz',
        rate: '+4%',
        kanjiScript: null,
        romaji: 'Halo kaka sayang! Kenalin aku Sasha, mahasiswi semester 4 yang manis dan ceria! Makasii banyaa yaa udah mampir di live Sasha, daisuki~!',
        description: 'Versi hybrid generasi awal (sebelum penyempurnaan fonetik Katakana/Kanji prosody).'
    },
    {
        filename: 'contoh_3_sasha_natural_indonesia.mp3',
        title: '8. Sasha Natural Indonesia (Gadis AI Standar)',
        voice: 'id-ID-GadisNeural',
        pitch: '+4Hz',
        rate: '+2%',
        kanjiScript: null,
        romaji: 'Halo semuanya! Aku Sasha! Makasih banyak ya buat teman-teman yang udah mampir dan tap-tap layar. Jangan lupa follow biar kita bisa seru-seruan bareng lagi!',
        description: 'Bahasa Indonesia standar AI (artikulasi jelas, namun intonasi lebih datar/khas AI sistem).'
    }
];

(async () => {
    console.log('🚀 Men-generate seluruh sampel audio Seiyuu-Indo & galeri...');

    // Generate / Polish Seiyuu-Indo samples
    for (const item of SEIYUU_INDO_SAMPLES) {
        const rawTarget = path.join(samplesDir, item.filename + '.raw.mp3');
        const finalTarget = path.join(samplesDir, item.filename);
        console.log(`🎙️ Proses: ${item.title}...`);
        await tts.synthesizeEdgeRaw(item.kanjiScript, rawTarget, 'ja-JP-NanamiNeural', item.pitch, item.rate);
        await tts.polishAndSave(rawTarget, finalTarget);
        if (fs.existsSync(rawTarget)) fs.unlinkSync(rawTarget);
        console.log(`✅ Selesai: ${item.filename} (${fs.statSync(finalTarget).size} bytes)`);
    }

    const renderCard = (s, isHighlight = false) => `
        <div class="card ${isHighlight ? 'highlight' : ''}">
            <div class="card-header">
                <span class="card-title">${s.title}</span>
                <span class="tag ${isHighlight ? 'tag-highlight' : ''}">${s.voice}</span>
            </div>
            <div class="desc">${s.description}</div>
            <div class="quote ${isHighlight ? 'quote-highlight' : ''}">
                ${s.kanjiScript ? `<div class="kanji-box">🎌 <strong>Naskah Fonetik:</strong> <code>${s.kanjiScript}</code></div>` : ''}
                <div class="romaji-box">🗣️ <strong>Bacaan:</strong> "${s.romaji}"</div>
            </div>
            <audio controls preload="metadata">
                <source src="${s.filename}" type="audio/mpeg">
                Browser kamu tidak mendukung audio player.
            </audio>
        </div>
    `;

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌸 Galeri Suara Sasha AI VTuber - Seiyuu Natural Indo & Japanese</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #0f172a 100%);
            color: #f8fafc;
            min-height: 100vh;
            padding: 40px 20px;
            display: flex;
            justify-content: center;
        }
        .container {
            max-width: 860px;
            width: 100%;
        }
        .hero {
            text-align: center;
            margin-bottom: 32px;
            background: rgba(30, 41, 59, 0.5);
            backdrop-filter: blur(12px);
            padding: 32px;
            border-radius: 24px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
        }
        .badge {
            display: inline-block;
            background: linear-gradient(90deg, #ec4899, #8b5cf6);
            color: white;
            font-size: 12px;
            font-weight: 700;
            padding: 4px 14px;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
        }
        h1 {
            font-size: 28px;
            color: #fff;
            margin-bottom: 8px;
        }
        p.subtitle {
            color: #94a3b8;
            font-size: 14px;
            max-width: 650px;
            margin: 0 auto;
            line-height: 1.5;
        }
        .section-title {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 20px;
            font-weight: 700;
            color: #38bdf8;
            margin: 32px 0 16px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid rgba(56, 189, 248, 0.2);
        }
        .section-title.gold {
            color: #fbbf24;
            border-bottom-color: rgba(251, 191, 36, 0.3);
        }
        .section-title.jp {
            color: #f472b6;
            border-bottom-color: rgba(244, 114, 182, 0.2);
        }
        .section-title.muted {
            color: #94a3b8;
            border-bottom-color: rgba(148, 163, 184, 0.2);
        }
        .card {
            background: rgba(15, 23, 42, 0.7);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 16px;
            transition: all 0.25s ease;
        }
        .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .card.highlight {
            border: 1px solid rgba(251, 191, 36, 0.4);
            background: linear-gradient(135deg, rgba(30, 27, 75, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
            box-shadow: 0 6px 20px rgba(251, 191, 36, 0.1);
        }
        .card.highlight:hover {
            border-color: #fbbf24;
            box-shadow: 0 10px 28px rgba(251, 191, 36, 0.25);
        }
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            flex-wrap: wrap;
            gap: 8px;
        }
        .card-title {
            font-size: 16px;
            font-weight: 700;
            color: #fbcfe8;
        }
        .highlight .card-title {
            color: #fef08a;
        }
        .tag {
            font-size: 11px;
            padding: 3px 8px;
            border-radius: 6px;
            background: #334155;
            color: #93c5fd;
            font-family: monospace;
        }
        .tag-highlight {
            background: rgba(251, 191, 36, 0.2);
            color: #fde047;
            border: 1px solid rgba(251, 191, 36, 0.3);
        }
        .desc {
            font-size: 13px;
            color: #94a3b8;
            margin-bottom: 12px;
            line-height: 1.4;
        }
        .quote {
            font-size: 14px;
            line-height: 1.6;
            color: #e2e8f0;
            margin-bottom: 14px;
            background: rgba(0,0,0,0.35);
            padding: 12px 16px;
            border-left: 4px solid #ec4899;
            border-radius: 0 8px 8px 0;
        }
        .quote-highlight {
            border-left-color: #fbbf24;
            background: rgba(0,0,0,0.45);
        }
        .kanji-box {
            font-size: 13px;
            color: #fed7aa;
            margin-bottom: 6px;
            font-family: 'Segoe UI', Meiryo, sans-serif;
        }
        .kanji-box code {
            background: rgba(251, 191, 36, 0.15);
            padding: 2px 6px;
            border-radius: 4px;
            color: #fef08a;
            font-family: inherit;
        }
        .romaji-box {
            color: #e2e8f0;
            font-size: 14px;
        }
        audio {
            width: 100%;
            height: 40px;
            border-radius: 8px;
            outline: none;
        }
        .actions {
            margin-top: 32px;
            text-align: center;
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .btn {
            display: inline-block;
            background: #3b82f6;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            transition: 0.2s;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .btn:hover { background: #2563eb; transform: translateY(-1px); }
        .btn-pink { background: #ec4899; }
        .btn-pink:hover { background: #db2777; }
    </style>
</head>
<body>
    <div class="container">
        <div class="hero">
            <span class="badge">✨ Edisi Khusus VTuber</span>
            <h1>Galeri Suara Sasha AI Studio</h1>
            <p class="subtitle">Perbandingan teknik suara: Suara Japanese Seiyuu berbicara Bahasa Indonesia dengan ejaan fonetik Kanji/Katakana, Bahasa Jepang Asli, dan Suara AI Standar.</p>
            <div class="actions">
                <a href="/" class="btn btn-pink">📺 Buka Layar OBS 3D</a>
                <a href="/admin" class="btn">🎛️ Buka Panel Admin</a>
            </div>
        </div>

        <div class="section-title gold">
            <span>🎌 Suara Japanese Anime Ngomong Bahasa Indonesia (Teknik Kanji/Katakana Fonetik)</span>
        </div>
        ${SEIYUU_INDO_SAMPLES.map(s => renderCard(s, true)).join('')}

        <div class="section-title jp">
            <span>🇯🇵 Bahasa Jepang Asli (Pure Japanese Seiyuu)</span>
        </div>
        ${JAPANESE_PURE_SAMPLES.map(s => renderCard(s, false)).join('')}

        <div class="section-title muted">
            <span>🇮🇩 Perbandingan: Versi AI Standar / Hybrid Awal</span>
        </div>
        ${INDO_STANDARD_SAMPLES.map(s => renderCard(s, false)).join('')}

    </div>
</body>
</html>`;

    fs.writeFileSync(path.join(samplesDir, 'index.html'), html, 'utf8');
    console.log('🎉 Selesai membuat audio Seiyuu-Indo dan halaman galeri yang diperbarui!');
})();
