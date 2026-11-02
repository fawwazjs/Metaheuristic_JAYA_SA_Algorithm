# 03 — ANIMASI, SIMULATOR, & 3D

> Semua logika algoritma ada di `src/lib/algorithms/` (murni, tanpa UI, deterministik dengan RNG ber-seed).
> Simulator 2D, scene 3D, dan demo penjadwalan memakai modul yang sama.
> Konten & rumus: lihat `01-CONTENT.md`. Gaya visual: lihat `02-DESIGN.md`.

---

## 0. Infrastruktur Bersama

### 0.1 RNG ber-seed
`rng.ts`: implementasi `mulberry32(seed)` → fungsi `() => number` di [0,1). Semua acak (r, r1, r2, pemilihan neighbor, populasi awal) lewat RNG ini. Tombol **"Seed baru"** dan **input seed** (agar hasil bisa diulang).

### 0.2 Fungsi uji (Landscape)
`landscapes.ts` — fungsi 2D `f(x,y)` yang diminimalkan, domain `[-5, 5]²` (untuk Rastrigin pakai `[-5.12, 5.12]`):
| Nama bergaya | Fungsi | Sifat |
|---|---|---|
| "Lembah Tenang" | Sphere: `x² + y²` | unimodal, mudah |
| "Pegunungan Berduri" | Rastrigin: `20 + x² + y² − 10(cos2πx + cos2πy)` | banyak optimum lokal |
| "Jurang Berliku" | Rosenbrock: `(1−x)² + 100(y−x²)²` (domain dinormalisasi) | lembah sempit |
| "Kawah Ganda" | Himmelblau: `(x²+y−11)² + (x+y²−7)²` | 4 minimum |
| "Bukit Ackley" | Ackley | banyak lokal + global dalam |
Sediakan metadata: `domain`, `globalMin`, `maxForColor` untuk pewarnaan heatmap. Normalisasi tinggi untuk 3D (`height = scale * f/ fmax`, lalu `pow` agar tidak terlalu curam).

### 0.3 Mesin simulasi berbasis "step"
Setiap algoritma di-implementasi sebagai **state machine** dengan `init(config, rng)`, `step()` → mengembalikan `StepEvent` (apa yang baru terjadi), dan `state` (immutable snapshot untuk di-render). Ini memungkinkan:
- Play/pause/step manual/mundur 1 langkah (simpan riwayat snapshot, maks 500).
- Sinkron dengan stepper "Cara Kerja": tiap **fase** punya nama (`phase`) yang cocok dengan langkah di stepper.
- Animasi per fase: interpolasi visual antar snapshot (tween 200–600ms tergantung kecepatan).

### 0.4 Render
- 2D: `<canvas>` dua lapis (layer statis heatmap/kontur di-cache ke offscreen canvas; layer dinamis di-redraw tiap frame via `requestAnimationFrame`). Atau SVG untuk elemen sedikit (SA).
- 3D: react-three-fiber, `frameloop="demand"` bila statis, `"always"` saat ada animasi; `dpr={[1, 1.75]}`; lazy-load dengan `IntersectionObserver` + `React.lazy`.
- Hentikan loop saat tab tidak terlihat dan saat komponen di luar viewport.

---

## 1. Simulator JAYA (2D) — "Lanskap Fungsi dan Populasi"

### 1.1 Algoritma (`jaya.ts`)
```ts
type JayaConfig = { popSize: number; dim: 2; bounds: [number, number][]; fn: (x:number[])=>number;
  maxIter: number; seed: number; clamp: true };
type JayaPhase = 'init' | 'evaluate' | 'bestWorst' | 'update' | 'select' | 'iterate' | 'done';

// Per iterasi:
// 1) evaluate: F_k = fn(X_k) untuk semua kandidat
// 2) bestWorst: P_best = argmin F; P_worst = argmax F
// 3) update (per kandidat k, per dimensi i):
//    X'_{k,i} = X_{k,i} + r1*(Best_i - |X_{k,i}|) - r2*(Worst_i - |X_{k,i}|)   // r1,r2 ~ U(0,1) BARU tiap dimensi
//    lalu clamp ke bounds
// 4) select (greedy): jika fn(X') < fn(X) → terima, jika tidak tolak
// 5) iterate: ulangi sampai maxIter ATAU P_best & P_worst tidak berubah selama N iterasi (default 15)
```
- Pertahankan rumus **persis seperti slide** (`|X|`).
- Hasilkan `StepEvent` per kandidat saat fase `update/select` supaya bisa dianimasikan satu per satu (mode "lambat") atau semuanya serentak (mode "cepat").
- Catat riwayat: `bestFitnessPerIter`, `meanFitnessPerIter`, `worstFitnessPerIter`, jumlah update diterima/ditolak.

### 1.2 Visual
- Kanvas: **heatmap kontur** landscape (palet krem→cokelat→merah tua, kontur garis tinta tipis seperti peta kuno). Sumbu digambar sebagai garis peta.
- **Kandidat** = prajurit kecil (lingkaran bergaris/ikon pion) berwarna hijau `--forest`.
- **P_best** = ksatria bermahkota emas dengan aura/cahaya emas berdenyut.
- **P_worst** = pion merah gelap dengan retakan/tengkorak kecil + aura redup.
- **Pembaruan (fase update):** panah **hijau** dari kandidat menuju P_best (komponen `r1·(Best−|X|)`) dan panah **merah putus-putus** menjauhi P_worst (komponen `−r2·(Worst−|X|)`), lalu **vektor hasil** (jumlah) berwarna emas; kandidat bergerak mengikuti vektor hasil dengan tween.
- **Seleksi (fase select):** jika diterima → kilau emas + ikon ✔; jika ditolak → kandidat "terpental" kembali ke posisi lama + ikon ✖ (tampilkan kedua posisi sesaat: ghost).
- **Jejak (trail):** tiap kandidat meninggalkan jejak pudar (maks 20 titik).
- **Label:** `Iterasi k`, `Best F`, `Worst F`, `Diterima/Ditolak`.
- **Grafik konvergensi** di sisi/bawah: garis best/mean/worst vs iterasi (SVG), garis vertikal penanda iterasi saat ini.

### 1.3 Kontrol
Play/Pause · Step (satu fase) · Step Iterasi (satu iterasi penuh) · Mundur · Reset · **Kecepatan** (0.25×–4×) · **Ukuran populasi** (5–60) · **Landscape** (dropdown, §0.2) · **Seed** · toggle **tampilkan vektor**, **tampilkan jejak**, **tampilkan kontur**, **mode serentak/satu-per-satu** · batas iterasi maksimum.
Tampilkan panel angka real-time: untuk kandidat yang di-hover/diklik tampilkan perhitungan lengkap: `X, Best, Worst, r1, r2, X'` dan keputusan seleksi (**ini jantung edukasinya**).

### 1.4 Contoh langkah-demi-langkah (mini-demo terkait Langkah 3 stepper)
Komponen `JayaUpdateCalculator` — satu variabel, input: `X`, `P_best`, `P_worst`, slider `r1`, `r2` (0–1). Hitung: `X' = X + r1(Pbest−|X|) − r2(Pworst−|X|)` dan tampilkan dengan substitusi angka seperti slide.
**Preset "Contoh Slide":** `X=2, Pbest=3, Pworst=1, r1=r2=0.5` → hasil **3**. Visual: garis bilangan 1–3 dengan panah.
Tambahan: tombol **"Bulatkan ke VM"** (`round` + clamp [1, m]) yang menjelaskan kelemahan "konversi kontinu ke diskret".

---

## 2. Simulator SA (2D) — "Solusi Tunggal di Atas Lanskap"

### 2.1 Algoritma (`sa.ts`)
```ts
type SaConfig = { fn; bounds; T0: number | 'auto'; alpha: number /*0..1*/; innerLoops: number;
  Tfinal: number /*default 0.01*/; stepSize: number /*sigma neighbor*/; seed: number };
// Neighbor kontinu (untuk landscape): x' = x + N(0, stepSize^2), clamp
// Loop:
//  outer: while T > Tfinal:
//    inner: repeat innerLoops:
//      neighbor → ΔC = f(next) - f(cur)
//      if ΔC <= 0 → terima            // sesuai slide: ΔC=0 diterima
//      else P = exp(-ΔC/T); r~U(0,1); terima jika r < P
//      update S_cur; jika f(S_cur) < f(S_best) → S_best = S_cur
//    T = alpha * T
```
- `T0 = 'auto'`: hitung `T0 = −mean(ΔC_buruk)/ln(HEC)` dengan sampel 50 neighbor acak yang memperburuk, `HEC` default 0.9 (slider 0.5–0.99). Tampilkan rumus & angka.
- Jaga `ΔC>0` pada pemanggilan `exp` (cegah NaN/overflow).
- Riwayat: `T`, `curCost`, `bestCost`, tipe keputusan (`improve`, `equal`, `worse-accepted`, `worse-rejected`), `P`, `r`.

### 2.2 Visual
- **Kanvas utama** (landscape sama seperti §0.2): satu titik "bola logam panas" yang bergerak. Warna bola mengikuti temperatur (putih-kuning panas → oranye → merah → abu-baja dingin) + glow yang mengecil seiring T turun.
- **Neighbor** ditampilkan sebagai titik bayangan (ghost) + garis putus-putus ke posisi saat ini; hasil keputusan:
  - ΔC<0/=0: terima → garis hijau, bola melompat.
  - ΔC>0 diterima (Metropolis): garis **oranye** + percikan api + label "Diterima walau lebih buruk! P=0.67, r=0.31".
  - ΔC>0 ditolak: garis merah putus-putus, ghost memudar, bola tetap + label "Ditolak (r ≥ P)".
- **Jejak** seluruh lintasan (gradien warna waktu), titik **S_best** ditandai bendera/panji emas.
- **Termometer vertikal** bergaya kaca-alkimia di sisi: tinggi = T/T0, garis ambang `T_final`.
- **Grafik ganda** (SVG): (a) cost saat ini & best vs iterasi (kelihatan naik-turun di awal, stabil di akhir), (b) temperatur vs iterasi (kurva eksponensial `α^k`).
- **Indikator probabilitas:** meteran setengah lingkaran menunjukkan `P = exp(−ΔC/T)` untuk neighbor terakhir; jarum `r` acak; terima bila jarum r < P (animasi jarum berayun lalu mengunci).
- **Histogram "penerimaan solusi buruk"** per fase suhu (tinggi→rendah) untuk menunjukkan makin sedikit diterima.

### 2.3 Kontrol
Play/Pause · Step · Step sampai suhu turun · Mundur · Reset · **T0** (slider / "auto") · **α** (0.80–0.999) · **inner loops** (1–200) · **T_final** · **ukuran langkah** · **Landscape** · **Seed** · kecepatan 0.25×–8× · toggle ghost/jejak/termometer.

### 2.4 Kalkulator interaktif (`ProbabilityCalc`) — terkait Langkah 8 & 10
Slider `ΔC` (0–20) dan `T` (0.01–50). Tampilkan `P = e^{−ΔC/T}` + **kurva P terhadap T** (untuk ΔC tetap) dengan titik yang bergerak. Preset dari slide:
- `ΔC=4, T=10` → `P≈0.6703`
- `ΔC=4, T=1` → `P≈0.0183`
Kalkulator **cooling**: `α=0.998, T0=10` → tabel T1=9.98, T2=9.96004, T3≈9.94012; tombol "Berapa iterasi hingga T<0.01?" (`n = ceil(ln(Tfinal/T0)/ln(α))`).
Kalkulator **T0**: input `ΔC̄` & `HEC` → `T0`; preset `ΔC̄=2, HEC=0.9` → **18.98**.

---

## 3. Demo Penjadwalan Task→Node (SA diskret) — "Papan Pembagian Tugas"

Ini visualisasi untuk bagian "Cara Kerja SA" Langkah 1–4 & 6–9 dengan data slide.

### 3.1 Data & model
Matriks ETC (persis slide):
```
        N1  N2  N3
  t1     4   6   9
  t2     7   3   5
  t3     8   4   2
  t4     5   7   4
```
Solusi `S = [s1..s4]`, `s_i ∈ {1,2,3}`. `C_j(S)`, `f(S)=max_j C_j`.
Preset awal **S0 = [1,2,3,1]** → `C=(9,3,2)`, `f=9`.

### 3.2 Visual
- 3 "dermaga/bengkel" (node) berupa tiga **batang tumpukan** (stacked bar): tiap tugas = blok bertinggi sebanding ETC(i,j), warna per tugas. Garis horizontal merah = makespan (`max`). Node dengan beban terbesar ber-glow ("pemimpin beban").
- Blok bisa **di-drag** ke node lain (manual), dan batang langsung diperbarui + tampil `ΔC`.
- **Mode SA otomatis:** tombol "Jalankan SA otomatis" menjalankan SA diskret dengan operator neighbor dari §3.3, animasi blok berpindah, dan log keputusan (Terima/Tolak + P + r).
- Tabel matriks ETC dengan sel yang menyala sesuai penempatan saat ini.
- **Contoh slide interaktif:** klik "Tampilkan perhitungan C1" → highlight ETC(1,1)=4 dan ETC(4,1)=5 → `C1=9`.
- Hitung & tampilkan **solusi optimal brute-force** (3⁴=81 kemungkinan) sebagai pembanding "Harta karun sebenarnya", agar pengguna melihat seberapa dekat SA.
- Opsi: **JAYA diskret** (`round+clamp`) untuk dataset yang sama, tampilkan perbedaan hasil.

### 3.3 Operator neighbor (6 jenis, dari slide)
Implementasikan sebagai fungsi pada array `S`:
1. `newNodeInsertion(S)`: pilih satu tugas, ganti dengan node baru (acak, ≠ lama).
2. `swap(S)`: tukar `s_a` dan `s_b`.
3. `randomShuffle(S)`: pilih subset indeks, acak ulang nilainya di antara mereka.
4. `displacement(S)`: ambil segmen, geser ke posisi lain.
5. `insertion(S)`: ambil satu elemen, sisipkan di indeks lain (geser sisanya).
6. `inversion(S)`: balik urutan segmen `S[a..b]`.
UI: dropdown "Operator perturbation" (+ opsi "Acak dari semuanya") dan animasi singkat mengilustrasikan operator pada deretan kotak `S` (panah silang/bengkok seperti diagram slide, digambar sendiri).

---

## 4. Sinkronisasi Stepper ↔ Simulator

- Stepper "Cara Kerja" (JAYA 5 langkah, SA 10 langkah) dan simulator dihubungkan oleh store (`zustand`): `activePhase`.
- Mengklik langkah di stepper → simulator **melompat/menyorot** fase terkait (misal Langkah 3 JAYA → mode `update` dengan vektor panah ditampilkan; Langkah 8 SA → meteran probabilitas disorot).
- Sebaliknya, ketika simulator berjalan, stepper menyorot fase aktif ("Sedang di: Langkah 4 — Seleksi").
- Setiap langkah di stepper memiliki tombol **"Lihat di Simulator ▶"** yang men-scroll halus dan menjalankan 1 siklus demonstrasi.

**Peta fase:**
| Algoritma | Langkah stepper → fase simulator |
|---|---|
| JAYA | 1 → `init` · 2 → `evaluate` + `bestWorst` · 3 → `update` · 4 → `select` · 5 → `iterate`/`done` |
| SA | 1–4 → demo penjadwalan (ETC, S, C_j, f) · 5 → `T0` · 6 → `neighbor` · 7 → `deltaC` · 8 → `metropolis` · 9 → `updateBest` · 10 → `cool` + `stop` |

---

## 5. Scene 3D (react-three-fiber + drei) — bisa digerakkan pengguna

Umum: `OrbitControls` (rotate: drag, zoom: scroll/pinch, pan: klik kanan/dua jari) dengan `enableDamping`, batas `minDistance/maxDistance`, `maxPolarAngle` agar tidak tembus bawah tanah. Tombol UI **"Reset Kamera"**, **"Auto-rotate"** toggle, dan petunjuk kecil "Seret untuk memutar · Scroll untuk zoom". Bayangan lembut (1 directional light, resolusi 1024), fog cokelat. Frame time target ≤ 16ms desktop, kurangi detail di mobile (`useDetectGPU` dari drei atau cek `devicePixelRatio`/`navigator.hardwareConcurrency`).

### 5.1 Hero: "Lanskap Biaya" (`HeroLandscape`)
- Mesh `PlaneGeometry` (128×128 segmen; 64×64 di mobile) dengan tinggi dari fungsi Rastrigin/Himmelblau yang **berubah perlahan** (morph antar landscape tiap ~12 dtk, atau tombol "Ganti Medan").
- Material: shader/`vertexColors` gradien krem→cokelat→merah tua; garis kontur tinta tipis (via shader sederhana `fract(height*n)`), tampilan seperti **peta kuno 3D**.
- Beberapa partikel cahaya (ember) melayang. Bola logam kecil menggelinding di landscape (lintasan SA) — dekoratif.
- Teks hero (HTML) di atas canvas; kamera auto-rotate pelan; pengguna bisa drag untuk memutar. Klik pada medan → tempatkan bola; ia menuruni lembah (gradient descent kecil dengan sedikit "noise SA").

### 5.2 Bab SA: "Tempa Logam" (`AnnealingForge`)
Visual metafora 3D proses annealing + tautan ke algoritma.
- Landasan (anvil) dan batang logam (`BoxGeometry` / silinder) di atasnya; **material emissive** yang warnanya mengikuti temperatur `T` (putih-kuning → oranye → merah → abu baja).
- **Kisi atom/kristal** (InstancedMesh ~ 200–400 bola kecil) di dalam/di sekitar batang: pada T tinggi atom **bergetar acak** (amplitudo ∝ T) dan kisi tidak teratur; seiring T turun (cooling schedule) atom **menetap ke posisi kisi teratur** (energi minimum). Tampilkan metrik "Energi" ≈ jumlah deviasi dari kisi (selaras `cost`).
- Slider **Temperatur** (manual) + tombol **"Dinginkan perlahan (α=0.998)"** vs **"Celup air (dinginkan cepat)"** untuk menunjukkan beda hasil: pendinginan lambat → kristal rapi (cost rendah), cepat → cacat/terperangkap (optimum lokal) — hanya efek visual, beri catatan edukatif.
- Percikan api (partikel) saat "palu" memukul; palu beranimasi setiap iterasi "diterima".
- HUD kecil: `T`, `P(terima buruk)`, `Energi`.

### 5.3 Bab JAYA: "Visualisasi 3D Populasi" (`JayaArena3D`)
- Permukaan landscape 3D (pakai komponen/shader yang sama dengan hero) berukuran lebih kecil.
- Kandidat = bidak catur/pion 3D sederhana (`ConeGeometry`+`SphereGeometry` atau `LatheGeometry`), bergerak di atas permukaan (y = f(x,z)) mengikuti algoritma JAYA sungguhan dari `lib/algorithms/jaya.ts`.
- P_best = bidak raja emas dengan mahkota & pilar cahaya vertikal; P_worst = bidak gelap dengan cincin merah berdenyut.
- Saat fase update: **panah 3D** (ArrowHelper/cylinder+cone) dari kandidat ke best (hijau) dan menjauhi worst (merah); kandidat bergerak mulus.
- Kontrol dibagi dengan simulator 2D (play/pause/step/populasi/landscape) — **satu store bersama**: ubah di 2D → 3D ikut berubah. Tab **"Peta 2D / Medan 3D"** untuk berpindah tampilan.
- Klik bidak → panel perhitungan (seperti §1.3).

### 5.4 Perbandingan: "JAYA vs SA" (`CompareArena`)
- Landscape sama, dua garis: JAYA (hijau) dan SA (oranye). Tombol **"Mulai Perbandingan"** menjalankan keduanya dengan evaluasi yang sama.
- Panel bawah: grafik best-so-far vs **jumlah evaluasi fungsi** (adil, sumbu-x = evaluasi, bukan iterasi). Counter evaluasi per algoritma.
- Ringkasan otomatis setelah selesai ("JAYA menemukan 0.02 dalam 340 evaluasi; SA menemukan 0.11 dalam 340 evaluasi") — **hasil bergantung seed & landscape**, tampilkan catatan kecil "Hasil acak; ulangi dengan seed berbeda" dan opsi **"Jalankan 20 kali"** (tabel mean±std) di Web Worker supaya UI tidak macet.
- Tabel perbandingan statis (dari konten): populasi vs solusi tunggal, parameter, memori, kekuatan, kelemahan.

### 5.5 (Bonus) "Bidak Karakteristik"
Empat objek 3D kecil di kartu Karakteristik yang berputar saat hover (JAYA: perisai/pasukan; SA: landasan/termometer) — model prosedural sederhana (primitive geometry), bukan model unduhan.

---

## 6. Performa & Ketahanan
- Web Worker untuk komputasi berat (batch 20 run, brute-force ETC besar).
- `useFrame` ringan: hindari alokasi objek per frame; pakai `InstancedMesh` untuk partikel/atom/kandidat banyak.
- Deteksi WebGL (`document.createElement('canvas').getContext('webgl2'|'webgl')`); bila tidak ada → fallback SVG statis + simulator 2D tetap berfungsi.
- Dispose geometry/material/texture saat unmount; batasi jumlah canvas WebGL aktif bersamaan (**maks 2**; yang di luar viewport di-pause atau di-unmount).
- Simpan preferensi (seed, landscape, kecepatan) di `localStorage` dengan `try/catch`.

## 7. Pengujian (minimal)
Unit test (Vitest) untuk `lib/algorithms`:
- JAYA update contoh slide: `X=2, Pbest=3, Pworst=1, r1=r2=0.5` → `3`.
- Dengan seed tetap, `jaya` pada Sphere: best fitness non-increasing dan akhirnya < 1e-2 (±iterasi cukup).
- SA: `C1(S=[1,2,3,1]) = 9`, `f = 9`; `T0(ΔC̄=2, HEC=0.9) ≈ 18.98`; `P(ΔC=4,T=10) ≈ 0.6703`; `P(ΔC=4,T=1) ≈ 0.0183`; cooling `α=0.998,T0=10` → `9.98, 9.96004, ≈9.94012`.
- SA: `ΔC ≤ 0` selalu diterima; `S_best` tidak pernah memburuk.
- Operator neighbor menghasilkan array valid (panjang sama, nilai di [1..N]).
- RNG ber-seed deterministik.
Pengujian manual: tombol Play/Pause/Step/Reset di kedua simulator; keyboard; mobile 360px; `prefers-reduced-motion`; WebGL off.

## 8. Daftar Ceklis Visualisasi (Definition of Done)
- [ ] JAYA 2D: populasi, best/worst, vektor tarik/tolak, seleksi, grafik konvergensi.
- [ ] JAYA calculator: contoh slide → 3.
- [ ] SA 2D: bola panas, neighbor ghost, Metropolis meter, termometer, grafik cost & T.
- [ ] SA calculators: T0 (18.98), P (0.6703 / 0.0183), cooling.
- [ ] Papan penjadwalan ETC: drag blok, makespan, SA otomatis, 6 operator, brute-force pembanding.
- [ ] Stepper tersinkron dengan simulator (2 arah).
- [ ] 3D: HeroLandscape, AnnealingForge, JayaArena3D, CompareArena — semua OrbitControls.
- [ ] Reduced-motion & fallback non-WebGL.
- [ ] Unit test lulus; `npm run build` sukses tanpa error.
