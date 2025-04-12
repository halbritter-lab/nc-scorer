import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { sitemap } from 'vite-plugin-sitemap';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use the command and mode parameters instead of import.meta.env
  const isProd = mode === 'production';
  
  return {
    plugins: [
      vue(),
      vuetify({ autoImport: true }), // Enable Vuetify component auto-import
      sitemap({
        hostname: isProd ? 'https://halbritter-lab.github.io/nc-scorer' : 'http://localhost:5173',
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        // Define static routes for the sitemap
        urls: [
          // Static pages
          { url: '/', changefreq: 'weekly', priority: 1.0 },
          { url: '/faq', changefreq: 'monthly', priority: 0.7 },
          // Dynamic routes - these are sample routes that will be included in the sitemap
          // Common gene/variant entries can be added statically to ensure they're indexed
          { url: '/symbols/PKD1', priority: 0.8 },
          { url: '/symbols/PKD2', priority: 0.8 },
          { url: '/variant/chr16-g.2162630C>T', priority: 0.8 },
          { url: '/scoring/chr16-g.2162630C>T/dominant', priority: 0.8 },
        ],
      }),
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
