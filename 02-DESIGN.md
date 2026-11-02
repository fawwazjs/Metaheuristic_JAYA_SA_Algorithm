# 02 — DESAIN: Tema Krem–Cokelat, Perkamen, dan Ornamen Klasik

> Referensi hanya untuk **inspirasi suasana & pola interaksi**. Jangan menyalin kode, aset, ilustrasi, logo, atau teks mereka.
> - https://tongari-anime.com/en/ → ambil: layout editorial yang rapi, tipografi besar elegan, transisi section yang mulus, ilustrasi/ornamen sebagai framing, hero yang sinematik.
> - https://wha-spell-simulator.vercel.app/ → ambil: nuansa panel kontrol yang rapi, efek partikel/glow saat aksi, hasil simulasi yang terasa hidup.
> - https://bestiary.ca/ → ambil: nuansa **halaman buku klasik**, kartu seperti halaman buku tua, ilustrasi bergaya cetak/tinta, tipografi serif klasik.
> (Agent boleh membuka referensi untuk melihat suasana, tapi buat semua aset secara orisinal.)

## 1. Konsep Kreatif
**"Halaman Materi Kuliah Metaheuristik"** — website terasa seperti membuka **bahan ajar bergaya buku klasik**: latar perkamen, tipografi serif, ornamen sebagai bingkai. Setiap bagian adalah halaman materi perkamen. Dua algoritma disajikan sebagai dua pendekatan yang dibandingkan:

- **JAYA** — algoritma berbasis populasi: setiap kandidat bergerak menuju solusi terbaik dan menjauhi solusi terburuk. Ikon: **kumpulan titik/kandidat** dengan penanda terbaik.
- **Simulated Annealing (SA)** — algoritma berbasis solusi tunggal yang terinspirasi proses pendinginan logam: panas tinggi → didinginkan perlahan. Ikon: **logam, palu, dan api**.

**Aturan bahasa (penting):** seluruh teks UI memakai istilah akademik/teknis yang ada di PDF sumber — *algoritma, populasi, kandidat solusi, temperatur, pendinginan, keunggulan, kelemahan, perbandingan, referensi*. Hindari diksi bernuansa fantasi/medieval (kitab, kawanan penakluk, pandai besi, arena duel, gerbang kerajaan, anugerah & kutukan, segel, gulungan, manuskrip).

Penamaan UI (tetap sertakan istilah asli di sampingnya agar edukatif):
| Bagian | Judul | Istilah asli |
|---|---|---|
| Hero | Pendahuluan | Pendahuluan |
| Daftar isi | Daftar Isi | Daftar Isi |
| Bab I | Algoritma JAYA | Algoritma JAYA |
| Bab II | Simulated Annealing | Simulated Annealing |
| Perbandingan | Perbandingan | JAYA vs SA |
| Referensi | Referensi | Referensi |
| Penutup | Penutup | Terima Kasih |
| Keunggulan | Keunggulan | Keunggulan |
| Kelemahan | Kelemahan | Kelemahan |

## 2. Palet Warna (token Tailwind/CSS variable)

```css
:root {
  /* Perkamen & krem */
  --parchment-50:  #FBF4E4;   /* highlight kertas */
  --parchment-100: #F4E8CC;   /* latar utama */
  --parchment-200: #E9D5A8;   /* kartu */
  --parchment-300: #D9BF86;   /* border lembut */
  --parchment-400: #C4A263;

  /* Cokelat kulit / kayu */
  --leather-500: #8A5A2B;     /* aksen */
  --leather-600: #6B4423;     /* header, tombol */
  --leather-700: #4E3119;     /* teks sekunder / border tebal */
  --leather-800: #35210F;     /* teks utama */
  --leather-900: #1F1208;     /* latar gelap (footer, hero overlay) */

  /* Tinta & aksen heraldik */
  --ink:        #2A1B0E;      /* teks body */
  --gold:       #B8862B;      /* emas antik, garis/ornamen */
  --gold-light: #E3B64F;      /* glow/hover */
  --wax-red:    #7A1E1E;      /* segel lilin, aksen CTA */
  --forest:     #3F5B3A;      /* aksen JAYA (hijau kesatria) */
  --ember:      #C8561E;      /* aksen SA (bara/api) */
  --steel:      #5E6A73;      /* logam */
}
```
- **Latar halaman:** `--parchment-100` dengan tekstur (lihat §3), tepi digelapkan (vignette cokelat tua) agar terasa seperti kertas tua.
- **Teks:** `--ink` di atas perkamen (kontras tinggi); teks terang `--parchment-50` di atas `--leather-800/900`.
- **Aksen per bab:** JAYA → `--forest` + emas; SA → `--ember` + emas. Dipakai untuk glow, progress, highlight rumus.
- **Mode gelap "Lilin":** (opsional, bonus) tombol toggle lilin ☾ → latar `--leather-900`, teks krem, cahaya emas hangat. Default tetap terang.

## 3. Tekstur Latar & Hiasan (buat sendiri, tanpa aset berhak cipta)

### 3.1 Tekstur perkamen
Buat dengan kombinasi, urutan dari bawah ke atas:
1. Warna dasar `--parchment-100`.
2. **SVG `feTurbulence`** (noise fraktal) sebagai tekstur serat/bercak kertas, `baseFrequency` ~0.8–1.2, opacity 0.08–0.15, `mix-blend-mode: multiply`. Variasikan dengan `feTurbulence` kedua berfrekuensi rendah (~0.012) untuk bercak noda besar.
3. **Radial-gradient vignette** cokelat transparan di tepi (inset box-shadow lebar).
4. Garis serat halus (repeating-linear-gradient sangat tipis, opacity < 0.04).
5. Opsional: noda air/tinta (beberapa radial-gradient acak) dan lipatan kertas (garis vertikal/horizontal pudar).

Sediakan komponen `<ParchmentBackground />` dan kelas utilitas `.parchment`, `.parchment-dark` (kulit/kayu), `.stone` (batu abu-cokelat untuk footer).

### 3.2 Tekstur kayu & kulit (untuk navbar, tombol, panel kontrol)
- Kayu: gradient cokelat bergaris + `feTurbulence` anisotropik (baseFrequency `0.01 0.4`) untuk serat horizontal.
- Kulit: noise halus + inner shadow + jahitan (garis putus-putus emas pucat di tepi).
- Paku/rivet kuningan (lingkaran kecil radial-gradient emas) di sudut panel.

### 3.3 Hiasan (semua SVG/CSS orisinal, simpan di `src/assets/ornaments/`)
- **Border manuskrip:** bingkai ganda emas–cokelat dengan **sudut berornamen** (corner flourish, pola sulur/knotwork Celtic sederhana).
- **Pembatas section (`<OrnamentDivider />`):** garis dengan motif tengah (fleur-de-lis / mahkota / pedang bersilang / bintang delapan sudut), garis menggambar dirinya (stroke-dashoffset) saat masuk viewport.
- **Drop cap / inisial berhias:** huruf pertama paragraf pembuka tiap bab besar, berwarna merah segel/emas, dengan bingkai sulur.
- **Margin doodles** (marginalia): ikon kecil ala manuskrip di tepi (kunci, gulungan, tengkorak kecil, naga kecil, kesatria kecil) — SVG garis tinta sederhana, opacity rendah.
- **Segel lilin (`<WaxSealButton />`):** tombol CTA berbentuk segel merah dengan emboss; saat ditekan efek "cap" turun & muncul riak.
- **Panji/Banner:** kain bergelombang (SVG path dianimasikan halus) untuk judul bab, ekor bertakik "V".
- **Perisai heraldik:** lambang JAYA (perisai hijau + mahkota) dan SA (perisai bara + landasan) sebagai ikon tab/judul.
- **Gulungan (scroll):** navbar & daftar isi berbentuk gulungan yang membentang.
- **Obor/lilin:** dua obor di kiri-kanan hero dengan api animasi CSS/canvas (flicker lembut).
- **Debu/ember partikel:** partikel kecil melayang di hero & bab SA (canvas ringan, ≤ 60 partikel).
- **Cap tinta tumpah/percikan** sebagai transisi antar section (opsional).

### 3.4 Tekstur untuk 3D
- Material perkamen/kayu/batu prosedural: gunakan `CanvasTexture` dari canvas noise (bukan file gambar). Normal/bump sederhana dari noise yang sama.
- Cahaya hangat: `PointLight` oranye (obor) + `AmbientLight` krem rendah + fog cokelat gelap.

## 4. Tipografi
Gunakan Google Fonts (self-host jika memungkinkan, `font-display: swap`):
| Peran | Font | Catatan |
|---|---|---|
| Judul besar / hero | **MedievalSharp** atau **Cinzel Decorative** | huruf kapital, letter-spacing lebar |
| Judul bab/section | **Cinzel** (600–700) | rapi, kaku, klasik |
| Inisial/drop cap | **UnifrakturCook** atau **Pirata One** | blackletter, hanya untuk huruf pertama |
| Body | **EB Garamond** atau **Crimson Pro** | nyaman dibaca, 18–20px |
| Rumus/kode/angka | **KaTeX** (rumus), **JetBrains Mono** / **IM Fell** untuk label angka | |
| UI kecil/label | **Cinzel** small-caps | |

- Body 18–20px, line-height 1.7, lebar baris maks ~68ch.
- Pastikan teks Indonesia terbaca baik (diakritik tidak diperlukan, tapi cek glyph).
- Jangan memakai blackletter untuk paragraf panjang (keterbacaan).

## 5. Layout & Komponen

### 5.1 Grid & ritme
- Container maks 1200px; konten teks 720–800px; kartu 2–4 kolom di desktop, 1 kolom di mobile.
- Setiap section punya `padding-block` besar (96–140px desktop) agar terasa seperti halaman buku.
- Gaya **halaman buku**: pada desktop, section "Cara Kerja" berbentuk **buku terbuka 2 halaman** (kiri: teks & rumus, kanan: visualisasi). Mobile: ditumpuk vertikal.

### 5.2 Komponen utama
- **Navbar sticky:** bilah kayu/kulit tipis di atas; logo kecil "M" berhias; tautan sebagai plakat; progress scroll berupa garis emas di bawahnya; menu mobile = gulungan yang turun.
- **ParchmentCard:** kartu perkamen dengan border emas, sudut berornamen, shadow lembut; hover: terangkat 2–4px + glow emas tipis.
- **Kartu karakteristik (4 buah):** bergaya **kartu tarot/bestiary**: ikon di atas, judul Cinzel, deskripsi; hover membalik/memiringkan sedikit (tilt 3D ringan).
- **Pros/Cons:** dua kolom - "Keunggulan" (hijau/emas, ikon tameng) vs "Kelemahan" (merah/gelap, ikon peringatan). Tiap butir bisa **diklik untuk expand** (judul ringkas → penjelasan).
- **Stepper "Cara Kerja":** bergaya **halaman bernomor** dengan angka Romawi (I–X); indikator berupa jalur dengan titik/lilin yang menyala saat langkah tercapai; tombol "◀ Halaman Sebelumnya / Halaman Berikutnya ▶".
- **Rumus:** dibungkus panel "tulisan tangan" (latar krem lebih gelap, border putus-putus), KaTeX warna `--ink`; variabel penting di-highlight berwarna sesuai aksen bab.
- **Panel kontrol simulator:** panel gelap dengan slider, tombol Play/Pause/Step/Reset, dan toggle. Label huruf kapital kecil.
- **Tooltip:** gulungan kecil bertinta.
- **Footer:** blok batu/kayu gelap, daftar anggota kelompok, dan tautan bagian.

## 6. Motion Design (UI)
- **Page load:** layar pembuka singkat (≤ 1,5 dtk): segel lilin retak → gerbang terbuka → hero. Bisa dilewati (klik / `prefers-reduced-motion`).
- **Scroll reveal:** elemen muncul seperti tinta meresap: fade + translateY 16px + sedikit blur → jelas. Stagger 60–90ms.
- **Pembatas section:** garis ornamen "digambar".
- **Parallax ringan** pada marginalia, obor, dan lapisan tekstur (maks 20–40px).
- **Hover:** glow emas, kursor opsional berbentuk pena/pedang kecil (mudah dimatikan; jangan wajib).
- **Mikro-interaksi:** klik tombol → riak seperti tetes tinta/lilin; langkah stepper berpindah → halaman "membalik" (rotateY pendek, 350–500ms).
- Durasi standar 300–600ms, easing `cubic-bezier(.22,.8,.3,1)`.
- Hormati `prefers-reduced-motion`: ganti dengan fade sederhana, matikan parallax & partikel.

## 7. Suara (opsional bonus)
Toggle suara default **mati**. Efek kecil buatan sendiri (WebAudio sintetis, tanpa file berhak cipta): denting logam saat SA menerima solusi, desir saat JAYA bergerak, "cap" saat klik segel. Pastikan ada kontrol mute yang jelas.

## 8. Responsif
- Breakpoint: 360, 640, 1024, 1280.
- Mobile: navbar jadi ikon gulungan; buku 2 halaman → 1 kolom; scene 3D turun kompleksitas (partikel & shadow dikurangi); kontrol simulator tetap besar (target sentuh ≥ 44px).
- Canvas simulasi harus menyesuaikan lebar kontainer (ResizeObserver, devicePixelRatio ≤ 2).

## 9. Aksesibilitas & Kualitas
- Kontras teks ≥ 4.5:1 (periksa `--ink` vs perkamen; `--gold` jangan untuk teks kecil di atas krem).
- Semua kontrol dapat diakses keyboard (Tab, Enter, Space, panah untuk stepper/slider); fokus berupa cincin emas jelas.
- `aria-live="polite"` untuk ringkasan hasil simulasi ("Iterasi 12, best cost 9").
- Ornamen dekoratif `aria-hidden="true"`; gambar bermakna punya `alt`.
- Jangan mengandalkan warna saja untuk status (tambahkan ikon/label: ✔ diterima / ✖ ditolak).

## 10. Do & Don't
**Do**
- Pertahankan keterbacaan: ornamen mendukung, bukan mengganggu konten.
- Konsisten: satu gaya garis (tinta, ketebalan 1.5–2px) untuk semua ikon/ornamen.
- Buat aset sendiri; boleh gunakan emoji/ikon Unicode seperlunya sebagai placeholder, lalu ganti SVG buatan sendiri.

**Don't**
- Jangan memakai logo ITS, foto kampus, atau gambar dari PDF/situs referensi.
- Jangan menyalin asset/kode/ilustrasi/musik dari tongari-anime, wha-spell-simulator, atau bestiary.ca.
- Jangan berlebihan dengan font dekoratif untuk teks panjang.
- Jangan membuat animasi berat yang menghambat scroll (jaga 60fps; gunakan `transform`/`opacity`, `will-change` seperlunya).
