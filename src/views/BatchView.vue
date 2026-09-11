<template>
  <ContentContainer class="batch-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">Batch variant scoring</h1>
        <p>
          Assess up to 200 variants together and download their scores and
          evidence.
        </p>
      </div>
    </header>
    <v-card class="batch-input" variant="outlined">
      <v-card-title tag="h2" class="section-heading"
        >Variant input</v-card-title
      >
      <v-card-text class="section-body">
        <p class="mb-2">
          Enter genetic variants, one per line. You can optionally provide
          inheritance and segregation data using tabs. Gene symbols alone cannot
          be scored; provide a specific HGVS variant or
          chromosome-position-reference-alternate coordinates.
        </p>
        <p class="text-caption mb-4">
          Format:
          <code>Variant &lt;TAB&gt; Inheritance &lt;TAB&gt; Segregation</code>
          <br />
          Omitted inheritance defaults to 'Unknown'; omitted segregation is
          treated as missing.
          <br />
          <strong>Note:</strong> Omitting segregation data for inheritance
          patterns that expect it may result in a penalty (20% score reduction).
        </p>
        <v-textarea
          v-model="variantsInput"
          label="Paste Variants (One per line)"
          rows="10"
          placeholder="NM_001009944.3:c.11935C>T"
          variant="outlined"
          hint="Enter up to 200 variants."
          persistent-hint
          :disabled="isLoading"
          class="mb-4"
        ></v-textarea>

        <div class="mb-4">
          <p class="text-subtitle-1 mb-2">Or use an example list:</p>
          <div class="d-flex flex-wrap" style="gap: 8px">
            <v-btn
              v-for="example in exampleLists"
              :key="example.name"
              @click="prefillTextArea(example.variants)"
              variant="outlined"
              min-height="44"
              class="font-weight-medium"
              :title="example.description"
              :disabled="isLoading"
            >
              {{ example.name }}
            </v-btn>
          </div>
        </div>

        <div class="assembly-setting">
          <v-select
            v-model="assembly"
            :items="assemblyOptions"
            label="Select Genome Assembly"
            variant="outlined"
            density="comfortable"
            :disabled="isLoading"
            class="assembly-select"
            hide-details
          ></v-select>
          <p class="text-caption">
            Select GRCh37 for variants with hg19 coordinates, or GRCh38 for hg38
            coordinates.
          </p>
        </div>

        <p v-if="processingStatus" class="progress-label" role="status">
          {{ processingStatus }} {{ batchResults.length }} of
          {{ inputCount }} completed.
        </p>
        <v-progress-linear
          v-if="isLoading"
          :model-value="progress"
          class="mb-4"
        ></v-progress-linear>

        <v-btn
          color="primary"
          :loading="isLoading"
          :disabled="!hasValidInput"
          @click="processVariants"
          class="process-button"
          variant="flat"
          min-height="44"
          min-width="160"
        >
          Process Variants
        </v-btn>
        <v-btn
          v-if="isLoading"
          variant="outlined"
          min-height="44"
          class="cancel-button"
          @click="cancelProcessing"
          >Cancel processing</v-btn
        >

        <v-alert
          v-if="errorMsg"
          type="error"
          class="mt-4"
          closable
          @input="errorMsg = ''"
        >
          {{ errorMsg }}
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- Interactive Results Table -->
    <v-card
      v-if="batchResults.length > 0"
      class="batch-results"
      variant="outlined"
    >
      <div class="results-header">
        <div>
          <h2 class="section-heading">Batch Results</h2>
          <p role="status" class="results-summary">
            {{ successfulCount }} scored ·
            {{ batchResults.length - successfulCount }} unavailable
          </p>
        </div>
        <div
          class="results-actions"
          role="group"
          aria-label="Batch result actions"
        >
          <v-btn
            color="primary"
            @click="clearResults"
            variant="outlined"
            min-height="44"
            min-width="120"
            :disabled="isLoading"
            >Clear Results</v-btn
          >
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn
                color="primary"
                v-bind="props"
                variant="flat"
                min-height="44"
                min-width="120"
                prepend-icon="mdi-download"
              >
                Download
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item
                @click="downloadResults('CSV')"
                title="Download as CSV"
              />
              <v-list-item
                @click="downloadResults('TSV')"
                title="Download as TSV"
              />
              <v-list-item
                @click="downloadResults('JSON')"
                title="Download as JSON"
              />
            </v-list>
          </v-menu>
        </div>
      </div>
      <v-card-text class="section-body">
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
          class="results-table"
          density="compact"
          :items-per-page="10"
        >
          <template #[`item.geneSymbol`]="{ item }">
            <router-link
              v-if="item.geneSymbol !== 'N/A'"
              :to="{ name: 'GeneView', params: { symbol: item.geneSymbol } }"
            >
              {{ item.geneSymbol }}
            </router-link>
            <span v-else>N/A</span>
          </template>
          <template #[`item.ncs`]="{ item }">
            <strong
              v-if="item.ncs !== 'N/A'"
              class="score-value"
              :title="`NCS Score: ${item.ncs}`"
            >
              {{ item.ncs }}
            </strong>
            <span v-else>N/A</span>
          </template>
          <template #[`item.geneScore`]="{ item }">
            <span
              v-if="item.geneScore !== 'N/A'"
              class="score-value"
              :title="`Gene Score: ${item.geneScore}`"
            >
              {{ formatScore(item.geneScore) }}
            </span>
            <span v-else>N/A</span>
          </template>
          <template #[`item.variantScore`]="{ item }">
            <span
              v-if="item.variantScore !== 'N/A'"
              class="score-value"
              :title="`Variant Score: ${item.variantScore}`"
            >
              {{ formatScore(item.variantScore) }}
            </span>
            <span v-else>N/A</span>
          </template>
          <template #[`item.inheritanceScore`]="{ item }">
            <span
              v-if="item.inheritanceScore !== 'N/A'"
              class="score-value"
              :title="`Inheritance Score: ${item.inheritanceScore}`"
            >
              {{ formatScore(item.inheritanceScore) }}
            </span>
            <span v-else>N/A</span>
          </template>
          <template #[`item.error`]="{ item }">
            <p v-if="item.error" class="row-error">{{ item.error }}</p>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </ContentContainer>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';
import ContentContainer from '@/components/ContentContainer.vue';
import { queryVariant } from '@/api/variantApi.js';
import { fetchGeneDetails } from '@/api/geneApi.js';
import { getPrioritizedGeneSymbol } from '@/utils/geneSymbolUtils.js';
import { downloadFile, generateCSV } from '@/utils/exportUtils.js';
import { logService } from '@/services/logService.js';
import { exampleLists } from '@/config/batchViewConfig.js';
import {
  calculateInheritanceScore,
  calculateNCS,
  parseUnitScore,
} from '@/utils/scoringUtils.js';
import { normalizeVariant, validateVariant } from '@/utils/validationUtils.js';

const MAX_VARIANTS = 200;

// Component State
const variantsInput = ref('');
const assembly = ref('GRCh38');
const isLoading = ref(false);
const errorMsg = ref('');
const progress = ref(0);
const batchResults = ref([]);
const tableSearch = ref('');
const processingStatus = ref('');
const inputCount = computed(
  () => variantsInput.value.split('\n').filter((line) => line.trim()).length,
);
const successfulCount = computed(
  () => batchResults.value.filter((row) => row.ncs !== 'N/A').length,
);
let activeRun = 0;
onBeforeUnmount(clearResults);

// Assembly options for selection
const assemblyOptions = [
  { title: 'GRCh38 / hg38 (Default)', value: 'GRCh38' },
  { title: 'GRCh37 / hg19', value: 'GRCh37' },
];

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
  const lines = variantsInput.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return lines.length > 0 && lines.length <= MAX_VARIANTS;
});

function prefillTextArea(variants) {
  if (Array.isArray(variants)) {
    variantsInput.value = variants.join('\n');
    const example = exampleLists.find((e) => e.variants === variants);
    if (example?.assembly) assembly.value = example.assembly;
    logService.info(`Prefilled batch input with "${example?.name}" example.`);
  }
}

function parseInputLine(line) {
  const parts = line.split('\t');
  return {
    variant: parts[0]?.trim() || '',
    inheritance: parts[1]?.trim() || 'Unknown',
    segregation: parts[2]?.trim() || null, // Use null for missing segregation data
  };
}

async function processVariants() {
  if (isLoading.value) return;
  clearResults();
  const run = activeRun;
  const selectedAssembly = assembly.value;
  const geneResults = new Map();
  isLoading.value = true;

  const lines = variantsInput.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length > MAX_VARIANTS) {
    errorMsg.value = `Maximum ${MAX_VARIANTS} variants allowed. You entered ${lines.length}.`;
    isLoading.value = false;
    return;
  }

  // Process variants sequentially to avoid reactivity issues
  for (let i = 0; i < lines.length; i++) {
    if (run !== activeRun) return;
    await processSingleVariant(
      lines[i],
      i,
      lines.length,
      run,
      selectedAssembly,
      geneResults,
    );
  }

  if (run === activeRun) {
    isLoading.value = false;
    processingStatus.value = 'Processing complete.';
  }
}

function parseApiScore(value, name) {
  const score = parseUnitScore(value);
  if (score === null) {
    throw new Error(
      `Missing or invalid ${name} score. Try processing this variant again; a measured score between 0 and 1 is required.`,
    );
  }
  return score;
}

async function processSingleVariant(
  line,
  index,
  total,
  run,
  selectedAssembly,
  geneResults,
) {
  const { variant, inheritance, segregation } = parseInputLine(line);
  const resultRow = {
    variant,
    inheritance,
    segregation,
    variantScore: 'N/A',
    geneSymbol: 'N/A',
    geneScore: 'N/A',
    inheritanceScore: 'N/A',
    ncs: 'N/A',
    error: '',
  };

  try {
    const normalizedVariant = normalizeVariant(variant);
    if (/^[A-Za-z][A-Za-z0-9]*$/.test(variant)) {
      throw new Error(
        'Gene symbols alone cannot be scored. Enter a specific HGVS variant or chromosome-position-reference-alternate coordinates.',
      );
    }
    const validation = validateVariant(normalizedVariant);
    if (validation !== true) throw new Error(validation);
    logService.info(`Processing variant ${index + 1}/${total}: "${variant}"`);
    processingStatus.value = `Annotating ${variant}.`;

    // Call queryVariant with batch-specific options
    const variantResult = await queryVariant(normalizedVariant, {
      skipCache: true,
      assembly: selectedAssembly,
    });
    if (run !== activeRun) return;

    logService.debug('Raw variant result:', variantResult);

    // Handle the response data structure
    let responseData = variantResult.data;

    // Handle case where response.data might be an array
    if (Array.isArray(responseData)) {
      logService.debug('Response data is an array, taking first item');
      responseData = responseData[0];
    }

    if (!responseData) {
      throw new Error('No response data returned from variant API');
    }

    // Ensure we have annotationData array structure
    if (!responseData.annotationData) {
      logService.debug('No annotationData found in response, restructuring...');
      // If the response itself looks like annotation data, wrap it
      if (responseData.most_severe_consequence || responseData.gene_symbol) {
        responseData = { annotationData: [responseData] };
      } else {
        responseData = { annotationData: [] };
      }
    }

    // Extract annotation from the first item in annotationData
    const annotation = responseData.annotationData?.[0];
    if (!annotation) {
      throw new Error('No annotation data found in response');
    }

    logService.debug('Extracted annotation:', annotation);

    // Extract variant score
    resultRow.variantScore = parseApiScore(
      annotation.nephro_variant_score,
      'variant',
    );
    logService.debug(`Variant score: ${resultRow.variantScore}`);

    // Extract gene symbol using prioritization logic
    resultRow.geneSymbol = getPrioritizedGeneSymbol(annotation) || 'N/A';
    logService.debug(`Gene symbol: ${resultRow.geneSymbol}`);

    // Get gene score if we have a valid gene symbol
    if (resultRow.geneSymbol !== 'N/A') {
      processingStatus.value = `Loading gene evidence for ${resultRow.geneSymbol} (${variant}).`;
      logService.debug(`Fetching gene details for: ${resultRow.geneSymbol}`);
      let geneResult = geneResults.get(resultRow.geneSymbol);
      if (!geneResult) {
        geneResult = await fetchGeneDetails(resultRow.geneSymbol, {
          skipCache: true,
        });
        geneResults.set(resultRow.geneSymbol, geneResult);
      }
      if (run !== activeRun) return;
      resultRow.geneScore = parseApiScore(geneResult?.data?.ngs, 'gene');
      logService.debug('Gene result:', geneResult);
      logService.debug(`Gene score: ${resultRow.geneScore}`);
    } else {
      throw new Error(
        'No gene could be resolved. Check the variant and genome assembly before processing again.',
      );
    }

    // Calculate inheritance score
    resultRow.inheritanceScore = calculateInheritanceScore(
      inheritance,
      segregation,
    );
    logService.debug(`Inheritance score: ${resultRow.inheritanceScore}`);

    // Calculate final NCS score
    if (resultRow.geneScore !== 'N/A' && resultRow.variantScore !== 'N/A') {
      resultRow.ncs = calculateNCS(
        resultRow.geneScore,
        resultRow.variantScore,
        resultRow.inheritanceScore,
      ).toFixed(3);
      logService.debug(`Final NCS: ${resultRow.ncs}`);
    }

    logService.info(
      `Successfully processed variant "${variant}" - NCS: ${resultRow.ncs}`,
    );
  } catch (e) {
    logService.error(`Failed to process variant "${variant}":`, e);
    const serviceError = e.response?.data?.error;
    resultRow.error =
      typeof serviceError === 'string'
        ? serviceError
        : e.message || 'Unknown processing error';
  }

  // Add to results and update progress
  if (run !== activeRun) return;
  batchResults.value.push(resultRow);
  progress.value = ((index + 1) / total) * 100;
}

function downloadResults(format) {
  if (!['CSV', 'TSV', 'JSON'].includes(format)) {
    errorMsg.value = 'Unsupported export format. Use CSV, TSV, or JSON.';
    return;
  }
  const headers = tableHeaders.map((h) => h.title);
  const data = batchResults.value.map((row) => [
    row.variant,
    row.geneSymbol,
    row.ncs,
    row.geneScore,
    row.variantScore,
    row.inheritanceScore,
    row.error,
  ]);

  const mimeType = {
    CSV: 'text/csv',
    TSV: 'text/tab-separated-values',
    JSON: 'application/json',
  }[format];

  const extension = format.toLowerCase();
  const filename = `nc_scorer_batch_results_${new Date().toISOString().split('T')[0]}.${extension}`;

  if (format === 'JSON') {
    downloadFile(
      JSON.stringify(batchResults.value, null, 2),
      filename,
      mimeType,
    );
  } else {
    const delimiter = format === 'CSV' ? ',' : '\t';
    const content = generateCSV(headers, data, delimiter);
    downloadFile(content, filename, mimeType);
  }
}

function clearResults() {
  activeRun += 1;
  isLoading.value = false;
  batchResults.value = [];
  progress.value = 0;
  errorMsg.value = '';
  processingStatus.value = '';
}

function cancelProcessing() {
  activeRun += 1;
  isLoading.value = false;
  processingStatus.value = 'Processing cancelled.';
}

function formatScore(score) {
  const numericScore = parseFloat(score);
  if (isNaN(numericScore)) return 'N/A';

  // Format to 2 decimal places, removing trailing zeros
  return numericScore.toFixed(2).replace(/\.?0+$/, '');
}
</script>

<style scoped>
.batch-input,
.batch-results {
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
  margin-top: 24px;
}
.section-heading {
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.5;
  padding: 20px 24px 12px;
}
.section-body {
  padding: 0 24px 24px;
}
.section-body > p {
  max-width: 75ch;
  line-height: 1.6;
}
.assembly-setting {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 24px;
  margin-bottom: 24px;
}
.assembly-select {
  flex: 0 1 300px;
  min-width: 230px;
}
.assembly-setting p {
  max-width: 50ch;
  line-height: 1.6;
}
.results-header {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
}
.results-header .section-heading {
  padding: 0;
}
.results-summary {
  margin-top: 4px;
  font-size: 0.875rem;
}
.results-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.batch-page :deep(.v-btn) {
  letter-spacing: normal;
  text-transform: none;
}
.score-value {
  color: rgb(var(--v-theme-on-surface));
  font-variant-numeric: tabular-nums;
}
.row-error {
  min-width: 220px;
  max-width: 50ch;
  padding: 12px 0;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.results-table :deep(th) {
  white-space: nowrap;
}
.progress-label {
  margin-bottom: 8px;
  overflow-wrap: anywhere;
}
.cancel-button {
  margin-left: 12px;
}
@media (max-width: 600px) {
  .section-heading,
  .results-header {
    padding: 16px;
  }
  .section-body {
    padding: 0 16px 16px;
  }
  .assembly-select {
    flex-basis: 100%;
  }
}
</style>
