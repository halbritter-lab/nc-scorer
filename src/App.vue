<template>
  <!-- Wrap entire app in API cache provider to ensure inject() is always used within proper context -->
  <ApiCacheProvider>
    <v-app>
    <!-- Include the AppBar component -->
    <AppBar />

    <!-- Application content -->
    <v-main>
      <router-view></router-view>
    </v-main>

    <!-- Include the FooterBar component -->
    <FooterBar />

    <!-- Global notification system -->
    <GlobalNotification />
    
    <!-- Log Viewer (lazy loaded) -->
    <Suspense v-if="showLogViewer">
      <template #default>
        <LogViewer />
      </template>
      <template #fallback>
        <v-card class="log-viewer-loading" elevation="10">
          <v-card-title class="log-viewer-loading-header">
            <span>Log Viewer</span>
            <v-spacer></v-spacer>
            <v-btn
              icon="mdi-close"
              size="small"
              variant="text"
              @click="closeLogViewer"
            ></v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="text-center pa-8">
            <v-progress-circular 
              indeterminate 
              color="primary"
              size="32"
              class="mb-3"
            ></v-progress-circular>
            <div>Loading log viewer...</div>
          </v-card-text>
        </v-card>
      </template>
    </Suspense>
    
    <!-- Disclaimer dialog -->
    <DisclaimerDialog v-if="!isDisclaimerAcknowledged" @acknowledged="onDisclaimerAcknowledged" />
    
    <!-- Global Structured Data -->
    <JsonLd :data="structuredData" />
  </v-app>
  </ApiCacheProvider>
</template>

<script>
import AppBar from './components/AppBar.vue';
import FooterBar from './components/FooterBar.vue';
import GlobalNotification from './components/GlobalNotification.vue';
import DisclaimerDialog from './components/DisclaimerDialog.vue';
import ApiCacheProvider from './components/ApiCacheProvider.vue';
import JsonLd from './components/JsonLd.vue';
import useTour from '@/composables/useTour.js';
import { useDisclaimer } from '@/composables/useDisclaimer.js';
import { useSeo } from '@/composables/useSeo.js';
import { onMounted, ref, defineAsyncComponent, computed } from 'vue';
import { useUiStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTheme } from 'vuetify';
import { logService } from '@/services/logService';
import { 
  generateOrganizationSchema, 
  generateWebApplicationSchema, 
  generateSearchActionSchema,
  combineSchemas 
} from '@/utils/jsonLd';

// Lazy load the LogViewer component for better initial loading performance
const LogViewer = defineAsyncComponent(() => import('./components/LogViewer.vue'));

export default {
  name: 'NCScorer',
  components: {
    AppBar,
    FooterBar,
    GlobalNotification,
    DisclaimerDialog,
    LogViewer,
    ApiCacheProvider,
    JsonLd,
  },
  setup() {
    const { startTour, shouldShowTour } = useTour();
    const { checkDisclaimerStatus } = useDisclaimer();
    const uiStore = useUiStore();
    const settingsStore = useSettingsStore();
    const theme = useTheme();
    
    // Initialize SEO
    useSeo();
    
    // Generate global structured data
    const structuredData = combineSchemas(
      generateOrganizationSchema(),
      generateWebApplicationSchema(),
      generateSearchActionSchema()
    );
    
    const isDisclaimerAcknowledged = ref(checkDisclaimerStatus());
    const showLogViewer = computed(() => uiStore.showLogViewer);
    
    const closeLogViewer = () => {
      uiStore.closeLogViewer();
    };

    // Function called when the disclaimer is acknowledged
    const onDisclaimerAcknowledged = () => {
      isDisclaimerAcknowledged.value = true;
    };

    // Auto-start the tour for new users or those who haven't explicitly completed/skipped it
    // after a short delay to ensure the UI has fully loaded
    onMounted(() => {
      // Set the initial theme from the persisted store state
      theme.global.name.value = settingsStore.isDarkMode ? 'dark' : 'light';
      
      // Check if disclaimer has been acknowledged
      isDisclaimerAcknowledged.value = checkDisclaimerStatus();
      
      // Only show tour if disclaimer is acknowledged and tour should be shown
      if (isDisclaimerAcknowledged.value && shouldShowTour()) {
        // Delay tour start to ensure all components are mounted
        setTimeout(() => {
          startTour();
        }, 1500);
      }
      
      // Create a single info log entry at app startup
      logService.info('Application initialized - NC-Scorer');
    });

    return {
      isDisclaimerAcknowledged,
      onDisclaimerAcknowledged,
      showLogViewer,
      closeLogViewer,
      structuredData
    };
  },
};
</script>

<style scoped>
.log-viewer-loading {
  position: fixed;
  bottom: 64px;
  right: 16px;
  width: 400px;
  max-width: 90%;
  z-index: 1000;
}

.log-viewer-loading-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
}
</style>
