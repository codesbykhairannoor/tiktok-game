const fs = require('fs');

const rawOld = JSON.parse(fs.readFileSync('soal_cpns.json', 'utf8'));

// Ambil soal math yang sudah ada dari lolos-cpns
const baseMath = rawOld.filter(q =>
    (q.kategori && (q.kategori.includes('ARITMATIKA') || q.kategori.includes('DERET') || q.kategori.includes('SOALCERITA'))) ||
    /\d+,\s*\d+,\s*\d+/.test(q.soal)
);

console.log('Base math from repo:', baseMath.length);

// Tambahkan bank soal matematika TIU CPNS autentik berkualitas tinggi
const curatedMTK = [
    {
        id: "tiu_mtk_01",
        kategori: "TIU - BERHITUNG CEPAT",
        soal: "Nilai dari 25% dari 480 ditambah 1/3 dari 180 adalah ...",
        opsi: { A: "160", B: "170", C: "180", D: "190", E: "200" },
        jawaban: "C",
        pembahasan: "(25% × 480 = 120) + (1/3 × 180 = 60) = 120 + 60 = 180."
    },
    {
        id: "tiu_mtk_02",
        kategori: "TIU - DERET ANGKA",
        soal: "4, 7, 11, 18, 29, 47, ...",
        opsi: { A: "65", B: "76", C: "84", D: "92", E: "98" },
        jawaban: "B",
        pembahasan: "Pola Fibonacci (penjumlahan 2 angka sebelumnya): 29 + 47 = 76."
    },
    {
        id: "tiu_mtk_03",
        kategori: "TIU - SOAL CERITA",
        soal: "15 orang pekerja dapat menyelesaikan sebuah jembatan dalam waktu 24 hari. Jika pekerjaan ingin diselesaikan dalam 18 hari, berapa jumlah tambahan pekerja yang diperlukan?",
        opsi: { A: "3 orang", B: "5 orang", C: "6 orang", D: "8 orang", E: "10 orang" },
        jawaban: "B",
        pembahasan: "Total beban = 15 × 24 = 360. Pekerja baru = 360 / 18 = 20 orang. Tambahan pekerja = 20 - 15 = 5 orang."
    },
    {
        id: "tiu_mtk_04",
        kategori: "TIU - ARITMATIKA SOSIAL",
        soal: "Sebuah barang dibeli dengan harga Rp 250.000 kemudian dijual dengan keuntungan 18%. Berapakah harga jual barang tersebut?",
        opsi: { A: "Rp 285.000", B: "Rp 290.000", C: "Rp 295.000", D: "Rp 300.000", E: "Rp 305.000" },
        jawaban: "C",
        pembahasan: "Untung = 18% × 250.000 = Rp 45.000. Harga jual = 250.000 + 45.000 = Rp 295.000."
    },
    {
        id: "tiu_mtk_05",
        kategori: "TIU - ALJABAR",
        soal: "Jika x = 1/16 dan y = 16%, manakah pernyataan yang benar?",
        opsi: { A: "x > y", B: "x < y", C: "x = y", D: "x + y = 1", E: "Hubungan x dan y tidak dapat ditentukan" },
        jawaban: "B",
        pembahasan: "x = 1/16 = 0,0625 (6,25%). y = 16% = 0,16. Karena 0,0625 < 0,16, maka x < y."
    },
    {
        id: "tiu_mtk_06",
        kategori: "TIU - DERET ANGKA",
        soal: "2, 5, 10, 17, 26, 37, ...",
        opsi: { A: "48", B: "49", C: "50", D: "52", E: "54" },
        jawaban: "C",
        pembahasan: "Pola n² + 1: 1²+1=2, 2²+1=5, 3²+1=10, 4²+1=17, 5²+1=26, 6²+1=37, 7²+1=50."
    },
    {
        id: "tiu_mtk_07",
        kategori: "TIU - KECEPATAN & JARAK",
        soal: "Budi mengendarai motor dengan kecepatan 45 km/jam menempuh perjalanan selama 3 jam 20 menit. Jarak yang ditempuh Budi adalah ...",
        opsi: { A: "135 km", B: "145 km", C: "150 km", D: "160 km", E: "175 km" },
        jawaban: "C",
        pembahasan: "3 jam 20 menit = 3 1/3 jam = 10/3 jam. Jarak = 45 × (10/3) = 150 km."
    },
    {
        id: "tiu_mtk_08",
        kategori: "TIU - PERBANDINGAN UMUR",
        soal: "Umur Ayah saat ini 3 kali umur Budi. Enam tahun yang lalu umur Ayah 4 kali umur Budi. Berapa umur Budi sekarang?",
        opsi: { A: "12 tahun", B: "15 tahun", C: "18 tahun", D: "20 tahun", E: "24 tahun" },
        jawaban: "C",
        pembahasan: "A = 3B. Enam tahun lalu: (A - 6) = 4(B - 6) -> 3B - 6 = 4B - 24 -> B = 18 tahun."
    },
    {
        id: "tiu_mtk_09",
        kategori: "TIU - BERHITUNG CEPAT",
        soal: "Hasil dari (√144 + √81) × 2² - 15 = ...",
        opsi: { A: "59", B: "69", C: "79", D: "84", E: "89" },
        jawaban: "B",
        pembahasan: "(12 + 9) × 4 - 15 = 21 × 4 - 15 = 84 - 15 = 69."
    },
    {
        id: "tiu_mtk_10",
        kategori: "TIU - PEKERJAAN BERSAMA",
        soal: "Andi dapat mengecat dinding dalam 4 jam, sedangkan Budi dapat mengecatnya dalam 6 jam. Jika mereka bekerja bersama-sama, waktu yang dibutuhkan adalah ...",
        opsi: { A: "2 jam", B: "2,4 jam", C: "2,5 jam", D: "3 jam", E: "3,2 jam" },
        jawaban: "B",
        pembahasan: "1/T = 1/4 + 1/6 = 3/12 + 2/12 = 5/12. T = 12/5 = 2,4 jam (2 jam 24 menit)."
    },
    {
        id: "tiu_mtk_11",
        kategori: "TIU - DERET ANGKA",
        soal: "1, 2, 4, 7, 11, 16, 22, ...",
        opsi: { A: "27", B: "28", C: "29", D: "30", E: "32" },
        jawaban: "C",
        pembahasan: "Pola selisih bertambah 1: +1, +2, +3, +4, +5, +6, lalu +7. 22 + 7 = 29."
    },
    {
        id: "tiu_mtk_12",
        kategori: "TIU - BERHITUNG CEPAT",
        soal: "Jika 0,375 dari suatu bilangan adalah 45, berapakah bilangan tersebut?",
        opsi: { A: "100", B: "110", C: "120", D: "130", E: "140" },
        jawaban: "C",
        pembahasan: "0,375 = 3/8. Bilangan = 45 ÷ (3/8) = 45 × 8 / 3 = 120."
    },
    {
        id: "tiu_mtk_13",
        kategori: "TIU - ARITMATIKA SOSIAL",
        soal: "Sebuah toko memberikan diskon ganda 30% + 20%. Diskon tunggal yang setara dengan diskon ganda tersebut adalah ...",
        opsi: { A: "44%", B: "46%", C: "48%", D: "50%", E: "52%" },
        jawaban: "A",
        pembahasan: "Harga bayar = (1 - 0,30) × (1 - 0,20) = 0,70 × 0,80 = 0,56 (56%). Diskon total = 100% - 56% = 44%."
    },
    {
        id: "tiu_mtk_14",
        kategori: "TIU - DERET HURUF & ANGKA",
        soal: "A, 2, C, 4, E, 8, G, 16, ...",
        opsi: { A: "H, 32", B: "I, 32", C: "I, 24", D: "J, 32", E: "H, 24" },
        jawaban: "B",
        pembahasan: "Dua deret selang-seling: Huruf loncat 1 (A, C, E, G, I) dan Angka kali 2 (2, 4, 8, 16, 32). Jawabannya I, 32."
    },
    {
        id: "tiu_mtk_15",
        kategori: "TIU - PERBANDINGAN",
        soal: "Sebuah mobil membutuhkan 8 liter bensin untuk menempuh jarak 96 km. Berapa liter bensin yang diperlukan untuk menempuh jarak 144 km?",
        opsi: { A: "10 liter", B: "11 liter", C: "12 liter", D: "13 liter", E: "14 liter" },
        jawaban: "C",
        pembahasan: "Konsumsi = 96 / 8 = 12 km/liter. Kebutuhan = 144 / 12 = 12 liter."
    },
    {
        id: "tiu_mtk_16",
        kategori: "TIU - BERHITUNG CEPAT",
        soal: "Berapakah hasil dari 75² - 25² = ...",
        opsi: { A: "4.500", B: "5.000", C: "5.500", D: "6.000", E: "6.500" },
        jawaban: "B",
        pembahasan: "Rumus a² - b² = (a+b)(a-b) = (75 + 25)(75 - 25) = 100 × 50 = 5.000."
    },
    {
        id: "tiu_mtk_17",
        kategori: "TIU - DERET ANGKA",
        soal: "81, 27, 9, 3, 1, ...",
        opsi: { A: "1/2", B: "1/3", C: "1/4", D: "0", E: "-1" },
        jawaban: "B",
        pembahasan: "Pola pembagian 3 berturut-turut: 1 ÷ 3 = 1/3."
    },
    {
        id: "tiu_mtk_18",
        kategori: "TIU - SOAL CERITA",
        soal: "Rata-rata nilai ujian matematika dari 19 siswa adalah 72. Jika nilai seorang siswa baru digabungkan, nilai rata-ratanya menjadi 73. Berapakah nilai siswa baru tersebut?",
        opsi: { A: "88", B: "90", C: "92", D: "94", E: "96" },
        jawaban: "C",
        pembahasan: "Total 20 siswa = 20 × 73 = 1.460. Total 19 siswa = 19 × 72 = 1.368. Nilai siswa baru = 1.460 - 1.368 = 92."
    },
    {
        id: "tiu_mtk_19",
        kategori: "TIU - ALJABAR",
        soal: "Jika a = 4, b = 3, dan c = (a + 2b) / ab, maka nilai dari (a + b) / c adalah ...",
        opsi: { A: "8,4", B: "8,8", C: "9,2", D: "9,6", E: "10,2" },
        jawaban: "A",
        pembahasan: "c = (4 + 6) / 12 = 10/12 = 5/6. Maka (4 + 3) ÷ (5/6) = 7 × 6 / 5 = 42/5 = 8,4."
    },
    {
        id: "tiu_mtk_20",
        kategori: "TIU - DERET ANGKA",
        soal: "5, 8, 16, 19, 38, 41, ...",
        opsi: { A: "44", B: "62", C: "78", D: "82", E: "86" },
        jawaban: "D",
        pembahasan: "Pola selang-seling (+3, ×2): 5+3=8, 8×2=16, 16+3=19, 19×2=38, 38+3=41, 41×2=82."
    },
    {
        id: "tiu_mtk_21",
        kategori: "TIU - BERHITUNG CEPAT",
        soal: "Nilai dari 12,5% dari 512 adalah ...",
        opsi: { A: "56", B: "60", C: "64", D: "68", E: "72" },
        jawaban: "C",
        pembahasan: "12,5% = 1/8. Maka 512 ÷ 8 = 64."
    },
    {
        id: "tiu_mtk_22",
        kategori: "TIU - BERPAPASAN",
        soal: "Kota P dan Q berjarak 180 km. Dari P, Doni berangkat pukul 08.00 dengan kecepatan 40 km/jam menuju Q. Dari Q, Roni berangkat pukul 08.00 dengan kecepatan 50 km/jam menuju P. Pukul berapa mereka berpapasan?",
        opsi: { A: "09.30", B: "10.00", C: "10.15", D: "10.30", E: "11.00" },
        jawaban: "B",
        pembahasan: "Waktu = Jarak / (V1 + V2) = 180 / (40 + 50) = 180 / 90 = 2 jam. Berpapasan = 08.00 + 2 jam = 10.00."
    },
    {
        id: "tiu_mtk_23",
        kategori: "TIU - DERET ANGKA",
        soal: "12, 14, 18, 26, 42, ...",
        opsi: { A: "58", B: "64", C: "70", D: "74", E: "82" },
        jawaban: "D",
        pembahasan: "Selisih berlipat ganda: +2, +4, +8, +16, lalu +32. 42 + 32 = 74."
    },
    {
        id: "tiu_mtk_24",
        kategori: "TIU - SOAL CERITA",
        soal: "Dalam suatu kelas terdapat 40 siswa. 25 siswa menyukai matematika, 20 siswa menyukai fisika, dan 5 siswa tidak menyukai keduanya. Berapa siswa yang menyukai keduanya?",
        opsi: { A: "5 orang", B: "8 orang", C: "10 orang", D: "12 orang", E: "15 orang" },
        jawaban: "C",
        pembahasan: "Total suka setidaknya satu = 40 - 5 = 35. Irisan (keduanya) = (25 + 20) - 35 = 45 - 35 = 10 orang."
    },
    {
        id: "tiu_mtk_25",
        kategori: "TIU - BERHITUNG CEPAT",
        soal: "Jika x = 25² - 24² dan y = 7, maka hubungan x dan y adalah ...",
        opsi: { A: "x > y²", B: "x = y²", C: "x < y", D: "x = y", E: "Hubungan tidak dapat ditentukan" },
        jawaban: "B",
        pembahasan: "x = (25+24)(25-24) = 49 × 1 = 49. y = 7 -> y² = 49. Jadi x = y²."
    },
    {
        id: "tiu_mtk_26",
        kategori: "TIU - DERET ANGKA",
        soal: "1, 3, 7, 15, 31, 63, ...",
        opsi: { A: "95", B: "112", C: "127", D: "135", E: "142" },
        jawaban: "C",
        pembahasan: "Pola: (n × 2) + 1. 63 × 2 + 1 = 127."
    },
    {
        id: "tiu_mtk_27",
        kategori: "TIU - BERHITUNG CEPAT",
        soal: "Berapakah nilai dari (0,125 × 64) + (0,5 × 36)?",
        opsi: { A: "22", B: "24", C: "26", D: "28", E: "30" },
        jawaban: "C",
        pembahasan: "(1/8 × 64 = 8) + (1/2 × 36 = 18) = 8 + 18 = 26."
    },
    {
        id: "tiu_mtk_28",
        kategori: "TIU - SOAL CERITA",
        soal: "Sebuah bak mandi bervolume 1.200 liter diisi kran dengan debit 40 liter/menit. Berapa lama bak tersebut terisi penuh?",
        opsi: { A: "25 menit", B: "30 menit", C: "35 menit", D: "40 menit", E: "45 menit" },
        jawaban: "B",
        pembahasan: "Waktu = Volume / Debit = 1.200 / 40 = 30 menit."
    },
    {
        id: "tiu_mtk_29",
        kategori: "TIU - DERET ANGKA",
        soal: "100, 90, 81, 73, 66, ...",
        opsi: { A: "58", B: "60", C: "61", D: "62", E: "63" },
        jawaban: "B",
        pembahasan: "Selisih: -10, -9, -8, -7, lalu -6. 66 - 6 = 60."
    },
    {
        id: "tiu_mtk_30",
        kategori: "TIU - ALJABAR",
        soal: "Jika 4x - 7 = 2x + 9, maka nilai x adalah ...",
        opsi: { A: "6", B: "7", C: "8", D: "9", E: "10" },
        jawaban: "C",
        pembahasan: "4x - 2x = 9 + 7 -> 2x = 16 -> x = 8."
    },
    {
        id: "tiu_mtk_31",
        kategori: "TIU - ARITMATIKA SOSIAL",
        soal: "Pedagang menjual sepeda motor seharga Rp 12.000.000 dan mengalami kerugian 20%. Berapakah harga beli sepeda motor tersebut?",
        opsi: { A: "Rp 14.000.000", B: "Rp 14.500.000", C: "Rp 15.000.000", D: "Rp 15.500.000", E: "Rp 16.000.000" },
        jawaban: "C",
        pembahasan: "Harga jual = 80% dari harga beli. Harga beli = 12.000.000 / 0,8 = Rp 15.000.000."
    },
    {
        id: "tiu_mtk_32",
        kategori: "TIU - BERHITUNG CEPAT",
        soal: "3/4 dari suatu bilangan adalah 48. Berapakah 2/3 dari bilangan tersebut?",
        opsi: { A: "36", B: "40", C: "42", D: "42,6", E: "42,67" },
        jawaban: "D",
        pembahasan: "Bilangan = 48 × 4 / 3 = 64. 2/3 × 64 = 128 / 3 = 42,67 (dibulatkan 42,67)."
    },
    {
        id: "tiu_mtk_33",
        kategori: "TIU - DERET ANGKA",
        soal: "6, 12, 10, 20, 18, 36, ...",
        opsi: { A: "32", B: "34", C: "38", D: "40", E: "72" },
        jawaban: "B",
        pembahasan: "Pola: (×2, -2). 6×2=12, 12-2=10, 10×2=20, 20-2=18, 18×2=36, 36-2=34."
    },
    {
        id: "tiu_mtk_34",
        kategori: "TIU - PERBANDINGAN",
        soal: "Pakan ayam sebanyak 30 kg cukup untuk 20 ekor ayam selama 6 hari. Jika ayam bertambah menjadi 30 ekor, pakan tersebut akan habis dalam ...",
        opsi: { A: "3 hari", B: "4 hari", C: "4,5 hari", D: "5 hari", E: "5,5 hari" },
        jawaban: "B",
        pembahasan: "Perbandingan berbalik nilai: (20 × 6) / 30 = 120 / 30 = 4 hari."
    },
    {
        id: "tiu_mtk_35",
        kategori: "TIU - BERHITUNG CEPAT",
        soal: "Nilai dari 15² + 20² = ...",
        opsi: { A: "525", B: "575", C: "625", D: "675", E: "725" },
        jawaban: "C",
        pembahasan: "225 + 400 = 625 (Triple Pythagoras 15, 20, 25)."
    },
    {
        id: "tiu_mtk_36",
        kategori: "TIU - KECEPATAN & JARAK",
        soal: "Sebuah kereta melaju dengan kecepatan 72 km/jam. Kecepatan kereta tersebut setara dengan ... m/detik.",
        opsi: { A: "15 m/detik", B: "18 m/detik", C: "20 m/detik", D: "25 m/detik", E: "30 m/detik" },
        jawaban: "C",
        pembahasan: "72 km/jam = (72 × 1.000) / 3.600 = 72.000 / 3.600 = 20 m/detik."
    },
    {
        id: "tiu_mtk_37",
        kategori: "TIU - DERET ANGKA",
        soal: "1, 8, 27, 64, 125, ...",
        opsi: { A: "196", B: "216", C: "225", D: "243", E: "256" },
        jawaban: "B",
        pembahasan: "Deret bilangan kubik (n³): 1³, 2³, 3³, 4³, 5³, lalu 6³ = 216."
    },
    {
        id: "tiu_mtk_38",
        kategori: "TIU - BERHITUNG CEPAT",
        soal: "Berapakah 35% dari 140?",
        opsi: { A: "45", B: "47", C: "49", D: "51", E: "53" },
        jawaban: "C",
        pembahasan: "35% × 140 = (35 × 14) / 10 = 490 / 10 = 49."
    },
    {
        id: "tiu_mtk_39",
        kategori: "TIU - SOAL CERITA",
        soal: "Jika luas persegi adalah 196 cm², maka keliling persegi tersebut adalah ...",
        opsi: { A: "48 cm", B: "52 cm", C: "56 cm", D: "60 cm", E: "64 cm" },
        jawaban: "C",
        pembahasan: "Sisi = √196 = 14 cm. Keliling = 4 × 14 = 56 cm."
    },
    {
        id: "tiu_mtk_40",
        kategori: "TIU - DERET ANGKA",
        soal: "3, 5, 8, 12, 17, 23, ...",
        opsi: { A: "28", B: "29", C: "30", D: "31", E: "32" },
        jawaban: "C",
        pembahasan: "Selisih bertambah 1: +2, +3, +4, +5, +6, lalu +7. 23 + 7 = 30."
    },
    {
        id: "tiu_mtk_41",
        kategori: "TIU - ALJABAR",
        soal: "Jika x² = 64 dan y = 8, manakah pernyataan yang tepat?",
        opsi: { A: "x = y", B: "x > y", C: "x < y", D: "x ≤ y", E: "x ≥ y" },
        jawaban: "D",
        pembahasan: "x² = 64 -> x bisa bernilai 8 atau -8. Karena x = 8 atau x = -8, dan y = 8, maka nilai x selalu lebih kecil atau sama dengan y (x ≤ y)."
    },
    {
        id: "tiu_mtk_42",
        kategori: "TIU - BERHITUNG CEPAT",
        soal: "Hasil dari (14 × 15) - (12 × 15) = ...",
        opsi: { A: "20", B: "25", C: "30", D: "35", E: "40" },
        jawaban: "C",
        pembahasan: "Sifat distributif: (14 - 12) × 15 = 2 × 15 = 30."
    },
    {
        id: "tiu_mtk_43",
        kategori: "TIU - DERET ANGKA",
        soal: "50, 48, 44, 38, 30, ...",
        opsi: { A: "18", B: "20", C: "22", D: "24", E: "26" },
        jawaban: "B",
        pembahasan: "Selisih pengurangan genap: -2, -4, -6, -8, lalu -10. 30 - 10 = 20."
    },
    {
        id: "tiu_mtk_44",
        kategori: "TIU - SOAL CERITA",
        soal: "Tiga buah bilangan genap berurutan memiliki jumlah 78. Bilangan yang terbesar adalah ...",
        opsi: { A: "24", B: "26", C: "28", D: "30", E: "32" },
        jawaban: "C",
        pembahasan: "Tengah = 78 / 3 = 26. Ketiga bilangan: 24, 26, 28. Terbesar = 28."
    },
    {
        id: "tiu_mtk_45",
        kategori: "TIU - BERHITUNG CEPAT",
        soal: "Berapakah 2/5 dari 350 dikurangi 1/4 dari 200?",
        opsi: { A: "80", B: "85", C: "90", D: "95", E: "100" },
        jawaban: "C",
        pembahasan: "(2/5 × 350 = 140) - (1/4 × 200 = 50) = 140 - 50 = 90."
    },
    {
        id: "tiu_mtk_46",
        kategori: "TIU - DERET ANGKA",
        soal: "2, 4, 12, 48, 240, ...",
        opsi: { A: "720", B: "960", C: "1.200", D: "1.440", E: "1.680" },
        jawaban: "D",
        pembahasan: "Pola faktorial/kali bertingkat: ×2, ×3, ×4, ×5, lalu ×6. 240 × 6 = 1.440."
    },
    {
        id: "tiu_mtk_47",
        kategori: "TIU - PERBANDINGAN",
        soal: "Uang Soni berbanding uang Rian adalah 4 : 7. Jika selisih uang mereka Rp 45.000, berapa total uang keduanya?",
        opsi: { A: "Rp 145.000", B: "Rp 155.000", C: "Rp 165.000", D: "Rp 175.000", E: "Rp 180.000" },
        jawaban: "C",
        pembahasan: "Selisih rasio = 7 - 4 = 3. 1 bagian = 45.000 / 3 = 15.000. Total rasio = 4 + 7 = 11. Total = 11 × 15.000 = Rp 165.000."
    },
    {
        id: "tiu_mtk_48",
        kategori: "TIU - ARITMATIKA SOSIAL",
        soal: "Ibu membeli 5 kg beras seharga Rp 65.000. Jika Ibu ingin membeli 12 kg beras yang sama, berapa uang yang harus dibayar?",
        opsi: { A: "Rp 144.000", B: "Rp 150.000", C: "Rp 156.000", D: "Rp 160.000", E: "Rp 168.000" },
        jawaban: "C",
        pembahasan: "Harga per kg = 65.000 / 5 = 13.000. Untuk 12 kg = 12 × 13.000 = Rp 156.000."
    },
    {
        id: "tiu_mtk_49",
        kategori: "TIU - BERHITUNG CEPAT",
        soal: "Nilai dari √0,0049 adalah ...",
        opsi: { A: "0,007", B: "0,07", C: "0,7", D: "7", E: "0,049" },
        jawaban: "B",
        pembahasan: "0,07 × 0,07 = 0,0049. Jadi √0,0049 = 0,07."
    },
    {
        id: "tiu_mtk_50",
        kategori: "TIU - DERET ANGKA",
        soal: "9, 9, 9, 6, 9, 3, ...",
        opsi: { A: "9, 0", B: "9, 1", C: "0, 9", D: "9, -1", E: "3, 9" },
        jawaban: "A",
        pembahasan: "Dua deret selang-seling: Suku ganjil bernilai konstan (9, 9, 9, 9). Suku genap berkurang 3 (9, 6, 3, 0). Jadi kelanjutannya 9, lalu 0."
    }
];

// Gabungkan baseMath dan curatedMTK
const allMath = [...baseMath, ...curatedMTK];

// Berikan ID bersih
const cleaned = allMath.map((q, idx) => ({
    id: `cpns_mtk_${String(idx + 1).padStart(3, '0')}`,
    kategori: q.kategori.replace('TIU - ', '').trim(),
    soal: q.soal,
    opsi: q.opsi,
    jawaban: q.jawaban,
    pembahasan: q.pembahasan
}));

fs.writeFileSync('soal_cpns_mtk.json', JSON.stringify(cleaned, null, 2), 'utf8');
console.log('Total bank soal MTK CPNS berhasil dibuat:', cleaned.length);
