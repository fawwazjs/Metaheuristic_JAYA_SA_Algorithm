import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import type { Connect, Plugin } from 'vite'

/**
 * Nama repository GitHub. GitHub Pages untuk "project site" menyajikan
 * situs dari https://<user>.github.io/<nama-repo>/, sehingga semua aset
 * (JS, CSS, favicon) harus memakai prefix /<nama-repo>/.
 *
 * Kalau nanti pindah ke custom domain atau user site (<user>.github.io),
 * ganti nilainya menjadi ''.
 */
const REPO_NAME = 'Metaheuristic_JAYA_SA_Algorithm'

/**
 * `/cloudsim` (tanpa garis miring) dialihkan ke `/cloudsim/`. Tanpa ini, fallback SPA
 * dev/preview server menyajikan halaman utama. GitHub Pages sudah melakukan hal yang sama.
 */
function cloudsimTrailingSlash(): Plugin {
  // Diketik minimal karena proyek ini tidak memasang @types/node (tipe request
  // bawaan Vite tanpa itu tidak punya properti url).
  const redirect = (
    req: { url?: string },
    res: { statusCode: number; setHeader(name: string, value: string): void; end(): void },
    next: () => void,
  ) => {
    const [path, query] = (req.url ?? '').split('?')
    if (!path.endsWith('/cloudsim')) return next()
    res.statusCode = 301
    res.setHeader('Location', `${path}/${query ? `?${query}` : ''}`)
    res.end()
  }
  const middleware = redirect as unknown as Connect.NextHandleFunction
  return {
    name: 'cloudsim-trailing-slash',
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  }
}

export default defineConfig(({ command, isPreview }) => ({
  // Dev server tetap di root ("/"); build produksi dan `vite preview` (yang menyajikan hasil
  // build) memakai base repo, supaya preview benar-benar meniru GitHub Pages.
  base: command === 'build' || isPreview ? `/${REPO_NAME}/` : '/',
  plugins: [react(), cloudsimTrailingSlash()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      // Dua halaman: materi utama (/) dan hasil simulasi CloudSim (/cloudsim/).
      input: {
        main: 'index.html',
        cloudsim: 'cloudsim/index.html',
      },
      output: {
        // Fungsi (bukan objek) agar setiap modul pasti masuk chunk paketnya. Dengan bentuk
        // objek, React ikut tertarik ke chunk three sebagai dependensi @react-three/fiber,
        // sehingga halaman /cloudsim/ yang tidak memakai 3D ikut mengunduh three.js.
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return undefined
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
          if (/\/node_modules\/(three|@react-three)\//.test(id)) return 'three'
          if (/\/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return 'motion'
          if (/\/node_modules\/katex\//.test(id)) return 'katex'
          return undefined
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}))