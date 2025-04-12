/**
 * Composable for managing API cache settings/preferences
 * Provides reactive state for cache enabled/disabled and persists user preferences
 */
import { ref, watchEffect } from 'vue';

export function useCacheSettings() {
  // Default to enabled
  const STORAGE_KEY = 'nc-scorer-cache-enabled';
  const defaultEnabled = true;
  
  // Create reactive state for cache enabled/disabled
  const cacheEnabled = ref(loadCacheSetting());
  
  // Persist cache setting to localStorage when changed
  watchEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheEnabled.value));
  });
  
  /**
   * Load the cache setting from localStorage or use default
   */
  function loadCacheSetting() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved !== null ? JSON.parse(saved) : defaultEnabled;
    } catch (e) {
      console.warn('Error loading cache settings from localStorage', e);
      return defaultEnabled;
    }
  }
  
  /**
   * Toggle cache state
   */
  function toggleCacheEnabled() {
    cacheEnabled.value = !cacheEnabled.value;
    return cacheEnabled.value;
  }
  
  /**
   * Explicitly set cache enabled state
   */
  function setCacheEnabled(value) {
    cacheEnabled.value = !!value;
    return cacheEnabled.value;
  }
  
  return {
    cacheEnabled,
    toggleCacheEnabled,
    setCacheEnabled
  };
}
