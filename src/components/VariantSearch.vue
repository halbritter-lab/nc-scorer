<!-- src/components/VariantSearch.vue -->
<template>
  <v-container>
    <v-card class="variant-search-card">
      <v-card-title>Search for a Variant</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="variantInput"
          label="Enter Variant (VCF or HGVS)"
          outlined
        ></v-text-field>
        <v-btn color="primary" @click="searchVariant">
          Search
        </v-btn>
      </v-card-text>
      <v-card-actions>
        <div>
          <p><em>Example (VCF):</em> "1-55051215-G-GA"</p>
          <p><em>Example (HGVS):</em> "ENST00000302118:c.524-1063_524-1062insA"</p>
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
      // Navigate to the VariantView page using the variantInput as a route parameter.
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
  max-width: 600px;
  margin: auto;
}
</style>
