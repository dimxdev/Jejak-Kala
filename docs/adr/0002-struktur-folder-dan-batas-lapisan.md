# ADR 0002: Struktur folder dan batas lapisan

- **Status:** diterima
- **Tanggal:** 2026-10-01

## Konteks
Proyek akan tumbuh lama dan dikerjakan per peta. Struktur harus mudah dipahami orang baru, dan batas antar-bagian tidak boleh memburuk pelan-pelan.

## Keputusan
Satu paket (`v2/`), bukan monorepo. Folder tingkat atas dipisah berdasarkan **jenis isi**, bukan teknologi:

```
docs/        rencana, arsitektur, keputusan (ADR), hasil riset gaya
content/     data konten (YAML) tanpa kode
assets-src/  sumber aset mentah + manifest (tidak ikut deploy)
public/      file statis yang disajikan apa adanya, termasuk aset jadi
src/         kode aplikasi, dibagi per lapisan: core, shared, features, game, app, i18n, styles
tests/       e2e (Playwright) dan tes yang butuh Node (arsitektur, konten)
tools/       skrip pengembangan (Bun/TypeScript, plus Python untuk gambar)
```

Di dalam `src/`, kode dibagi per **lapisan** dan **fitur**, dengan aturan dependensi satu arah (lihat `docs/architecture.md`). Tes unit berada **di sebelah** kodenya (`nama.test.ts`).

Aturan dependensi ditegakkan oleh `tests/unit/architecture.test.ts`.

## Konsekuensi
- Orang baru bisa menebak lokasi sesuatu dari jenisnya.
- Aturan lapisan tidak bergantung pada disiplin: melanggarnya menggagalkan tes.
- Jika nanti ada konsumen kedua (mis. situs ensiklopedia atau editor konten), `core` dan `content` mudah dipindah menjadi paket workspace karena sudah terisolasi.

## Alternatif yang ditolak
Monorepo dengan workspaces sejak awal (kompleksitas tanpa manfaat saat ini); struktur datar per jenis berkas (`components/`, `hooks/`, `utils/`) karena fitur tersebar dan sulit dipahami.
