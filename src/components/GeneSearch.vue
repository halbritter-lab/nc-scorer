<!-- src/components/GeneSearch.vue -->
<template>
  <v-card class="search-card">
    <v-card-text>
      <v-autocomplete
        v-model="searchQuery"
        :items="symbols"
        label="Search genes"
        :loading="isLoading"
        @keyup.enter="search"
      ></v-autocomplete>

      <!-- Display an error alert if symbols fail to load -->
      <v-alert v-if="error" type="error" dismissible>
        {{ error.message }}
      </v-alert>

      <!-- Search Button -->
      <v-btn color="primary" @click="search" class="mx-auto d-block"> Search </v-btn>
    </v-card-text>
  </v-card>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchSymbolsIndex } from '@/api/geneApi.js'; // Use the new API module

export default {
  name: 'GeneSearch',
  setup() {
    const searchQuery = ref('');
    const router = useRouter();
    const symbols = ref([]);
    const isLoading = ref(false);
    const error = ref(null);

    const loadSymbols = async () => {
      isLoading.value = true;
      try {
        symbols.value = await fetchSymbolsIndex();
      } catch (err) {
        error.value = err;
      } finally {
        isLoading.value = false;
      }
    };

    onMounted(loadSymbols);

    const search = () => {
      if (searchQuery.value) {
        router.push({ path: `/symbols/${searchQuery.value}` });
      }
    };

    return {
      searchQuery,
      search,
      symbols,
      isLoading,
      error,
    };
  },
};
</script>

<style scoped>
.search-card {
  max-width: 900px; /* Adjust this value as needed */
  margin: auto; /* Centers the input if it's smaller than the container */
}
</style>
