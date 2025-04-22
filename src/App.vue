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
    
    <!-- Disclaimer dialog -->
    <DisclaimerDialog v-if="!isDisclaimerAcknowledged" @acknowledged="onDisclaimerAcknowledged" />
  </v-app>
</template>

<script>
import AppBar from './components/AppBar.vue';
import FooterBar from './components/FooterBar.vue';
import GlobalNotification from './components/GlobalNotification.vue';
import DisclaimerDialog from './components/DisclaimerDialog.vue';
import useTour from '@/composables/useTour.js';
import { useDisclaimer } from '@/composables/useDisclaimer.js';
import { onMounted, ref } from 'vue';

export default {
  name: 'NCScorer',
  components: {
    AppBar,
    FooterBar,
    GlobalNotification,
    DisclaimerDialog,
  },
  setup() {
    const { startTour, shouldShowTour } = useTour();
    const { checkDisclaimerStatus } = useDisclaimer();
    
    const isDisclaimerAcknowledged = ref(checkDisclaimerStatus());

    // Function called when the disclaimer is acknowledged
    const onDisclaimerAcknowledged = () => {
      isDisclaimerAcknowledged.value = true;
    };

    // Auto-start the tour for new users or those who haven't explicitly completed/skipped it
    // after a short delay to ensure the UI has fully loaded
    onMounted(() => {
      // Check if disclaimer has been acknowledged
      isDisclaimerAcknowledged.value = checkDisclaimerStatus();
      
      // Only show tour if disclaimer is acknowledged and tour should be shown
      if (isDisclaimerAcknowledged.value && shouldShowTour()) {
        // Delay tour start to ensure all components are mounted
        setTimeout(() => {
          startTour();
        }, 1500);
      }
    });

    return {
      isDisclaimerAcknowledged,
      onDisclaimerAcknowledged
    };
  },
};
</script>
