<!-- src/views/VariantView.vue -->
<template>
  <v-container>
    <VariantCard :variantInput="variantInput" />
  </v-container>
</template>

<script>
import VariantCard from '@/components/VariantCard.vue';

export default {
  name: 'VariantView',
  props: {
    variantInput: {
      type: String,
      required: true,
    },
  },
  components: {
    VariantCard,
  },
};
</script>

<style scoped>
/* Additional styling if needed */
</style>
