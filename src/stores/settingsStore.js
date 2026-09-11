// src/stores/settingsStore.js
import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

const STORAGE_KEY = 'nc-scorer-settings';

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

// Helper function to load and parse state from localStorage
function loadStateFromStorage() {
  const savedState = readStorage(STORAGE_KEY);
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch (e) {
      console.error('Failed to parse settings from localStorage', e);
    }
  }
  return {}; // Return empty object if nothing is saved or parsing fails
}

// Helper function to migrate old localStorage keys to new centralized format
function migrateOldSettings() {
  const migrations = [];
  const keys = [];

  // Migrate cache settings
  const oldCacheEnabled = readStorage('nc-scorer-cache-enabled');
  if (oldCacheEnabled !== null) {
    try {
      migrations.push({ isCacheEnabled: JSON.parse(oldCacheEnabled) });
      keys.push('nc-scorer-cache-enabled');
    } catch (e) {
      console.warn('Failed to migrate cache settings', e);
    }
  }

  // Migrate disclaimer settings
  const oldDisclaimerAck = readStorage('disclaimerAcknowledged');
  const oldDisclaimerTime = readStorage('disclaimerTimestamp');
  if (oldDisclaimerAck || oldDisclaimerTime) {
    migrations.push({
      disclaimerAcknowledgedAt:
        oldDisclaimerTime ||
        (oldDisclaimerAck === 'true' ? new Date().toISOString() : null),
    });
    keys.push('disclaimerAcknowledged', 'disclaimerTimestamp');
  }

  // Migrate theme settings
  const oldDarkTheme = readStorage('darkTheme');
  if (oldDarkTheme !== null) {
    migrations.push({ isDarkMode: oldDarkTheme === 'true' });
    keys.push('darkTheme');
  }

  // Migrate tour settings
  const oldTourStatus = readStorage('nc-scorer-tour-status');
  const oldTourShown = readStorage('nc-scorer-tour-shown');
  if (oldTourStatus || oldTourShown) {
    let status = 'new';
    if (oldTourStatus === 'completed') status = 'completed';
    else if (oldTourStatus === 'skipped' || oldTourShown === 'true')
      status = 'skipped';

    migrations.push({ tourStatus: status });
    keys.push('nc-scorer-tour-status', 'nc-scorer-tour-shown');
  }

  // Migrate log level settings
  const oldLogLevel = readStorage('nc_scorer_logLevel');
  if (oldLogLevel) {
    migrations.push({ logLevel: oldLogLevel });
    keys.push('nc_scorer_logLevel');
  }

  // Merge all migrations into single object
  return { settings: Object.assign({}, ...migrations), keys };
}

export const useSettingsStore = defineStore('settings', () => {
  // --- MIGRATION ---
  // First, check for old settings and migrate them
  const migratedSettings = migrateOldSettings();

  // --- STATE ---
  // Load initial state (merged from storage and migrations)
  const initialState = {
    ...migratedSettings.settings,
    ...loadStateFromStorage(),
  };
  if (migratedSettings.keys.length) {
    try {
      // Keep legacy preferences intact until their replacement is persisted.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
      migratedSettings.keys.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Settings remain available in memory; retry migration on the next load.
    }
  }

  const isDarkMode = ref(initialState.isDarkMode ?? true); // Default to dark theme
  const isCacheEnabled = ref(initialState.isCacheEnabled ?? true);
  const disclaimerAcknowledgedAt = ref(
    initialState.disclaimerAcknowledgedAt || null,
  );
  const tourStatus = ref(initialState.tourStatus || 'new'); // 'new', 'skipped', 'completed'
  const logLevel = ref(initialState.logLevel || 'DEBUG'); // 'DEBUG', 'INFO', 'WARN', 'ERROR'
  const isPreprintBannerDismissed = ref(
    initialState.isPreprintBannerDismissed ?? false,
  );

  // --- GETTERS ---
  const isDisclaimerAcknowledged = computed(
    () => !!disclaimerAcknowledgedAt.value,
  );
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

  function dismissPreprintBanner() {
    isPreprintBannerDismissed.value = true;
  }

  function resetPreprintBanner() {
    isPreprintBannerDismissed.value = false;
  }

  // --- PERSISTENCE ---
  // This watcher is the key to the solution. It observes the state and persists it.
  watch(
    () => ({
      isDarkMode: isDarkMode.value,
      isCacheEnabled: isCacheEnabled.value,
      disclaimerAcknowledgedAt: disclaimerAcknowledgedAt.value,
      tourStatus: tourStatus.value,
      logLevel: logLevel.value,
      isPreprintBannerDismissed: isPreprintBannerDismissed.value,
    }),
    (stateToPersist) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
      } catch (e) {
        console.error('Failed to persist settings to localStorage', e);
      }
    },
    { deep: true }, // Necessary for watching object properties
  );

  return {
    // State
    isDarkMode,
    isCacheEnabled,
    disclaimerAcknowledgedAt,
    tourStatus,
    logLevel,
    isPreprintBannerDismissed,
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
    setLogLevel,
    dismissPreprintBanner,
    resetPreprintBanner,
  };
});
