<!-- components/SearchComponent.vue -->

<template>
  <v-card>
    <v-card-text>
      <v-text-field
        label="Search for a gene"
        v-model="searchQuery"
        @keyup.enter="search"
        outlined
        class="mb-4"
      ></v-text-field>

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
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export default {
  setup() {
    const searchQuery = ref('')
    const router = useRouter()

    function search() {
      if (searchQuery.value) {
        router.push({ name: 'GeneInfo', params: { symbol: searchQuery.value } })
      }
    }

    return {
      searchQuery,
      search
    }
  }
}
</script>
