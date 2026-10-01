# ADR 0004: Pipeline aset

- **Status:** diterima (bagian pemrosesan gambar masih dibangun)
- **Tanggal:** 2026-10-01

## Konteks
Satu bab membutuhkan ± 100–130 gambar, dan v2 menargetkan puluhan bab. Gambar dibuat dengan Gemini (akun Pro), jadi alurnya harus cepat, bisa diulang, dan tidak membuat repo membengkak.

## Keputusan
1. **Generate** di Gemini (model Pro, alat "Buat gambar", rasio diatur lewat pengaturan, bukan prompt).
2. **Prompt = blok gaya tetap + deskripsi subjek.** Blok gaya disimpan di repo (`assets-src/style-test/prompts.yaml`, kelak `assets-src/style/`), supaya semua aset satu gaya.
3. **Unduh otomatis:** `tools/gemini/ingest-download.ps1` menekan tombol Save pada dialog unduhan browser dan memindahkan berkasnya ke `assets-src/...`.
4. **Sumber mentah (`raw/`) tidak di-commit** (ratusan MB). Yang di-commit: manifest (prompt, status, asal) dan salinan kecil untuk tinjauan di `docs/art`.
5. **Pemrosesan** (hapus latar magenta untuk sprite, ubah ukuran, WebP) lewat `tools/assets/` ke `public/assets/<bab>/`, dimuat per misi.

## Konsekuensi
- Setiap aset bisa dilacak ke prompt dan gayanya.
- Repo tetap kecil; sumber mentah perlu dicadangkan terpisah (cloud atau disk lain).
- Volume besar nanti mungkin lebih cocok memakai API Gemini; kuota dan harga perlu dicek, dan kunci API disimpan pemilik proyek, bukan asisten.
- Alat pemrosesan gambar sementara memakai Python + Pillow (sudah terpasang dan terbukti di v1). Boleh dipindah ke TypeScript (`sharp`) bila perlu satu bahasa saja.
