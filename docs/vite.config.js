import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      ignored: ['**/.vitepress/dist/**', '**/.vitepress/cache/**'],
    },
  },
});
