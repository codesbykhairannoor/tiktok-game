const { MsEdgeTTS, OUTPUT_FORMAT } = require('d:/livetiktok/vtuber_battle/node_modules/msedge-tts');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
    const tts = new MsEdgeTTS();
    await tts.setMetadata('ja-JP-NanamiNeural', OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    const tempDir = 'd:/livetiktok/temp_instrumentals';
    const outDir = 'd:/livetiktok/vtuber_battle/public/songs';

    // =========================================================================
    // 1. RENAI CIRCULATION - Mika Solo Cover
    // =========================================================================
    console.log('--- Baking Renai Circulation (Mika Vocal) ---');
    const rcLyrics = `せーの！
でも そんなんじゃ だめ。
もう そんなんじゃ ほら。
こころは しんかするよ、もっと、もっと！
ふわふわり、ふわふわる、
あなたが なまえをよぶ、
それだけで ちゅうへ うかぶ。
えへへ、ミカのこと、すき？ 大好きー！`;

    const rcVocalRaw = path.join(tempDir, 'rc_vocal.mp3');
    const { audioStream: rcStream } = tts.toStream(rcLyrics, { pitch: '+12Hz', rate: '+5%' });
    const rcWs = fs.createWriteStream(rcVocalRaw);
    rcStream.pipe(rcWs);
    await new Promise(res => rcWs.on('finish', res));

    // Ambil 25s awal instrumental dan mix dengan vokal Mika
    const rcFinal = path.join(outDir, 'song_renai_circulation.mp3');
    execSync(`ffmpeg -y -ss 00:00:00 -t 00:00:26 -i "${tempDir}/rc_inst.mp3" -i "${rcVocalRaw}" -filter_complex "[0:a]volume=0.45[bgm];[1:a]adelay=300|300,volume=1.4,highpass=f=120,loudnorm=I=-14:TP=-1:LRA=10[voc];[bgm][voc]amix=inputs=2:duration=first:dropout_transition=2,afade=t=out:st=24:d=2" -b:a 192k "${rcFinal}"`);
    console.log('✅ Finished Renai Circulation Mika Cover');

    // =========================================================================
    // 2. KAWAIKUTE GOMEN - Mika Solo Cover
    // =========================================================================
    console.log('--- Baking Kawaikute Gomen (Mika Vocal) ---');
    const kgLyrics = `チュッ！かわいくて ごめん！
うまれてきちゃって ごめん！
チュッ！あざとくて ごめん！
きになっちゃうよね？ ごめん！
チュッ！かわいくて ごめん！
どりょくしちゃってて ごめん！
えへへ、ミカのこと だいすきになってねー！`;

    const kgVocalRaw = path.join(tempDir, 'kg_vocal.mp3');
    const { audioStream: kgStream } = tts.toStream(kgLyrics, { pitch: '+14Hz', rate: '+8%' });
    const kgWs = fs.createWriteStream(kgVocalRaw);
    kgStream.pipe(kgWs);
    await new Promise(res => kgWs.on('finish', res));

    // Ambil bagian reff chorus instrumental Kawaikute Gomen (sekitar 00:46)
    const kgFinal = path.join(outDir, 'song_kawaikute_gomen.mp3');
    execSync(`ffmpeg -y -ss 00:00:46.5 -t 00:00:26 -i "${tempDir}/kg_inst.mp3" -i "${kgVocalRaw}" -filter_complex "[0:a]volume=0.42[bgm];[1:a]adelay=200|200,volume=1.45,highpass=f=120,loudnorm=I=-14:TP=-1:LRA=10[voc];[bgm][voc]amix=inputs=2:duration=first:dropout_transition=2,afade=t=out:st=24:d=2" -b:a 192k "${kgFinal}"`);
    console.log('✅ Finished Kawaikute Gomen Mika Cover');

    // =========================================================================
    // 3. YOASOBI IDOL - Mika Solo Cover
    // =========================================================================
    console.log('--- Baking YOASOBI Idol (Mika Vocal) ---');
    const idolLyrics = `むてきの えがおで あらす メディア！
しりたい その ひみつ ミステリアス！
ぬけてるとこさえ かのじょの エリア、
かんぺきで うそつきな きみは、
てんさいてきな アイドルさま！
イェーイ！ミカだよー！`;

    const idolVocalRaw = path.join(tempDir, 'idol_vocal.mp3');
    const { audioStream: idolStream } = tts.toStream(idolLyrics, { pitch: '+12Hz', rate: '+10%' });
    const idolWs = fs.createWriteStream(idolVocalRaw);
    idolStream.pipe(idolWs);
    await new Promise(res => idolWs.on('finish', res));

    // Ambil bagian reff chorus instrumental Idol (sekitar 00:54)
    const idolFinal = path.join(outDir, 'song_yoasobi_idol.mp3');
    execSync(`ffmpeg -y -ss 00:00:54.2 -t 00:00:25 -i "${tempDir}/idol_inst.mp3" -i "${idolVocalRaw}" -filter_complex "[0:a]volume=0.42[bgm];[1:a]adelay=300|300,volume=1.4,highpass=f=120,loudnorm=I=-14:TP=-1:LRA=10[voc];[bgm][voc]amix=inputs=2:duration=first:dropout_transition=2,afade=t=out:st=23:d=2" -b:a 192k "${idolFinal}"`);
    console.log('✅ Finished YOASOBI Idol Mika Cover');

    console.log('🎉 ALL 3 MIKA COVERS BAKED SUCCESSFULLY!');
}

main().catch(console.error);
