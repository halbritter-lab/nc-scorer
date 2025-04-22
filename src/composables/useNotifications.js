/**
 * Composable for managing global notifications via snackbars
 */
import { reactive } from 'vue';

// Create a singleton notification state
const snackbar = reactive({
  visible: false,
  message: '',
  color: 'info',
  timeout: 5000,
  closeButton: true,
  queue: []
});

export function useNotifications() {
  /**
   * Show a notification message
   * @param {string} message - The message to display
   * @param {Object} options - Notification options
   */
  function notify(message, options = {}) {
    const notification = {
      message,
      color: options.color || 'info',
      timeout: options.timeout || 5000,
      closeButton: Object.prototype.hasOwnProperty.call(options, 'closeButton') ? options.closeButton : true
    };
    
    // If another notification is visible, queue this one
    if (snackbar.visible) {
      snackbar.queue.push(notification);
      return;
    }
    
    // Show the notification
    Object.assign(snackbar, notification, { visible: true });
  }
  
  /**
   * Close the current notification
   */
  function closeNotification() {
    snackbar.visible = false;
    
    // Process queue after a short delay
    setTimeout(() => {
      if (snackbar.queue.length > 0) {
        const next = snackbar.queue.shift();
        Object.assign(snackbar, next, { visible: true });
      }
    }, 300);
  }
  
  /**
   * Show an error notification
   * @param {string} message - The error message
   * @param {Object} options - Additional options
   */
  function notifyError(message, options = {}) {
    notify(message, { color: 'error', timeout: 8000, ...options });
  }
  
  /**
   * Show a warning notification
   * @param {string} message - The warning message
   * @param {Object} options - Additional options
   */
  function notifyWarning(message, options = {}) {
    notify(message, { color: 'warning', timeout: 6000, ...options });
  }
  
  /**
   * Show a success notification
   * @param {string} message - The success message
   * @param {Object} options - Additional options
   */
  function notifySuccess(message, options = {}) {
    notify(message, { color: 'success', timeout: 4000, ...options });
  }
  
  /**
   * Show an API retry notification
   * @param {string} variantId - The variant ID being retried
   * @param {number} attempt - The current retry attempt number
   * @param {string} error - The error message
   */
  function notifyRetry(variantId, attempt, error) {
    const maxRetries = 4;
    const message = `Retry ${attempt}/${maxRetries} for variant ${variantId}: ${error}`;
    notify(message, { 
      color: 'warning',
      timeout: 3000
    });
  }

  return {
    snackbar: reactive(snackbar),
    notify,
    notifyError,
    notifyWarning,
    notifySuccess,
    notifyRetry,
    closeNotification
  };
}
