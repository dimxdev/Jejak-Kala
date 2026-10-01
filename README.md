# Petualangan Sejarah v2

Game belajar sejarah: **Peta Waktu**, misi yang berbeda di tiap peta, dan Kodeks yang terisi seiring bermain. HP dulu, desktop paralel. Nama resmi masih dalam pertimbangan (lihat `docs/PLAN.md` bagian 13); nama kerjanya diatur di satu tempat: `.env`.

> Status: **Fase 1 (irisan vertikal Mesir) berjalan.** Sudah ada: Peta Waktu bergambar dengan penanda tahun, sambutan (nama dan penjelajah), halaman bab, Kodeks dengan label kredibilitas, simpanan ber-versi, alat pembuat aset, dan **misi 1 (Banjir Nil) yang bisa dimainkan sampai tuntas**: Lensa Waktu, cerita, Santai/Tantangan, baca Nilometer, rencana tanam, panen dan pajak, kuis bonus. Gaya gambar terkunci ([ADR 0005](docs/adr/0005-arah-seni-gaya-a.md)). Berikutnya: M2, M4, dan M7 ringkas.

## Menjalankan

Butuh [Bun](https://bun.sh) (v1.4+) dan Node 24.

```bash
bun install
bun run dev        # http://localhost:5173
```

| Perintah | Fungsi |
| --- | --- |
| `bun run dev` | server pengembangan (di halaman bab ada tombol "Tandai selesai (dev)" untuk mencoba aturan unlock) |
| `bun run check` | tipe, lint, validasi konten, dan semua tes unit. **Jalankan sebelum commit** |
| `bun run e2e` | tes alur lengkap di profil HP dan desktop (memakai Edge yang terpasang); membangun aplikasi dulu |
| `bun run assets:prompt <bab> [id]` | mencetak prompt Gemini lengkap untuk aset yang masih `todo` |
| `bun run assets:build <bab>` | mengolah gambar mentah yang `approved` menjadi WebP di `public/assets` |
| `bun run assets:check` | memastikan aset `approved` sudah dibangun |
| `bun run build` | build produksi ke `dist/` |
| `bun run format` | rapikan kode dengan Biome |
| `bun run content:check` | validasi `content/` dan daftar tahun yang belum diverifikasi |

## Peta folder

```
docs/         rencana (PLAN.md, plan-<bab>.md), arsitektur, konvensi, keputusan (adr/), riset gaya (art/)
content/      data konten dalam YAML: bab, misi (cerita dan angka), Kodeks, tokoh. Tanpa kode
assets-src/   sumber aset mentah + manifest + prompt. Tidak ikut deploy
public/       file statis yang disajikan apa adanya (ikon, aset jadi)
src/
  core/       aturan murni: tahun, skema konten, model misi, Kodeks, unlock, profil
  shared/     komponen UI umum, akses konten dan aset
  features/   fitur utuh: world-map, chapter, missions, codex, onboarding, progress, lab
  game/       Phaser (dimuat lazy, hanya untuk misi aksi)
  app/        bootstrap dan routing
  i18n/       teks UI bahasa Indonesia
  styles/     token warna dan tema per bab
tests/        e2e (Playwright) dan tes arsitektur/konten
tools/        skrip pengembangan: validasi konten, plugin Vite, alat aset, unduhan Gemini
```

Aturan antar-folder dijelaskan di [`docs/architecture.md`](docs/architecture.md) dan **ditegakkan oleh tes**.

## Dokumen
- [`docs/PLAN.md`](docs/PLAN.md): visi, keputusan, struktur permainan, teknologi
- [`docs/plan-mesir.md`](docs/plan-mesir.md): rencana peta pertama
- [`docs/architecture.md`](docs/architecture.md), [`docs/conventions.md`](docs/conventions.md), [`docs/adr/`](docs/adr/)
- [`docs/art/style-bible.md`](docs/art/style-bible.md): aturan visual semua aset; [`docs/art/style-test.md`](docs/art/style-test.md): hasil uji tiga gaya gambar
- [`assets-src/README.md`](assets-src/README.md): cara membuat dan menambah aset

## Deploy (Vercel)
Buat project baru dengan **Root Directory = `v2`**, preset Vite. `vercel.json` sudah menangani rute SPA. Pada deploy pertama, periksa log instalasi Bun (lihat `docs/adr/0001-stack.md`).
