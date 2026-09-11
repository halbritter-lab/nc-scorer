import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  // Public assets are served by Vite; unit tests must not import /img as a
  // Windows filesystem path when compiling component templates.
  plugins: [
    vue({ template: { transformAssetUrls: { includeAbsolute: false } } }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    server: {
      deps: {
        inline: ['vuetify'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: [
        'src/**/*.{js,vue}',
        'scripts/docs-dev-server.js',
        'scripts/variant-linker-browser.js',
        'scripts/vuetify-motion.js',
      ],
      exclude: ['src/assets/**', 'src/styles/**'],
    },
  },
});
