/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

// Nazwa repozytorium na GitHubie — wymagane przez GitHub Pages
// (patrz CLAUDE.md, "Pułapki Phaser + Vite" oraz docs/02_ARCHITEKTURA.md sekcja 14).
const REPO_NAME = 'portfolio-runner';

export default defineConfig({
  base: `/${REPO_NAME}/`,
  build: {
    target: 'es2022',
    sourcemap: false,
    // Phaser to jeden duży moduł (~1.2 MB min) — ostrzeżenie o rozmiarze chunku nie jest tu błędem.
    chunkSizeWarningLimit: 1500,
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
