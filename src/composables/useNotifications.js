/**
 * Composable for managing global notifications via snackbars
 * Now uses the centralized uiStore for state management
 */
import { useUiStore } from '@/stores/uiStore';

export function useNotifications() {
  const uiStore = useUiStore();

  return {
    snackbar: uiStore.notification,
    notify: uiStore.notify,
    notifyError: uiStore.notifyError,
    notifyWarning: uiStore.notifyWarning,
    notifySuccess: uiStore.notifySuccess,
    notifyRetry: uiStore.notifyRetry,
    closeNotification: uiStore.closeNotification
  };
}
