# Metaheuristic_JAYA_SA_Algorithm

Website edukasi interaktif tentang algoritma metaheuristik **JAYA** dan **Simulated Annealing** — Kelompok 4 Kelas C, ITS.

Dibangun dengan **Vite + React + TypeScript + Tailwind CSS**, dengan visualisasi 3D (`@react-three/fiber`) dan animasi (`framer-motion`).

## Menjalankan secara lokal

Butuh Node.js 20+.

```bash
npm install
npm run dev       # http://localhost:5173
```

Perintah lain:

```bash
npm run build     # build produksi ke folder dist/
npm run preview   # cek hasil build
npm test          # unit test algoritma
```

## Deploy ke GitHub Pages

Situs ini berupa SPA statis, jadi cocok di-hosting gratis di GitHub Pages. Konfigurasi sudah disiapkan di repo ini:

1. **`vite.config.ts`** — `base` di-set ke `/Metaheuristic_JAYA_SA_Algorithm/` saat build, karena GitHub Pages menyajikan project site dari `https://<user>.github.io/<repo>/`. Tanpa ini, JS/CSS/favicon akan 404.
2. **`.github/workflows/deploy.yml`** — otomatis build + deploy setiap push ke `main`.
3. **`.nojekyll`** — ditambahkan ke hasil build supaya GitHub Pages tidak memproses file lewat Jekyll.

### Langkah aktivasi (sekali saja)

1. Buka repo di GitHub → **Settings** → **Pages**.
2. Di bagian **Build and deployment** → **Source**, pilih **GitHub Actions** (bukan "Deploy from a branch").
3. Push ke `main` (atau jalankan workflow manual dari tab **Actions** → *Deploy ke GitHub Pages* → **Run workflow**).
4. Setelah workflow selesai, situs tersedia di:

   ```
   https://fawwazjs.github.io/Metaheuristic_JAYA_SA_Algorithm/
   ```

### Kalau pindah ke custom domain / user site

Ubah `REPO_NAME` di `vite.config.ts` menjadi `''`, lalu tambahkan file `public/CNAME` berisi domain kamu (untuk custom domain). Untuk user site (`<user>.github.io`), `base` harus `/`.

## Struktur singkat

```
src/
  components/   # layout, konten, simulasi, visual 3D, UI
  lib/          # algoritma JAYA, SA, scheduling, konten
  store/        # state management (zustand)
  styles/       # Tailwind + CSS global
public/         # aset statis (favicon)
```
