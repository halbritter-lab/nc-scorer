// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

// Vuetify
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

// Material Design Icons
import "@mdi/font/css/materialdesignicons.css";

// Import the theme configuration
import themeConfig from '@/config/themeConfig.json';

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: themeConfig.defaultTheme
  }
});

createApp(App)
  .use(vuetify)
  .use(router)
  .mount('#app');
