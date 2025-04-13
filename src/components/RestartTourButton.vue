<template>
  <v-btn
    color="primary"
    variant="outlined"
    prepend-icon="mdi-refresh"
    @click="restartTour"
    class="restart-tour-btn"
  >
    {{ buttonText }}
  </v-btn>
</template>

<script>
import useTour from '@/composables/useTour';

export default {
  name: 'RestartTourButton',
  props: {
    buttonText: {
      type: String,
      default: 'Restart Guided Tour',
    },
  },
  setup() {
    const { restartTour } = useTour();

    return {
      restartTour,
    };
  },
};
</script>

<style scoped>
.restart-tour-btn {
  margin-top: 16px;
}
</style>
