import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  build: {
    outDir: 'build',
    assetsDir: 'assets',
    rollupOptions: {
      // Additional Rollup build options can be specified here
    },
  },
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './setupTests.js',
    coverage: {
      exclude: [
        'dist/*',
        'src/main.jsx',
        'src/__tests__/validity.test.jsx',
        '.eslintrc.cjs',
        'vite.config.js',
      ],
    },
  },
});
