# PROMPT UTAMA — Website Interaktif "Metaheuristik: JAYA & Simulated Annealing"

> Baca file ini PERTAMA. Lalu baca berurutan: `01-CONTENT.md`, `02-DESIGN.md`, `03-ANIMATIONS.md`.
> Semua teks yang tampil di website berbahasa **Indonesia**.

## 1. Tujuan
Bangun website edukasi interaktif satu halaman (single-page, scroll bersambung) yang menjelaskan dua algoritma metaheuristik: **JAYA** (berbasis populasi) dan **Simulated Annealing / SA** (berbasis solusi tunggal). Sumber materi adalah presentasi kuliah Metaheuristik ITS, Kelompok 4 Kelas C. Seluruh isinya ada di `01-CONTENT.md` dan harus akurat sesuai file itu.

Website harus:
1. Menjelaskan definisi, karakteristik, keunggulan, kelemahan, dan cara kerja tiap algoritma.
2. Punya **visualisasi animasi interaktif** langkah demi langkah untuk SA dan JAYA (detail di `03-ANIMATIONS.md`).
3. Punya **elemen 3D yang bisa diputar/digeser/di-zoom** pengguna (OrbitControls) (detail di `03-ANIMATIONS.md`).
4. Bertema **krem–cokelat dan perkamen** dengan ornamen klasik sesuai `02-DESIGN.md`, namun **gaya bahasa tetap akademik** mengikuti istilah pada PDF sumber.
5. Responsif (desktop, tablet, mobile) dan cepat.

## 2. Tech stack (wajib, kecuali ada alasan kuat)
- **Vite + React + TypeScript**
- **Tailwind CSS** (token warna/font diatur di `tailwind.config`)
- **three + @react-three/fiber + @react-three/drei** untuk 3D
- **framer-motion** untuk animasi UI/scroll reveal
- **HTML Canvas 2D / SVG** untuk visualisasi algoritma 2D
- **KaTeX** (`react-katex` atau `katex`) untuk rumus matematika
- **zustand** (opsional) untuk state simulasi
- Tanpa backend. Build statis, siap deploy ke Vercel.
- Jangan pakai aset berhak cipta. Semua tekstur/ornamen dibuat sendiri dengan CSS, SVG, atau canvas (lihat `02-DESIGN.md`).

## 3. Struktur halaman (urutan section)
1. **Hero / Pendahuluan** - judul "METAHEURISTIK", subjudul "Algoritma JAYA & Simulated Annealing", nama kelompok & anggota (dari `01-CONTENT.md`), scene 3D latar (lanskap fungsi yang bisa diputar), tombol "Mulai".
2. **Daftar Isi** - navigasi sticky bergaya perkamen ke semua section.
3. **Pengantar Singkat** — apa itu metaheuristik, beda populasi vs solusi tunggal (ringkas, 2–3 kalimat, boleh dari materi).
4. **Bab I — JAYA**: Definisi → Filosofi → Karakteristik → Keunggulan & Kelemahan → Cara Kerja (stepper 5 langkah) → **Simulator JAYA**.
5. **Bab II — Simulated Annealing**: Definisi → Karakteristik → Keunggulan & Kelemahan → Cara Kerja (stepper 10 langkah) → **Simulator SA** + **visualisasi 3D pendinginan logam**.
6. **Perbandingan** - tabel JAYA vs SA + simulasi berdampingan (kedua algoritma di landscape yang sama).
7. **Referensi** — 2 referensi dari PDF.
8. **Penutup "Terima Kasih"** — Kelompok 4 Kelas C.

## 4. Fitur interaktif minimum (definition of done)
- [ ] Navigasi sticky + scroll-spy + smooth scroll.
- [ ] Animasi scroll-reveal pada tiap kartu/section.
- [ ] Stepper "Cara Kerja" JAYA (5 langkah) dan SA (10 langkah): tombol Prev/Next, indikator progres, rumus KaTeX, penjelasan, dan contoh angka. Langkah aktif men-trigger animasi terkait di simulator.
- [ ] Simulator JAYA 2D (populasi, best, worst, pembaruan, seleksi) dengan kontrol play/pause/step/reset/kecepatan/ukuran populasi/pilihan fungsi.
- [ ] Simulator SA 2D (1 titik, temperatur, penerimaan solusi buruk, kurva cost & temperatur) dengan kontrol play/pause/step/reset/T0/α/kecepatan.
- [ ] Kalkulator mini interaktif: probabilitas SA `P = exp(-ΔC/T)`; update JAYA satu variabel.
- [ ] Demo penjadwalan task→node (tabel ETC, hitung beban node, makespan) yang bisa diklik/diubah (lihat `03-ANIMATIONS.md` §3).
- [ ] 3D: (a) Hero cost landscape, (b) visualisasi pendinginan logam SA, (c) visualisasi 3D populasi JAYA. Semua bisa diputar/zoom dengan mouse & touch.
- [ ] Respect `prefers-reduced-motion` (matikan animasi berat, tampilkan state statis).
- [ ] Fallback bila WebGL tidak tersedia (gambar/ilustrasi SVG statis).
- [ ] Lighthouse performance ≥ 80 desktop; lazy-load scene 3D saat masuk viewport.
- [ ] Aksesibilitas: kontras teks cukup, fokus keyboard terlihat, `aria-label` pada kontrol simulator.

## 5. Struktur folder yang disarankan
```
src/
  main.tsx, App.tsx
  styles/ (index.css, theme tokens)
  components/
    layout/ (Navbar, Footer, SectionFrame, OrnamentDivider, ScrollProgress)
    ui/ (ParchmentCard, WaxSealButton, Stepper, Tabs, Slider, Toggle)
    math/ (Tex.tsx)
    content/ (Definisi, Karakteristik, ProsKons, CaraKerja)
    sim/ (JayaSim.tsx, SaSim.tsx, CompareSim.tsx, TaskSchedulingDemo.tsx, ProbabilityCalc.tsx)
    three/ (HeroLandscape.tsx, AnnealingForge.tsx, JayaArena3D.tsx)
  lib/
    algorithms/ (jaya.ts, sa.ts, landscapes.ts, rng.ts)
    content.ts  // semua teks dari 01-CONTENT.md sebagai data terstruktur
  assets/ (SVG ornamen buatan sendiri)
```
**Penting:** pisahkan logika algoritma (`lib/algorithms`) dari UI supaya bisa dites dan dipakai ulang oleh simulator 2D, 3D, dan perbandingan. Gunakan RNG ber-seed agar simulasi bisa direproduksi (ada tombol "Seed baru").

## 6. Urutan kerja yang disarankan untuk agent
1. Scaffold Vite+React+TS+Tailwind, pasang dependensi, atur theme token dari `02-DESIGN.md`.
2. Buat layout, navbar, frame perkamen, ornamen, tekstur latar.
3. Masukkan konten statis dari `01-CONTENT.md` ke `lib/content.ts` dan render section.
4. Implementasi `lib/algorithms` (JAYA, SA, landscape) + unit test sederhana (contoh angka di `01-CONTENT.md` harus cocok).
5. Bangun simulator 2D + stepper yang tersinkron.
6. Bangun scene 3D.
7. Polish: animasi, responsif, aksesibilitas, performa.
8. Jalankan `npm run build`, perbaiki error/warning, tulis `README.md` singkat (cara jalan & deploy).

## 7. Aturan penting
- **Akurasi konten** lebih penting dari hiasan. Jangan mengubah rumus/angka dari `01-CONTENT.md`. Bila menambah penjelasan, tandai sebagai "Catatan" dan jangan bertentangan dengan materi.
- Hormati "Catatan Akurasi" di akhir `01-CONTENT.md`.
- Jangan menyalin aset, kode, atau teks dari situs referensi. Ambil **inspirasi suasana** saja (lihat `02-DESIGN.md` §Referensi).
- Teks UI Indonesia; istilah teknis (fitness, makespan, cooling schedule, dsb.) boleh tetap Inggris seperti di materi.
- Commit kecil dan sering; jelaskan di README fitur yang sudah selesai & yang belum.
