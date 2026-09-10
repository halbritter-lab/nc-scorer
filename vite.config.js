// vite.config.js - Modernized ESM configuration
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const isProd = mode === 'production';
  
  // Dynamic import for the sitemap plugin (ESM module)
  const { default: VitePluginSitemap } = await import('vite-plugin-sitemap');
  
  return {
    plugins: [
      vue(),
      {
        name: 'mdi-font-display-swap',
        transform(code, id) {
          if (id.includes('materialdesignicons') && id.endsWith('.css')) {
            return {
              code: code.replace(/@font-face\s*\{/g, '@font-face {\n  font-display: swap;'),
              map: null,
            };
          }
        },
      },
      {
        name: 'variant-linker-proxy-fix',
        transform(code, id) {
          if (id.includes('variant-linker') && (id.includes('apiHelper') || id.includes('configHelper'))) {
            let transformed = code;
            if (transformed.includes('process.env.ENSEMBL_BASE_URL || apiConfig.ensembl.baseUrl')) {
              transformed = transformed.replace(
                'process.env.ENSEMBL_BASE_URL || apiConfig.ensembl.baseUrl',
                '(typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "/ensembl" : apiConfig.ensembl.baseUrl)'
              );
            }
            return {
              code: transformed,
              map: null,
            };
          }
        },
      },
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
        hostname: 'https://nc-scorer.kidney-genetics.org',
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        // Generate dynamic routes from gene database
        urls: async () => {
          if (isProd) {
            try {
              const { generateSitemapRoutes } = await import('./scripts/generate-sitemap-routes.js');
              return generateSitemapRoutes();
            } catch (error) {
              console.warn('Could not generate dynamic sitemap routes:', error.message);
            }
          }
          // Fallback routes for development or if generation fails
          return [
            { url: '/', changefreq: 'weekly', priority: 1.0 },
            { url: '/genes', changefreq: 'weekly', priority: 0.8 },
            { url: '/batch', changefreq: 'weekly', priority: 0.8 },
            { url: '/about', changefreq: 'monthly', priority: 0.7 },
            { url: '/methodology', changefreq: 'monthly', priority: 0.7 },
            { url: '/search', changefreq: 'daily', priority: 0.9 },
          ];
        },
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
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },
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
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('vuetify')) {
                return 'vuetify';
              }
              if (id.includes('variant-linker')) {
                return 'variant-linker';
              }
              if (id.includes('vue') || id.includes('pinia') || id.includes('@unhead')) {
                return 'vue-core';
              }
            }
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
    preview: {
      port: 4173,
      host: 'localhost',
      proxy: {
        '/ensembl/': {
          target: 'https://rest.ensembl.org',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ensembl/, ''),
        },
        '/ensembl_grch37/': {
          target: 'https://grch37.rest.ensembl.org',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ensembl_grch37/, ''),
        },
      },
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
      // Make process.env properties specifically available without clobbering third-party libraries
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.BASE_URL': JSON.stringify('/'),
    }
  };
});
