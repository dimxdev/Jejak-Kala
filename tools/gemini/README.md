# Generate aset dengan Gemini

Alurnya dijalankan lewat browser pane aplikasi Claude (atau browser biasa) dan dua skrip PowerShell di folder ini. Dicoba nyata pada 2026-10-01 dengan akun Gemini Pro.

## Satu gambar, langkah demi langkah
Cara paling andal memakai `find` (pencarian di pohon aksesibilitas), bukan klik berdasarkan koordinat:

1. Buka `https://gemini.google.com/app`. Pilih model **Pro** (pemilih di kiri atas).
2. Percakapan baru: tombol **"Upload & alat"** → **Buat gambar** (chip **Gambar** muncul). Dalam percakapan yang sudah memakai mode itu, mode tetap aktif.
3. Klik kolom prompt (`find "textbox"` → klik ref-nya) supaya kolom terbuka. Baru sesudah itu `find "rasio aspek"` menemukan tombolnya; labelnya menampilkan rasio sekarang (`Rasio aspek, 3:4`). Klik, lalu `find "<rasio>"` → klik `menuitemradio`-nya, lalu **cek lagi labelnya**.
4. Klik kolom prompt lagi, ketik prompt, tekan Enter.
5. Tunggu ± 30–40 detik (kadang sampai 90 detik). `find "Download gambar"` dan tunggu sampai jumlah tombol bertambah satu.
6. Klik tombol **"Download gambar ukuran penuh"** milik gambar terbaru (ref yang terakhir).
7. Segera jalankan:
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File tools/gemini/ingest-download.ps1 -Destination assets-src/<...>/raw/<id>
   ```
   Skrip menekan Save pada dialog unduhan, menunggu file selesai, lalu memindahkannya (± 9 detik).

## Skrip
- `accept-save-dialog.ps1`: browser pane membuka dialog "Save As" bawaan Windows untuk setiap unduhan. Dialog itu **jendela milik** (owned window) aplikasi Claude, jadi UI Automation tidak melihatnya di tingkat atas. Skrip ini memakai Win32 (`EnumWindows`), hanya menyentuh dialog berjudul `blob:*` dengan nama file `Gemini_Generated_Image_*`, lalu mengirim klik ke tombol Save. Teruji pada dialog asli.
- `ingest-download.ps1`: menjalankan skrip di atas di latar, menunggu file selesai (> 200 KB, bukan `.tmp`), memindahkannya. Path berisi spasi harus dikutip saat memulai proses latar (sudah ditangani). Setiap Save meninggalkan **file kosong 0 byte** `Gemini_Generated_Image_*` di Downloads; skrip ini membersihkannya sebelum dan sesudah, karena jalur editor selalu menyarankan nama yang sama dan Windows lalu bertanya "already exists, replace?". Bila pertanyaan itu tetap muncul, `accept-save-dialog.ps1` menjawab Yes (hanya untuk berkas bernama `Gemini_Generated_Image_*`).

## Hasil
JPEG, ± 2–3 MB. Resolusi: 16:9 → 2752×1536, 3:4 → 1792×2400, 9:16 → 1536×2752. Tanpa transparansi: untuk sprite minta latar magenta datar `#FF00FF` lalu hapus dengan `tools/assets`.

## Jebakan (sudah pernah terjadi)
- **Selalu lihat gambar yang baru diunduh** sebelum menandainya sah. Pada percakapan yang pernah macet lalu di-reload, "Download gambar ukuran penuh" untuk gambar ke-3 mengembalikan gambar ke-2 (isi hampir sama, ukuran file beda), sedangkan yang tampil di halaman benar. Jalan keluarnya: klik gambar hasil (membuka editor), menu **⋯ → Download**. Itu mengunduh gambar yang tampil, **896×1200 untuk 3:4**, tepat sama dengan ukuran akhir potret, jadi cukup untuk potret/ikon tetapi tidak untuk latar 16:9. Tutup editor dengan panah kembali di kiri atas.
- **Percakapan yang macet** (titik-titik pemuatan > 2 menit): reload halaman. Pesan yang dikirim saat macet bisa hilang; kirim ulang. Setelah reload mode **Gambar** tetap aktif.
- **Jangan mengklik gambar hasil** kecuali untuk jalur editor di atas: itu membuka editor gambar dan teks yang diketik masuk ke sana.
- **Kolom prompt menutup setelah mengganti rasio.** Buka lagi dengan klik di bawah, tunggu, baru ketik. Teks yang diketik saat kolom belum fokus hilang tanpa pesan.
- **Salah klik pada tombol "+" di dalam percakapan** bisa mengaktifkan alat lain (pernah muncul "Membuat draf email" dan notifikasi "Email baru dibuat"). Selalu pastikan chip **"Gambar"** terlihat sebelum mengetik, dan cek hasil sebelum Enter bila ragu.
- Pemilihan baris pada lembar rasio sensitif terhadap waktu; tunggu 2 detik setelah membukanya dan verifikasi ikon rasio sesudahnya.
- **Teks bisa masuk dua kali.** Setelah mengganti rasio, tampilan kolom prompt tertinggal: tangkapan layar menunjukkan kolom kosong padahal teks yang diketik sudah masuk, lalu mengetik lagi menggandakannya. Biasakan: klik kolom, tunggu 2 detik, ketik **sekali**, tunggu 2 detik, lalu cek panjangnya dengan `javascript_tool` (`document.querySelector('[role="textbox"]').innerText.length` harus sama dengan panjang prompt) sebelum menekan Enter. Bila ganda: `ctrl+a`, `Backspace`, ketik ulang.
- **Prompt sprite jangan memuat cahaya, bayangan, atau kilau** (mis. "soft glow"): itu menodai latar magenta dan merusak pemotongan. Minta bentuk saja.
- Setelah mengirim, jumlah tombol "Download gambar" bertambah satu saat gambar selesai. Lihat gambarnya (dan hasil unduhan, lewat pratinjau kecil) sebelum menyetujui di manifest.
- Gemini punya kuota harian; setiap gambar menghabiskan satu jatah.
- Tersedia juga **Buat video** dan **Buat musik** di menu "+" (akun Pro). Belum diuji untuk game ini.
