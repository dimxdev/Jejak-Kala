# ADR 0005: Arah seni, gaya A (datar, buku cerita)

- **Status:** diterima
- **Tanggal:** 2026-10-01

## Konteks
Game ini butuh ratusan ilustrasi yang harus terasa satu keluarga: peta, latar misi, potret tokoh, benda koleksi, dan sprite platformer. Gambar dibuat dengan Gemini Pro. Tiga gaya diuji dengan subjek yang sama (21 gambar): datar buku cerita (A), gouache (B), dan diorama kertas (C). Hasil dan angkanya ada di `docs/art/style-test.md`.

## Keputusan
**Gaya A**, dipilih pemilik proyek (rekomendasi yang sama dari uji). Alasan utama:
- satu-satunya gaya yang konsisten penuh di semua jenis aset, sehingga bisa diskalakan,
- sprite paling bersih (1,0 % tepi lembut saat latar magenta dihapus) dan paling mudah digerakkan lewat kode,
- paling terbaca di layar HP dan paling kecil (rata-rata 47 KB per gambar pada 1280 px),
- risiko kesalahan sejarah yang tampak paling rendah karena bentuk disederhanakan.

Gaya dikunci dalam **satu berkas**, `assets-src/style/style.yaml`, dan **semua prompt dibuat darinya** oleh `tools/assets` (blok gaya + jenis aset + subjek). Aturan yang bisa dibaca manusia: `docs/art/style-bible.md`.

## Konsekuensi
- Suasana tidak semegah gouache. Kekurangan itu ditutup dengan pencahayaan latar yang lebih kaya di dalam kosakata datar (gradasi langit, kabut tipis), seperti pada banner uji.
- Palet per zaman disimpan di `style.yaml`; palet Mesir diukur dari gambar uji, zaman lain diisi saat petanya direncanakan.
- Tokoh tetap dibuat dari lembar karakter dan dilanjutkan dalam percakapan Gemini yang sama (bukan percakapan baru) supaya wajah dan kostum konsisten.
- Konsistensi pada ratusan aset belum teruji. Tinjauan akurasi visual per bab tetap wajib.

## Alternatif yang ditolak
- **B (gouache):** paling memukau, tetapi paling berisiko drift tokoh pada skala besar dan paling memperlihatkan kesalahan sejarah. Dipertahankan sebagai tolok ukur kualitas latar.
- **C (diorama kertas):** unik, tetapi konsistensinya paling rendah (bingkai tak diminta, pakaian berubah, pinggiran sprite kotor).
