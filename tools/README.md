# Alat pengembangan

Skrip yang dijalankan di komputer pengembang, bukan di aplikasi. TypeScript dijalankan Bun; pengolahan gambar memakai `sharp` (TypeScript), dan dua skrip Python + Pillow tersisa untuk lembar perbandingan (lihat `docs/adr/0004-pipeline-aset.md`).

| Alat | Fungsi | Perintah |
| --- | --- | --- |
| `content/validate.ts` | validasi seluruh `content/` (skema dan antar-berkas) dan daftar `verify: true` | `bun run content:check` |
| `vite/yaml-content.ts` | plugin Vite: `import x from '...yaml'` | dipakai `vite.config.ts` |
| `assets/prompt.ts` | mencetak prompt Gemini lengkap dan rasio untuk satu aset | `bun run assets:prompt <bab> [id \| --todo]` |
| `assets/build.ts` | mengolah gambar mentah yang `approved` menjadi WebP di `public/assets` (sprite: hapus latar magenta; potret/ikon/ilustrasi: tepi memudar) | `bun run assets:build <bab> [--only a,b] [--force]` |
| `assets/check.ts` | memeriksa manifest dan memastikan aset `approved` sudah dibangun | `bun run assets:check` |
| `assets/style.ts`, `manifest.ts`, `pipeline.ts`, `paths.ts` | pustaka untuk alat di atas (gaya terkunci di `assets-src/style/style.yaml`) | |
| `gemini/accept-save-dialog.ps1` | menekan Save (dan Yes pada "already exists") di dialog unduhan browser | dipanggil `ingest-download.ps1` |
| `gemini/ingest-download.ps1` | membersihkan sisa file kosong, menunggu unduhan Gemini selesai, memindahkannya ke `assets-src` | lihat `gemini/README.md` |
| `assets/contact-sheet.py` | lembar kontak berlabel dari satu folder gambar | `python tools/assets/contact-sheet.py <folder> <out.png>` |
| `assets/style-test-report.py` | perbandingan gaya: salinan WebP, lembar, ukuran, kelayakan sprite | `python tools/assets/style-test-report.py` |

Semua alat TypeScript punya tes di sebelahnya (`*.test.ts`) dan ikut `bun run test`.
