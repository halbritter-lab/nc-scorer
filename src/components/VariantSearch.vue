<!-- src/components/VariantSearch.vue -->
<template>
  <v-container class="pa-4">
    <v-card class="variant-search-card">
      <v-card-text>
        <div class="search-container mx-auto mb-4">
          <!-- Main search area with Google-like styling -->  
          <div class="google-search-wrapper">
            <div class="search-inputs-row d-flex align-center" @keyup.enter="searchVariant">
              <!-- Input area with magnifying glass icon -->
              <div class="search-input-area d-flex align-center" style="width: calc(100% - 56px);">
                <v-icon class="search-icon ml-3 mr-2">mdi-magnify</v-icon>
                <v-text-field
                  v-model="variantInput"
                  label="Enter Variant (VCF or HGVS)"
                  variant="plain"
                  hide-details
                  @keyup.enter="searchVariant"
                  id="variant-search-input"
                  aria-label="Enter a genomic variant in VCF or HGVS format"
                  class="google-search-input"
                  style="width: 100%;"
                  density="comfortable"
                ></v-text-field>
              </div>
              
              <!-- Simple search button -->
              <div class="search-button-area d-flex align-center px-2" style="width: 56px;">
                <v-btn
                  color="primary"
                  variant="text"
                  icon
                  @click="searchVariant"
                  aria-label="Search"
                  size="large"
                >
                  <v-icon>mdi-arrow-right</v-icon>
                </v-btn>
              </div>
            </div>
          </div>
          
          <!-- Hint text below search box -->
          <div class="mt-1 text-caption hint-text">
            Format examples: '1-55051215-G-GA' or 'ENST00000302118:c.524-1063_524-1062insA'
          </div>
        </div>
        <!-- Main search button has been replaced by the one in the search bar -->
      </v-card-text>
      <v-card-actions>
        <div class="example-text">
          <p>
            <router-link
              :to="{ name: 'VariantView', params: { variantInput: '1-55051215-G-GA' } }"
              class="example-link"
              aria-label="Example VCF format variant: 1-55051215-G-GA"
            >
              Example (VCF): "1-55051215-G-GA"
            </router-link>
          </p>
          <p>
            <router-link
              :to="{
                name: 'VariantView',
                params: { variantInput: 'ENST00000302118:c.524-1063_524-1062insA' },
              }"
              class="example-link"
              aria-label="Example HGVS format variant: ENST00000302118:c.524-1063_524-1062insA"
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

.search-container {
  max-width: 700px;
  margin: 0 auto;
}

.google-search-wrapper {
  border: 1px solid #dfe1e5;
  border-radius: 24px;
  padding: 8px 0;
  overflow: hidden;
  background: white;
}

/* Dark mode adjustments */
.v-theme--dark .google-search-wrapper {
  background: #1e1e1e;
  border-color: #666;
  border-width: 1.5px;
}

.google-search-wrapper:hover {
  box-shadow: 0 1px 6px rgba(32, 33, 36, 0.28);
  border-color: rgba(223, 225, 229, 0);
}

.v-theme--dark .google-search-wrapper:hover {
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.4);
  border-color: rgba(50, 50, 50, 0.8);
}

.google-search-input {
  border: none !important;
  font-size: 16px;
}

/* Dark mode input text */
.v-theme--dark .google-search-input {
  color: rgba(255, 255, 255, 0.87) !important;
}

.v-theme--dark .google-search-input .v-field__input {
  color: rgba(255, 255, 255, 0.87) !important;
}

.search-inputs-row {
  min-height: 44px;
}

.search-icon {
  color: #9aa0a6;
}

.v-theme--dark .search-icon {
  color: rgba(255, 255, 255, 0.7);
}

.full-width {
  width: 100%;
}

.full-width .v-field {
  width: 100%;
}

.vertical-divider {
  border-left: 1px solid #dfe1e5;
  height: 24px;
}

.v-theme--dark .vertical-divider {
  border-left-color: #666;
  border-left-width: 1.5px;
}
/* Hint text styling with theme support */
.hint-text {
  color: #666;
}

.v-theme--dark .hint-text {
  color: rgba(255, 255, 255, 0.6);
}

.example-text {
  margin-top: 16px;
  font-size: 0.9rem;
  color: #666;
}

.v-theme--dark .example-text {
  color: rgba(255, 255, 255, 0.6);
}

.example-link {
  padding: 6px;
  display: inline-block; /* Ensures the padding is applied effectively */
  margin: 2px 0;
}
</style>
