import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use the command and mode parameters instead of import.meta.env
  const isProd = mode === 'production';
  
  return {
    plugins: [
      vue(),
      vuetify({ autoImport: true }), // Enable Vuetify component auto-import
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'), // Setup '@' alias to point to src directory
      },
    },
    base: isProd ? "/nc-scorer/" : "/", // Preserve the base URL for GitHub Pages
    server: {
      watch: {
        usePolling: true
      },
      proxy: {
        '/ensembl/': {
          target: 'https://rest.ensembl.org',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ensembl/, ''),
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (_proxyReq, req) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          }
        }
      }
    },
    define: {
      // Make process.env available to the client for compatibility
      'process.env': {
        NODE_ENV: JSON.stringify(mode),
        BASE_URL: JSON.stringify(isProd ? "/nc-scorer/" : "/")
      }
    }
  };
});
