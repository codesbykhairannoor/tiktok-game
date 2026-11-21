/**
 * cat_fis.js - 50 Soal Benda di Sekitar & Sains Dasar
 */

module.exports = [
  // 1-10
  {
    soal: "Perubahan wujud benda dari padat menjadi cair seperti es yang mencair di suhu ruang disebut...",
    jawabanBenar: "Mencair (Melebur)",
    salah: ["Membeku", "Menguap", "Menyublim", "Mengembun"],
    pembahasan: "Mencair terjadi karena benda padat menyerap energi panas dari lingkungannya.",
    aliases: ["mencair", "melebur"]
  },
  {
    soal: "Perubahan wujud benda dari cair menjadi padat seperti air dimasukkan ke dalam freezer kulkas disebut...",
    jawabanBenar: "Membeku",
    salah: ["Mencair", "Menguap", "Mengembun", "Mengkristal"],
    pembahasan: "Membeku melepaskan kalor sehingga suhu cairan turun hingga titik bekunya.",
    aliases: ["membeku"]
  },
  {
    soal: "Perubahan wujud benda dari cair menjadi gas saat air dipanaskan hingga mendidih disebut...",
    jawabanBenar: "Menguap",
    salah: ["Membeku", "Menyublim", "Mengembun", "Mencair"],
    pembahasan: "Menguap mengubah cairan menjadi partikel uap gas karena menyerap panas.",
    aliases: ["menguap"]
  },
  {
    soal: "Munculnya titik-titik air di luar dinding gelas berisi es atau pada daun rumput di pagi hari disebut...",
    jawabanBenar: "Mengembun",
    salah: ["Menguap", "Menyublim", "Mencair", "Membeku"],
    pembahasan: "Mengembun adalah perubahan wujud gas udara menjadi butiran air cair karena penurunan suhu.",
    aliases: ["mengembun"]
  },
  {
    soal: "Perubahan wujud benda dari padat langsung menjadi gas tanpa mencair terlebih dahulu seperti kapur barus disebut...",
    jawabanBenar: "Menyublim",
    salah: ["Menguap", "Mengkristal", "Mencair", "Membeku"],
    pembahasan: "Kapur barus dan dry ice (es kering) menyublim langsung menjadi uap gas.",
    aliases: ["menyublim"]
  },
  {
    soal: "Benda yang dapat menghantarkan panas dan arus listrik dengan sangat baik disebut...",
    jawabanBenar: "Konduktor",
    salah: ["Isolator", "Semikonduktor", "Resistor", "Radiator"],
    pembahasan: "Logam seperti tembaga, besi, dan aluminium adalah contoh konduktor yang baik.",
    aliases: ["konduktor"]
  },
  {
    soal: "Benda yang tidak dapat menghantarkan panas atau listrik seperti kayu, plastik, dan kain disebut...",
    jawabanBenar: "Isolator",
    salah: ["Konduktor", "Kondensator", "Transistor", "Generator"],
    pembahasan: "Isolator digunakan pada pegangan panci dan lapisan pembungkus kabel listrik agar aman dipegang.",
    aliases: ["isolator"]
  },
  {
    soal: "Kutub magnet yang senama (misalnya kutub Utara didekatkan dengan kutub Utara) akan saling...",
    jawabanBenar: "Tolak-menolak",
    salah: ["Tarik-menarik", "Menempel erat", "Meleleh", "Menjadi netral"],
    pembahasan: "Hukum dasar magnet: kutub senama tolak-menolak, kutub tidak senama saling tarik-menarik.",
    aliases: ["tolak menolak", "tolak-menolak"]
  },
  {
    soal: "Kutub magnet yang berbeda nama (Utara dengan Selatan) jika didekatkan akan saling...",
    jawabanBenar: "Tarik-menarik",
    salah: ["Tolak-menolak", "Berputar menjauh", "Meledak", "Hilang kemagnetannya"],
    pembahasan: "Kutub Utara dan Kutub Selatan memiliki medan magnet berlawanan arah sehingga tarik-menarik.",
    aliases: ["tarik menarik", "tarik-menarik"]
  },
  {
    soal: "Alat navigasi penunjuk arah mata angin yang memanfaatkan sifat jarum magnetik adalah...",
    jawabanBenar: "Kompas",
    salah: ["Barometer", "Speedometer", "Termometer", "Altimeter"],
    pembahasan: "Jarum kompas selalu menunjuk ke arah utara dan selatan kutub magnetik bumi.",
    aliases: ["kompas"]
  },

  // 11-20
  {
    soal: "Alat yang digunakan untuk mengukur derajat suhu panas atau dingin suatu benda adalah...",
    jawabanBenar: "Termometer",
    salah: ["Barometer", "Higrometer", "Speedometer", "Anemometer"],
    pembahasan: "Termometer menggunakan pemuaian zat cair raksa atau alkohol di dalam tabung kaca berskala.",
    aliases: ["termometer"]
  },
  {
    soal: "Titik beku air murni pada tekanan udara normal adalah...",
    jawabanBenar: "0 derajat Celsius",
    salah: ["100 derajat Celsius", "50 derajat Celsius", "-10 derajat Celsius", "32 derajat Celsius"],
    pembahasan: "Air murni membeku menjadi es padat tepat pada suhu 0°C.",
    aliases: ["0 derajat", "0 celcius", "0"]
  },
  {
    soal: "Titik didih air murni pada tekanan udara normal (1 atmosfer) adalah...",
    jawabanBenar: "100 derajat Celsius",
    salah: ["50 derajat Celsius", "0 derajat Celsius", "200 derajat Celsius", "80 derajat Celsius"],
    pembahasan: "Air mendidih dan berubah menjadi uap air bergejolak pada suhu 100°C.",
    aliases: ["100 derajat", "100 celcius", "100"]
  },
  {
    soal: "Perpindahan panas yang disertai dengan perpindahan partikel zat perantaranya (seperti merebus air) disebut...",
    jawabanBenar: "Konveksi",
    salah: ["Konduksi", "Radiasi", "Evaporasi", "Kondensasi"],
    pembahasan: "Konveksi terjadi pada zat cair dan gas, di mana air panas naik dan air dingin turun bersirkulasi.",
    aliases: ["konveksi"]
  },
  {
    soal: "Perpindahan panas melalui zat padat tanpa disertai perpindahan partikel zatnya (seperti sendok panas dalam kopi) disebut...",
    jawabanBenar: "Konduksi",
    salah: ["Konveksi", "Radiasi", "Sublimasi", "Resonansi"],
    pembahasan: "Konduksi terjadi karena getaran partikel logam merambatkan energi panas ke ujung lainnya.",
    aliases: ["konduksi"]
  },
  {
    soal: "Perpindahan panas secara langsung tanpa memerlukan zat perantara (seperti pancaran sinar matahari ke bumi) disebut...",
    jawabanBenar: "Radiasi (Pancaran)",
    salah: ["Konduksi", "Konveksi", "Transmisi", "Refleksi"],
    pembahasan: "Radiasi merambat melalui gelombang elektromagnetik bahkan melintasi ruang hampa udara.",
    aliases: ["radiasi"]
  },
  {
    soal: "Sifat cahaya yang tampak saat berkas sinar lampu senter lurus di malam berkabut membuktikan bahwa cahaya...",
    jawabanBenar: "Merambat lurus",
    salah: ["Dapat dibiaskan", "Dapat diuraikan", "Menembus benda gelap", "Berputar"],
    pembahasan: "Cahaya merambat lurus dari sumbernya melewati medium yang seragam.",
    aliases: ["merambat lurus"]
  },
  {
    soal: "Peristiwa pensil yang tampak patah atau bengkok ketika dicelupkan ke dalam gelas berisi air adalah bukti bahwa cahaya...",
    jawabanBenar: "Dapat dibiaskan (mengalami pembiasan / refraksi)",
    salah: ["Dapat dipantulkan", "Merambat lurus", "Dapat diserap habis", "Dapat diuraikan"],
    pembahasan: "Pembiasan terjadi karena cahaya merambat melalui dua medium yang berbeda kerapatan optiknya (udara ke air).",
    aliases: ["dapat dibiaskan", "pembiasan", "refraksi"]
  },
  {
    soal: "Terjadinya pelangi indah berwarna-warni di langit setelah hujan reda membuktikan bahwa cahaya putih matahari...",
    jawabanBenar: "Dapat diuraikan (Dispersi cahaya)",
    salah: ["Dapat dibiaskan saja", "Merambat lurus", "Dapat diserap air", "Menembus cermin"],
    pembahasan: "Titik-titik air hujan bertindak seperti prisma kaca yang menguraikan cahaya putih menjadi spektrum mejikuhibiniu.",
    aliases: ["dapat diuraikan", "dispersi", "diuraikan"]
  },
  {
    soal: "Bayangan yang dihasilkan oleh cermin datar yang biasa kita gunakan untuk berhias memiliki sifat...",
    jawabanBenar: "Sama besar, tegak, dan maya (terbalik kiri-kanan)",
    salah: [
      "Lebih kecil dan terbalik",
      "Lebih besar dan nyata",
      "Nyata dan terbalik ke bawah",
      "Berubah-ubah warna"
    ],
    pembahasan: "Cermin datar membentuk bayangan maya yang ukurannya persis sama dengan benda aslinya.",
    aliases: ["sama besar dan tegak", "sama besar", "maya"]
  },

  // 21-30
  {
    soal: "Cermin yang digunakan pada kaca spion kendaraan agar jangkauan pandangan ke belakang lebih luas adalah...",
    jawabanBenar: "Cermin cembung",
    salah: ["Cermin cekung", "Cermin datar", "Kaca pembesar", "Lensa cekung"],
    pembahasan: "Cermin cembung selalu menghasilkan bayangan tegak, maya, dan diperkecil sehingga bidang pandangnya luas.",
    aliases: ["cermin cembung"]
  },
  {
    soal: "Cermin yang digunakan oleh dokter gigi untuk melihat gigi berlubang tampak lebih besar dan jelas adalah...",
    jawabanBenar: "Cermin cekung",
    salah: ["Cermin cembung", "Cermin datar", "Kaca jendela", "Prisma"],
    pembahasan: "Benda yang diletakkan sangat dekat di depan cermin cekung akan menghasilkan bayangan tegak dan diperbesar.",
    aliases: ["cermin cekung"]
  },
  {
    soal: "Gaya yang timbul akibat gesekan antara dua permukaan benda yang saling bersentuhan dinamakan gaya...",
    jawabanBenar: "Gaya gesek",
    salah: ["Gaya pegas", "Gaya gravitasi", "Gaya magnet", "Gaya otot"],
    pembahasan: "Gaya gesek arahnya selalu berlawanan dengan arah gerak benda dan dapat memperlambat gerak.",
    aliases: ["gaya gesek", "gesek"]
  },
  {
    soal: "Ban mobil dan motor dibuat memiliki alur ulir bergerigi di permukaannya dengan tujuan untuk...",
    jawabanBenar: "Memperbesar gaya gesek agar ban tidak licin selip di jalan",
    salah: [
      "Membuat mobil melaju lebih kencang",
      "Memperindah tampilan ban",
      "Menghemat penggunaan karet ban",
      "Meringankan beban kendaraan"
    ],
    pembahasan: "Alur ban mencengkeram aspal basah sehingga ban tidak tergelincir saat mengerem.",
    aliases: ["memperbesar gaya gesek", "tidak licin", "mencegah selip"]
  },
  {
    soal: "Gaya tarik bumi yang menyebabkan buah kelapa jatuh ke bawah menuju tanah adalah gaya...",
    jawabanBenar: "Gaya gravitasi",
    salah: ["Gaya magnet", "Gaya gesek", "Gaya pegas", "Gaya sentripetal"],
    pembahasan: "Gravitasi bumi menarik semua benda bermassa di dekatnya menuju pusat bumi.",
    aliases: ["gravitasi", "gaya gravitasi"]
  },
  {
    soal: "Gaya lentur yang terjadi saat kita menarik tali busur panah atau melompat di atas trampolin adalah gaya...",
    jawabanBenar: "Gaya pegas",
    salah: ["Gaya gesek", "Gaya magnet", "Gaya mesin", "Gaya gravitasi"],
    pembahasan: "Gaya pegas timbul pada benda elastis yang diregangkan atau dimampatkan.",
    aliases: ["gaya pegas", "pegas"]
  },
  {
    soal: "Perubahan bentuk energi yang terjadi pada setrika listrik dan penanak nasi (rice cooker) adalah...",
    jawabanBenar: "Energi listrik menjadi energi panas (kalor)",
    salah: [
      "Energi listrik menjadi energi gerak",
      "Energi listrik menjadi energi cahaya",
      "Energi kimia menjadi energi panas",
      "Energi panas menjadi energi listrik"
    ],
    pembahasan: "Elemen pemanas kawat nikelin pada setrika mengubah arus listrik menjadi kalor.",
    aliases: ["listrik menjadi panas", "panas"]
  },
  {
    soal: "Perubahan bentuk energi yang terjadi pada kipas angin, blender, dan mesin cuci adalah...",
    jawabanBenar: "Energi listrik menjadi energi gerak (kinetik)",
    salah: [
      "Energi listrik menjadi energi panas",
      "Energi listrik menjadi energi kimia",
      "Energi gerak menjadi energi listrik",
      "Energi bunyi menjadi energi gerak"
    ],
    pembahasan: "Motor dinamo listrik memutar baling-baling mengubah listrik menjadi gerak kinetik.",
    aliases: ["listrik menjadi gerak", "gerak"]
  },
  {
    soal: "Perubahan bentuk energi yang terjadi pada radio dan bel pintu rumah adalah...",
    jawabanBenar: "Energi listrik menjadi energi bunyi",
    salah: [
      "Energi listrik menjadi energi gerak",
      "Energi listrik menjadi energi kimia",
      "Energi bunyi menjadi energi listrik",
      "Energi panas menjadi bunyi"
    ],
    pembahasan: "Loudspeaker mengubah sinyal listrik frekuensi suara menjadi gelombang getaran bunyi.",
    aliases: ["listrik menjadi bunyi", "bunyi"]
  },
  {
    soal: "Alat panel surya (solar cell) berfungsi untuk mengubah energi matahari menjadi...",
    jawabanBenar: "Energi listrik",
    salah: ["Energi gerak langsung", "Energi kimia cair", "Energi nuklir", "Energi angin"],
    pembahasan: "Sel fotovoltaik pada panel surya mengubah foton cahaya matahari menjadi arus listrik DC ramah lingkungan.",
    aliases: ["energi listrik", "listrik"]
  },

  // 31-40
  {
    soal: "Pembangkit Listrik Tenaga Air (PLTA) memanfaatkan aliran deras air terjun atau waduk untuk memutar...",
    jawabanBenar: "Turbin air yang menggerakkan generator",
    salah: ["Panel surya", "Ketel uap batu bara", "Kincir angin", "Motor aki"],
    pembahasan: "Putaran turbin memutar rotor generator untuk menghasilkan arus listrik tegangan tinggi.",
    aliases: ["turbin", "turbin air", "generator"]
  },
  {
    soal: "Sumber energi yang tidak akan pernah habis meskipun digunakan secara terus-menerus disebut energi...",
    jawabanBenar: "Energi terbarukan (Matahari, air, angin)",
    salah: ["Minyak bumi", "Batu bara", "Gas alam", "Bahan bakar fosil"],
    pembahasan: "Energi terbarukan ramah lingkungan dan tersedia melimpah di alam tanpa habis.",
    aliases: ["energi terbarukan", "terbarukan"]
  },
  {
    soal: "Benda yang dibuat dari kaca bening tebal melengkung untuk memperbesar tulisan kecil adalah...",
    jawabanBenar: "Lup (Kaca pembesar)",
    salah: ["Periskop", "Teleskop bintang", "Kacamata hitam", "Cermin datar"],
    pembahasan: "Lup menggunakan sebuah lensa cembung untuk membentuk bayangan maya, tegak, dan diperbesar.",
    aliases: ["lup", "kaca pembesar"]
  },
  {
    soal: "Alat optik yang terdapat pada kapal selam untuk melihat keadaan di permukaan laut adalah...",
    jawabanBenar: "Periskop",
    salah: ["Mikroskop", "Teleskop", "Lup", "Stetoskop"],
    pembahasan: "Periskop menggunakan dua cermin datar atau prisma yang dipasang miring 45 derajat.",
    aliases: ["periskop"]
  },
  {
    soal: "Bunyi dapat merambat paling cepat melalui medium zat perantara berupa...",
    jawabanBenar: "Zat padat (seperti rel kereta api)",
    salah: ["Zat cair (air kolam)", "Gas (udara)", "Ruang hampa udara", "Minyak goreng"],
    pembahasan: "Kerapatan partikel zat padat sangat rapat sehingga getaran bunyi merambat jauh lebih cepat.",
    aliases: ["zat padat", "padat"]
  },
  {
    soal: "Di ruang hampa udara luar angkasa kita tidak dapat mendengar suara teriakan teman karena...",
    jawabanBenar: "Tidak ada medium udara untuk merambatkan gelombang bunyi",
    salah: [
      "Suhu di luar angkasa sangat dingin",
      "Tidak ada gaya gravitasi bumi",
      "Suara terhalang oleh bintang",
      "Ruang angkasa terlalu gelap"
    ],
    pembahasan: "Bunyi adalah gelombang mekanik yang mutlak membutuhkan zat perantara (medium) untuk merambat.",
    aliases: ["tidak ada medium", "ruang hampa", "tidak ada udara"]
  },
  {
    soal: "Bunyi pantul yang terdengar hampir bersamaan dengan bunyi asli sehingga mengaburkan bunyi asli disebut...",
    jawabanBenar: "Gaung (Kerdam)",
    salah: ["Gema", "Resonansi", "Infrasonik", "Ultrasonik"],
    pembahasan: "Gaung terjadi di ruangan sempit tertutup tanpa peredam suara seperti aula kosong.",
    aliases: ["gaung", "kerdam"]
  },
  {
    soal: "Bunyi pantul yang terdengar jelas setelah bunyi asli selesai diucapkan di tebing bukit yang jauh disebut...",
    jawabanBenar: "Gema",
    salah: ["Gaung", "Kerdam", "Desibel", "Audiosonik"],
    pembahasan: "Gema terjadi ketika jarak dinding pemantul cukup jauh sehingga bunyi pantul tiba setelah bunyi asli.",
    aliases: ["gema"]
  },
  {
    soal: "Gelombang bunyi dengan frekuensi di atas 20.000 Hz yang hanya bisa didengar kelelawar dan lumba-lumba adalah...",
    jawabanBenar: "Ultrasonik",
    salah: ["Infrasonik", "Audiosonik", "Supersonik", "Megasonik"],
    pembahasan: "Manusia hanya mampu mendengar rentang frekuensi audiosonik (20 Hz sampai 20.000 Hz).",
    aliases: ["ultrasonik"]
  },
  {
    soal: "Gelombang bunyi dengan frekuensi sangat rendah di bawah 20 Hz yang bisa didengar gajah dan anjing adalah...",
    jawabanBenar: "Infrasonik",
    salah: ["Ultrasonik", "Audiosonik", "Megasonik", "Harmonik"],
    pembahasan: "Infrasonik frekuensinya di bawah 20 getaran per detik (20 Hz), manusia tidak bisa mendengarnya.",
    aliases: ["infrasonik"]
  },

  // 41-50
  {
    soal: "Pemasangan kabel listrik di tiang-tiang pinggir jalan dibuat agak kendur bertujuan agar...",
    jawabanBenar: "Kabel tidak putus saat menyusut di malam hari yang dingin",
    salah: [
      "Menghemat kabel tembaga",
      "Mudah dihinggapi burung",
      "Aliran listrik mengalir lebih lancar",
      "Kabel tidak kepanasan"
    ],
    pembahasan: "Benda memuai saat panas dan menyusut saat dingin. Jika dipasang kencang, kabel akan putus saat menyusut.",
    aliases: ["tidak putus saat menyusut", "tidak putus"]
  },
  {
    soal: "Pemasangan sambungan rel kereta api sengaja diberi celah rongga renggang bertujuan agar...",
    jawabanBenar: "Rel tidak melengkung bengkok saat memuai di siang hari yang terik",
    salah: [
      "Kereta api dapat mengerem mendadak",
      "Roda kereta tidak cepat aus",
      "Air hujan dapat mengalir lancar",
      "Suara kereta api terdengar nyaring"
    ],
    pembahasan: "Besi rel memuai bertambah panjang di bawah terik matahari, celah memberi ruang pemuaian.",
    aliases: ["tidak melengkung saat memuai", "tidak bengkok", "tidak melengkung"]
  },
  {
    soal: "Pemasangan kaca pada bingkai jendela kayu sengaja dibuat agak longgar bertujuan agar...",
    jawabanBenar: "Kaca tidak pecah saat memuai terkena panas matahari",
    salah: [
      "Angin dapat masuk ke dalam rumah",
      "Kaca mudah dilepas saat dibersihkan",
      "Bingkai kayu tidak cepat lapuk",
      "Menghemat biaya pemasangan"
    ],
    pembahasan: "Kaca memuai saat terkena panas, rongga bingkai mencegah tekanan yang memecahkan kaca.",
    aliases: ["tidak pecah saat memuai", "kaca tidak pecah"]
  },
  {
    soal: "Balon udara dapat terbang mengangkasa ke langit karena udara di dalam balon...",
    jawabanBenar: "Dipanaskan sehingga massa jenisnya lebih ringan daripada udara sekitar",
    salah: [
      "Didinginkan menggunakan es kering",
      "Diisi air hangat bertekanan",
      "Ditiup kipas angin listrik",
      "Diberi magnet penolak bumi"
    ],
    pembahasan: "Udara panas memuai dan menjadi lebih renggang/ringan sehingga terangkat naik oleh gaya apung.",
    aliases: ["dipanaskan", "lebih ringan"]
  },
  {
    soal: "Benda langit dan magnet buatan dapat dibuat dengan cara digosok searah, induksi, dan...",
    jawabanBenar: "Dialiri arus listrik searah (Elektromagnetik)",
    salah: ["Dipanaskan di atas api", "Dipukul-pukul martil", "Direnjam air garam", "Dijemur terik"],
    pembahasan: "Melilitkan kawat berarus listrik DC pada paku besi mengubah paku menjadi magnet sementara.",
    aliases: ["dialiri arus listrik", "elektromagnet", "elektromagnetik"]
  },
  {
    soal: "Sifat kemagnetan suatu magnet batang dapat hilang atau rusak jika magnet tersebut...",
    jawabanBenar: "Dibakar dipanaskan atau dipukul-pukul berkali-kali",
    salah: [
      "Disimpan di dalam lemari",
      "Didekatkan dengan besi murni",
      "Dibalut dengan kain wol",
      "Diberi minyak pelumas"
    ],
    pembahasan: "Pemanasan dan benturan keras mengacaukan susunan magnet elementer di dalam bahan magnet.",
    aliases: ["dibakar", "dipukul-pukul", "dipanaskan"]
  },
  {
    soal: "Bagian magnet yang memiliki gaya tarik magnet paling kuat terletak pada...",
    jawabanBenar: "Kedua ujung kutub magnet",
    salah: ["Bagian tengah magnet", "Sisi samping magnet", "Kutub atas saja", "Semua bagian sama kuat"],
    pembahasan: "Garis-garis gaya magnet paling rapat dan terpusat di kedua ujung kutubnya (U dan S).",
    aliases: ["kedua ujung kutub", "ujung kutub", "kutub"]
  },
  {
    soal: "Alat pengukur kecepatan kendaraan bermotor yang terpasang di dashboard stang adalah...",
    jawabanBenar: "Speedometer (Spidometer)",
    salah: ["Odometer", "Termometer", "Barometer", "Manometer"],
    pembahasan: "Spidometer menunjukkan kelajuan kendaraan dalam satuan kilometer per jam (km/jam).",
    aliases: ["speedometer", "spidometer"]
  },
  {
    soal: "Alat pengukur jarak total yang sudah ditempuh oleh sebuah kendaraan bermotor adalah...",
    jawabanBenar: "Odometer",
    salah: ["Speedometer", "Altimeter", "Takometer", "Voltmeter"],
    pembahasan: "Odometer mencatat total jarak tempuh kilometer yang telah dilalui kendaraan sejak awal.",
    aliases: ["odometer"]
  },
  {
    soal: "Benda yang bentuk dan volumenya selalu tetap meskipun dipindahkan ke wadah mana pun adalah benda...",
    jawabanBenar: "Benda padat (seperti batu dan kayu)",
    salah: ["Benda cair", "Benda gas", "Benda uap", "Benda plasma"],
    pembahasan: "Benda padat memiliki partikel yang terikat sangat kuat dan susunannya teratur rapat.",
    aliases: ["benda padat", "padat"]
  }
];

