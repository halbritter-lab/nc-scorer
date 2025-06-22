<template>
  <ContentContainer>
    <v-card class="mb-6">
      <v-card-title class="text-h5">
        Batch Variant Analysis
      </v-card-title>
      <v-card-text>
        <p class="mb-4">
          Enter genetic variants, one per line (HGVS or VCF format). Maximum 200 variants.
        </p>
        <v-textarea
          v-model="variantsInput"
          label="Paste Variants (One per line)"
          rows="10"
          placeholder="e.g. ENST00000275493.7:c.2551C>T"
          hint="Enter variants in HGVS or VCF format, one per line"
          persistent-hint
          :disabled="isLoading"
          class="mb-4"
        ></v-textarea>
        
        <!-- Example Prefill Buttons -->
        <div class="mb-4">
          <p class="text-subtitle-1 mb-2">Or use an example list:</p>
          <div class="d-flex flex-wrap" style="gap: 8px;">
            <v-btn
              v-for="example in exampleLists"
              :key="example.name"
              @click="prefillTextArea(example.variants)"
              variant="tonal"
              size="small"
              :title="example.description"
            >
              {{ example.name }}
            </v-btn>
          </div>
        </div>
        
        <v-select
          v-model="outputFormat"
          :items="['JSON', 'CSV', 'TSV', 'VCF']"
          label="Output Format"
          :disabled="isLoading"
          class="mb-4"
        ></v-select>
        
        <v-btn 
          color="primary" 
          :loading="isLoading" 
          :disabled="!hasValidInput"
          @click="processAndDownload"
          class="mb-4"
        >
          Process & Download
        </v-btn>
        
        <v-alert
          v-if="errorMsg"
          type="error"
          class="mt-4"
          closable
        >
          {{ errorMsg }}
        </v-alert>
      </v-card-text>
    </v-card>
  </ContentContainer>
</template>

<script setup>
import { ref, computed } from 'vue';
import ContentContainer from '@/components/ContentContainer.vue';
import { queryVariant } from '@/api/variantApi.js';
import { downloadFile } from '@/utils/exportUtils.js';
import { logService } from '@/services/logService.js';
import { exampleLists } from '@/config/batchViewConfig.js';

// Constants
const MAX_VARIANTS = 200;

// Reactive state
const variantsInput = ref('');
const outputFormat = ref('CSV');
const isLoading = ref(false);
const errorMsg = ref('');

// Computed properties
const hasValidInput = computed(() => {
  const lines = variantsInput.value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  return lines.length > 0 && lines.length <= MAX_VARIANTS;
});

// Method to prefill the textarea with an example list
function prefillTextArea(variants) {
  if (Array.isArray(variants)) {
    variantsInput.value = variants.join('\n');
    logService.info(`Prefilled batch input with "${exampleLists.find(e => e.variants === variants)?.name}" example.`);
  }
}

// Methods
async function processAndDownload() {
  // Reset error state and set loading
  errorMsg.value = '';
  isLoading.value = true;
  
  try {
    // Parse and validate input
    const variantsArray = variantsInput.value
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // Validate against max limit
    if (variantsArray.length > MAX_VARIANTS) {
      const errorMessage = `Maximum ${MAX_VARIANTS} variants allowed. You entered ${variantsArray.length}.`;
      logService.warn(errorMessage);
      errorMsg.value = errorMessage;
      isLoading.value = false;
      return;
    }
    
    if (variantsArray.length === 0) {
      const errorMessage = 'Please enter at least one variant.';
      logService.warn(errorMessage);
      errorMsg.value = errorMessage;
      isLoading.value = false;
      return;
    }
    
    // Call the API
    const result = await queryVariant(variantsArray, { 
      output: outputFormat.value,
      skipCache: true // Always skip cache for batch requests
    });
    
    // Process the result (either object or string)
    const content = typeof result.data === 'string' 
      ? result.data 
      : JSON.stringify(result.data, null, 2);
    
    // Determine MIME type based on output format
    let mime;
    switch(outputFormat.value) {
      case 'JSON':
        mime = 'application/json';
        break;
      case 'CSV':
        mime = 'text/csv';
        break;
      case 'TSV':
        mime = 'text/tab-separated-values';
        break;
      case 'VCF':
        mime = 'text/plain';
        break;
      default:
        mime = 'text/plain';
    }
    
    // Generate filename with current date
    const filename = `nc_scorer_batch_${new Date().toISOString().split('T')[0]}.${outputFormat.value.toLowerCase()}`;
    
    // Download the file
    downloadFile(content, filename, mime);
    
    logService.info(`Batch result downloaded as ${filename}`, { 
      format: outputFormat.value,
      fileSize: content.length,
      filename
    });
    
  } catch (error) {
    console.error('Batch processing error:', error);
    errorMsg.value = error.message || 'An unknown error occurred during batch processing';
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
