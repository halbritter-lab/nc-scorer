// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';

// Vuetify - Manual style imports to avoid sass-embedded dependency issues
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';

// Custom CSS for font optimization without requiring Sass processing
import '@/assets/css/font-optimization.css';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

// Performance optimization: Add font-display: swap to prevent FOIT (Flash of Invisible Text)
// This is done via CSS instead of Sass to avoid sass-embedded issues

// Import the theme configuration
import themeConfig from '@/config/themeConfig.json';

// Custom styles for Shepherd Tour are loaded only when needed via the useTour composable

// Configurable performance settings
const ENABLE_PERFORMANCE_HINTS = true;

// Create Vuetify instance with tree-shakable components
const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: themeConfig.defaultTheme,
  },
});

// Create Pinia instance
const pinia = createPinia();

// Create and mount the app
const app = createApp(App);

// Register plugins
app.use(vuetify);
app.use(router);
app.use(pinia);

// Mount the app
app.mount('#app');

// Performance monitoring (only in development)
if (import.meta.env.DEV && ENABLE_PERFORMANCE_HINTS) {
  // Import logService directly to avoid circular import issues
  const { logService } = await import('./services/logService');
  
  // Monitor for Largest Contentful Paint
  new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      logService.debug(`LCP: ${entry.startTime}ms - ${entry.element?.tagName || 'unknown element'}`);
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
