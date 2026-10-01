# ADR 0001: Teknologi

- **Status:** diterima
- **Tanggal:** 2026-10-01

## Konteks
Game belajar sejarah, HP dulu dan desktop paralel, dibangun per peta dalam proyek jangka panjang. Sebagian besar misi adalah teks, pilihan, dan teka-teki (DOM/SVG); hanya sebagian kecil yang butuh canvas (aksi). Aset gambar banyak, sehingga ukuran awal harus tetap kecil.

## Keputusan
- **Vite + TypeScript (strict)** sebagai fondasi.
- **React** untuk cangkang aplikasi (peta, misi naratif, Kodeks) dan **Phaser** untuk misi aksi, dimuat lazy.
- **Bun** sebagai package manager dan penjalan skrip; **Vite tetap bundler**.
- **Tailwind (token lewat CSS variables)** untuk gaya; **Zustand** untuk state; **Zod** untuk skema konten.
- **Vitest** (unit), **Playwright** (e2e, memakai Edge yang terpasang secara lokal), **Biome** (lint dan format).
- **Vercel** statis, satu project per versi (*Root Directory* = `v2`).

## Konsekuensi
- Bundel awal kecil (± 131 KB gzip) karena Phaser terpisah (± 358 KB gzip).
- Bun mempercepat pengembangan, tidak mempercepat game di perangkat pemain.
- Isu lockfile Bun 1.4 di Vercel sudah diperbaiki per 2026-09-15; **cek log install pada deploy pertama**. Cadangan: Install Command `npx --yes bun@1.4.0 install --frozen-lockfile`.
- Versi yang terpasang saat keputusan ini: React 19.3, Vite 8.3, TypeScript 7.0, Vitest 5, Phaser 4.2, Tailwind 4.3.

## Alternatif yang ditolak
Astro (bukan kerangka aplikasi dengan state dan audio yang persisten), Svelte/Solid (ekosistem komponen teka-teki lebih kecil), Godot/Unity (ekspor web berat untuk HP berkuota terbatas), vanilla seperti v1 (tidak skala), PixiJS/Kaplay (fitur lebih sedikit daripada Phaser).
