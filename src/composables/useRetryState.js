// src/composables/useRetryState.js
import { ref, reactive } from 'vue';
import { createRetryState } from '@/utils/retry.js';

/**
 * Composable to provide a shared retry state across components
 * for tracking and displaying API retry information.
 */
export default function useRetryState() {
  // Create a reactive shared retry state
  const retryStates = reactive({
    gene: createRetryState(),
    variant: createRetryState(),
    inheritance: createRetryState(),
  });

  // Track if any retries are currently in progress
  const anyRetryInProgress = ref(false);

  // Show a snackbar when retries occur
  const snackbar = reactive({
    visible: false,
    message: '',
    color: 'warning',
    timeout: 5000,
  });

  /**
   * Show a snackbar message
   * @param {string} message - The message to display
   * @param {string} color - The color of the snackbar (default: 'warning')
   * @param {number} timeout - The timeout in milliseconds (default: 5000)
   */
  function showSnackbar(message, color = 'warning', timeout = 5000) {
    snackbar.message = message;
    snackbar.color = color;
    snackbar.timeout = timeout;
    snackbar.visible = true;
  }

  /**
   * Reset all retry states
   */
  function resetAllRetryStates() {
    Object.values(retryStates).forEach((state) => state.reset());
    anyRetryInProgress.value = false;
  }

  return {
    retryStates,
    anyRetryInProgress,
    snackbar,
    showSnackbar,
    resetAllRetryStates,
  };
}
