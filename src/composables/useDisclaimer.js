/**
 * Composable for managing disclaimer acknowledgment state
 * Handles localStorage operations and state tracking for the disclaimer dialog
 */
import { ref, readonly } from 'vue';

// Store the acknowledgment state in a reactive reference
const isAcknowledged = ref(false);
const acknowledgedAt = ref(null);

/**
 * Check if disclaimer has been acknowledged by checking localStorage
 * @returns {boolean} True if disclaimer has been acknowledged
 */
const checkDisclaimerStatus = () => {
  const acknowledged = localStorage.getItem('disclaimerAcknowledged') === 'true';
  const timestamp = localStorage.getItem('disclaimerTimestamp');
  
  // Update reactive state if found in localStorage
  if (acknowledged) {
    isAcknowledged.value = true;
    acknowledgedAt.value = timestamp ? new Date(parseInt(timestamp)) : null;
    return true;
  }
  
  return false;
};

/**
 * Save disclaimer acknowledgment to localStorage with timestamp
 */
const saveDisclaimerAcknowledgment = () => {
  const now = new Date();
  localStorage.setItem('disclaimerAcknowledged', 'true');
  localStorage.setItem('disclaimerTimestamp', now.getTime().toString());
  
  // Update reactive state
  isAcknowledged.value = true;
  acknowledgedAt.value = now;
};

/**
 * Clear disclaimer acknowledgment from localStorage
 * Used for development or testing purposes
 */
const resetDisclaimerAcknowledgment = () => {
  localStorage.removeItem('disclaimerAcknowledged');
  localStorage.removeItem('disclaimerTimestamp');
  
  // Update reactive state
  isAcknowledged.value = false;
  acknowledgedAt.value = null;
};

/**
 * Format the acknowledged date for display
 * @returns {string|null} Formatted date string or null if not acknowledged
 */
const getFormattedAcknowledgmentDate = () => {
  if (!acknowledgedAt.value) return null;
  
  return acknowledgedAt.value.toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export function useDisclaimer() {
  // Initialize by checking localStorage on first use
  checkDisclaimerStatus();
  
  return {
    isAcknowledged: readonly(isAcknowledged),
    acknowledgedAt: readonly(acknowledgedAt),
    checkDisclaimerStatus,
    saveDisclaimerAcknowledgment,
    resetDisclaimerAcknowledgment,
    getFormattedAcknowledgmentDate
  };
}
