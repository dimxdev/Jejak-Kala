# Konvensi

## Bahasa
- **Kode, nama berkas, kunci data, dan komentar: bahasa Inggris.**
- **Teks yang dilihat pemain: bahasa Indonesia.** Teks UI (tombol, label, petunjuk) ada di `src/i18n/id.ts`; teks pelajaran dan cerita ada di `content/`.
- Dokumen di `docs/` ditulis dalam bahasa Indonesia.

## Penamaan
- Folder dan berkas: `kebab-case` (`world-map`, `plan-mesir.md`), kecuali komponen React: `PascalCase.tsx` (`MissionCard.tsx`).
- Id konten (bab, misi, entri Kodeks, tokoh, aset): `kebab-case`. Id bab dan misi unik di seluruh game; id misi diawali nomornya: `m1-banjir-nil`. Id entri Kodeks unik di dalam babnya.
- Gambar dirujuk sebagai `"<bab>/<id-aset>"` (`mesir/banner`, `shared/kala-happy`).
- Tahun disimpan sebagai bilangan bulat: **negatif = SM, positif = M, tidak ada tahun 0** (`-2560`, `1822`).

## Fakta dan kejujuran sejarah
- Setiap entri Kodeks punya **label kredibilitas** (Terbukti, Menurut tradisi, Perdebatan, Mitos, Model game). Yang dibuat game agar bisa dimainkan (mis. angka panen dan pajak di M1) dilabeli **Model game** dan dikatakan begitu kepada pemain.
- Fakta dicek ke sumber dan sumbernya dicatat di `sources`. Selama belum dicek: `verify: true` (pada tahun atau pada entri). `bun run content:check` mendaftar semuanya. Hapus penandanya hanya setelah sumbernya dicatat.
- Tokoh rekaan ditandai `fictional: true` dan tampil sebagai "tokoh rekaan".

## Gaya kode
- TypeScript `strict`, tanpa `any`. Biome mengatur format dan lint: `bun run format`.
- Komentar menjelaskan **kenapa**, bukan apa. Tidak ada komentar yang hanya mengulang kode.
- Setiap logika aturan baru masuk ke `src/core` beserta tes di sebelahnya (`nama.test.ts`).
- Komponen tidak berisi aturan permainan; mereka memanggil fungsi di `core`.
- Kontrol memakai elemen semantik (`button`, `fieldset`+`legend`, `dialog`, `output`) bukan `div` dengan `role`; Biome menegakkannya.

## Cara menambah ...

**Bab baru**
1. Tulis `docs/plan-<nama>.md` (ikuti `plan-mesir.md`).
2. Buat `content/chapters/<id>/chapter.yaml` (lihat `content/README.md`). Id harus sama dengan nama folder.
3. Tambah tema warna di `src/styles/themes.css` (`[data-theme='<id>']`). Tes kontras otomatis memeriksanya.
4. Tulis aset bab di `assets-src/chapters/<id>/manifest.yaml` dan buat gambarnya (lihat "Aset baru").
5. `bun run check`.

**Misi baru dengan mesin yang sudah ada**
1. Tambah misinya di `chapter.yaml`, lalu `content/chapters/<bab>/missions/<id>.yaml` dengan `engine:` yang sama, `params` baru, dan adegan yang dibutuhkan mesin.
2. Tulis entri Kodeks yang dibukanya di `codex.yaml`.
3. `bun run content:check`.

**Mesin misi baru** (lihat `docs/architecture.md` bagian 4)
1. `src/core/missions/<mesin>/schema.ts` dan `model.ts` beserta tes (solver untuk menilai bintang bila ada pilihan).
2. Tambah mesinnya ke union di `src/core/missions/schema.ts` dan adegannya ke `ENGINE_SCENES`.
3. Buat tampilannya di `src/features/missions/<mesin>/` dan satu `case` di `EngineView.tsx` (kompiler menolak bila lupa).
4. Bila jenis misinya baru: tambah ke `MISSION_TYPES` di `src/core/content/schema.ts` dan label di `src/i18n/id.ts` (TypeScript memaksa ini).
5. Tes e2e untuk alur utamanya di `tests/e2e/`.

**Entri Kodeks baru**: tulis di `codex.yaml` bab itu, cantumkan di `codex:` atau `bonusCodex:` misi yang membukanya.

**Aset baru**
1. Daftarkan di manifest bab (`assets-src/chapters/<id>/manifest.yaml`): `id`, `kind`, `subject`, `status: todo`.
2. `bun run assets:prompt <bab> <id>` mencetak prompt lengkap (blok gaya tetap + subjek) dan rasio yang dipilih di Gemini.
3. Generate dan unduh lewat alur di `tools/gemini/README.md`; **lihat gambarnya** sebelum menandai `approved`.
4. `bun run assets:build <bab>` menghasilkan WebP di `public/assets/<bab>/`; `bun run assets:check` memastikan semua aset `approved` sudah ada.
5. Rujuk dari konten sebagai `"<bab>/<id>"`.

## Commit
Satu perubahan logis per commit, pesan singkat dalam bahasa Indonesia atau Inggris yang menjelaskan apa dan kenapa. Jalankan `bun run check` (dan `bun run e2e` untuk perubahan UI) sebelum commit.
