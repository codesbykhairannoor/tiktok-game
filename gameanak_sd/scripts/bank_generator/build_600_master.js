/**
 * build_600_master.js
 * Assembling 600 questions across 12 categories into 60 Rounds
 * Enforcing 100% mathematical balance: exactly 2 A, 2 B, 2 C, 2 D, 2 E per round!
 */

const fs = require('fs');
const path = require('path');

const catGeo = require('./cat_geo');
const catIpa = require('./cat_ipa');
const catSky = require('./cat_sky');
const catMtk = require('./cat_mtk');
const catRch = require('./cat_rch');
const catBio = require('./cat_bio');
const catBah = require('./cat_bah');
const catSej = require('./cat_sej');
const catBud = require('./cat_bud');
const catPkn = require('./cat_pkn');
const catFis = require('./cat_fis');
const catOr  = require('./cat_or');

const categories = [
    { key: "geo", name: "Geografi & Peta Indonesia", icon: "🌍", questions: catGeo },
    { key: "ipa", name: "Sains & Dunia Hewan (IPA)", icon: "🦁", questions: catIpa },
    { key: "sky", name: "Tata Surya & Luar Angkasa", icon: "🚀", questions: catSky },
    { key: "mtk", name: "Matematika Refleks SD", icon: "📐", questions: catMtk },
    { key: "rch", name: "Teka-Teki Receh SD", icon: "🤪", questions: catRch },
    { key: "bio", name: "Tubuh Manusia & Kesehatan", icon: "🫀", questions: catBio },
    { key: "bah", name: "Bahasa Indonesia & Peribahasa", icon: "📚", questions: catBah },
    { key: "sej", name: "Sejarah & Pahlawan Nasional", icon: "🇮🇩", questions: catSej },
    { key: "bud", name: "Budaya & Rumah Adat Nusantara", icon: "🎭", questions: catBud },
    { key: "pkn", name: "PPKn & Garuda Pancasila", icon: "🦅", questions: catPkn },
    { key: "fis", name: "Benda di Sekitar & Sains Dasar", icon: "🔬", questions: catFis },
    { key: "or",  name: "Permainan Tradisional & Olahraga", icon: "⚽", questions: catOr }
];

console.log('Validating category lengths...');
categories.forEach(c => {
    console.log(`- ${c.name}: ${c.questions.length} soal`);
    if (c.questions.length !== 50) {
        throw new Error(`Kategori ${c.name} panjangnya bukan 50, melainkan ${c.questions.length}`);
    }
});

// Target letters: 5 Options
const LETTERS = ['A', 'B', 'C', 'D', 'E'];

// Simple shuffle
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const final600 = [];

// 60 Rounds total (5 series of 12 rounds)
// Seri 1: Ronde 1 - 12 (soal index 0..9)
// Seri 2: Ronde 13 - 24 (soal index 10..19)
// Seri 3: Ronde 25 - 36 (soal index 20..29)
// Seri 4: Ronde 37 - 48 (soal index 30..39)
// Seri 5: Ronde 49 - 60 (soal index 40..49)

for (let series = 0; series < 5; series++) {
    for (let catIdx = 0; catIdx < 12; catIdx++) {
        const cat = categories[catIdx];
        const roundNumber = (series * 12) + (catIdx + 1);
        const startIndex = series * 10;
        const roundRawQuestions = cat.questions.slice(startIndex, startIndex + 10);

        // Target letters for exactly 10 questions: 2 A, 2 B, 2 C, 2 D, 2 E
        const targetLetters = shuffle(['A', 'A', 'B', 'B', 'C', 'C', 'D', 'D', 'E', 'E']);

        roundRawQuestions.forEach((rawQ, qInRoundIdx) => {
            const targetLetter = targetLetters[qInRoundIdx];
            const globalIndex = startIndex + qInRoundIdx + 1;
            const qId = `${cat.key}_${String(globalIndex).padStart(3, '0')}`;

            // Shuffled distractors
            const wrongShuffled = shuffle(rawQ.salah);
            const opsi = {};
            let wrongIdx = 0;

            LETTERS.forEach(l => {
                if (l === targetLetter) {
                    opsi[l] = rawQ.jawabanBenar;
                } else {
                    opsi[l] = wrongShuffled[wrongIdx++];
                }
            });

            // Clean aliases
            const cleanAliases = (rawQ.aliases || []).filter(a => !LETTERS.map(x => x.toLowerCase()).includes(a.toLowerCase().trim()));
            cleanAliases.push(targetLetter.toLowerCase());

            final600.push({
                id: qId,
                ronde: roundNumber,
                kategori: cat.name,
                soal: rawQ.soal,
                opsi: opsi,
                jawaban: targetLetter,
                pembahasan: rawQ.pembahasan,
                aliases: cleanAliases
            });
        });
    }
}

console.log(`\n✅ Selesai merakit total: ${final600.length} soal (60 Ronde)!`);

// Verifikasi Matematis
const totalCounts = { A: 0, B: 0, C: 0, D: 0, E: 0 };
final600.forEach(q => totalCounts[q.jawaban]++);
console.log('Distribusi Kunci Jawaban Total (600 Soal):', totalCounts);

let allRoundsValid = true;
for (let r = 1; r <= 60; r++) {
    const roundQs = final600.filter(q => q.ronde === r);
    const rc = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    roundQs.forEach(q => rc[q.jawaban]++);
    if (rc.A !== 2 || rc.B !== 2 || rc.C !== 2 || rc.D !== 2 || rc.E !== 2) {
        console.error(`❌ Ronde ${r} tidak seimbang:`, rc);
        allRoundsValid = false;
    }
}

if (allRoundsValid) {
    console.log('🎯 SEMUA 60 RONDE 100% TERBUKTI SEIMBANG: TEPAT 2 A, 2 B, 2 C, 2 D, 2 E DI SETIAP RONDE!');
}

// Simpan ke d:/livetiktok/gameanak_sd/soal_sd.json
const destPath = 'd:/livetiktok/gameanak_sd/soal_sd.json';
fs.writeFileSync(destPath, JSON.stringify(final600, null, 2), 'utf8');
console.log(`📁 Berhasil disimpan ke: ${destPath}`);

