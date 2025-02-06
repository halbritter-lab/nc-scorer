<!-- src/views/SearchPage.vue -->
<template>
  <v-container>
    <v-card>
      <v-tabs
        v-model="activeTab"
        fixed-tabs
      >
        <v-tab value="variant">Variant Search</v-tab>
        <v-tab value="gene">Gene Search</v-tab>
      </v-tabs>

      <v-card-text>
        <v-tabs-window v-model="activeTab">
          <v-tabs-window-item value="variant">
            <VariantSearch />
          </v-tabs-window-item>
          <v-tabs-window-item value="gene">
            <GeneSearch />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import { ref } from 'vue';
import GeneSearch from '../components/GeneSearch.vue';
import VariantSearch from '../components/VariantSearch.vue';

export default {
  name: 'SearchPage',
  components: {
    GeneSearch,
    VariantSearch,
  },
  setup() {
    // Set activeTab to 'variant' by default.
    const activeTab = ref('variant');
    return { activeTab };
  },
};
</script>

<style scoped>
/* You can add additional styling as needed */
</style>
