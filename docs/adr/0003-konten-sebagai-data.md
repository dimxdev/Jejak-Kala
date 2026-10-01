# ADR 0003: Konten sebagai data

- **Status:** diterima
- **Tanggal:** 2026-10-01

## Konteks
Game akan memiliki banyak bab, misi, fakta, dan tahun. Penulisnya (manusia maupun AI) perlu mengubahnya tanpa menyentuh kode, dan kesalahan (tahun 0, id kembar, bab yang tak terjangkau) harus tertangkap sebelum sampai ke pemain.

## Keputusan
- Konten ditulis sebagai **YAML** di `content/chapters/<id>/`.
- Bentuknya didefinisikan satu kali di `src/core/content/schema.ts` (**Zod**). Build, `bun run content:check`, tes, dan aplikasi memakai skema yang sama.
- **Kunci memakai bahasa Inggris, teks untuk pemain bahasa Indonesia.**
- Tahun adalah bilangan bulat bertanda (negatif = SM). Tahun yang belum dicek diberi `verify: true` dan terdaftar otomatis.
- YAML dikompilasi menjadi modul JS saat build (`tools/vite/yaml-content.ts`), jadi pemain tidak mengunduh parser YAML.
- Metadata bab dibundel; konten berat per bab (data misi, Kodeks) akan dimuat lazy saat bab dibuka.

## Konsekuensi
- Menambah bab = menambah folder dan satu berkas; kode tidak berubah.
- Kesalahan data gagal cepat dengan pesan yang menyebut berkas dan kolom.
- Teks tersimpan terpisah dari kode sehingga bahasa lain bisa ditambah nanti.
- Skema harus dijaga kompatibel; perubahan yang merusak harus disertai migrasi konten.
