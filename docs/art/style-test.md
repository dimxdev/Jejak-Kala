# Style test: tiga gaya gambar

> Tanggal: 2026-10-01 · Alat: Gemini Pro (3.1 Pro), "Buat gambar" · 21 gambar (3 gaya × 7 subjek)
> Prompt lengkap: [`assets-src/style-test/prompts.yaml`](../../assets-src/style-test/prompts.yaml)
> Lembar perbandingan: [`style-test/comparison.png`](style-test/comparison.png) · salinan kecil per gambar: `style-test/<gaya>/*.webp`

## Yang diuji
Subjek yang sama dibuat dalam tiga gaya, mewakili semua jenis aset yang akan dibutuhkan game:

| Subjek | Menguji |
| --- | --- |
| banner bab (16:9) | ilustrasi pembuka bab dan node peta |
| latar misi (16:9) | latar yang memberi ruang kosong untuk antarmuka |
| potret netral dan cemas (3:4) | konsistensi tokoh antar-ekspresi |
| ikon artefak | benda koleksi untuk Kodeks |
| sprite jalan dan lompat (3:4, latar magenta) | kelayakan karakter platformer dan konsistensi antar-pose |

## Gaya
- **A. Datar (buku cerita):** bentuk geometris bersih, palet hangat terbatas, garis tipis, tekstur kertas halus.
- **B. Gouache:** cat digital dengan sapuan kuas, warna matte kaya, cahaya emas hangat.
- **C. Diorama kertas:** lapisan kertas potong bertumpuk dengan bayangan lembut.

## Hasil

| | A. Datar | B. Gouache | C. Diorama kertas |
| --- | --- | --- | --- |
| Konsistensi antar-subjek | **sangat tinggi**: satu tampilan di ketujuh subjek | tinggi; wajah dua potret mirip tetapi ada drift kecil pada rambut dan bayangan | rendah: potret masuk bingkai foto tanpa diminta, pakaian sprite berubah dari kilt menjadi tunik yang diselempangkan |
| Kesetiaan pada prompt | mengikuti (kilt, kalung, wig) | mengikuti | sebagian menyimpang (pakaian, bingkai) |
| Sprite: konsistensi walk ke jump | konsisten | konsisten | konsisten satu sama lain, tetapi proporsi lebih kaku |
| Sprite: kemudahan hapus latar magenta | **1,0 %** piksel tepi setengah-transparan | 1,3 % | 4,6 %, tersisa pinggiran merah muda |
| Ukuran rata-rata (WebP q80, sisi terpanjang 1280 px) | **47 KB** | 59 KB | 61 KB |
| Keterbacaan di layar HP | paling baik | baik | tekstur ramai |
| Suasana dan kesan "premium" | bagus | **paling kuat** | unik, punya kedalaman bawaan |
| Risiko kesalahan sejarah yang tampak | rendah (bentuk disederhanakan) | lebih tinggi (detail realistis memperlihatkan salah kostum atau bangunan) | sedang |
| Cocok dianimasikan dengan kode (2–3 pose + tween) | sangat | cukup | cukup |

Catatan jujur:
- **Tidak ada gambar yang perlu diulang** (satu kali generate per gambar cukup) di ketiga gaya. Jadi biaya ulang per gambar belum terukur.
- **Konsistensi pada ratusan aset belum teruji.** Tes ini hanya menguji tujuh subjek. Gaya A paling kecil risikonya karena bentuknya sederhana.
- Selisih ukuran file kecil secara absolut (± 50–60 KB per gambar pada 1280 px). Bukan faktor penentu; konsistensi dan biaya tinjauan yang menentukan.

## Rekomendasi
**Gaya A (datar, buku cerita) sebagai dasar semua aset**, dengan pencahayaan latar yang diperkaya (seperti pada banner A: gradasi langit dan kabut tipis) untuk adegan pembuka. Alasannya:

1. Satu-satunya gaya yang konsisten penuh di semua jenis aset, sehingga bisa diskalakan ke 500+ aset dengan blok gaya yang sama.
2. Sprite paling bersih dan paling mudah dianimasikan lewat kode.
3. Paling terbaca di layar HP dan paling ringan.
4. Cocok untuk pemain dewasa (nuansa ilustrasi editorial), dan palet per zaman cukup diganti lewat blok gaya.

**B** adalah pilihan tepat jika suasana lebih penting daripada skala: hasilnya paling memukau, dengan konsekuensi tinjauan akurasi visual yang lebih berat dan risiko drift tokoh yang lebih besar. **C** tidak disarankan sebagai gaya utama; idenya (lapisan berkedalaman) bisa dipakai pada parallax latar gaya A.

## Keputusan
**Gaya A dipilih oleh pemilik proyek pada 2026-10-01.** Keputusannya tercatat di [ADR 0005](../adr/0005-arah-seni-gaya-a.md), aturan visualnya di [style-bible.md](style-bible.md), dan versi yang dibaca mesin di `assets-src/style/style.yaml`. Gaya B dan C tidak dipakai; berkas ujinya tetap disimpan di folder ini sebagai arsip perbandingan.

## Catatan teknis dari uji ini
- Resolusi hasil unduhan: 16:9 → 2752×1536, 3:4 → 1792×2400, 9:16 → 1536×2752. Format JPEG (tanpa transparansi), ± 2–3 MB.
- Latar magenta datar (`#FF00FF`) dapat dihapus dengan baik untuk gaya A dan B.
- Detail alur unduh otomatis dan jebakan UI Gemini: `tools/gemini/README.md`.
