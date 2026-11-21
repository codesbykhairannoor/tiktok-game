const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const keys = process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',') : [
  process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE'
];
let keyIdx = 0;

const ffmpegBin = 'D:\\threadstomation\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe';
const outDir = path.join(__dirname, '..', 'public', 'voicepack');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const clips = [
  {
    name: 'round_start',
    prompt: 'Bacakan dengan suara pembawa acara wanita muda yang ramah, mempesona, manis, dan bersemangat: Ronde baru dimulai! Siap-siap teman-teman pejuang CPNS, tulis jawaban terbaikmu di komentar!'
  },
  {
    name: 'countdown_10s',
    prompt: 'Bacakan dengan suara pembawa acara wanita muda yang manis dan mengingatkan dengan seru: Waktunya tinggal sepuluh detik lagi! Ayo segera kirim jawabanmu di komentar!'
  },
  {
    name: 'time_up',
    prompt: 'Bacakan dengan suara pembawa acara wanita muda yang manis, jelas, dan memikat: Waktu habis! Kunci jawaban yang benar adalah...'
  },
  {
    name: 'correct',
    prompt: 'Bacakan dengan suara pembawa acara wanita muda yang manis, bangga, dan antusias: Wah hebat banget! Jawaban kamu tepat sekali!'
  },
  {
    name: 'gift_thanks',
    prompt: 'Bacakan dengan suara pembawa acara wanita muda yang sangat manis, hangat, dan ramah: Terima kasih banyak atas gift dan dukungannya! Sukses selalu ya!'
  }
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateClip(clip) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const key = keys[keyIdx % keys.length];
    const curIdx = keyIdx % keys.length;
    keyIdx++;
    console.log(`[GEN] Generating ${clip.name} using key index ${curIdx}...`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${key}`;
    const payload = {
      contents: [{ parts: [{ text: clip.prompt }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Aoede' }
          }
        }
      }
    };

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.warn(`[WARN] Status ${resp.status} for ${clip.name}: ${text}. Switching key...`);
        await sleep(1500);
        continue;
      }

      const data = await resp.json();
      if (!data.candidates || !data.candidates[0].content.parts[0].inlineData) {
        console.warn(`[WARN] No inlineData in response for ${clip.name}. Switching key...`);
        await sleep(1500);
        continue;
      }

      const b64 = data.candidates[0].content.parts[0].inlineData.data;
      const pcm = Buffer.from(b64, 'base64');
      const tempPcm = path.join(__dirname, `temp_${clip.name}.pcm`);
      const destMp3 = path.join(outDir, `${clip.name}.mp3`);

      fs.writeFileSync(tempPcm, pcm);
      execFileSync(ffmpegBin, [
        '-y',
        '-f', 's16le',
        '-ar', '24000',
        '-ac', '1',
        '-i', tempPcm,
        '-b:a', '192k',
        destMp3
      ], { stdio: 'ignore' });

      if (fs.existsSync(tempPcm)) fs.unlinkSync(tempPcm);

      const size = fs.statSync(destMp3).size;
      console.log(`[SUCCESS] Saved ${clip.name}.mp3 (${size} bytes)`);
      return;
    } catch (err) {
      console.error(`[ERR] Attempt failed for ${clip.name}:`, err.message);
      await sleep(1500);
    }
  }
  throw new Error(`Failed to generate ${clip.name} after multiple attempts.`);
}

async function run() {
  console.log(`🚀 Starting baking 10 sexy female voicepack clips (Aoede)...`);
  for (const clip of clips) {
    await generateClip(clip);
    // Jeda 2 detik
    await sleep(2000);
  }
  console.log(`✅ All 10 sexy voicepack clips baked successfully into public/voicepack/!`);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
