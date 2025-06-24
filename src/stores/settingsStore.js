// src/stores/settingsStore.js
import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

const STORAGE_KEY = 'nc-scorer-settings';

// Helper function to load and parse state from localStorage
function loadStateFromStorage() {
  const savedState = localStorage.getItem(STORAGE_KEY);
  if (savedState) {
    try {
      return JSON.parse(savedState);
    } catch (e) {
      console.error('Failed to parse settings from localStorage', e);
    }
  }
  return {}; // Return empty object if nothing is saved or parsing fails
}

// Helper function to migrate old localStorage keys to new centralized format
function migrateOldSettings() {
  const migrations = [];
  
  // Migrate cache settings
  const oldCacheEnabled = localStorage.getItem('nc-scorer-cache-enabled');
  if (oldCacheEnabled !== null) {
    try {
      migrations.push({ isCacheEnabled: JSON.parse(oldCacheEnabled) });
      localStorage.removeItem('nc-scorer-cache-enabled');
    } catch (e) {
      console.warn('Failed to migrate cache settings', e);
    }
  }
  
  // Migrate disclaimer settings
  const oldDisclaimerAck = localStorage.getItem('disclaimerAcknowledged');
  const oldDisclaimerTime = localStorage.getItem('disclaimerTimestamp');
  if (oldDisclaimerAck || oldDisclaimerTime) {
    migrations.push({
      disclaimerAcknowledgedAt: oldDisclaimerTime || (oldDisclaimerAck === 'true' ? new Date().toISOString() : null)
    });
    localStorage.removeItem('disclaimerAcknowledged');
    localStorage.removeItem('disclaimerTimestamp');
  }
  
  // Migrate theme settings
  const oldDarkTheme = localStorage.getItem('darkTheme');
  if (oldDarkTheme !== null) {
    migrations.push({ isDarkMode: oldDarkTheme === 'true' });
    localStorage.removeItem('darkTheme');
  }
  
  // Migrate tour settings
  const oldTourStatus = localStorage.getItem('nc-scorer-tour-status');
  const oldTourShown = localStorage.getItem('nc-scorer-tour-shown');
  if (oldTourStatus || oldTourShown) {
    let status = 'new';
    if (oldTourStatus === 'completed') status = 'completed';
    else if (oldTourStatus === 'skipped' || oldTourShown === 'true') status = 'skipped';
    
    migrations.push({ tourStatus: status });
    localStorage.removeItem('nc-scorer-tour-status');
    localStorage.removeItem('nc-scorer-tour-shown');
  }
  
  // Migrate log level settings
  const oldLogLevel = localStorage.getItem('nc_scorer_logLevel');
  if (oldLogLevel) {
    migrations.push({ logLevel: oldLogLevel });
    localStorage.removeItem('nc_scorer_logLevel');
  }
  
  // Merge all migrations into single object
  return migrations.reduce((acc, migration) => ({ ...acc, ...migration }), {});
}

export const useSettingsStore = defineStore('settings', () => {
  // --- MIGRATION ---
  // First, check for old settings and migrate them
  const migratedSettings = migrateOldSettings();
  
  // --- STATE ---
  // Load initial state (merged from storage and migrations)
  const initialState = { ...loadStateFromStorage(), ...migratedSettings };
  
  const isDarkMode = ref(initialState.isDarkMode ?? true); // Default to dark theme
  const isCacheEnabled = ref(initialState.isCacheEnabled ?? true);
  const disclaimerAcknowledgedAt = ref(initialState.disclaimerAcknowledgedAt || null);
  const tourStatus = ref(initialState.tourStatus || 'new'); // 'new', 'skipped', 'completed'
  const logLevel = ref(initialState.logLevel || 'DEBUG'); // 'DEBUG', 'INFO', 'WARN', 'ERROR'

  // --- GETTERS ---
  const isDisclaimerAcknowledged = computed(() => !!disclaimerAcknowledgedAt.value);
  const formattedDisclaimerDate = computed(() => {
    if (!disclaimerAcknowledgedAt.value) return null;
    return new Date(disclaimerAcknowledgedAt.value).toLocaleDateString();
  });

  // --- ACTIONS ---
  function toggleTheme() {
    isDarkMode.value = !isDarkMode.value;
  }

  function setTheme(isDark) {
    isDarkMode.value = isDark;
  }

  function toggleCache() {
    isCacheEnabled.value = !isCacheEnabled.value;
  }

  function setCacheEnabled(enabled) {
    isCacheEnabled.value = enabled;
  }

  function acknowledgeDisclaimer() {
    disclaimerAcknowledgedAt.value = new Date().toISOString();
  }
  
  function setTourStatus(status) {
    if (['new', 'skipped', 'completed'].includes(status)) {
      tourStatus.value = status;
    }
  }

  function resetTour() {
    tourStatus.value = 'new';
  }

  function setLogLevel(level) {
    if (['DEBUG', 'INFO', 'WARN', 'ERROR'].includes(level)) {
      logLevel.value = level;
    }
  }

  // --- PERSISTENCE ---
  // This watcher is the key to the solution. It observes the state and persists it.
  watch(
    () => ({
      isDarkMode: isDarkMode.value,
      isCacheEnabled: isCacheEnabled.value,
      disclaimerAcknowledgedAt: disclaimerAcknowledgedAt.value,
      tourStatus: tourStatus.value,
      logLevel: logLevel.value
    }),
    (stateToPersist) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
      } catch (e) {
        console.error('Failed to persist settings to localStorage', e);
      }
    },
    { deep: true } // Necessary for watching object properties
  );

  return {
    // State
    isDarkMode,
    isCacheEnabled,
    disclaimerAcknowledgedAt,
    tourStatus,
    logLevel,
    // Getters
    isDisclaimerAcknowledged,
    formattedDisclaimerDate,
    // Actions
    toggleTheme,
    setTheme,
    toggleCache,
    setCacheEnabled,
    acknowledgeDisclaimer,
    setTourStatus,
    resetTour,
    setLogLevel
  };
});