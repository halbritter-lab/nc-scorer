// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import { createHead } from '@unhead/vue/client';
import { useUiStore } from '@/stores/uiStore';

// Vuetify - Manual style imports to avoid sass-embedded dependency issues
import 'vuetify/styles';

// Shared touch target sizing
import '@/assets/css/font-optimization.css';
import { createVuetify } from 'vuetify';
import { iconConfig } from '@/config/iconConfig';

// Import the theme configuration
import themeConfig from '@/config/themeConfig.json';

// Custom styles for Shepherd Tour are loaded only when needed via the useTour composable

// Configurable performance settings
const ENABLE_PERFORMANCE_HINTS = true;

// Create Vuetify instance with tree-shaking enabled via vite-plugin-vuetify
const vuetify = createVuetify({
  icons: iconConfig,
  theme: {
    defaultTheme: themeConfig.defaultTheme,
    themes: {
      dark: {
        colors: {
          background: '#101b1a',
          surface: '#192725',
          primary: '#a0ddd0',
          'primary-darken-1': '#6daf9f',
          'on-surface': '#e2efeb',
          'on-surface-variant': '#afc5bf',
          secondary: '#00695C',
        },
      },
      light: {
        colors: {
          background: '#f5f8f7',
          surface: '#ffffff',
          primary: '#006b5e',
          'primary-darken-1': '#005247',
          'on-surface': '#193b36',
          'on-surface-variant': '#526963',
          secondary: '#00695C',
        },
      },
    },
  },
});

// Create Pinia instance
const pinia = createPinia();

// Create head instance for SEO
const head = createHead();

// Create and mount the app
const app = createApp(App);

// Register plugins
app.use(vuetify);
app.use(router);
app.use(pinia);
app.use(head);

// Resolve the initial route before showing the shell so the footer does not
// jump out of the viewport when the first lazy page arrives.
router
  .isReady()
  .catch(() => {
    useUiStore(pinia).notifyError(
      'This page could not load. Refresh the page or choose another page from the navigation.',
    );
  })
  .then(() => app.mount('#app'));

// Performance monitoring (only in development)
if (import.meta.env.DEV && ENABLE_PERFORMANCE_HINTS) {
  // Import logService directly to avoid circular import issues
  const { logService } = await import('./services/logService');

  // Monitor for Largest Contentful Paint
  new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      logService.debug(
        `LCP: ${entry.startTime}ms - ${entry.element?.tagName || 'unknown element'}`,
      );
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true });

  // Monitor for First Input Delay
  new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      const delay = entry.processingStart - entry.startTime;
      logService.debug(`FID: ${Math.round(delay)}ms`);
    }
  }).observe({ type: 'first-input', buffered: true });
}
