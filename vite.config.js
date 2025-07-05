// vite.config.js - Convert to ESM format
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';
import fs from 'fs';
// Use dynamic import for sitemap plugin to handle ESM compatibility
// Will be imported asynchronously in the config function

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  // Use the command and mode parameters instead of import.meta.env
  const isProd = mode === 'production';
  
  // Dynamic import for the sitemap plugin (ESM module)
  const { default: VitePluginSitemap } = await import('vite-plugin-sitemap');
  
  return {
    plugins: [
      vue(),
      vuetify({
        autoImport: true,
        // Disable Vuetify's built-in sass handling to avoid sass-embedded issues
        styles: false,
      }), // Enable Vuetify component auto-import
      // Add bundle visualizer in build mode
      visualizer({
        open: false,
        gzipSize: true,
        brotliSize: true,
        filename: 'dist/stats.html',
      }),
      VitePluginSitemap({
        hostname: isProd ? 'https://nc-scorer.kidney-genetics.org' : 'http://localhost:5173',
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        // Define static routes for the sitemap
        urls: [
          // Static pages
          { url: '/', changefreq: 'weekly', priority: 1.0 },
          { url: '/genes', changefreq: 'weekly', priority: 0.8 },
          { url: '/batch', changefreq: 'weekly', priority: 0.8 },
          { url: '/about', changefreq: 'monthly', priority: 0.7 },
          { url: '/methodology', changefreq: 'monthly', priority: 0.7 },
          // Dynamic routes - these are sample routes that will be included in the sitemap
          // Common gene/variant entries can be added statically to ensure they're indexed
          { url: '/symbols/PKD1', priority: 0.8 },
          { url: '/symbols/PKD2', priority: 0.8 },
          { url: '/variant/chr16-g.2162630C>T', priority: 0.8 },
          { url: '/scoring/chr16-g.2162630C>T/dominant', priority: 0.8 },
        ],
      }),
      {
        name: 'copy-cname',
        writeBundle() {
          if (fs.existsSync('CNAME')) {
            fs.copyFileSync('CNAME', path.join('dist', 'CNAME'));
          }
        }
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'), // Setup '@' alias to point to src directory
      },
    },
    base: '/', // Custom domain doesn't need subdirectory
    
    // Optimize build output for better caching
    build: {
      cssCodeSplit: true, // Split CSS by chunk for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-core': ['vue', 'vue-router'],
            vuetify: ['vuetify', 'vuetify/styles'],
            icons: ['@mdi/font/css/materialdesignicons.css'],
          },
          // Ensure asset names include content hash for better caching
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
        },
      },
      // Configure chunk size warnings
      chunkSizeWarningLimit: 700, // KB
    },
    server: {
      watch: {
        usePolling: true,
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
          },
        },
        '/ensembl_grch37/': {
          target: 'https://grch37.rest.ensembl.org',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ensembl_grch37/, ''),
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.log('GRCh37 proxy error', err);
            });
            proxy.on('proxyReq', (_proxyReq, req) => {
              console.log('Sending GRCh37 Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log('Received GRCh37 Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
      },
    },
    define: {
      // Make process.env available to the client for compatibility
      'process.env': {
        NODE_ENV: JSON.stringify(mode),
        BASE_URL: JSON.stringify('/'),
      },
    }
  };
});
