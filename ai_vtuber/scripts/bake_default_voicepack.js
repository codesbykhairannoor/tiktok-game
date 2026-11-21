const path = require('path');
const fs = require('fs');
const TTSService = require('../src/TTSService');
const VoicePackService = require('../src/VoicePackService');

const audioDir = path.join(__dirname, '..', 'public', 'audio');
const voicepackDir = path.join(__dirname, '..', 'public', 'voicepack');

const tts = new TTSService(audioDir, 'id-ID-GadisNeural', 'kawaii-hybrid');
const vp = new VoicePackService(voicepackDir);

// 42+ Klip Suara Imut ("Puluhan Suara" Gratis Rp 0 — Hybrid JA Anime + Kokoro CPU + ID Manis)
const CLIPS_TO_BAKE = [
    // --- KAWAII / REACTION SFX (Cocok sebagai intro stitch & ekspresi cepat) ---
    { category: 'kawaii', label: 'Kyaa~! (JA Nanami)', text: 'きゃー！すごい！', engine: 'edge-ja', voice: 'ja-JP-NanamiNeural', pitch: '+14Hz', rate: '+10%', motion: 'Jump', expression: 'happy' },
    { category: 'kawaii', label: 'Ehehe~! (JA Nanami)', text: 'えへへ〜！うれしい！', engine: 'edge-ja', voice: 'ja-JP-NanamiNeural', pitch: '+12Hz', rate: '+5%', motion: 'Blush', expression: 'happy' },
    { category: 'kawaii', label: 'Yatta~! (JA Nanami)', text: 'やったー！ありがとう！', engine: 'edge-ja', voice: 'ja-JP-NanamiNeural', pitch: '+14Hz', rate: '+8%', motion: 'Jump', expression: 'happy' },
    { category: 'kawaii', label: 'Arigatou~! (JA Nanami)', text: 'ありがとう〜！だいすき！', engine: 'edge-ja', voice: 'ja-JP-NanamiNeural', pitch: '+12Hz', rate: '+6%', motion: 'Clapping', expression: 'happy' },
    { category: 'kawaii', label: 'Waaah Sugoi! (JA Nanami)', text: 'わあ、すごい！', engine: 'edge-ja-soft', voice: 'ja-JP-NanamiNeural', pitch: '+12Hz', rate: '+6%', motion: 'Surprised', expression: 'happy' },
    { category: 'kawaii', label: 'Uwaa Kirei! (JA Nanami)', text: 'うわあ、うれしい！', engine: 'edge-ja-soft', voice: 'ja-JP-NanamiNeural', pitch: '+12Hz', rate: '+5%', motion: 'Blush', expression: 'happy' },
    { category: 'kawaii', label: 'Yay So Sweet (Kokoro)', text: 'Yay! You are so sweet!', engine: 'kokoro', useKokoro: true, kokoroVoice: 'af_heart', motion: 'Clapping', expression: 'happy' },
    { category: 'kawaii', label: 'Omg Thank You (Kokoro)', text: 'Oh my gosh, thank you!', engine: 'kokoro', useKokoro: true, kokoroVoice: 'af_bella', motion: 'Jump', expression: 'happy' },
    { category: 'kawaii', label: 'Hehe Love U (Kokoro)', text: 'Hehe, love you!', engine: 'kokoro', useKokoro: true, kokoroVoice: 'af_aoede', motion: 'Blush', expression: 'happy' },
    { category: 'kawaii', label: 'Gemes Banget!', text: 'Ih gemes banget sih kamu!', engine: 'edge-id', pitch: '+20Hz', rate: '+10%', motion: 'Blush', expression: 'happy' },

    // --- GREETINGS (Sapaan Masuk Penonton) ---
    { category: 'greetings', label: 'Halo Selamat Datang', text: 'Halo kakak manis! Selamat datang di live Nita ya!', engine: 'edge-id', pitch: '+18Hz', rate: '+8%', motion: 'Goodbye', expression: 'happy' },
    { category: 'greetings', label: 'Konbanwa Minna', text: 'こんにちは！みんな来てくれてありがとう！', engine: 'edge-ja', voice: 'ja-JP-NanamiNeural', pitch: '+12Hz', rate: '+6%', motion: 'Goodbye', expression: 'happy' },
    { category: 'greetings', label: 'Duduk Manis Ya', text: 'Eh ada kakak baru masuk! Duduk yang manis ya di sini!', engine: 'edge-id', pitch: '+18Hz', rate: '+10%', motion: 'Goodbye', expression: 'happy' },
    { category: 'greetings', label: 'Welcome Bestie (Kokoro)', text: 'Welcome to the stream, bestie!', engine: 'kokoro', useKokoro: true, kokoroVoice: 'af_heart', motion: 'Goodbye', expression: 'happy' },
    { category: 'greetings', label: 'Jangan Lupa Tap Layar', text: 'Halo semuanya! Jangan lupa tap-tap layar biar Nita makin semangat!', engine: 'edge-id', pitch: '+20Hz', rate: '+10%', motion: 'Clapping', expression: 'happy' },
    { category: 'greetings', label: 'Kangen Nita Ya?', text: 'Ehe, kangen sama Nita ya? Sini ngobrol bareng!', engine: 'edge-id', pitch: '+16Hz', rate: '+6%', motion: 'Blush', expression: 'happy' },

    // --- SAWERIA (Reaksi Heboh Donasi) ---
    { category: 'saweria', label: 'Saweria Sultan Dateng!', text: 'Wah sultan beneran dateng! Makasih banyak sawerannya kakak!', engine: 'edge-id', pitch: '+22Hz', rate: '+12%', motion: 'Jump', expression: 'happy' },
    { category: 'saweria', label: 'Deg-Degan Dapet Sawer', text: 'Aduh Nita jadi deg-degan nih dapet saweran! Makasih ya sayang!', engine: 'edge-id', pitch: '+18Hz', rate: '+8%', motion: 'Blush', expression: 'happy' },
    { category: 'saweria', label: 'Buat Jajan Cilok', text: 'Asik dapet jajan seblak sama es boba! Berkah selalu kakak sultan!', engine: 'edge-id', pitch: '+20Hz', rate: '+10%', motion: 'Jump', expression: 'happy' },
    { category: 'saweria', label: 'Arigatou Saweria (JA)', text: 'わあ！スーパーチャットありがとう！大好き！', engine: 'edge-ja', voice: 'ja-JP-NanamiNeural', pitch: '+14Hz', rate: '+8%', motion: 'Jump', expression: 'happy' },
    { category: 'saweria', label: 'Luv U Sultan (Kokoro)', text: 'Whoa! Thank you so much for the donation! You are amazing!', engine: 'kokoro', useKokoro: true, kokoroVoice: 'af_bella', motion: 'Jump', expression: 'happy' },
    { category: 'saweria', label: 'Auto Jadi Kesayangan', text: 'Fix kamu jadi penonton kesayangan Nita hari ini! Makasih banyak!', engine: 'edge-id', pitch: '+18Hz', rate: '+10%', motion: 'Clapping', expression: 'happy' },

    // --- GIFT TIKTOK ---
    { category: 'gift', label: 'Makasih Gift-nya!', text: 'Makasih banyak gift-nya kakak manis! Nita seneng banget!', engine: 'edge-id', pitch: '+20Hz', rate: '+10%', motion: 'Clapping', expression: 'happy' },
    { category: 'gift', label: 'Mawar Merah Wangi', text: 'Uwu dapet bunga mawar! Wangi banget kayak kamu ehe!', engine: 'edge-id', pitch: '+18Hz', rate: '+8%', motion: 'Blush', expression: 'happy' },
    { category: 'gift', label: 'Sultan Gercep', text: 'Widih gercep banget lempar gift-nya! Makasih ya panutan Nita!', engine: 'edge-id', pitch: '+20Hz', rate: '+12%', motion: 'Clapping', expression: 'happy' },
    { category: 'gift', label: 'Happy Dance Gift', text: 'Yey dapet gift! Nita joget dulu ya buat kamu!', engine: 'edge-id', pitch: '+22Hz', rate: '+12%', motion: 'Jump', expression: 'happy' },
    { category: 'gift', label: 'Gift Ureshii (JA)', text: 'ギフトありがとう！とっても嬉しい！', engine: 'edge-ja', voice: 'ja-JP-NanamiNeural', pitch: '+12Hz', rate: '+8%', motion: 'Clapping', expression: 'happy' },
    { category: 'gift', label: 'Cute Gift (Kokoro)', text: 'Aww, thank you for the cute gift!', engine: 'kokoro', useKokoro: true, kokoroVoice: 'af_heart', motion: 'Blush', expression: 'happy' },

    // --- ROAST / TSUNDERE LUCU ---
    { category: 'roast', label: 'Baka Tsundere (JA)', text: 'ばか！べ、別にあんたのためじゃないんだからね！', engine: 'edge-ja', voice: 'ja-JP-NanamiNeural', pitch: '+12Hz', rate: '+8%', motion: 'Blush', expression: 'surprised' },
    { category: 'roast', label: 'Hmph! Jangan Pelit!', text: 'Hmph! Masa nonton doang nggak kasih tap-tap sama mawar sih!', engine: 'edge-id', pitch: '+20Hz', rate: '+10%', motion: 'Thinking', expression: 'surprised' },
    { category: 'roast', label: 'Muka Template Meme', text: 'Eh jangan galak-galak dong, nanti Nita nangis nih! Bercanda kok!', engine: 'edge-id', pitch: '+18Hz', rate: '+10%', motion: 'Surprised', expression: 'happy' },
    { category: 'roast', label: 'Jangan Naksir Nita', text: 'Jangan liatin kacamata Nita terus dong, nanti kamu naksir beneran lho!', engine: 'edge-id', pitch: '+18Hz', rate: '+8%', motion: 'Blush', expression: 'happy' },
    { category: 'roast', label: 'Dompet Aman Kak?', text: 'Cie senyum-senyum sendiri nonton Nita, dompet aman kan kak?', engine: 'edge-id', pitch: '+18Hz', rate: '+10%', motion: 'Thinking', expression: 'happy' },
    { category: 'roast', label: 'Noob Alert (Kokoro)', text: 'Hey! Don\'t just lurk there, say hi to me!', engine: 'kokoro', useKokoro: true, kokoroVoice: 'af_aoede', motion: 'Surprised', expression: 'surprised' },

    // --- IDLE CHATTER (Biar stream gak sepi pas chat lagi tenang) ---
    { category: 'idle', label: 'Ajak Ngobrol Dong', text: 'Eh kok sepi nih? Ayo komen apa aja dong biar Nita bacain!', engine: 'edge-id', pitch: '+18Hz', rate: '+8%', motion: 'LookAround', expression: 'happy' },
    { category: 'idle', label: 'Udah Makan Belum?', text: 'Kakak-kakak yang lagi nonton udah pada makan belum? Jangan telat makan ya!', engine: 'edge-id', pitch: '+16Hz', rate: '+6%', motion: 'Thinking', expression: 'happy' },
    { category: 'idle', label: 'Cek Kacamata Nita', text: 'Gimana nih kacamata baru Nita hari ini? Kelihatan makin pinter kan?', engine: 'edge-id', pitch: '+18Hz', rate: '+8%', motion: 'Blush', expression: 'happy' },
    { category: 'idle', label: 'Bawah 5 View End!', text: 'Inget aturan live ya! Kalau di bawah lima view nanti Nita ngambek terus end stream lho!', engine: 'edge-id', pitch: '+20Hz', rate: '+10%', motion: 'Surprised', expression: 'surprised' },
    { category: 'idle', label: 'Ngantuk Nunggu Komen', text: 'Hmm, Nita nungguin komen kalian nih, jangan lupa follow dulu ya!', engine: 'edge-id', pitch: '+16Hz', rate: '+5%', motion: 'LookAround', expression: 'relaxed' },
    { category: 'idle', label: 'Semangat Hari Ini!', text: 'Semangat terus ya buat kamu yang lagi capek hari ini! Nita temenin di sini!', engine: 'edge-id', pitch: '+18Hz', rate: '+8%', motion: 'Clapping', expression: 'happy' }
];

(async () => {
    console.log(`[BAKER] 🎙️ Memulai bake ${CLIPS_TO_BAKE.length} klip suara imut ke public/voicepack/ ...`);
    let count = 0;

    for (const item of CLIPS_TO_BAKE) {
        // Lewati jika label yang sama sudah ada
        if (vp.list(item.category).some(c => c.label === item.label)) {
            console.log(`[BAKER] ⏭️ Skip (sudah ada): ${item.category}/${item.label}`);
            continue;
        }

        const filename = `vp_${item.category}_${Date.now()}_${count}.mp3`;
        const targetPath = path.join(voicepackDir, item.category, filename);

        try {
            await tts.bakeClip({
                text: item.text,
                targetPath,
                voice: item.voice || 'id-ID-GadisNeural',
                pitch: item.pitch || '+18Hz',
                rate: item.rate || '+8%',
                useKokoro: Boolean(item.useKokoro),
                kokoroVoice: item.kokoroVoice || 'af_heart'
            });

            vp.addClip({
                category: item.category,
                label: item.label,
                text: item.text,
                filename,
                engine: item.engine,
                motion: item.motion,
                expression: item.expression
            });
            count++;
            console.log(`[BAKER] ✅ (${count}) ${item.category} -> ${item.label}`);
        } catch (err) {
            console.error(`[BAKER] ❌ Gagal bake "${item.label}":`, err.message);
        }
    }

    // Hapus file test sementara kalau ada
    const testWav = path.join(audioDir, 'test_kokoro.wav');
    if (fs.existsSync(testWav)) {
        try { fs.unlinkSync(testWav); } catch {}
    }

    console.log(`[BAKER] 🎉 Selesai! Total klip tersedia di Voice Pack: ${vp.list().length}`);
    process.exit(0);
})();
