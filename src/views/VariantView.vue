<!-- src/views/VariantView.vue -->
<template>
  <ContentContainer>
    <VariantCard :variantInput="variantInput" />
  </ContentContainer>
</template>

<script>
import VariantCard from '@/components/VariantCard.vue';
import ContentContainer from '@/components/ContentContainer.vue';

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
    ContentContainer,
  },
};
</script>

<style scoped>
/* Additional styling if needed */
</style>
