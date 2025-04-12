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
import { useNotifications } from '@/composables/useNotifications';

export default {
  name: 'GlobalNotification',
  setup() {
    const { snackbar, closeNotification } = useNotifications();

    return {
      notification: snackbar,
      closeNotification
    };
  }
};
</script>

<style scoped>
.notification-snackbar {
  z-index: 10000;
}
</style>
