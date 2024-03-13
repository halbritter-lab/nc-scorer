<!-- views/GeneInfo.vue -->

<template>
  <v-container>
    <v-table>
      <template v-slot:default>
        <thead>
          <tr>
            <th class="text-left">Property</th>
            <th class="text-left">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(value, key) in geneData" :key="key">
            <td>{{ key }}</td>
            <td>{{ value }}</td>
          </tr>
        </tbody>
      </template>
    </v-table>
  </v-container>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router' // Import useRouter
import axios from 'axios'

export default {
  props: {
    symbol: String
  },
  setup(props) {
    const geneData = ref({})
    const router = useRouter() // Create an instance of the router

    onMounted(async () => {
      if (props.symbol) {
        try {
          const response = await axios.get(`json/symbols/${props.symbol}.json`)
          geneData.value = response.data
        } catch (error) {
          // Redirect to PageNotFound view if there is an error (e.g., file not found)
          router.push({ path: '/404' });
        }
      }
    })

    return {
      geneData
    }
  }
}
</script>
