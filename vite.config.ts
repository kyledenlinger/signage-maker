import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative base so the build works on GitHub Pages or any static host.
  base: './',
  plugins: [react()],
  build: {
    // The export chunk (jsPDF, JSZip, html-to-image) is ~500 kB and loads after the page is idle.
    chunkSizeWarningLimit: 600,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
