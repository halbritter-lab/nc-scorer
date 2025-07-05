import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      // Enable hot reload for docs
      usePolling: true,
      interval: 100
    }
  }
});