import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Nama repository GitHub. GitHub Pages untuk "project site" menyajikan
 * situs dari https://<user>.github.io/<nama-repo>/, sehingga semua aset
 * (JS, CSS, favicon) harus memakai prefix /<nama-repo>/.
 *
 * Kalau nanti pindah ke custom domain atau user site (<user>.github.io),
 * ganti nilainya menjadi ''.
 */
const REPO_NAME = 'Metaheuristic_JAYA_SA_Algorithm'

export default defineConfig(({ command }) => ({
  // Dev server tetap di root ("/"), build produksi memakai base repo.
  base: command === 'build' ? `/${REPO_NAME}/` : '/',
  plugins: [react()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          katex: ['katex'],
          motion: ['framer-motion'],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}))