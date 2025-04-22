<!-- components/FooterBar.vue -->

<template>
  <v-footer app padless class="elevation-3">
    <div class="footer-content-wrapper">
      <v-row justify="center" no-gutters align="center">
        <!-- Combined Disclaimer Button -->
        <v-col cols="auto" class="disclaimer-info mr-auto" v-if="formattedAcknowledgmentDate">
          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                variant="text"
                density="compact"
                size="small"
                :color="formattedAcknowledgmentDate ? 'success' : 'grey-darken-1'"
                @click="showDisclaimer"
                aria-label="View disclaimer information"
                class="pa-1"
              >
                <v-icon
                  start
                  :icon="formattedAcknowledgmentDate ? 'mdi-check-circle-outline' : 'mdi-gavel'"
                  class="mr-1"
                ></v-icon>
                <span class="text-caption">Disclaimer</span>
              </v-btn>
            </template>
            <!-- Tooltip Content -->
            <span>
              {{ formattedAcknowledgmentDate
                 ? `Research disclaimer acknowledged: ${formattedAcknowledgmentDate}. Click to view again.`
                 : 'View the research disclaimer.' }}
            </span>
          </v-tooltip>
        </v-col>
        <!-- Spacer to push other icons right -->
        <v-spacer></v-spacer>

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
    </div>

    <!-- Dialog remains unchanged -->
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
import footerConfig from '../config/footerConfig.json';
import { useDisclaimer } from '@/composables/useDisclaimer';

export default {
  name: 'FooterBar',
  setup() {
    const footerLinks = ref(footerConfig.links);
    const disclaimerDialogVisible = ref(false);

    const { getFormattedAcknowledgmentDate, saveDisclaimerAcknowledgment } = useDisclaimer();
    const formattedAcknowledgmentDate = ref(getFormattedAcknowledgmentDate());

    const showDisclaimer = () => {
      disclaimerDialogVisible.value = true;
    };

    const acknowledgeAgain = () => {
      saveDisclaimerAcknowledgment();
      // Force update after saving potentially new timestamp
      formattedAcknowledgmentDate.value = getFormattedAcknowledgmentDate();
      disclaimerDialogVisible.value = false;
    };

    onMounted(() => {
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
.footer-content-wrapper {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
  /* Ensure the row inside takes full height */
  display: flex;
  align-items: center;
  min-height: 56px; /* Adjust based on Vuetify footer default height */
}

/* Style the new disclaimer button */
.disclaimer-info .v-btn {
  text-transform: none; /* Prevent uppercase */
}
.disclaimer-info .v-btn .v-icon {
   font-size: 18px; /* Slightly smaller icon inside button */
}

.footer-icon-btn {
  margin: 0 6px;
  padding: 12px;
}

.v-icon {
  font-size: 24px;
}

/* Original disclaimer-info class can be simplified or removed if not needed elsewhere */
.disclaimer-info {
  /* Styles here apply to the v-col wrapper */
}

</style>