# Petualangan Sejarah v2: Rencana Induk

> Status: **draf 2**. Rencana per peta ada di folder ini (`docs/`), satu file per peta. Peta sengaja direncanakan **satu per satu**: peta berikutnya baru dipikirkan setelah Mesir selesai, jadi dokumen ini hanya memuat hal yang berlaku untuk semua peta.
>
> **Fase 0 selesai (2026-10-01):** kerangka proyek, Peta Waktu dengan penanda tahun, dan uji tiga gaya gambar. Lihat `../README.md` dan `art/style-test.md`.
>
> **Fase 1 berjalan:** gaya A terkunci (ADR 0005), 22 aset Mesir dan aset bersama selesai, **M1 (Banjir Nil) dan M2 (Tali Para Penyurvei) bisa dimainkan dari awal sampai Kodeks** dengan Lensa Waktu, Santai/Tantangan, dan bonus. **M4 (Lereng Sempurna) setengah jadi:** rute hitung bisa dimainkan, panggung Phaser belum dipasang. Lihat bagian 12.
>
> Perubahan dari draf 1: gratis dulu, bahasa Indonesia dulu, Bun sebagai package manager, penanda tahun di peta, video ditunda, kajian nama (bagian 13), dan Ujian Zaman Mesir mewajibkan 6 dari 6 misi.

## 1. Visi

Belajar sejarah yang terasa seperti petualangan sungguhan, bukan sekadar kuis. Pemain menjelajahi **Peta Waktu**, masuk ke sebuah zaman, lalu menjalani misi yang beragam: menghitung seperti juru ukur Mesir, membaca prasasti seperti Champollion, menimbang bukti seperti peneliti. Orang dewasa pun harus merasa dapat sesuatu: ada lapisan "Dalam" dengan sumber, perdebatan sejarawan, dan matematika yang sungguhan.

Prinsip:

1. **Setiap misi punya tujuan belajar yang jelas** dan diuji lewat melakukan sesuatu, bukan lewat membaca lalu menghafal.
2. **Setiap peta punya tantangan khasnya sendiri.** Dua peta tidak boleh terasa sama (lihat matriks di bagian 5).
3. **Sejarah dijaga jujur.** Setiap fakta berlabel kredibilitas dan bersumber. Legenda ditandai sebagai legenda.
4. **Banyak sudut pandang.** Peristiwa dilihat dari beberapa pihak, dan pemain memerankan orang-orang berbeda.
5. **Pemain selalu tahu "sekarang tahun berapa".** Tahun tampil di peta, di dalam misi, dan di Kodeks (bagian 4).
6. **Mulus di HP, nyaman di desktop.**
7. **Dibangun per peta, dirilis per peta.** Game ini proyek panjang yang tumbuh seiring perjalanan sejarahnya.

## 2. Keputusan yang sudah diambil

| Topik | Keputusan |
| --- | --- |
| Jalur konten | **Dua jalur:** Sejarah Dunia dan Sejarah Nusantara, berjalan berdampingan di satu Peta Waktu |
| Pemain | Semua orang, termasuk dewasa. Bahasa hangat tapi tidak kekanak-kanakan; ada mode Santai dan Tantangan |
| Platform | **HP dulu**, desktop berjalan paralel (satu basis kode responsif) |
| Gaya gambar | **Ilustratif**, gaya A "datar (buku cerita)" **dipilih 2026-10-01** lewat *style test* (bagian 7, ADR 0005) |
| Bahasa | **Indonesia dulu.** Teks tetap dipisahkan dari kode (tidak ditulis langsung di komponen) supaya bahasa lain bisa ditambah nanti tanpa membongkar kode |
| Biaya | **Gratis dulu:** tanpa iklan, tanpa akun, progres tersimpan di perangkat. Hosting di Vercel (paket gratis) |
| Cara kerja | Per peta. Satu file rencana per peta di `docs/`. Peta pertama: Mesir Kuno |
| Teknologi | Vite + TypeScript + React + Phaser, **Bun** sebagai package manager. Detail di bagian 8 |
| Video | **Ditunda.** Alasannya di bagian 7 |
| Nama | Masih nama kerja. Ada temuan penting soal "Lorong Waktu", lihat bagian 13 |
| Mekanik tiap peta | Berbeda-beda: teka-teki, matematika, investigasi, keputusan, aksi, dan seterusnya |

## 3. Struktur permainan

- **Peta Waktu:** peta dunia berkabut. Tiap bab adalah satu node (zaman + wilayah) yang menampilkan rentang tahunnya. Kabut terangkat dan rute menyala saat bab selesai.
- **Bab (peta):** 5–7 misi + 1 **Ujian Zaman**. Konten bab berupa paket data yang bisa ditambah tanpa mengubah mesin game.
- **Gating:** bab berikutnya terbuka setelah Ujian Zaman bab sebelumnya selesai. Ujian terbuka setelah **semua misi bab itu selesai** (Mesir: 6 dari 6). Semua misi di bab terbuka sejak awal, dan urutan yang disarankan hanya disorot di peta bab. "Selesai" berarti lulus dengan minimal 1 bintang.
- **Jaring pengaman agar tidak ada jalan buntu:** setiap misi bisa diselesaikan di mode Santai (tanpa kegagalan keras), petunjuk bertingkat tersedia, dan setelah beberapa percobaan gagal muncul opsi **"Lihat solusi"** (misi dihitung selesai tanpa bintang). Pemain yang ingin menantang diri tidak terganggu.
- **Bintang (1–3) per misi:** kemahiran dan koleksi, bukan syarat lanjut.
- **Kodeks:** buku catatan yang terisi saat bermain: tokoh, tempat, artefak, konsep. Ada **garis waktu global** yang terisi seiring jalannya cerita. Tiap entri punya tahun, label kredibilitas, dan sumber. Untuk artefak, ilustrasi disandingkan dengan foto aslinya dari koleksi museum berlisensi terbuka (cek lisensi tiap gambar).
- **Kilas Balik:** ulangan singkat dengan pengulangan berjarak atas fakta yang sudah pernah ditemui.
- **Mode:** *Santai* (tanpa nyawa, petunjuk lebih murah, fokus belajar) dan *Tantangan*. Lapisan **"Dalam"** bisa dibuka kapan saja untuk pembaca yang ingin lebih jauh.
- **Cerita bingkai:** jam pasir sang Penjelajah Waktu retak. **Pengacau Waktu** menyelipkan kesalahan sejarah di setiap zaman: anakronisme, mitos, hoaks. Tugas pemain menemukan dan memperbaikinya. Ini sekaligus melatih berpikir kritis, dan tiap Ujian Zaman memuat satu pertarungan dengannya.

## 4. Penanda tahun

Pemain tidak boleh pernah bingung "ini terjadi kapan".

- **Format:** `± 2560 SM`, `1822 M`, rentang `± 3100 – 30 SM`. Tanda ± untuk perkiraan.
- **Peta Waktu:** ada **penggaris waktu** di tepi peta. Setiap node menampilkan rentang tahunnya, dan menyentuh node memunculkan kartu seperti "Mesir Kuno · ± 3100 – 30 SM".
- **Peta bab (daftar misi):** strip garis waktu bab menandai tahun tiap misi. Misi boleh dimainkan tak berurutan, tetapi posisinya di garis waktu selalu terlihat.
- **Di dalam misi:** chip permanen di pojok layar, mis. `Giza · ± 2560 SM`.
- **Lensa Waktu:** saat pindah sudut pandang atau zaman, angka tahun berputar dari tahun lama ke tahun baru, sehingga lompatan lintas ribuan tahun terasa.
- **Kodeks:** setiap entri punya tahun, dan garis waktu global menyusun semuanya.
- **Data:** setiap bab, misi, adegan, dan entri Kodeks punya bidang tahun (`start`, `end` opsional, `approximate`, `verify`; kunci data berbahasa Inggris). SM disimpan sebagai bilangan negatif. Penggaris dan garis waktu dibuat otomatis dari data, dan validator konten memeriksa urutan dan rentangnya.

## 5. Tantangan khas tiap peta

Aturan: **tiap peta punya satu mekanik tanda tangan (signature)** yang belum dipakai peta lain, ditambah kombinasi jenis misi yang berbeda. Matriks ini diisi satu baris setiap kali sebuah peta direncanakan.

| Peta | Jalur | Mekanik tanda tangan | Jenis misi yang dipakai |
| --- | --- | --- | --- |
| Mesir Kuno | Dunia | **Ukur dan hitung** (matematika Mesir) + **membaca sandi tulisan** | simulasi keputusan, puzzle geometri, investigasi + pecahan, platformer + gerbang hitung, sandi, manajemen sumber daya (dagang), ujian bos |
| (peta berikutnya) | | dipikirkan setelah Mesir selesai | |

Jenis misi tersedia sebagai modul yang bisa dipakai ulang: ekspedisi aksi, investigasi bukti, keputusan bercabang, garis waktu/sebab-akibat, puzzle hitungan, puzzle sandi/logika, manajemen sumber daya, ujian bos. Misi baru dengan mekanik baru boleh ditambahkan kapan saja.

## 6. Karakter dan sudut pandang

- **Penjelajah Waktu** adalah tokoh bingkai. Pemain memilih tampilan di awal dari beberapa pilihan (agar semua orang merasa terwakili). Penjelajah berjalan di misi aksi seperti di v1, dan tampil sebagai penanda di Peta Waktu.
- **Kala**, jam pasir hidup, adalah pendamping: memberi petunjuk, menjelaskan istilah, dan menyuarakan kisah bingkai.
- **Sudut pandang:** hampir setiap misi memerankan **tokoh sejarah yang berbeda** (petani, juru ukur, arsitek, pedagang, bahkan peneliti dari masa kemudian). Peralihan ditandai efek *Lensa Waktu* (jam pasir dibalik, tahun berputar). Mengumpulkan beragam sudut pandang pada satu peristiwa menjadi koleksi tersendiri.
- **Yang berjalan dan yang tidak:** karakter berjalan hanya di misi aksi/jelajah. Misi lain memakai potret dan adegan ilustrasi dengan animasi ringan (parallax, napas, kedip).
- **Animasi karakter** dibuat sederhana: 2–3 pose per tokoh (diam, jalan, lompat) digerakkan lewat kode (bobbing, squash-stretch, rotasi), seperti di v1. Animasi rangka penuh (Rive/Spine) baru dipertimbangkan kalau *style test* menunjukkan perlunya.

## 7. Arah seni

**Rekomendasi:** gaya ilustrasi buku cerita (bentuk datar bersih dengan tekstur halus dan palet hangat), dengan **palet warna berbeda per zaman**, supaya tiap peta langsung terasa berbeda. Alasannya: ilustratif cocok untuk audiens dewasa dan terasa serius-tapi-indah, bentuk datar paling mudah dibuat konsisten oleh AI, dan ukuran filenya lebih kecil daripada lukisan realistis.

Risiko utama: **konsistensi antar-gambar**, **animasi**, dan **ukuran file**.

**Style test dulu (Fase 0):** sebelum produksi, buat set uji yang sama dalam 2–3 gaya kandidat: (A) ilustrasi datar buku cerita, (B) cat gouache digital, (C) diorama potongan kertas berlapis. Set ujinya: ilustrasi node peta, latar misi, potret tokoh dengan 2 ekspresi, ikon artefak, dan pose karakter jalan. Gaya dipilih berdasarkan hasil sebenarnya (konsistensi, keterbacaan di layar HP, kemudahan dianimasikan), bukan tebakan.

Aturan konsistensi:
- **Style bible** satu halaman: gaya, palet per zaman, ketebalan garis, pencahayaan, daftar larangan (mis. tidak ada teks di dalam gambar).
- **Template prompt** yang selalu dipakai, plus **gambar acuan** (character sheet, latar acuan) untuk tiap tokoh dan zaman.
- **Daftar cek akurasi visual** per peta (pakaian, bangunan, alat yang sesuai zaman).
- Latar dibuat berlapis (langit/jauh/tengah) untuk parallax; sprite dibuat di latar polos lalu dipotong dengan skrip seperti di v1.
- Format WebP, dua ukuran, dimuat per misi.

**Volume:** perkiraan 100–130 gambar untuk peta berisi 6–7 misi (tidak termasuk foto museum). Karena itu pipeline aset akan diotomatiskan: manifest aset, skrip validasi, dan evaluasi generate lewat API Gemini dibanding lewat browser. Kuota dan harga perlu dicek lebih dulu, dan kunci API disimpan oleh pemilik proyek, bukan oleh asisten.

### Video: ditunda

Keputusan: **tidak membuat video untuk slice pertama.**

- Video berat untuk HP (kuota data, baterai) dan sering dibatasi autoplay.
- Gambar diam yang "dihidupkan" lewat kode (parallax, partikel, napas, kedip, efek Lensa Waktu) memberi sebagian besar kesan bergerak dengan bobot yang jauh lebih kecil.
- Video AI sulit dijaga konsisten dengan style bible. Di aplikasi Gemini, pembuatan video setahuku hanya tersedia di paket berbayar (Pro/Ultra) dengan kuota harian kecil (laporan Juni 2025: Pro mendapat 3 video Veo 3 Fast per hari, klip ± 8 detik; angkanya bisa sudah berubah). Jadi bukan jalur produksi massal.
- **Kandidat pemakaian nanti:** intro 5–8 detik, transisi Lensa Waktu, penutup bab. Bentuknya loop pendek WebM/MP4 ≤ 1 MB dengan gambar poster, menghormati *reduced motion* dan mode Hemat Data.
- Akun Gemini pemilik proyek adalah **Pro** dan memiliki menu **Buat video** dan **Buat musik**. Satu klip uji dibuat setelah gaya gambar dikunci, supaya klipnya satu gaya dengan aset.
- **Audio memberi dampak suasana yang lebih besar per biaya:** musik ambient per zaman dan efek suara. Ini diprioritaskan sebelum video. Menu **Buat musik** di Gemini layak diuji untuk musik latar tiap zaman.

## 8. Teknologi

**Pilihan:** Vite + TypeScript, **React** untuk cangkang aplikasi, **Phaser** untuk misi aksi (dimuat lazy), **Bun** sebagai package manager.

Alasan struktur hibrida: sebagian besar misi adalah teks, pilihan, teka-teki, dan visualisasi (dunia DOM/SVG), sedangkan canvas dibutuhkan hanya untuk misi aksi. Memaksakan semuanya ke satu paradigma membuat salah satu bagian jadi sengsara.

| Lapisan | Pilihan | Alasan |
| --- | --- | --- |
| Package manager & runner | **Bun** (sudah terpasang, v1.4.0) | `bun install` dan `bun run` jauh lebih cepat daripada npm. Vite tetap bundler-nya |
| Build | Vite + TypeScript (strict) | cepat, standar, aman tipe |
| Cangkang UI | React | ekosistem terbesar untuk UI teka-teki (drag-drop, komponen aksesibel, animasi) dan paling andal untuk pengembangan dibantu AI. Svelte adalah pesaing terdekat |
| Misi aksi | Phaser 4 (lazy-load) | tilemap, fisika, kamera, sentuhan, audio. Ukurannya hanya terbayar saat misi aksi dibuka |
| State | Zustand | kecil, jelas, mudah diuji |
| Gaya | Tailwind + CSS variables (tema per peta) | tema warna per zaman tinggal ganti variabel |
| Animasi UI | Motion | transisi, Lensa Waktu, Peta Waktu |
| Konten | YAML/Markdown + skema Zod, dikompilasi ke JSON | tervalidasi saat build: aset ada, sumber terisi, graf unlock tanpa siklus, tahun berurutan |
| Simpan | IndexedDB, skema ber-versi + migrasi | offline, kode ekspor/impor progres |
| PWA | vite-plugin-pwa (Workbox), cache per peta | main offline setelah paket peta diunduh |
| Audio | Howler / WebAudio | |
| Tes | Vitest (logika, solver puzzle), Playwright (alur lengkap, viewport HP), Lighthouse CI (anggaran performa) | seperti bot di v1, tapi permanen |
| Lint dan format | Biome | satu alat, cepat |
| Hosting | Vercel statis, project terpisah dengan *Root Directory* = `v2` | v1 tetap hidup |
| Nanti | Supabase atau Firebase | hanya kalau butuh akun, simpan awan, papan peringkat |

### Soal Bun dan performa

- Bun **mempercepat pengembangan** (instal paket, menjalankan skrip), **bukan game di perangkat pemain**. Yang sampai ke pemain adalah hasil build Vite yang dijalankan browser.
- Performa yang dirasakan pemain ditentukan oleh: ukuran dan format gambar (WebP/AVIF), pemuatan per misi, code-splitting (Phaser lazy), cache PWA, dan render yang hemat.
- Vite tetap dipakai sebagai bundler karena ekosistem plugin PWA dan React-nya. Vitest dijalankan lewat `bun run test`; Playwright dijalankan lewat Node jika ada kendala kompatibilitas.
- Vercel mendukung Bun tanpa konfigurasi ([pengumuman](https://vercel.com/changelog/bun-install-is-now-supported-with-zero-configuration)). Ada isu lockfile khusus Bun 1.4 (build memakai Bun 1.3 dan mengabaikan lockfile) yang diperbaiki per 15 September 2026 ([PR #17608](https://github.com/vercel/vercel/pull/17608)). **Pada deploy pertama, periksa log install.** Jika lockfile masih diabaikan, ubah *Install Command* di pengaturan project menjadi `npx --yes bun@1.4.0 install --frozen-lockfile`.

Kenapa bukan yang lain:
- **Astro:** unggul untuk situs konten, tetapi bukan kerangka yang pas untuk aplikasi dengan state, audio, dan navigasi yang harus bertahan. Cocok nanti untuk situs pendamping/ensiklopedia berbasis SEO.
- **Svelte/Solid:** bagus, tetapi ekosistem komponen teka-teki lebih kecil.
- **Godot/Unity:** ekspor web umumnya berat untuk pemain HP berkuota terbatas.
- **Vanilla seperti v1:** tidak akan skala untuk puluhan layar dan banyak state.
- **PixiJS/Kaplay:** lebih ringan, tetapi fiturnya lebih sedikit daripada Phaser untuk kebutuhan kita.

**Tata letak HP/desktop:** layar minimum 360×640. Cangkang (peta, misi naratif, Kodeks, teka-teki) responsif untuk potret dan lanskap. **Misi aksi meminta lanskap** (ajakan memutar layar, tombol layar penuh, kunci orientasi di perangkat yang mendukung). Input memakai Pointer Events untuk semua teka-teki dan pintasan keyboard di desktop.

**Anggaran performa (target awal, direvisi setelah slice):**
- Muat pertama (cangkang): JS ≤ 300 KB gzip, gambar ≤ 1 MB.
- Paket aset per misi ≤ 3 MB, dimuat saat dibutuhkan. Misi berikutnya di-prefetch saat jaringan longgar dan tidak dalam mode Hemat Data.
- Mode **Hemat Data** memakai gambar beresolusi lebih rendah.

## 9. Kualitas konten

- Setiap fakta punya **label kredibilitas**: *Terbukti*, *Menurut tradisi*, *Perdebatan*, atau *Mitos*, plus minimal satu sumber (kutipan pendek atau rujukan).
- **Sudut pandang jamak** untuk peristiwa yang diperebutkan. Topik sensitif (perang, penjajahan, kekerasan) diperlakukan hormat dan faktual.
- **Matematika diverifikasi oleh kode:** setiap teka-teki punya solver yang dites. Tidak boleh ada teka-teki tanpa jawaban atau dengan banyak jawaban yang tidak disengaja.
- **Lisensi:** teks ditulis sendiri, kutipan hanya dari sumber domain publik atau lisensi terbuka, foto museum dicek lisensinya per gambar. Penggunaan komersial hasil Gemini perlu dicek ke ketentuan Google bila kelak relevan.
- Idealnya seorang guru atau sejarawan menelaah tiap peta sebelum rilis.

## 10. Alur kerja per peta

1. **Rencana peta** (`docs/plan-<nama>.md`): tema, tujuan belajar, perspektif, misi, penanda tahun, mekanik tanda tangan, Kodeks, daftar aset, urutan produksi.
2. **Riset dan verifikasi fakta** (tandai `[verifikasi]` di rencana sampai selesai).
3. **Aset** lewat pipeline, ditinjau akurasinya.
4. **Bangun misi** satu per satu dengan solver/tes.
5. **Uji bot + uji di HP sungguhan.**
6. **Tinjau konten**, lalu rilis.

**Definisi selesai satu peta:** semua fakta bersumber dan berlabel; semua tahun terisi dan berurutan; semua teka-teki lolos tes solver; aset lengkap dan dioptimalkan; bot menamatkan peta dari awal sampai Ujian Zaman; dicoba di setidaknya satu HP Android dan satu iPhone; aksesibilitas dasar (ukuran huruf, reduced motion, mode buta warna) lolos; ditinjau.

## 11. Struktur folder v2 (rencana)

```
v2/
  docs/         rencana, arsitektur, ADR, riset gaya
  content/      data konten (YAML)
  assets-src/   sumber aset mentah + manifest + prompt
  public/       aset jadi dan file statis
  src/          core, shared, features, game, app, i18n, styles
  tests/        e2e dan tes arsitektur/konten
  tools/        skrip pengembangan
```

Penjelasan lengkap: `../README.md` dan `adr/0002-struktur-folder-dan-batas-lapisan.md`.

## 12. Status peta

| Peta | Rencana | Status |
| --- | --- | --- |
| Mesir Kuno | [`plan-mesir.md`](plan-mesir.md) | draf 2 |
| lainnya | sengaja belum direncanakan, menunggu Mesir selesai | |

**Status pengerjaan (2026-10-01):**
- Fase 0 selesai.
- Gaya gambar terkunci (gaya A) beserta alat pembuat aset (`bun run assets:prompt|build|check`), style bible, dan lembar karakter Kala dan tiga penjelajah.
- Fase 1, vertical slice Mesir. **Selesai:** cangkang (Peta Waktu bergambar, shell dengan navigasi, sambutan nama dan penjelajah, Kodeks dengan label kredibilitas, simpanan ber-versi) **M1** (simulasi keputusan), dan **M2** (teka-teki patok dan tali). **M4** setengah jadi (aset, aturan, level, Kodeks, panel gerbang, dan scene Phaser sudah ada; tinggal memasang panggung ke halaman, lihat `plan-mesir.md`). **Berikutnya:** menyelesaikan M4, M7 versi ringkas; lalu M3, M5, M6.

## 13. Nama game

**Temuan penting:** "Lorong Waktu" adalah judul **serial TV Indonesia yang sangat dikenal** (SCTV, 1999–2006, 207 episode, dibuat Deddy Mizwar, bertema perjalanan lintas waktu dan sejarah), dengan versi animasi 2019 dan versi baru 2025. Sumber: [Wikipedia (id)](https://id.wikipedia.org/wiki/Lorong_Waktu_(sinetron)), [Wikipedia (en, versi 2025)](https://en.wikipedia.org/wiki/Lorong_Waktu_(2025_TV_series)). Karena namanya persis sama dan temanya sangat dekat, **untuk v2 sebaiknya memakai nama baru**: ada risiko kebingungan dan masalah merek. v1 boleh tetap memakai nama itu sebagai proyek belajar. (Ini bukan nasihat hukum. Cek merek sebelum rilis publik.)

Kandidat (pencarian awal tidak menemukan game atau aplikasi bernama sama; ini **bukan** pemeriksaan merek):

| Nama | Makna | Catatan |
| --- | --- | --- |
| **Jejak Kala** (rekomendasi) | "jejak waktu" (*kala* = waktu, bahasa sastra) | klop dengan pendamping bernama Kala; hanya ada film berjudul "Kala" (2007), genre berbeda |
| Pasir Waktu | merujuk jam pasir | mudah dipahami, tetapi mirip "Sands of Time" yang dikenal gamer |
| Silam | "masa silam" | pendek dan kuat; agak abstrak |
| Lintas Kala | "menyeberangi waktu" | menjelaskan perjalanan antarzaman |

Subjudul yang cocok untuk semua kandidat: *Petualangan Sejarah Dunia dan Nusantara*. Sebelum rilis: cek domain, toko aplikasi, dan basis data merek DJKI. **Nama final tidak menghalangi pekerjaan**: kode memakai nama kerja yang mudah diganti.

## 14. Pertanyaan terbuka

- Nama final (bagian 13).
- Bahasa Inggris: ditunda; strukturnya sudah disiapkan (teks terpisah dari kode).
- Rencana peta kedua: sengaja ditunda sampai Mesir selesai.
