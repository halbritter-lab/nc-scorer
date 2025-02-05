<!-- src/views/GeneSearch.vue -->
<template>
  <v-container>
    <!-- Variant Search placed above Gene Search -->
    <variant-search></variant-search>
    <search-component></search-component>
  </v-container>
</template>

<script>
import SearchComponent from '../components/SearchComponent.vue';
import VariantSearch from '../components/VariantSearch.vue';

export default {
  name: 'GeneSearch',
  components: {
    SearchComponent,
    VariantSearch,
  },
};
</script>

<style scoped>
/* Add any additional styling if necessary */
</style>
