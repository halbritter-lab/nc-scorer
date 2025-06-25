// src/composables/useRetryState.js
import { useUiStore } from '@/stores/uiStore';

/**
 * Composable to provide retry state management using the centralized uiStore
 * for tracking and displaying API retry information.
 */
export default function useRetryState() {
  const uiStore = useUiStore();

  return {
    retryStates: uiStore.retryStates,
    anyRetryInProgress: uiStore.anyRetryInProgress,
    getRetryState: uiStore.getRetryState,
    updateRetryState: uiStore.updateRetryState,
    resetRetryState: uiStore.resetRetryState,
    resetAllRetryStates: uiStore.resetAllRetryStates,
  };
}
