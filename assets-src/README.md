# Sumber aset

Gambar mentah hasil generate, beserta catatan cara membuatnya. **Tidak ikut deploy** (`.vercelignore`), dan bagian `raw/` **tidak di-commit** karena ratusan MB (`.gitignore`). Yang di-commit: gaya, prompt, manifest, dan hasil olahan kecil di `public/assets/`.

```
assets-src/
  style/style.yaml            gaya A yang terkunci: blok gaya, jenis aset, palet per zaman
  chapters/<bab>/             aset per bab ("shared" = aset milik seluruh game)
    manifest.yaml             daftar aset: id, jenis, subjek, status (di-commit)
    raw/                      gambar asli (tidak di-commit)
  style-test/                 arsip uji tiga gaya (2026-10-01)
  _inbox/                     unduhan sementara (tidak di-commit)
```

Aturan visualnya: [`docs/art/style-bible.md`](../docs/art/style-bible.md). Keputusannya: [ADR 0005](../docs/adr/0005-arah-seni-gaya-a.md).

## Alur satu aset
1. Tambah ke `manifest.yaml`: `id`, `kind`, `subject` (bagian prompt yang berubah-ubah, dalam bahasa Inggris), `status: todo`.
2. `bun run assets:prompt <bab> <id>` mencetak prompt lengkap = **blok gaya tetap + larangan + subjek (+ penutup jenis)** dan rasio yang dipilih di Gemini. Tokoh yang sama dibuat dalam **satu percakapan Gemini** (`followUp: true`, `chat: <id percakapan>`) supaya tampilannya tidak berubah.
3. Generate dan unduh otomatis: [`tools/gemini/README.md`](../tools/gemini/README.md). **Lihat gambarnya**: akurasi visual (pakaian, bangunan, alat sesuai zaman), tidak ada teks nyasar, tokoh konsisten. Yang gagal diulang (catat sebabnya di `note`).
4. Tandai `status: approved` dan isi `file:` (relatif terhadap `assets-src/`).
5. `bun run assets:build <bab>` menulis `public/assets/<bab>/<id>.webp`; `bun run assets:check` memastikan tidak ada aset `approved` yang belum dibangun.
6. Rujuk dari konten sebagai `"<bab>/<id>"`.

## Jenis aset (`kind`)
| Jenis | Rasio | Hasil |
| --- | --- | --- |
| `banner`, `background` | 16:9 | WebP ≤ 1600 px; `background` meminta bagian bawah lapang untuk UI |
| `portrait` | 3:4 | ≤ 900×1200, tepi memudar |
| `icon` | 1:1 | ≤ 512 px, tepi memudar |
| `illustration` | 3:4 | ≤ 1200 px, tepi memudar |
| `sprite` | 3:4 | latar magenta `#FF00FF` dihapus, dipangkas, paling besar 512 × 512 px, alfa penuh. Sprite lebar (gerbang, tongkat) memakai `aspect` 4:3, 16:9 atau 1:1 di manifest |
| `map` | 4:3 | ≤ 1600×1200 |
| `reference` | 16:9 | lembar karakter untuk menjaga konsistensi; **tidak dikirim ke pemain** |

## Aturan
- Satu berkas per aset, nama `kebab-case` sama dengan id di manifest.
- Gambar tidak boleh memuat teks. Nama tempat dalam prompt bisa tertulis di gambar (pernah terjadi pada peta); cukup sebut ciri visualnya.
- Sprite dibuat di atas latar **magenta datar `#FF00FF`** supaya bisa dihapus otomatis.
- Jangan percaya satu unduhan: gambar yang tampil di halaman Gemini dan yang terunduh kadang beda (lihat jebakan di `tools/gemini/README.md`).
- **Cadangkan `raw/` di luar git** (cloud atau disk lain); itu satu-satunya salinan aslinya.
