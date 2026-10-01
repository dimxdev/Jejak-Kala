# Konten

Semua isi game yang bukan kode: bab, misi, cerita, tokoh, dan Kodeks. Ditulis sebagai YAML dan divalidasi oleh skema Zod di `src/core/` (jadi aturan bentuknya ada di satu tempat). Kunci berbahasa Inggris, isi untuk pemain berbahasa Indonesia.

```
content/
  characters.yaml                     tokoh yang berbicara di dialog
  chapters/<id>/
    chapter.yaml                      metadata bab dan daftar misinya
    codex.yaml                        entri Kodeks bab ini
    missions/<id-misi>.yaml           isi satu misi: cerita, angka, kuis
```

Folder bab harus bernama sama dengan `id` bab, dan berkas misi sama dengan id misinya. **Jalankan `bun run content:check` setelah mengubah apa pun**: ia memeriksa tiap berkas terhadap skemanya, lalu memeriksa berkas-berkas itu satu sama lain (tokoh dan gambar yang dirujuk ada, entri Kodeks yang dibuka misi benar-benar ditulis, id tidak kembar).

## `chapter.yaml`

| Kunci | Arti | Skema |
| --- | --- | --- |
| `id`, `track` (`world` / `nusantara`) | identitas bab dan jalurnya | `src/core/content/schema.ts` |
| `title`, `tagline`, `region` | teks di peta dan halaman bab | |
| `theme` | nama tema warna di `src/styles/themes.css` | |
| `banner` | gambar lebar bab, `"<bab>/<id-aset>"` (opsional) | |
| `years` | `start`, `end` (opsional), `approximate`, `verify` | |
| `map` | `x`, `y` posisi di Peta Waktu, persen dari gambar peta | |
| `requires` | id bab yang ujiannya harus lulus lebih dulu | |
| `examRequires` | `all` atau jumlah misi yang membuka ujian | |
| `missions[]` | `id`, `type`, `title`, `summary`, `place`, `years[]`, `workload`, `perspective` | |
| `exam` | satu misi bertipe `boss` | |

Misi yang tercantum di `chapter.yaml` tetapi belum punya berkas di `missions/` tampil sebagai "segera hadir".

## `missions/<id>.yaml`

Amplop yang sama untuk semua misi (skema: `src/core/missions/schema.ts`):

| Kunci | Arti |
| --- | --- |
| `id` | harus sama dengan nama berkas dan satu id di `chapter.yaml` |
| `engine` | "mesin" yang memainkan misi ini, mis. `nile-flood` |
| `intro` | adegan sebelum misi (dialog) |
| `scenes` | adegan bernama yang dimainkan mesin di momennya sendiri (mesin menyebut yang ia butuhkan; kurang satu = `content:check` gagal) |
| `outro` | `one` / `two` / `three`: adegan penutup menurut jumlah bintang |
| `codex` | id entri Kodeks yang terbuka saat misi selesai |
| `bonusQuiz`, `bonusCodex` | kuis opsional di akhir; menjawab `passAt` benar membuka `bonusCodex` |
| `params` | angka dan data khusus mesin, divalidasi skema mesin itu (mis. `src/core/missions/nile-flood/schema.ts`) |

Angka permainan ada di `params`, jadi bisa disetel tanpa menyentuh kode. Tes (`tests/unit/content.test.ts`) memastikan, misalnya, bahwa rencana terbaik selalu membuat keluarga kenyang pada setiap tinggi banjir.

### Dialog
Satu adegan = daftar baris `{ who, mood, text }`, dengan `background` opsional.
- `who` adalah id tokoh di `characters.yaml`, atau `player` (penjelajah pilihan pemain, namanya diisi game) atau `narrator` (tanpa wajah).
- `mood` memilih potret tokoh (`neutral` jika tidak ditulis; kalau tokoh tak punya potret itu, dipakai `neutral`). `content:check` menolak mood yang tidak ada.
- Gambar dirujuk sebagai `"<bab>/<id-aset>"`, mis. `mesir/m1-bg-akhet` atau `shared/kala-happy`; `content:check` memastikan berkas WebP-nya ada di `public/assets`.

## `codex.yaml` (Kodeks)

Skema: `src/core/codex/schema.ts`. Tiap entri punya `category` (`person`/`place`/`artifact`/`concept`), `credibility`, `summary`, `body[]`, lapisan `deep[]` dan `sources[]` untuk pembaca yang ingin lebih dalam, serta `related[]`, `images[]`, dan `years[]`.

Label kredibilitas **wajib** dan adalah inti game ini:

| `credibility` | Tampil sebagai | Arti |
| --- | --- | --- |
| `proven` | Terbukti | didukung bukti yang bisa diperiksa |
| `tradition` | Menurut tradisi | diwariskan, tidak terbukti langsung |
| `debated` | Perdebatan | para ahli belum sepakat |
| `myth` | Mitos | populer tetapi tidak didukung bukti |
| `game` | Model game | dibuat game agar bisa dimainkan; **bukan** sejarah |

`verify: true` pada entri = ada fakta yang belum dicek ke sumber ahli. Setiap fakta baru dicek ke sumber dan dicatat di `sources` sebelum `verify` dihapus.

## Tahun
- Bilangan bulat bertanda: **negatif = SM, positif = M, tanpa tahun 0** (`-2560`, `1822`).
- `approximate: true` ditampilkan dengan "±".
- `verify: true` = belum dicek ke sumber. Daftarnya dicetak oleh `content:check`. Hapus hanya setelah sumbernya dicatat.
- `years: []` pada misi berarti "di luar waktu" (mis. ujian). Misi yang melompat zaman memakai beberapa entri (`196 SM → 1822 M`); Lensa Waktu memutar tahun melewati semuanya.

## Tokoh
`characters.yaml`: tiap tokoh punya `name`, `role`, `fictional`, dan `portraits` (mood → gambar, `neutral` wajib). `fictional: true` ditampilkan sebagai "tokoh rekaan" supaya tidak tertukar dengan sejarah.

Contoh lengkap: `chapters/mesir/` (`chapter.yaml`, `codex.yaml`, `missions/m1-banjir-nil.yaml`). Rencana isinya: `docs/plan-mesir.md`.
