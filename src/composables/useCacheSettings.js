/**
 * Composable for managing API cache settings/preferences
 * Now uses centralized Pinia store for state management and persistence
 */
import { computed } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore';

export function useCacheSettings() {
  const settingsStore = useSettingsStore();

  // The 'enabled' state is now a computed property reading from the store
  const cacheEnabled = computed(() => settingsStore.isCacheEnabled);

  // Actions now delegate to the store
  const toggleCacheEnabled = () => {
    settingsStore.toggleCache();
    return settingsStore.isCacheEnabled;
  };

  // Explicitly set cache enabled state
  const setCacheEnabled = (value) => {
    settingsStore.setCacheEnabled(!!value);
    return settingsStore.isCacheEnabled;
  };

  return {
    cacheEnabled,
    toggleCacheEnabled,
    setCacheEnabled,
  };
}
