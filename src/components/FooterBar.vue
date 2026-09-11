<!-- components/FooterBar.vue -->

<template>
  <v-footer class="app-footer">
    <div class="footer-content-wrapper">
      <v-row justify="center" no-gutters align="center">
        <!-- Left side controls group -->
        <v-col cols="auto" class="footer-controls-left mr-auto">
          <!-- Disclaimer Button -->
          <v-tooltip location="top" aria-label="View research disclaimer">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                variant="text"
                min-height="44"
                min-width="44"
                :color="formattedAcknowledgmentDate ? 'primary' : undefined"
                @click="showDisclaimer"
                aria-label="View disclaimer information"
                class="pa-2 mr-2"
              >
                <v-icon
                  start
                  :icon="
                    formattedAcknowledgmentDate
                      ? 'mdi-check-circle-outline'
                      : 'mdi-gavel'
                  "
                  class="mr-1"
                ></v-icon>
                <span class="text-caption font-weight-medium">Disclaimer</span>
              </v-btn>
            </template>
            <!-- Tooltip Content -->
            <span>
              {{
                formattedAcknowledgmentDate
                  ? `Research disclaimer acknowledged: ${formattedAcknowledgmentDate}. Click to view again.`
                  : 'View the research disclaimer.'
              }}
            </span>
          </v-tooltip>

          <!-- Log Viewer Toggle Button -->
          <v-tooltip location="top" aria-label="Show or hide application logs">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                variant="text"
                min-height="44"
                min-width="44"
                :color="showLogViewer ? 'primary' : undefined"
                @click="toggleLogViewer"
                aria-label="Show/Hide Application Logs"
                class="pa-2"
              >
                <v-icon start icon="mdi-text-box-outline" class="mr-1"></v-icon>
                <span class="text-caption font-weight-medium">Logs</span>
              </v-btn>
            </template>
            <span>{{
              showLogViewer ? 'Hide application logs' : 'Show application logs'
            }}</span>
          </v-tooltip>
        </v-col>
        <!-- Spacer to push other icons right -->
        <v-spacer></v-spacer>

        <!-- Footer links -->
        <v-col cols="auto" v-for="link in footerLinks" :key="link.text">
          <v-tooltip location="top" :aria-label="link.text">
            <template v-slot:activator="{ props }">
              <v-btn
                icon
                :href="link.href"
                target="_blank"
                rel="noopener noreferrer"
                variant="text"
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

    <DisclaimerDialog
      v-if="disclaimerDialogVisible"
      :require-acknowledgment="!isAcknowledged"
      @closed="acknowledgeAgain"
    />
  </v-footer>
</template>

<script>
import { ref, computed } from 'vue';
import footerConfig from '../config/footerConfig.json';
import { useDisclaimer } from '@/composables/useDisclaimer';
import { useUiStore } from '@/stores/uiStore';
import DisclaimerDialog from '@/components/DisclaimerDialog.vue';

export default {
  name: 'FooterBar',
  components: { DisclaimerDialog },
  setup() {
    const footerLinks = ref(footerConfig.links);
    const disclaimerDialogVisible = ref(false);

    const { getFormattedAcknowledgmentDate, isAcknowledged } = useDisclaimer();
    const formattedAcknowledgmentDate = computed(
      getFormattedAcknowledgmentDate,
    );

    // UI store integration for log viewer
    const uiStore = useUiStore();
    const showLogViewer = computed(() => uiStore.showLogViewer);
    const toggleLogViewer = () => uiStore.toggleLogViewer();

    const showDisclaimer = () => {
      disclaimerDialogVisible.value = true;
    };

    const acknowledgeAgain = () => {
      disclaimerDialogVisible.value = false;
    };

    return {
      footerLinks,
      isAcknowledged,
      disclaimerDialogVisible,
      formattedAcknowledgmentDate,
      showDisclaimer,
      acknowledgeAgain,
      // Log viewer
      showLogViewer,
      toggleLogViewer,
    };
  },
};
</script>

<style scoped>
.app-footer {
  flex: 0 0 auto;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
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

/* Left controls group styling */
.footer-controls-left {
  display: flex;
  align-items: center;
}
</style>
