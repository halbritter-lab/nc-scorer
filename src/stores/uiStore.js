// src/stores/uiStore.js
import { defineStore } from 'pinia';
import { ref, reactive, computed } from 'vue';

/**
 * UI store to manage application-wide UI state
 * Handles:
 * - Log viewer visibility
 * - Dark mode state (placeholder for integration with theme system)
 * - Global notifications/snackbars
 * - Retry states for API operations
 */
export const useUiStore = defineStore('ui', () => {
  // Log viewer state
  const showLogViewer = ref(false);
  const isDarkMode = ref(false);
  
  // Notification state
  const notification = reactive({
    visible: false,
    message: '',
    color: 'info',
    timeout: 5000,
    closeButton: true,
    queue: []
  });
  
  // Retry states for different operations
  const retryStates = reactive({
    gene: { attempts: 0, lastError: null, inProgress: false, component: '', reset() { Object.assign(this, { attempts: 0, lastError: null, inProgress: false, component: '' }); } },
    variant: { attempts: 0, lastError: null, inProgress: false, component: '', reset() { Object.assign(this, { attempts: 0, lastError: null, inProgress: false, component: '' }); } },
    inheritance: { attempts: 0, lastError: null, inProgress: false, component: '', reset() { Object.assign(this, { attempts: 0, lastError: null, inProgress: false, component: '' }); } }
  });
  
  // Computed
  const anyRetryInProgress = computed(() => {
    return Object.values(retryStates).some(state => state.inProgress);
  });
  
  // Log viewer actions
  function toggleLogViewer() {
    showLogViewer.value = !showLogViewer.value;
  }
  
  function openLogViewer() {
    showLogViewer.value = true;
  }
  
  function closeLogViewer() {
    showLogViewer.value = false;
  }
  
  // Notification actions
  function notify(message, options = {}) {
    const newNotification = {
      message,
      color: options.color || 'info',
      timeout: options.timeout || 5000,
      closeButton: Object.prototype.hasOwnProperty.call(options, 'closeButton') ? options.closeButton : true
    };
    
    // If another notification is visible, queue this one
    if (notification.visible) {
      notification.queue.push(newNotification);
      return;
    }
    
    // Show the notification
    Object.assign(notification, newNotification, { visible: true });
  }
  
  function closeNotification() {
    notification.visible = false;
    
    // Process queue after a short delay
    setTimeout(() => {
      if (notification.queue.length > 0) {
        const next = notification.queue.shift();
        Object.assign(notification, next, { visible: true });
      }
    }, 300);
  }
  
  function notifyError(message, options = {}) {
    notify(message, { color: 'error', timeout: 8000, ...options });
  }
  
  function notifyWarning(message, options = {}) {
    notify(message, { color: 'warning', timeout: 6000, ...options });
  }
  
  function notifySuccess(message, options = {}) {
    notify(message, { color: 'success', timeout: 4000, ...options });
  }
  
  function notifyRetry(variantId, attempt, error) {
    const maxRetries = 4;
    const message = `Retry ${attempt}/${maxRetries} for variant ${variantId}: ${error}`;
    notify(message, { 
      color: 'warning',
      timeout: 3000
    });
  }
  
  // Retry state actions
  function getRetryState(type) {
    return retryStates[type];
  }
  
  function updateRetryState(type, updates) {
    if (retryStates[type]) {
      Object.assign(retryStates[type], updates);
    }
  }
  
  function resetRetryState(type) {
    if (retryStates[type]) {
      retryStates[type].reset();
    }
  }
  
  function resetAllRetryStates() {
    Object.values(retryStates).forEach(state => state.reset());
  }
  
  return {
    // Log viewer state
    showLogViewer,
    isDarkMode,
    
    // Notification state  
    notification,
    
    // Retry state
    retryStates,
    anyRetryInProgress,
    
    // Log viewer actions
    toggleLogViewer,
    openLogViewer,
    closeLogViewer,
    
    // Notification actions
    notify,
    closeNotification,
    notifyError,
    notifyWarning,
    notifySuccess,
    notifyRetry,
    
    // Retry state actions
    getRetryState,
    updateRetryState,
    resetRetryState,
    resetAllRetryStates
  };
});
