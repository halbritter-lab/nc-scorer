<template>
  <ContentContainer>
    <v-card class="mb-6">
      <v-card-title class="text-h5">
        Batch Variant Scoring
      </v-card-title>
      <v-card-text>
        <p class="mb-2">
          Enter genetic variants, one per line. You can optionally provide inheritance and segregation data using tabs.
        </p>
        <p class="text-caption mb-4">
          Format: <code>Variant &lt;TAB&gt; Inheritance &lt;TAB&gt; Segregation</code>
          <br>
          If inheritance and segregation are omitted, they will default to 'Unknown' and '1'.
        </p>
        <v-textarea
          v-model="variantsInput"
          label="Paste Variants (One per line)"
          rows="10"
          placeholder="e.g., NM_004380.3:c.589G>T    Inherited dominant    0.95"
          hint="Enter up to 200 variants."
          persistent-hint
          :disabled="isLoading"
          class="mb-4"
        ></v-textarea>

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
        
        <v-progress-linear v-if="isLoading" :model-value="progress" class="mb-4"></v-progress-linear>

        <v-btn 
          color="primary" 
          :loading="isLoading" 
          :disabled="!hasValidInput"
          @click="processVariants"
          class="mb-4"
        >
          Process Variants
        </v-btn>
        
        <v-alert v-if="errorMsg" type="error" class="mt-4" closable @input="errorMsg = ''">
          {{ errorMsg }}
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- Interactive Results Table -->
    <v-card v-if="batchResults.length > 0" class="mb-6">
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Batch Results</span>
        <div class="d-flex" style="gap: 8px;">
          <v-btn color="secondary" @click="clearResults" size="small" variant="tonal">Clear Results</v-btn>
          <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn color="primary" v-bind="props" size="small" variant="tonal" prepend-icon="mdi-download">
                  Download
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item @click="downloadResults('CSV')" title="Download as CSV" />
                <v-list-item @click="downloadResults('TSV')" title="Download as TSV" />
                <v-list-item @click="downloadResults('JSON')" title="Download as JSON" />
              </v-list>
            </v-menu>
        </div>
      </v-card-title>
      <v-card-text>
        <v-text-field
            v-model="tableSearch"
            label="Filter Results"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            class="mb-4"
        ></v-text-field>
        <v-data-table
          :headers="tableHeaders"
          :items="batchResults"
          :search="tableSearch"
          class="elevation-1"
          density="compact"
          :items-per-page="10"
        >
          <template #[`item.geneSymbol`]="{ item }">
            <router-link v-if="item.geneSymbol !== 'N/A'" :to="{ name: 'GeneView', params: { symbol: item.geneSymbol } }">
              {{ item.geneSymbol }}
            </router-link>
            <span v-else>N/A</span>
          </template>
          <template #[`item.ncs`]="{ item }">
            <v-chip :color="getScoreColor(item.ncs)" size="small">{{ item.ncs }}</v-chip>
          </template>
          <template #[`item.error`]="{ item }">
            <v-tooltip v-if="item.error" :text="item.error">
              <template #activator="{ props }">
                <v-icon v-bind="props" color="error">mdi-alert-circle</v-icon>
              </template>
            </v-tooltip>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </ContentContainer>
</template>

<script setup>
import { ref, computed } from 'vue';
import ContentContainer from '@/components/ContentContainer.vue';
import { queryVariant } from '@/api/variantApi.js';
import { fetchGeneDetails } from '@/api/geneApi.js';
import { getPrioritizedGeneSymbol } from '@/utils/geneSymbolUtils.js';
import { downloadFile } from '@/utils/exportUtils.js';
import { logService } from '@/services/logService.js';
import { exampleLists } from '@/config/batchViewConfig.js';
import { calculateInheritanceScore, calculateNCS } from '@/utils/scoringUtils.js';

const MAX_VARIANTS = 200;

// Component State
const variantsInput = ref('');
const isLoading = ref(false);
const errorMsg = ref('');
const progress = ref(0);
const batchResults = ref([]);
const tableSearch = ref('');

// Table Headers
const tableHeaders = [
  { title: 'Variant', key: 'variant' },
  { title: 'Gene', key: 'geneSymbol' },
  { title: 'NCS', key: 'ncs' },
  { title: 'Gene Score', key: 'geneScore' },
  { title: 'Variant Score', key: 'variantScore' },
  { title: 'Inheritance Score', key: 'inheritanceScore' },
  { title: 'Error', key: 'error', sortable: false },
];

const hasValidInput = computed(() => {
  const lines = variantsInput.value.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  return lines.length > 0 && lines.length <= MAX_VARIANTS;
});

function prefillTextArea(variants) {
  if (Array.isArray(variants)) {
    variantsInput.value = variants.join('\n');
    const example = exampleLists.find(e => e.variants === variants);
    logService.info(`Prefilled batch input with "${example?.name}" example.`);
  }
}

function parseInputLine(line) {
  const parts = line.split('\t');
  return {
    variant: parts[0]?.trim() || '',
    inheritance: parts[1]?.trim() || 'Unknown',
    segregation: parts[2]?.trim() || '1.0',
  };
}

async function processVariants() {
  clearResults();
  isLoading.value = true;

  const lines = variantsInput.value.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length > MAX_VARIANTS) {
    errorMsg.value = `Maximum ${MAX_VARIANTS} variants allowed. You entered ${lines.length}.`;
    isLoading.value = false;
    return;
  }

  // Process variants sequentially to avoid reactivity issues
  for (let i = 0; i < lines.length; i++) {
    await processSingleVariant(lines[i], i, lines.length);
  }

  isLoading.value = false;
}

async function processSingleVariant(line, index, total) {
    const { variant, inheritance, segregation } = parseInputLine(line);
    const resultRow = {
      variant, inheritance, segregation,
      variantScore: 'N/A', geneSymbol: 'N/A', geneScore: 'N/A',
      inheritanceScore: 'N/A', ncs: 'N/A', error: '',
    };

    try {
      const variantResult = await queryVariant(variant, { skipCache: true });
      const annotation = variantResult.data?.[0] || variantResult.data;
      if (!annotation) throw new Error('No annotation data returned');

      resultRow.variantScore = annotation.nephro_variant_score ?? 0;
      resultRow.geneSymbol = getPrioritizedGeneSymbol(annotation) || 'N/A';

      if (resultRow.geneSymbol !== 'N/A') {
        const geneResult = await fetchGeneDetails(resultRow.geneSymbol, { skipCache: true });
        resultRow.geneScore = geneResult.data?.ngs ?? 0;
      }

      resultRow.inheritanceScore = calculateInheritanceScore(inheritance, segregation);
      
      if (resultRow.geneScore !== 'N/A' && resultRow.variantScore !== 'N/A') {
        resultRow.ncs = calculateNCS(resultRow.geneScore, resultRow.variantScore, resultRow.inheritanceScore).toFixed(3);
      }
    } catch (e) {
      logService.error(`Failed to process variant "${variant}":`, e);
      resultRow.error = e.message || 'Unknown error';
    }
    
    // Use splice to add to reactive array safely
    batchResults.value.splice(batchResults.value.length, 0, resultRow);
    progress.value = ((index + 1) / total) * 100;
}


function downloadResults(format) {
  const headers = tableHeaders.filter(h => h.key !== 'error').map(h => h.title);
  const data = batchResults.value.map(row => [
    row.variant, row.geneSymbol, row.ncs, row.geneScore,
    row.variantScore, row.inheritanceScore,
  ]);
  
  const mimeType = {
    CSV: 'text/csv',
    TSV: 'text/tab-separated-values',
    JSON: 'application/json'
  }[format];
  
  const extension = format.toLowerCase();
  const filename = `nc_scorer_batch_results_${new Date().toISOString().split('T')[0]}.${extension}`;
  
  if (format === 'JSON') {
    downloadFile(JSON.stringify(batchResults.value, null, 2), filename, mimeType);
  } else {
    const delimiter = format === 'CSV' ? ',' : '\t';
    const content = [headers.join(delimiter), ...data.map(row => row.join(delimiter))].join('\n');
    downloadFile(content, filename, mimeType);
  }
}

function clearResults() {
  batchResults.value = [];
  progress.value = 0;
  errorMsg.value = '';
}

function getScoreColor(score) {
  const numericScore = parseFloat(score);
  if (isNaN(numericScore)) return 'grey';
  if (numericScore >= 7) return 'error';
  if (numericScore >= 3) return 'warning';
  return 'grey';
}
</script>