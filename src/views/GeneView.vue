<!-- src/views/GeneView.vue -->
<template>
  <v-container>
    <GeneCard :symbol="symbol" />
  </v-container>
</template>

<script>
import GeneCard from '@/components/GeneCard.vue';

export default {
  name: 'GeneView',
  props: {
    symbol: {
      type: String,
      required: true,
    },
  },
  components: {
    GeneCard,
  },
};
</script>

<style scoped>
/* Additional styling if needed */
</style>
