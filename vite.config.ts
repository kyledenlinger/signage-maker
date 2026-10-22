import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative base so the build works on GitHub Pages or any static host.
  base: './',
  plugins: [react()],
  // The export libraries load lazily, so the dev server would only find them mid-session and
  // reload the page to re-bundle them. Bundle them up front.
  optimizeDeps: {
    entries: ['index.html', 'gallery.html'],
    include: ['html-to-image', 'jspdf', 'jszip', 'qrcode'],
  },
  build: {
    // The export chunk (jsPDF, JSZip, html-to-image) is ~500 kB and loads after the page is idle.
    chunkSizeWarningLimit: 600,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
