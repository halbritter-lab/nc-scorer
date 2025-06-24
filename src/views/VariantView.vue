<!-- src/views/VariantView.vue -->
<template>
  <ContentContainer>
    <VariantCard :variantInput="variantInput" :assembly="assembly" />
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
    assembly: {
      type: String,
      default: 'GRCh38',
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
