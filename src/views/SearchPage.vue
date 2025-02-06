<!-- src/views/SearchPage.vue -->
<template>
  <v-container>
    <!-- Variant Search placed above Gene Search -->
    <variant-search></variant-search>
    <gene-search></gene-search>
  </v-container>
</template>

<script>
import GeneSearch from '../components/GeneSearch.vue';
import VariantSearch from '../components/VariantSearch.vue';

export default {
  name: 'SearchPage',
  components: {
    GeneSearch,
    VariantSearch,
  },
};
</script>

<style scoped>
/* Add any additional styling if necessary */
</style>
