# Style bible: gaya A (datar, buku cerita)

Aturan visual yang berlaku untuk **semua** aset. Versi yang bisa dibaca mesin: [`assets-src/style/style.yaml`](../../assets-src/style/style.yaml). Keputusannya: [ADR 0005](../adr/0005-arah-seni-gaya-a.md). Contoh acuan: [`style-test/a-flat/`](style-test/a-flat/).

## 1. Rasa yang dituju
Ilustrasi buku cerita modern yang tenang dan hangat, serius tetapi tidak kekanak-kanakan. Bentuk datar bersih, bayangan hanya lembut, gradasi hanya di langit dan kabut. Cocok untuk anak maupun orang dewasa.

## 2. Aturan gambar
- **Bentuk:** geometris, sederhana, tanpa detail realistis yang rumit.
- **Garis:** tipis, **sewarna lebih gelap** dari bentuknya (bukan hitam pekat).
- **Warna:** palet hangat terbatas per zaman (bagian 5). Satu gambar tidak boleh memakai warna di luar palet kecuali aksen kecil.
- **Tekstur:** butiran kertas halus saja.
- **Cahaya:** satu sumber yang jelas (mis. matahari rendah). Gradasi hanya pada langit dan kabut.
- **Tanpa teks:** tidak ada huruf, angka, atau tulisan di dalam gambar (generator sering salah menulis). Goresan "tulisan" harus abstrak.
- **Tanpa orang** pada latar dan adegan; tokoh dibuat sebagai aset terpisah.

## 3. Jenis aset
Semua jenis, rasio, dan ukuran keluaran ada di `style.yaml`; ringkasnya:

| Jenis | Rasio | Dipakai untuk | Keluaran |
| --- | --- | --- | --- |
| `banner` | 16:9 | pembuka bab | WebP ≤ 1600×900 |
| `background` | 16:9 | latar misi; sepertiga bawah dibiarkan sederhana untuk antarmuka | WebP ≤ 1600×900 |
| `portrait` | 3:4 | tokoh dalam dialog | WebP ≤ 900×1200 |
| `icon` | 1:1 | benda koleksi | WebP ≤ 512 |
| `sprite` | 3:4 | karakter aksi, latar **magenta datar** | WebP alfa, tinggi 512 |
| `illustration` | 3:4 | gambar pendamping entri Kodeks | WebP ≤ 1200 |
| `map` | 4:3 | Peta Waktu | WebP ≤ 1600×1200 |
| `reference` | 16:9 | lembar karakter, **tidak dikirim ke pemain** | - |

## 4. Prompt
Prompt selalu **blok gaya + klausul larangan + subjek** (+ kalimat penutup jenis). Jangan menulis blok gaya dengan tangan: pakai `bun run assets:prompt <bab> <id>`.

Aturan subjek: tulis dalam bahasa Inggris, satu kalimat adegan atau tokoh, sebut posisi kamera, dan batasi hal yang harus ada. Rasio dipilih di pengaturan Gemini, bukan di teks.

## 5. Palet Mesir (terukur dari gambar uji)
`paper #fef1db` · `sand #e4bc93` · `ochre #df9f5a` · `terracotta #bd7542` · `clay #c08d69` · `umber #895933` · `nile #769e92` · `nile-deep #537d76` · `reed #a1bca7` · `ink #2b393b`

Palet zaman lain dibuat saat petanya direncanakan, dengan aturan yang sama: 5–7 warna hangat/dingin yang khas zamannya ditambah `paper` dan `ink`.

## 6. Tokoh
- **Konsistensi:** buat **lembar karakter** lebih dulu (`reference`: tampak depan, tiga perempat, samping, tiga ekspresi). Aset tokoh berikutnya dibuat **dalam percakapan Gemini yang sama**, dengan kalimat "Same character X, in exactly the same style, outfit, framing, colours and background as the previous ...".
- **Potret:** setengah badan, menghadap sedikit ke samping, latar krem polos. Ekspresi minimal: netral dan satu ekspresi sesuai kebutuhan cerita.
- **Sprite aksi:** tampak samping menghadap **kanan**, kedua kaki terlihat, latar magenta `#FF00FF` datar tanpa bayangan dan tanpa gradasi. Pose baku: jalan, lompat, diam. Pose berikutnya dalam percakapan yang sama.
- **Tokoh tetap:** Kala (jam pasir pendamping), Penjelajah Waktu (pilihan tampilan pemain), dan tokoh per bab.

## 7. Latar berlapis (parallax)
Latar misi aksi dibuat sebagai beberapa gambar: langit+jauh (satu gambar penuh), tengah (pada latar magenta, lalu dihapus), dan latar depan digambar oleh kode. Detailnya ditetapkan saat misi aksi pertama (M4) dibangun.

## 8. Daftar cek akurasi visual (sebelum aset disetujui)
- Pakaian, perhiasan, alat, dan bangunan sesuai **zaman dan tempat** (mis. tidak ada kuda dan kereta di Mesir masa piramida, tidak ada unta di Giza masa Kerajaan Lama, tidak ada besi di zaman perunggu).
- Tokoh sejarah tidak digambarkan dengan atribut yang dikarang. Tokoh rekaan diberi label di aplikasi.
- Tidak ada teks, simbol, atau hieroglif palsu yang bisa dikira nyata.
- Topik kepercayaan dan kematian digambarkan hormat.

## 9. Penamaan dan penyimpanan
- id aset: `kebab-case`, unik per bab (`m1-bg-akhet`, `meryt-neutral`, `hemiunu-walk`).
- Sumber mentah: `assets-src/chapters/<bab>/raw/` (tidak di-commit; cadangkan sendiri). Hasil olahan: `public/assets/<bab>/<id>.webp` (di-commit).
- Manifest per bab mencatat subjek, status, dan asal setiap aset: `assets-src/chapters/<bab>/manifest.yaml`.
