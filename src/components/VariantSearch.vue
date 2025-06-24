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
                  placeholder="e.g., 1-55051215-G-GA or NM_001009944.3:c.11935C>T"
                  variant="plain"
                  :rules="variantRules"
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
            
            <!-- Assembly selection row -->
            <div class="search-inputs-row assembly-row d-flex align-center border-top pt-2" @keyup.enter="searchVariant">
              <div class="filter-row d-flex">
                <!-- Assembly selection -->
                <div class="filter-cell">
                  <div class="d-flex align-center pl-3 pr-2">
                    <v-icon class="option-icon mr-2">mdi-book-open-variant</v-icon>
                    <v-select
                      v-model="assembly"
                      :items="assemblyOptions"
                      label="Genome Assembly"
                      variant="plain"
                      hide-details
                      density="comfortable"
                      class="option-select"
                      id="assembly-select"
                      aria-label="Select genome assembly"
                      @keydown.enter="searchVariant"
                    ></v-select>
                  </div>
                </div>
                
                <!-- Helper text -->
                <div class="filter-cell vertical-divider">
                  <div class="d-flex align-center pl-3 pr-2">
                    <span class="text-caption text-medium-emphasis">Select GRCh37 for hg19 coordinates</span>
                  </div>
                </div>
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
          <div class="example-grid">
            <!-- Examples heading -->
            <div class="example-heading mb-1">Examples to try:</div>

            <!-- VCF format example -->
            <router-link
              :to="{ name: 'VariantView', params: { variantInput: '1-55051215-G-GA' } }"
              class="example-link"
              aria-label="Example with VCF format 1-55051215-G-GA"
            >
              <v-icon size="x-small" class="mr-1" color="primary">mdi-dna</v-icon>
              <div class="example-content">
                <div class="example-title">1-55051215-G-GA</div>
                <div class="example-details">VCF format example</div>
              </div>
            </router-link>

            <!-- HGVS format example -->
            <router-link
              :to="{
                name: 'VariantView',
                params: { variantInput: 'ENST00000302118:c.524-1063_524-1062insA' },
              }"
              class="example-link"
              aria-label="Example with HGVS format ENST00000302118:c.524-1063_524-1062insA"
            >
              <v-icon size="x-small" class="mr-1" color="primary">mdi-dna</v-icon>
              <div class="example-content">
                <div class="example-title">ENST00000302118:c.524-1063_524-1062insA</div>
                <div class="example-details">HGVS format example</div>
              </div>
            </router-link>
          </div>
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
import { validateVariant, normalizeVariant } from '@/utils/validationUtils';

export default {
  name: 'VariantSearch',
  setup() {
    const variantInput = ref('');
    const assembly = ref('GRCh38');
    const error = ref(null);
    const router = useRouter();
    
    // Assembly options for selection
    const assemblyOptions = [
      { title: 'GRCh38 / hg38 (Default)', value: 'GRCh38' },
      { title: 'GRCh37 / hg19', value: 'GRCh37' },
    ];
    
    const variantRules = [
      (value) => !!value || 'Variant is required',
      validateVariant
    ];

    const searchVariant = () => {
      // Reset error state
      error.value = null;
      
      // Validate variant input
      const variantValidation = validateVariant(variantInput.value);
      if (variantValidation !== true) {
        error.value = variantValidation;
        return;
      }
      
      // Normalize variant format to standard format before navigation
      const normalizedVariant = normalizeVariant(variantInput.value);
      
      // Navigate to the VariantView page with the normalized input and assembly as route parameters
      router.push({ 
        name: 'VariantView', 
        params: { 
          variantInput: normalizedVariant,
          assembly: assembly.value
        } 
      });
    };

    return {
      variantInput,
      assembly,
      assemblyOptions,
      searchVariant,
      error,
      variantRules,
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
  width: 100%;
}

.v-theme--dark .example-text {
  color: rgba(255, 255, 255, 0.6);
}

.example-heading {
  font-weight: 500;
  color: #444;
  font-size: 0.85rem;
  margin-bottom: 4px;
}

.v-theme--dark .example-heading {
  color: rgba(255, 255, 255, 0.8);
}

.example-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.example-link {
  padding: 4px 6px;
  border-radius: 4px;
  display: inline-flex;
  align-items: start;
  font-size: 0.85rem;
  transition: background-color 0.2s ease;
  text-decoration: none;
  color: inherit;
}

.example-link:hover {
  background-color: rgba(0, 0, 0, 0.05);
  text-decoration: none;
}

.v-theme--dark .example-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.example-content {
  display: flex;
  flex-direction: column;
}

.example-title {
  font-weight: 500;
  line-height: 1.2;
  color: #1976d2; /* Primary color for link-like appearance */
}

.v-theme--dark .example-title {
  color: #64b5f6; /* Lighter blue for dark theme */
}

.example-details {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
  line-height: 1.2;
}

.v-theme--dark .example-details {
  color: rgba(255, 255, 255, 0.6);
}

.example-link:hover .example-title {
  text-decoration: underline;
}

/* Additional styles for assembly selection */
.option-icon {
  color: #5f6368;
  font-size: 18px;
}

.v-theme--dark .option-icon {
  color: rgba(255, 255, 255, 0.7);
}

.option-select {
  font-size: 14px;
}

.filter-row {
  display: flex;
  width: 100%;
}

.filter-cell {
  width: 50%;
  max-width: 50%;
}

.filter-cell .v-input {
  width: 100%;
}

.border-top {
  border-top: 1px solid #dfe1e5;
}

.v-theme--dark .border-top {
  border-top-color: #666;
  border-top-width: 1.5px;
}

.assembly-row {
  margin-top: 2px;
  min-height: 48px;
  display: flex;
  align-items: center;
}
</style>
