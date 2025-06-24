/**
 * Composable for managing disclaimer acknowledgment state
 * Now uses centralized Pinia store for state management and persistence
 */
import { computed } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore';

export function useDisclaimer() {
  const settingsStore = useSettingsStore();

  // Use the store's getters and actions directly
  return {
    isAcknowledged: computed(() => settingsStore.isDisclaimerAcknowledged),
    acknowledgedAt: computed(() => settingsStore.disclaimerAcknowledgedAt),
    checkDisclaimerStatus: () => settingsStore.isDisclaimerAcknowledged, // For backward compatibility in App.vue
    saveDisclaimerAcknowledgment: () => settingsStore.acknowledgeDisclaimer(),
    resetDisclaimerAcknowledgment: () => {
      // Reset disclaimer by setting acknowledgedAt to null
      settingsStore.disclaimerAcknowledgedAt = null;
    },
    getFormattedAcknowledgmentDate: () => settingsStore.formattedDisclaimerDate,
  };
}
