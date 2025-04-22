// src/stores/uiStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * UI store to manage application-wide UI state
 * Currently handles:
 * - Log viewer visibility
 * - Dark mode state (placeholder for integration with theme system)
 */
export const useUiStore = defineStore('ui', () => {
  // State
  const showLogViewer = ref(false);
  const isDarkMode = ref(false);
  
  // Actions
  function toggleLogViewer() {
    showLogViewer.value = !showLogViewer.value;
  }
  
  function openLogViewer() {
    showLogViewer.value = true;
  }
  
  function closeLogViewer() {
    showLogViewer.value = false;
  }
  
  return {
    // State
    showLogViewer,
    isDarkMode,
    
    // Actions
    toggleLogViewer,
    openLogViewer,
    closeLogViewer
  };
});
