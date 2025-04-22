<!-- components/FooterBar.vue -->

<template>
  <v-footer app padless class="elevation-3">
    <v-row justify="center" no-gutters align="center">
      <!-- Disclaimer acknowledgment date display -->
      <v-col cols="auto" class="disclaimer-info mr-auto" v-if="formattedAcknowledgmentDate">
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <div class="d-flex align-center" v-bind="props">
              <v-icon size="small" class="mr-1">mdi-information-outline</v-icon>
              <span class="text-caption">Disclaimer acknowledged: {{ formattedAcknowledgmentDate }}</span>
            </div>
          </template>
          <span>Click to view the research disclaimer</span>
        </v-tooltip>
        <v-btn
          variant="text"
          density="compact"
          size="small"
          class="ml-2 pa-1"
          @click="showDisclaimer"
          aria-label="View disclaimer"
        >
          <v-icon size="small">mdi-gavel</v-icon>
        </v-btn>
      </v-col>
      
      <v-spacer v-if="formattedAcknowledgmentDate"></v-spacer>
      
      <!-- Footer links -->
      <v-col cols="auto" v-for="link in footerLinks" :key="link.text">
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-btn
              icon
              :href="link.href"
              target="_blank"
              text
              v-bind="props"
              min-width="48px"
              min-height="48px"
              :aria-label="link.text || 'External link'"
              class="footer-icon-btn"
            >
              <v-icon>{{ link.icon }}</v-icon>
            </v-btn>
          </template>
          <span>{{ link.text }}</span>
        </v-tooltip>
      </v-col>
    </v-row>
    
    <!-- Dialog to show disclaimer again when requested -->
    <v-dialog v-model="disclaimerDialogVisible" max-width="600">
      <v-card>
        <v-card-title class="text-h5">
          Research Use Disclaimer
        </v-card-title>
        <v-card-text>
          <v-alert
            type="warning"
            variant="tonal"
            class="mb-4"
          >
            <strong>NC-Scorer is intended for research purposes only and is not a clinical diagnostic tool.</strong>
          </v-alert>

          <p class="mb-3">By using NC-Scorer, you acknowledge and agree to the following:</p>
          
          <ul class="mb-3">
            <li class="mb-2">This tool is designed for <strong>research and informational purposes only</strong>.</li>
            <li class="mb-2">NC-Scorer does <strong>not</strong> provide medical advice or diagnosis.</li>
            <li class="mb-2">The scores and predictions are based on computational models and publicly available data, not on clinical validation for individual cases.</li>
            <li class="mb-2">Results should <strong>not</strong> be used for making clinical decisions without independent validation and consultation with qualified healthcare professionals.</li>
          </ul>
          
          <p>Using this application implies understanding and acceptance of these limitations.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="acknowledgeAgain">
            I Understand and Agree
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-footer>
</template>

<script>
import { ref, onMounted } from 'vue';
import footerConfig from '../config/footerConfig.json'; // Adjust the path to your config file
import { useDisclaimer } from '@/composables/useDisclaimer';

export default {
  name: 'FooterBar',
  setup() {
    const footerLinks = ref(footerConfig.links);
    const disclaimerDialogVisible = ref(false);
    
    // Get disclaimer information from the composable
    const { getFormattedAcknowledgmentDate, saveDisclaimerAcknowledgment } = useDisclaimer();
    const formattedAcknowledgmentDate = ref(getFormattedAcknowledgmentDate());

    // Function to open the disclaimer dialog
    const showDisclaimer = () => {
      disclaimerDialogVisible.value = true;
    };
    
    // Function to acknowledge the disclaimer again and update the timestamp
    const acknowledgeAgain = () => {
      saveDisclaimerAcknowledgment();
      formattedAcknowledgmentDate.value = getFormattedAcknowledgmentDate();
      disclaimerDialogVisible.value = false;
    };
    
    onMounted(() => {
      // Refresh the acknowledgment date from localStorage on mount
      formattedAcknowledgmentDate.value = getFormattedAcknowledgmentDate();
    });

    return {
      footerLinks,
      disclaimerDialogVisible,
      formattedAcknowledgmentDate,
      showDisclaimer,
      acknowledgeAgain
    };
  },
};
</script>

<style scoped>
/* Footer icon button styles for better touch targets */
.footer-icon-btn {
  margin: 0 6px; /* Add horizontal spacing between buttons */
  padding: 12px; /* Increase padding to improve the touch target size */
}

/* Ensure icons are properly sized */
.v-icon {
  font-size: 24px; /* Standardize icon size */
}

/* Disclaimer info styles */
.disclaimer-info {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  padding-left: 12px;
}
</style>
