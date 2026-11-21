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

const tts = new TTSService(audioDir, 'ja-JP-NanamiNeural', 'kawaii-hybrid');
const vp = new VoicePackService(voicepackDir);

const SASHA_COLLEGE_CLIPS = [
    {
        num: 1,
        category: 'gift',
        label: 'Gift Mawar Merah #1',
        displayText: 'Uwaa makasii banyaa mawar merahnya kaka sayang, Sasha jadi makin semangat live habis pulang kuliah nih, daisuki~!',
        jpText: 'うわあ、まかしーばにゃーまわるめらーにゃ、かかさやん、さしゃじゃでぃまきんすまんがっとりぶはびすぷらんくりあーにー、だいすきー！',
        giftTrigger: 'rose',
        motion: 'Jump',
        expression: 'happy'
    },
    {
        num: 2,
        category: 'gift',
        label: 'Gift Mawar Manis #2',
        displayText: 'Ehehe makasii mawarnya kaka manis, wangi banget kayak parfum baru Sasha, luv you~!',
        jpText: 'えへへ、まかしーまわるにゃ、かかまにす、わんぎーばんげーかやぱるふむばるーさしゃ、らぶゆー！',
        giftTrigger: 'rose',
        motion: 'Blush',
        expression: 'happy'
    },
    {
        num: 3,
        category: 'gift',
        label: 'Gift Kopi Kampus #1',
        displayText: 'Wah asiiik makasii banyaa kopinya kaka sayang, pas banget buat nemenin Sasha begadang nugas kuliah malam ini, daisuki~!',
        jpText: 'わあー、あしーく、まかしーばにゃーこぴにゃ、かかさやん、ぱすばんげーぶあっとぬむにんさしゃぶがだんぬがすくりあーまらむいに、だいすきー！',
        giftTrigger: 'coffee',
        motion: 'Clapping',
        expression: 'happy'
    },
    {
        num: 4,
        category: 'gift',
        label: 'Gift Es Kopi #2',
        displayText: 'Ufufu makasii es kopinya kaka manis, mata Sasha langsung melek lagi nih, sayang kaka banyaa~!',
        jpText: 'うふふ、まかしーえすこぴにゃ、かかまにす、またさしゃらんすんむれっくらぎにー、さやんかかばにゃー！',
        giftTrigger: 'coffee',
        motion: 'Blush',
        expression: 'happy'
    },
    {
        num: 5,
        category: 'gift',
        label: 'Gift Donat Manis',
        displayText: 'Waa ureshii! Makasii banyaa donat manisnya kaka, cemilan favorit Sasha waktu istirahat ngampus nih~!',
        jpText: 'わあ、うれしい！まかしーばにゃーどなっとまにすにゃかか、ちゃみらんふぁぼりっとさしゃわくとぅいすてぃらはっとんがんぷすにー！',
        giftTrigger: 'doughnut',
        motion: 'Clapping',
        expression: 'happy'
    },
    {
        num: 6,
        category: 'gift',
        label: 'Gift Es Krim Segar',
        displayText: 'Kyaa makasii banyaa es krimnya kaka sayang, seger banget bikin mood Sasha naik seratus persen~!',
        jpText: 'きゃあー、まかしーばにゃーえすくりむにゃ、かかさやん、すぐるばんげーびきんむーどさしゃないくすらとぅすぷるせんー！',
        giftTrigger: 'icecream',
        motion: 'Jump',
        expression: 'happy'
    },
    {
        num: 7,
        category: 'gift',
        label: 'Gift Finger Heart #2',
        displayText: 'Ehehe dapet heart lagi dari kaka sayang, hati Sasha ikutan berdebar nih, daisuki yo~!',
        jpText: 'えへへ、だぱっとはーとらぎだりかかさやん、はてぃさしゃいくたんぶるでばるにー、だいすきよー！',
        giftTrigger: 'heart',
        motion: 'Blush',
        expression: 'happy'
    },
    {
        num: 8,
        category: 'gift',
        label: 'Gift Sultan Paus #2',
        displayText: 'Uwaa sugoi! Sultan kampus beneran turun tangan nih, makasii banyaa kaka sultan, Sasha sayang banget sama kamu~!',
        jpText: 'うわあ、すごーい！すーたんかんぷすぶぬらんとぅるんたんがんにー、まかしーばにゃーかかすーたん、さしゃさやんばんげーさまかむー！',
        giftTrigger: 'whale',
        motion: 'Jump',
        expression: 'happy'
    },
    {
        num: 9,
        category: 'gift',
        label: 'Gift Spesial #1',
        displayText: 'Uwaa makasii banyaa gift-nya kaka sayang, kamu perhatian banget deh sama Sasha, arigatou ne~!',
        jpText: 'うわあ、まかしーばにゃーぎふとにゃ、かかさやん、かむぷるはてぃあんばんげーでーさまさしゃ、ありがとうねー！',
        giftTrigger: 'any',
        motion: 'Clapping',
        expression: 'happy'
    },
    {
        num: 10,
        category: 'gift',
        label: 'Gift Spesial #2',
        displayText: 'Kyaa ureshii! Makasii banyaa kaka manis udah kasih gift buat Sasha, sehat dan lancar terus rezekinya yaa~!',
        jpText: 'きゃあ、うれしい！まかしーばにゃーかかまにすうだーかしーぎふとぶあっとさしゃ、せはっとだんらんちゃるとぅるするずきにゃやー！',
        giftTrigger: 'any',
        motion: 'Jump',
        expression: 'happy'
    },
    {
        num: 11,
        category: 'saweria',
        label: 'Saweria Uang Jajan Kuliah #1',
        displayText: 'Kyaa sugoi! Makasii banyaa sawerannya kaka sultan, lumayan banget buat tambahan uang jajan ngampus Sasha, daisuki~!',
        jpText: 'きゃあー、すごーい！まかしーばにゃーさうぇらんにゃ、かかすーたん、るまやんばんげーぶあっとたんばはんうあんじゃじゃんんがんぷすさしゃ、だいすきー！',
        motion: 'Jump',
        expression: 'happy'
    },
    {
        num: 12,
        category: 'saweria',
        label: 'Saweria Deg-degan #2',
        displayText: 'Ehehe Sasha jadi deg-degan dapet saweran dari kaka sayang, makasii banyaa yaa, Sasha doain kaka makin sukses~!',
        jpText: 'えへへ、さしゃじゃでぃどぅぐどぅぐんだぱっとさうぇらんだりかかさやん、まかしーばにゃーやー、さしゃどあいんかかまきんすくせすー！',
        motion: 'Blush',
        expression: 'happy'
    },
    {
        num: 13,
        category: 'greetings',
        label: 'Sapaan Pulang Kuliah #2',
        displayText: 'Halo kaka manis, selamat malam! Sasha baru aja beres tugas kuliah nih, yuk ngobrol santai bareng Sasha~!',
        jpText: 'はろーかかまにす、すらまっとまらむ！さしゃばるーあじゃぶれすとぅがすくりあーにー、ゆーくごぶろるさんたいばれんさしゃー！',
        motion: 'Goodbye',
        expression: 'happy'
    },
    {
        num: 14,
        category: 'kawaii',
        label: 'Penampilan Baru Sasha',
        displayText: 'Ehehe, gimana kaka, Sasha hari ini udah keliatan manis dan cantik banget belum~?',
        jpText: 'えへへ、ぎまなかか、さしゃはりいにうだーくりあたんまにすだんちゃんてぃくばんげーぶるむー？',
        motion: 'Blush',
        expression: 'happy'
    },
    {
        num: 15,
        category: 'roast',
        label: 'Tsundere Manja',
        displayText: 'Iih kaka jangan godain Sasha terus dong, nanti Sasha salah tingkah nih depan kamera, baka~!',
        jpText: 'いーかか、じゃんがんごだいんさしゃとぅるすどん、なんてぃさしゃさらーてぃんかーにーどぅぱんかめら、ばかー！',
        motion: 'Blush',
        expression: 'surprised'
    },
    {
        num: 16,
        category: 'idle',
        label: 'Idle Ngobrol Kampus #1',
        displayText: 'Hmm kaka-kaka yang lagi nonton udah pada makan malam belum nih? Jangan sampe telat makan kayak Sasha waktu dikejar tugas dosen yaa~!',
        jpText: 'んー、かかかかやんらぎのんとん、うだーぱだまかんまらむぶるむにー？じゃんがんさんぺとぅらっとまかんかやーさしゃわくとぅでぃくじゃるとぅがすどせんやー！',
        motion: 'Thinking',
        expression: 'relaxed'
    },
    {
        num: 17,
        category: 'idle',
        label: 'Idle Tap-Tap Layar #2',
        displayText: 'Ehehe yang baru gabung jangan malu-malu komen yaa, sini temenin Sasha ngobrol biar ga ngantuk malam ini~!',
        jpText: 'えへへ、やんばるーがぶんじゃんがんまるまるこめんやー、しにとぅむにんさしゃごぶろるびあるがーがんとぅくまらむいにー！',
        motion: 'LookAround',
        expression: 'happy'
    },
    {
        num: 18,
        category: 'gift',
        label: 'Gift Heart',
        displayText: 'Uwaa ureshii! Makasii banyaa heart-nya kaka sayang, Sasha seneng banget, daisuki~!',
        jpText: 'うわあ、うれしい！まかしーばにゃーはーとにゃ、かかさやん、さしゃすなんばんげー、だいすきー！',
        giftTrigger: 'heart',
        motion: 'Blush',
        expression: 'happy'
    },
    {
        num: 19,
        category: 'gift',
        label: 'Gift Paus Sultan',
        displayText: 'Kyaa sugoi! Makasii banyaa pausnya kaka sultan, Sasha sayang kamu~!',
        jpText: 'きゃあー、すごーい！まかしーばにゃーぱうすにゃ、かかすーたん、さしゃさやんかむー！',
        giftTrigger: 'whale',
        motion: 'Jump',
        expression: 'happy'
    },
    {
        num: 20,
        category: 'greetings',
        label: 'Sapaan Masuk',
        displayText: 'Ehehe, halo kaka sayang, selamat datang di live Sasha yaa, jangan lupa tap-tap layar~!',
        jpText: 'えへへ、はろーかかさやん、すらまっとだたんでぃりぶさしゃやー、じゃんがんるぱたっぷたっぷらやるー！',
        giftTrigger: null,
        motion: 'Goodbye',
        expression: 'happy'
    }
];

async function synthNanamiClip(jpText, targetPath) {
    const tmpRaw = targetPath + '.nanami.mp3';
    await tts.synthesizeEdgeRaw(jpText, tmpRaw, 'ja-JP-NanamiNeural', '+8Hz', '+4%');
    if (!fs.existsSync(tmpRaw) || fs.statSync(tmpRaw).size < 500) {
        throw new Error('Output Edge Nanami kosong/terlalu kecil');
    }

    await execFileAsync('ffmpeg', [
        '-y', '-i', tmpRaw,
        '-af', 'highpass=f=100,loudnorm=I=-15:TP=-1.5:LRA=11',
        '-ar', '24000', '-ac', '1',
        '-c:a', 'libmp3lame', '-b:a', '128k',
        targetPath
    ], { timeout: 25000 });

    if (fs.existsSync(tmpRaw)) fs.unlinkSync(tmpRaw);
}

(async () => {
    // 1. Hapus semua klip lama Nita/Audisi/script-baked lama untuk rebuild Voice Pack Sasha secara bersih
    const toRemove = vp.list().filter((c) =>
        c.engine !== 'edge-ja-soft' ||
        /nita|にた|audisi/i.test(`${c.label} ${c.text}`) ||
        /^(vp_nanami|vp_sasha)_/i.test(c.filename || '') ||
        (c.repoSource && /edge-tts|VoicePack|VOICEVOX/i.test(c.repoSource))
    );
    for (const c of toRemove) {
        vp.deleteClip(c.id);
        console.log(`[CLEANUP] 🗑️ Hapus klip lama: ${c.label} (${c.engine})`);
    }

    // 2. Bake 20 klip JA Nanami persona Sasha Remaja Kuliah (+8Hz / +4%)
    let added = 0;
    for (const item of SASHA_COLLEGE_CLIPS) {
        const cat = item.category;
        if (vp.list(cat).some((c) => c.label === item.label)) {
            console.log(`[SASHA BAKER] ⏭️ Skip (sudah ada): ${item.label}`);
            continue;
        }

        const catDir = path.join(voicepackDir, cat);
        if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });

        const filename = `vp_sasha_${cat}_${item.num}_${Date.now()}.mp3`;
        const targetPath = path.join(catDir, filename);

        await synthNanamiClip(item.jpText, targetPath);
        const size = fs.existsSync(targetPath) ? fs.statSync(targetPath).size : 0;
        if (size < 1000) throw new Error(`Hasil audio ${item.label} terlalu kecil (${size} bytes)`);

        vp.addClip({
            category: cat,
            label: item.label,
            text: item.displayText,
            filename,
            engine: 'edge-ja-soft',
            motion: item.motion,
            expression: item.expression,
            giftTrigger: item.giftTrigger || null,
            repoSource: 'rany2/edge-tts (ja-JP-NanamiNeural +8Hz/+4%)'
        });
        added++;
        console.log(`[SASHA BAKER] ✅ [${cat}${item.giftTrigger ? ':' + item.giftTrigger : ''}] ${item.label} -> ${filename} (${size} bytes)`);
    }

    console.log(`[SASHA BAKER] 🎉 Selesai! Hapus ${toRemove.length} klip lama, tambah ${added} klip baru. Total VoicePack: ${vp.list().length} (100% edge-ja-soft Sasha).`);
})();
