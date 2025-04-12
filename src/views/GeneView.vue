<!-- src/views/GeneView.vue -->
<template>
  <ContentContainer>
    <GeneCard :symbol="symbol" />
  </ContentContainer>
</template>

<script>
import GeneCard from '@/components/GeneCard.vue';
import ContentContainer from '@/components/ContentContainer.vue';

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
    ContentContainer,
  },
};
</script>

<style scoped>
/* Additional styling if needed */
</style>
