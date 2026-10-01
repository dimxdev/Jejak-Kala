# Arsitektur

Dokumen ini menjelaskan bagaimana kode v2 disusun dan **kenapa**. Aturan di bagian 2 ditegakkan oleh tes (`tests/unit/architecture.test.ts`), jadi pelanggarannya langsung ketahuan.

## 1. Gambaran

```
content/ (YAML)  ──build──▶  src/core  ──▶  src/shared  ──▶  src/features  ──▶  src/app
 data konten                 aturan &        konten, UI        layar & fitur      kerangka,
 tanpa kode                  skema (murni)   umum              (React)            routing
                                                  │
                                                  └──lazy──▶  src/game (Phaser, hanya misi aksi)
```

- **Konten adalah data.** Bab, misi, dialog, angka permainan, Kodeks, dan teks pelajaran ada di `content/` sebagai YAML. Menambah bab tidak mengubah kode.
- **Aturan permainan adalah fungsi murni** di `src/core` (format tahun, aturan unlock, model misi, skema konten). Mudah dites tanpa browser, dan dijalankan juga oleh skrip di `tools/`.
- **UI React** (`features`) memanggil aturan itu dan menampilkan hasilnya.
- **Phaser** hanya dimuat saat misi aksi dibuka (`import('@/game/createGame')`), sehingga bundel awal kecil.

## 2. Lapisan dan aturan dependensi

| Folder | Isi | Boleh mengimpor | Tidak boleh |
| --- | --- | --- | --- |
| `src/core` | TypeScript murni: tahun, skema konten, Kodeks, model misi, aturan unlock, profil | hanya `zod` dan berkas lain di `core` (impor **relatif**, tanpa alias) | React, Phaser, DOM, folder lain |
| `src/shared` | komponen UI umum (`ui/`), akses konten dan aset (`content/`, `assets.ts`) | `core`, paket UI | `features`, `app`, `game` |
| `src/features/<nama>` | satu fitur utuh: komponen, state, halaman. Pintu masuknya `index.ts` | `core`, `shared`, fitur lain **lewat `@/features/<nama>`** | `app`; impor ke dalam fitur lain |
| `src/game` | Phaser: scene, entitas | `core`, `phaser` | React, `features`, `app` |
| `src/app` | bootstrap, routing, shell navigasi | semuanya | |
| `src/i18n` | teks UI (bahasa Indonesia) dan helper | `core` (tipe) | |
| `src/styles` | token warna, tema per bab (Tailwind) | | |

Kenapa `core` memakai impor relatif: skrip di `tools/` (dijalankan Bun tanpa bundler) dan tes mengimpornya langsung. Alias `@/` hanya dikenal Vite. Untuk alasan yang sama, tes di dalam `core` tidak boleh membaca berkas; tes yang butuh YAML sungguhan ada di `tests/unit/`.

Fitur yang ada: `world-map` (Peta Waktu), `chapter` (halaman bab), `missions` (host dan mesin misi), `codex` (Kodeks), `onboarding` (nama dan penjelajah), `progress` (penyimpanan), `lab` (khusus pengembangan).

## 3. Alur data

1. `content/**/*.yaml` ditulis manusia.
2. `tools/vite/yaml-content.ts` mengubahnya menjadi modul JS saat build (parser YAML tidak ikut ke pemain).
3. `shared/content/*` mem-parse dengan skema Zod. Yang kecil dimuat saat aplikasi mulai (daftar bab, tokoh); yang besar dimuat **lazy** lewat `import.meta.glob` saat dibutuhkan (berkas misi saat misi dibuka, Kodeks saat halaman Kodeks dibuka), dan masing-masing menjadi chunk sendiri. Data yang salah gagal dengan pesan yang menyebut berkas dan kolomnya.
4. Rute memuat datanya lewat **loader** React Router (`missionLoader`, `codexLoader`), jadi komponen menerima data yang sudah siap.
5. `bun run content:check` (dan tes) memvalidasi semua konten tanpa menjalankan aplikasi: tiap berkas terhadap skemanya, lalu antar-berkas (id unik, `requires` valid tanpa siklus, tokoh dan mood ada, gambar ada di `public/assets`, entri Kodeks yang dibuka misi ditulis, adegan yang dibutuhkan mesin ada).
6. Progres pemain disimpan `features/progress` (Zustand + penyimpanan lokal, bertanda versi dengan `migrate`). UI membacanya sebagai data biasa lalu memanggil fungsi di `core/progress/unlock`.

## 4. Misi: host dan mesin

Sebuah misi punya **amplop** yang sama untuk semua dan **mesin** yang khusus.

- **Amplop** (`src/core/missions/schema.ts`): `intro`, `scenes`, `outro` per bintang, `codex`, `bonusQuiz`, `params`. Dimainkan oleh **host** `features/missions/MissionPage.tsx`, yang mengurus alur yang sama untuk setiap misi: Lensa Waktu (tahun berputar ke zaman misi) → cerita pembuka → pilih Santai/Tantangan → mesin → cerita penutup → kuis bonus → hasil (bintang dan entri Kodeks baru) dan menyimpan progres.
- **Mesin** (`engine:` di berkas misi) adalah modul yang memainkan bagian tengahnya. Satu mesin = tiga bagian:
  - `src/core/missions/<mesin>/schema.ts`: skema Zod untuk `params`.
  - `src/core/missions/<mesin>/model.ts` (+ `model.test.ts`): aturan sebagai fungsi murni, termasuk solver yang menghitung rencana terbaik untuk menilai bintang.
  - `src/features/missions/<mesin>/`: komponen React, dimuat lazy lewat `EngineView.tsx`. Props-nya sama: `{ mission, mode, onFinish({ stars, bonus? }) }`; `bonus: true` membuka entri `bonusCodex` misi itu (mis. tantangan lingkaran di M2).
- **Mode** Santai (petunjuk dan pratinjau) dan Tantangan (angka mentah) dipilih pemain; mesin hanya menerima `mode`.
- Mesin yang sudah ada: `nile-flood` (M1 Mesir, simulasi keputusan), `rope-survey` (M2 Mesir, teka-teki geometri patok dan tali), dan `pyramid-climb` (M4 Mesir, platformer dengan tiga gerbang hitung; panggung Phaser belum dipasang, lihat bagian 4a).

### 4a. Misi aksi (Phaser)

Misi aksi memakai pola yang sama dengan mesin lain, ditambah satu lapisan:

- **Aturan di `core`**, bukan di Phaser: gerak pemain, kejangkauan level, bahaya sebagai fungsi waktu, dan penilaian adalah fungsi murni yang dites (`src/core/missions/pyramid-climb/`). Angka gerak dibaca bersama oleh scene dan oleh pemeriksaan level, sehingga level yang lolos `content:check` memang bisa diselesaikan.
- **Scene di `src/game/<mesin>/`** hanya menggambar dan menggerakkan. Ia tidak mengenal React: ia memanggil `ClimbEvents` (gerbang tercapai, tongkat diambil, puncak, kemajuan, waktu) dan menerima perintah lewat `ClimbHandle` (masukan, jeda, buka gerbang, mundur, lewati). Gambar dirujuk dari `params.art` di berkas misi dan dicek `content:check`.
- **Keyboard dan tombol sentuh dibaca di React** lalu dikirim sebagai `setInput`, supaya Phaser tidak menyita tombol panah dan spasi saat panel di atasnya terbuka.
- Phaser dimuat lazy lewat `import('@/game/<mesin>')`, jadi hanya terbayar saat misi aksi dibuka. Selalu ada **rute tanpa aksi** (gerbang saja) sebagai aksesibilitas dan cadangan bila Phaser gagal dimuat.

Daftar mesin ada di tiga tempat yang dijaga kompiler dan tes: union di `schema.ts` (skema), `ENGINE_SCENES` (adegan yang wajib ada), dan `switch` di `EngineView.tsx` (tampilan; `assertNever` membuatnya tidak lolos kompilasi bila ada mesin tanpa tampilan).

## 5. Kodeks dan cerita

- `src/core/codex/schema.ts`: entri dengan **label kredibilitas wajib** (Terbukti / Menurut tradisi / Perdebatan / Mitos / Model game), lapisan `deep` dan `sources`, dan `related`.
- Entri terbuka bila misi yang membukanya selesai; kunci simpanannya `"<bab>/<entri>"` (`codexKey`) karena id entri hanya unik di dalam babnya.
- `src/core/story/schema.ts`: tokoh, baris dialog, adegan, kuis. `shared/ui/ScenePlayer.tsx` memutar adegan; `shared/content/speakers.ts` mengubah `who` dan `mood` menjadi nama dan potret (`player` = penjelajah pilihan pemain lewat `PlayerProvider`).

## 6. Aset

```
Gemini ──unduh──▶ assets-src/<...>/raw (tidak di-commit) ──tools/assets──▶ public/assets/<bab>/... (WebP, di-commit)
```

Manifest di `assets-src` mencatat prompt, status, dan asal tiap aset supaya bisa diulang. Gambar dirujuk dari konten sebagai `"<bab>/<id-aset>"`, dan `content:check` memastikan berkasnya ada. Potret, ikon, dan ilustrasi diproses dengan **tepi memudar** (`fade` di `style.yaml`) supaya latar krem mereka menyatu dengan halaman. Detail: `assets-src/README.md` dan `docs/adr/0004-pipeline-aset.md`.

## 7. Tampilan

- Tema "kertas": halaman krem, tinta gelap, aksen cokelat umber (palet diukur dari gambar Mesir). Token ada di `src/styles/themes.css` dan dipetakan ke kelas Tailwind; tema bab menimpa token lewat `data-theme`. `tests/unit/theme-contrast.test.ts` menjaga semua pasangan warna teks di atas 4,5:1 (WCAG AA).
- Shell (`src/app/AppShell.tsx`): header dengan chip pemain, navigasi bawah di HP dan di header pada layar lebar. Misi berjalan di luar shell supaya memakai seluruh layar.
- Prioritas HP, jalan paralel di desktop. Target sentuh minimal 44 px, gerak dimatikan oleh `prefers-reduced-motion`, kontrol memakai elemen semantik (`fieldset`, `dialog`, `button`).

## 8. Performa

Anggaran awal ada di `PLAN.md` bagian 8. Ukuran terukur saat ini (build produksi, gzip):

| Bagian | Ukuran |
| --- | --- |
| Bundel awal (React, router, aplikasi, Zod) | ± 142 KB JS + 7 KB CSS |
| Host misi | ± 5 KB |
| Mesin `nile-flood` / `rope-survey` | ± 6 KB / ± 6 KB |
| Berkas misi M1, M2, dan Kodeks | ± 2 KB, ± 2 KB, dan ± 5 KB, dimuat saat dibuka |
| Phaser (chunk terpisah, hanya misi aksi) | ± 358 KB |
| Gambar | WebP 12 sampai 150 KB per gambar; latar dan potret dimuat lebih awal oleh host misi |

## 9. Pengujian

| Jenis | Alat | Isi |
| --- | --- | --- |
| Unit | Vitest | tahun, skema, aturan unlock, model misi (termasuk bukti bahwa solver tidak terkalahkan), simpanan dan migrasinya, alat aset, kontras warna, **arsitektur**, konten |
| E2E | Playwright (profil HP dan desktop) | sambutan, Peta Waktu, bab, seluruh alur M1 dan M2 (Santai 3 bintang, jaring pengaman 1 bintang, Tantangan), Kodeks, keluar dari misi |
| Konten | `bun run content:check` | skema dan konsistensi antar-berkas; mendaftar tahun dan fakta `verify: true` |

Semua dijalankan oleh `bun run check` (tanpa e2e) dan `bun run e2e`.
