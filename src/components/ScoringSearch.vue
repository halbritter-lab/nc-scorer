<!-- src/components/ScoringSearch.vue -->
<template>
  <v-container class="pa-4">
    <v-card class="scoring-search-card">
      <v-card-text>
        <!-- Google-like search container -->
        <div class="search-container mx-auto mb-4">
          <!-- Main search area with integrated components on a single line -->
          <div class="google-search-wrapper">
            <!-- Main inputs section with search button -->
            <div class="search-inputs-row d-flex align-center" @keyup.enter="searchScoring">
              <!-- Primary input with search icon -->
              <div class="search-input-area d-flex align-center" style="width: calc(100% - 56px);">
                <v-icon class="search-icon ml-3 mr-2">mdi-magnify</v-icon>
                <v-text-field
                  v-model="variantInput"
                  label="Enter Variant (VCF or HGVS)"
                  placeholder="e.g., 1-55051215-G-GA or NM_001009944.3:c.11935C>T"
                  variant="plain"
                  :rules="variantRules"
                  @keyup.enter="searchScoring"
                  id="scoring-variant-input"
                  aria-label="Enter primary variant in VCF or HGVS format"
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
                  @click="searchScoring"
                  aria-label="Search"
                  size="large"
                >
                  <v-icon>mdi-arrow-right</v-icon>
                </v-btn>
              </div>
            </div>
            
            <!-- Second variant row (conditionally shown) -->
            <div v-if="showSecondVariantInput" class="search-inputs-row second-variant-row d-flex align-center border-top pt-2" @keyup.enter="searchScoring">
              <div class="search-input-area d-flex align-center flex-grow-1">
                <v-icon class="option-icon ml-3 mr-2">mdi-plus-circle-outline</v-icon>
                <v-text-field
                  v-model="variantInput2"
                  label="Second Variant (for Compound Heterozygous)"
                  placeholder="e.g., 1-55051215-G-GA or NM_001009944.3:c.11935C>T"
                  variant="plain"
                  :rules="variantRules"
                  @keyup.enter="searchScoring"
                  id="scoring-variant-input-2"
                  aria-label="Enter second variant for compound heterozygous analysis"
                  class="google-search-input"
                  density="comfortable"
                ></v-text-field>
              </div>
            </div>
            
            <!-- Options row with search button on right -->
            <div class="search-inputs-row options-row d-flex align-center border-top pt-2" @keyup.enter="searchScoring">
              <!-- Equal width inputs layout -->
              <div class="filter-row d-flex">
                <!-- Left side: Inheritance -->
                <div class="filter-cell">
                  <div class="d-flex align-center pl-3 pr-2">
                    <v-icon class="option-icon mr-2">mdi-dna</v-icon>
                    <v-select
                      v-model="inheritance"
                      :items="inheritanceOptions"
                      label="Inheritance"
                      variant="plain"
                      hide-details
                      density="comfortable"
                      class="option-select"
                      id="inheritance-pattern-select"
                      aria-label="Select inheritance pattern"
                      @keydown.enter="searchScoring"
                    ></v-select>
                  </div>
                </div>
                
                <!-- Right side: Segregation -->
                <div class="filter-cell vertical-divider">
                  <div class="d-flex align-center pl-3 pr-2">
                    <v-icon class="option-icon mr-2" :class="{'text-disabled': !showSegregationInput}">mdi-percent</v-icon>
                    <v-text-field
                      v-model="segregation"
                      label="Segregation"
                      placeholder="0.0 to 1.0 (e.g., 0.95)"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      variant="plain"
                      :rules="segregationRules"
                      density="comfortable"
                      class="option-input"
                      id="segregation-probability-input"
                      aria-label="Enter segregation probability value between 0 and 1"
                      @keyup.enter="searchScoring"
                      :disabled="!showSegregationInput"
                    ></v-text-field>
                  </div>
                </div>
              </div>
              

            </div>
            
            <!-- Assembly selection row -->
            <div class="search-inputs-row assembly-row d-flex align-center border-top pt-2" @keyup.enter="searchScoring">
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
                      @keydown.enter="searchScoring"
                    ></v-select>
                  </div>
                </div>
                
                <!-- Empty cell for alignment -->
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
            Format examples: '1-55051215-G-GA' or 'NM_001009944.3:c.11935C>T'
          </div>
        </div>
        <!-- Main search button (below) has been replaced by the one in the search bar -->
      </v-card-text>
      <v-card-actions>
        <div class="example-text">
          <div class="example-grid">
            <!-- Examples heading -->
            <div class="example-heading mb-1">Examples to try:</div>

            <!-- VCF format example -->
            <router-link
              :to="exampleLinkOld1"
              class="example-link"
              aria-label="Example with VCF format 1-55051215-G-GA, Inherited dominant pattern, segregation 0.95"
            >
              <v-icon size="x-small" class="mr-1" color="primary">mdi-dna</v-icon>
              <div class="example-content">
                <div class="example-title">1-55051215-G-GA</div>
                <div class="example-details">Inherited dominant, Segregation: 0.95</div>
              </div>
            </router-link>

            <!-- NM format, PKD1 example -->
            <router-link
              :to="exampleLinkPKD1"
              class="example-link"
              aria-label="Example with PKD1 gene variant NM_001009944.3:c.11935C>T, Inherited dominant, segregation 0.95"
            >
              <v-icon size="x-small" class="mr-1" color="primary">mdi-dna</v-icon>
              <div class="example-content">
                <div class="example-title">NM_001009944.3:c.11935C>T (PKD1)</div>
                <div class="example-details">Inherited dominant, Segregation: 0.95</div>
              </div>
            </router-link>
            
            <!-- NM format, COL4A5 example -->
            <router-link
              :to="exampleLinkCOL4A5"
              class="example-link"
              aria-label="Example with COL4A5 gene variant NM_033380.3:c.1871G>A, Denovo pattern"
            >
              <v-icon size="x-small" class="mr-1" color="primary">mdi-dna</v-icon>
              <div class="example-content">
                <div class="example-title">NM_033380.3:c.1871G>A (COL4A5)</div>
                <div class="example-details">Denovo, No segregation</div>
              </div>
            </router-link>

            <!-- CEP290 compound heterozygous example -->
            <router-link
              :to="exampleLinkCEP290"
              class="example-link example-highlight"
              aria-label="Compound heterozygous example with CEP290 gene variants using genomic coordinates"
            >
              <v-icon size="x-small" class="mr-1" color="secondary">mdi-dna</v-icon>
              <div class="example-content">
                <div class="example-title">12-88101183-A-G (CEP290)</div>
                <div class="example-details">Compound heterozygous, Segregation: 1.0</div>
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
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { noSegregationPatterns, requiresSecondVariant } from '@/config/inheritanceConfig';
import { validateVariant, validateSegregation, normalizeVariant } from '@/utils/validationUtils';

export default {
  name: 'ScoringSearch',

  setup() {
    const router = useRouter();
    const route = useRoute();

    // Initialize form fields from URL parameters or query parameters if available; otherwise, use defaults.
    // Check both route.params (normal navigation) and route.query (from Edit Search button)
    const variantInput = ref(route.query.variant || route.params.variantInput || '');
    const variantInput2 = ref(route.query.variant2 || route.params.variantInput2 || '');
    const inheritance = ref(route.query.inheritance || route.params.inheritance || 'Unknown');
    const segregation = ref(route.query.segregation || route.params.segregation || '1');
    const assembly = ref(route.query.assembly || route.params.assembly || 'GRCh38');
    
    // No debug logging to prevent circular references
    
    // Validation rules
    const variantRules = [
      (value) => !!value || 'Variant is required',
      validateVariant
    ];
    
    const segregationRules = [
      (value) => !showSegregationInput.value || !!value || 'Segregation is required when applicable',
      validateSegregation
    ];

    // Inheritance options for selection.
    const inheritanceOptions = [
      'Denovo',
      'Inherited dominant',
      'Homozygous recessive',
      'X-linked dominant',
      'X-linked recessive',
      'Compound heterozygous (confirmed)',
      'Compound heterozygous (suspected)',
      'Unknown',
    ];

    // Assembly options for selection
    const assemblyOptions = [
      { title: 'GRCh38 / hg38 (Default)', value: 'GRCh38' },
      { title: 'GRCh37 / hg19', value: 'GRCh37' },
    ];

    // Only allow segregation input if the inheritance pattern allows it
    const showSegregationInput = computed(() => {
      return !noSegregationPatterns.includes(inheritance.value);
    });

    // Show second variant input field only for compound heterozygous patterns
    const showSecondVariantInput = computed(() => {
      return requiresSecondVariant.includes(inheritance.value);
    });
    
    // Auto-show second variant input if variantInput2 has a value (for example links)
    if (variantInput2.value) {
      // Force a pattern that shows the second variant input
      inheritance.value = 'Compound heterozygous (confirmed)';
    }

    /**
     * Computed router-link for the first (previous) example.
     *
     * @return {object} The route object for the first previous example.
     */
    const exampleLinkOld1 = computed(() => ({
      name: 'ScoringView',
      params: {
        variantInput: '1-55051215-G-GA',
        inheritance: 'Inherited dominant',
        segregation: '0.95',
      },
    }));

    /**
     * Computed router-link for the second (previous) example.
     *
     * @return {object} The route object for the second previous example.
     */
    const exampleLinkOld2 = computed(() => ({
      name: 'ScoringView',
      params: {
        variantInput: 'ENST00000302118:c.524-1063_524-1062insA',
        inheritance: 'Denovo',
        segregation: '1',
      },
    }));

    /**
     * Computed router-link for a PKD1 coding variant example.
     *
     * @return {object} The route object for the PKD1 example.
     */
    const exampleLinkPKD1 = computed(() => ({
      name: 'ScoringView',
      params: {
        variantInput: 'NM_001009944.3:c.11935C>T',
        inheritance: 'Inherited dominant',
        segregation: '0.95',
      },
    }));

    /**
     * Computed router-link for a COL4A5 coding variant example.
     *
     * @return {object} The route object for the COL4A5 example.
     */
    const exampleLinkCOL4A5 = computed(() => ({
      name: 'ScoringView',
      params: {
        variantInput: 'NM_033380.3:c.1871G>A',
        inheritance: 'Denovo',
        segregation: '1',
      },
    }));
    
    /**
     * Computed router-link for a CEP290 compound heterozygous example.
     * These are real-world variants associated with nephronophthisis and Senior-Loken syndrome.
     * Using genomic positions (GRCh37/hg19).
     *
     * @return {object} The route object for the CEP290 compound heterozygous example.
     */
    const exampleLinkCEP290 = computed(() => ({
      name: 'ScoringView',
      params: {
        variantInput: '12-88101183-A-G',  // Deep intronic variant (common in CEP290, c.2991+1655A>G)
        variantInput2: '12-88077263-G-T', // Second variant on other allele (c.5668G>T)
        inheritance: 'Compound heterozygous (confirmed)',
        segregation: '1',
      },
    }));

    // Reactive variable for error messages.
    const error = ref(null);

    /**
     * Validates the user input and navigates to the ScoringView route if the input is valid.
     *
     * @return {void}
     */
    const searchScoring = () => {
      // Reset error state
      error.value = null;
      
      // Validate primary variant
      const variant1Validation = validateVariant(variantInput.value);
      if (variant1Validation !== true) {
        error.value = variant1Validation;
        return;
      }
      
      // If compound heterozygous is selected, validate second variant
      if (showSecondVariantInput.value) {
        const variant2Validation = validateVariant(variantInput2.value);
        if (variant2Validation !== true) {
          error.value = 'Second variant: ' + variant2Validation;
          return;
        }
      }
      
      // If segregation input is active, validate it
      if (showSegregationInput.value && segregation.value) {
        const segregationValidation = validateSegregation(segregation.value);
        if (segregationValidation !== true) {
          error.value = segregationValidation;
          return;
        }
      } else if (showSegregationInput.value) {
        error.value = 'Please enter a segregation probability.';
        return;
      }

      // Prepare route params - conditionally include variantInput2 only when needed
      const routeParams = {
        // Normalize variant format to standard format (hyphen-separated for VCF, no whitespace for HGVS)
        variantInput: normalizeVariant(variantInput.value),
        inheritance: inheritance.value,
        segregation: segregation.value,
        assembly: assembly.value,
      };

      // Add second variant to params only if it exists and is needed
      if (showSecondVariantInput.value && variantInput2.value) {
        routeParams.variantInput2 = normalizeVariant(variantInput2.value);
      }

      router.push({
        name: 'ScoringView',
        params: routeParams,
      });
    };

    return {
      variantInput,
      variantInput2,
      inheritance,
      segregation,
      assembly,
      inheritanceOptions,
      assemblyOptions,
      showSegregationInput,
      showSecondVariantInput,
      searchScoring,
      error,
      exampleLinkOld1,
      exampleLinkOld2,
      exampleLinkPKD1,
      exampleLinkCOL4A5,
      exampleLinkCEP290,
      variantRules,
      segregationRules,
    };
  },
};
</script>

<style scoped>
.scoring-search-card {
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

.search-inputs-row {
  min-height: 44px;
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

.search-icon {
  color: #9aa0a6;
}

.v-theme--dark .search-icon {
  color: rgba(255, 255, 255, 0.7);
}

.option-icon {
  color: #5f6368;
  font-size: 18px;
}

.v-theme--dark .option-icon {
  color: rgba(255, 255, 255, 0.7);
}

.text-disabled {
  opacity: 0.5;
}

.option-select, .option-input {
  font-size: 14px;
}

.vertical-divider {
  border-left: 1px solid #dfe1e5;
  height: 24px;
}

.v-theme--dark .vertical-divider {
  border-left-color: #666;
  border-left-width: 1.5px;
}

.border-top {
  border-top: 1px solid #dfe1e5;
}

.v-theme--dark .border-top {
  border-top-color: #666;
  border-top-width: 1.5px;
}

.second-variant-row,
.options-row {
  margin-top: 2px;
  min-height: 48px;
  display: flex;
  align-items: center;
}

/* Fixed width containers for form fields */
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

.full-width {
  width: 100%;
}

.full-width .v-field {
  width: 100%;
}

/* Make search box more attractive in both themes */
.google-search-wrapper .search-inputs-row:first-child {
  padding-top: 4px;
}

.google-search-wrapper .search-inputs-row:last-child {
  padding-bottom: 4px;
}

/* Make the divider lines only appear for each middle element */
.vertical-divider:first-of-type {
  border-left: none;
}

/* Hint text styling with theme support */
.hint-text {
  color: #666;
}

.v-theme--dark .hint-text {
  color: rgba(255, 255, 255, 0.6);
}

.example-text {
  margin-top: 8px;
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
  margin-bottom: 2px;
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

.example-highlight {
  border-left: 2px solid var(--v-theme-secondary);
  background-color: rgba(var(--v-theme-secondary), 0.05);
}
</style>
