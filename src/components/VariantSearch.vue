<!-- src/components/VariantSearch.vue -->
<template>
  <v-container class="pa-4">
    <v-card class="variant-search-card">
      <v-card-text>
        <v-text-field
          v-model="variantInput"
          label="Enter Variant (VCF or HGVS)"
          outlined
          @keyup.enter="searchVariant"
        ></v-text-field>
        <v-btn color="primary" @click="searchVariant" class="mx-auto d-block"> Search </v-btn>
      </v-card-text>
      <v-card-actions>
        <div class="example-text">
          <p>
            <router-link :to="{ name: 'VariantView', params: { variantInput: '1-55051215-G-GA' } }">
              Example (VCF): "1-55051215-G-GA"
            </router-link>
          </p>
          <p>
            <router-link
              :to="{
                name: 'VariantView',
                params: { variantInput: 'ENST00000302118:c.524-1063_524-1062insA' },
              }"
            >
              Example (HGVS): "ENST00000302118:c.524-1063_524-1062insA"
            </router-link>
          </p>
        </div>
      </v-card-actions>
      <v-alert v-if="error" type="error" dismissible>
        {{ error }}
      </v-alert>
    </v-card>
  </v-container>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'VariantSearch',
  setup() {
    const variantInput = ref('');
    const error = ref(null);
    const router = useRouter();

    const searchVariant = () => {
      if (!variantInput.value) {
        error.value = 'Please enter a variant.';
        return;
      }
      error.value = null;
      // Navigate to the VariantView page with the input as a route parameter.
      router.push({ name: 'VariantView', params: { variantInput: variantInput.value } });
    };

    return {
      variantInput,
      searchVariant,
      error,
    };
  },
};
</script>

<style scoped>
.variant-search-card {
  max-width: 900px;
  margin: auto;
  padding: 16px;
}
.example-text {
  margin-top: 16px;
  font-size: 0.9rem;
  color: #666;
}
</style>
