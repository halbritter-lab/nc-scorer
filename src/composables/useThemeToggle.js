// src/composables/useThemeToggle.js
import { computed } from 'vue';
import { useTheme } from 'vuetify';
import { useSettingsStore } from '@/stores/settingsStore';

export default function useThemeToggle() {
  const theme = useTheme();
  const settingsStore = useSettingsStore();

  const darkTheme = computed(() => settingsStore.isDarkMode);

  // The toggleTheme action now does two things:
  // 1. Calls the store action to persist the state.
  // 2. Updates the live Vuetify theme.
  const toggleTheme = () => {
    settingsStore.toggleTheme(); // Persists the new state
    theme.global.name.value = settingsStore.isDarkMode ? 'dark' : 'light';
  };

  // Also provide a method to set theme directly (useful for initialization)
  const setTheme = (isDark) => {
    settingsStore.setTheme(isDark);
    theme.global.name.value = isDark ? 'dark' : 'light';
  };

  return { darkTheme, toggleTheme, setTheme };
}
