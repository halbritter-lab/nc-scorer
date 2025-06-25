<template>
  <v-snackbar
    v-model="notification.visible"
    :color="notification.color"
    :timeout="notification.timeout"
    location="top"
    class="notification-snackbar"
  >
    {{ notification.message }}
    <template v-slot:actions v-if="notification.closeButton">
      <v-btn
        variant="text"
        icon="mdi-close"
        @click="closeNotification"
      ></v-btn>
    </template>
  </v-snackbar>
</template>

<script>
import { useUiStore } from '@/stores/uiStore';

export default {
  name: 'GlobalNotification',
  setup() {
    const uiStore = useUiStore();

    return {
      notification: uiStore.notification,
      closeNotification: uiStore.closeNotification
    };
  }
};
</script>

<style scoped>
.notification-snackbar {
  z-index: 10000;
}
</style>
