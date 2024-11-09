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
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        'node_modules',
        '.eslintrc.cjs',
        'vite.config.js',
        'src/main.tsx',
        'src/helper.tsx',
        'dist/*',
      ],
    },
  },
});
