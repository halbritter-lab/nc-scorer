<!-- components/SearchComponent.vue -->

<template>
  <v-card>
    <v-card-text>
      <v-autocomplete
        v-model="searchQuery"
        :items="symbols"
        label="Search genes"
        :loading="isLoading"
        @keyup.enter="search"
      ></v-autocomplete>

      <!-- Search Button -->
      <v-btn
        color="primary"
        @click="search"
        class="mx-auto d-block"
      >
        Search
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

export default {
  setup() {
    const searchQuery = ref('');
    const router = useRouter();

    const symbols = ref([]);
    const isLoading = ref(false);
    const error = ref(null);

    const loadSymbols = async () => {
        isLoading.value = true;
        try {
            const response = await fetch('json/symbols_index.json');
            if (!response.ok) {
                throw new Error('Failed to fetch symbols');
            }
            symbols.value = await response.json();
        } catch (err) {
            error.value = err;
        } finally {
            isLoading.value = false;
        }
    };

    onMounted(loadSymbols);

    function search() {
      if (searchQuery.value) {
        router.push({ path: `/symbols/${searchQuery.value}` });
      }
    }

    return {
      searchQuery,
      search,
      symbols,
      isLoading,
      error
    }
  }
}
</script>
