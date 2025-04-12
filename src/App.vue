<template>
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
  </v-app>
</template>

<script>
import AppBar from './components/AppBar.vue';
import FooterBar from './components/FooterBar.vue';
import GlobalNotification from './components/GlobalNotification.vue';
import useTour from '@/composables/useTour.js';
import { onMounted } from 'vue';

export default {
  name: 'NCScorer',
  components: {
    AppBar,
    FooterBar,
    GlobalNotification,
  },
  setup() {
    const { startTour, isFirstVisit } = useTour();

    // Auto-start the tour for first-time visitors after a short delay
    // to ensure the UI has fully loaded
    onMounted(() => {
      if (isFirstVisit()) {
        // Delay tour start to ensure all components are mounted
        setTimeout(() => {
          startTour();
        }, 1500);
      }
    });

    return {
      // No need to expose these properties as they're only used internally
    };
  },
};
</script>
