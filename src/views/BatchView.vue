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
          patterns that expect it reduces the inheritance component by 20%.
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

        <p v-if="variantCountExceeded" class="text-caption text-error mb-2">
          Maximum {{ MAX_VARIANTS }} variants allowed. You entered
          {{ inputCount }}.
        </p>

        <p v-if="processingStatus" class="progress-label" role="status">
          {{ processingStatus }} {{ completedCount }} of
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
          @click:close="errorMsg = ''"
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
            <template v-if="isLoading">
              Processing variants · {{ completedCount }} of
              {{ inputCount }} finished
            </template>
            <template v-else>
              {{ successfulCount }} scored · {{ unavailableCount }} unavailable
            </template>
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
          <v-menu :disabled="isLoading">
            <template v-slot:activator="{ props }">
              <v-btn
                color="primary"
                v-bind="props"
                variant="flat"
                min-height="44"
                min-width="120"
                prepend-icon="mdi-download"
                :disabled="isLoading"
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
          :loading="isLoading"
          loading-text="Processing batch variants..."
          class="results-table"
          density="compact"
          :items-per-page="10"
        >
          <template #[`item.geneSymbol`]="{ item }">
            <router-link
              v-if="item.status === 'scored' && item.geneSymbol !== 'N/A'"
              :to="{ name: 'GeneView', params: { symbol: item.geneSymbol } }"
            >
              {{ item.geneSymbol }}
            </router-link>
            <span
              v-else-if="
                item.status === 'scored' ||
                item.status === 'failed' ||
                item.geneSymbol !== 'N/A'
              "
            >
              {{ item.geneSymbol }}
            </span>
            <span
              v-else
              class="text-medium-emphasis d-inline-flex align-center"
            >
              <v-progress-circular
                indeterminate
                size="14"
                width="2"
                color="primary"
                class="mr-1"
              />
              Pending
            </span>
          </template>
          <template #[`item.ncs`]="{ item }">
            <strong
              v-if="item.status === 'scored' && item.ncs !== 'N/A'"
              class="score-value"
              :title="`NCS Score: ${item.ncs}`"
            >
              {{ item.ncs }}
            </strong>
            <span
              v-else-if="item.status === 'failed' || item.status === 'scored'"
            >
              N/A
            </span>
            <span v-else class="text-medium-emphasis">—</span>
          </template>
          <template #[`item.geneScore`]="{ item }">
            <span
              v-if="item.status === 'scored' && item.geneScore !== 'N/A'"
              class="score-value"
              :title="`Gene Score: ${item.geneScore}`"
            >
              {{ formatScore(item.geneScore) }}
            </span>
            <span
              v-else-if="item.status === 'failed' || item.status === 'scored'"
            >
              N/A
            </span>
            <span v-else class="text-medium-emphasis">—</span>
          </template>
          <template #[`item.variantScore`]="{ item }">
            <span
              v-if="item.status === 'scored' && item.variantScore !== 'N/A'"
              class="score-value"
              :title="`Variant Score: ${item.variantScore}`"
            >
              {{ formatScore(item.variantScore) }}
            </span>
            <span
              v-else-if="item.status === 'failed' || item.status === 'scored'"
            >
              N/A
            </span>
            <span v-else class="text-medium-emphasis">—</span>
          </template>
          <template #[`item.inheritanceScore`]="{ item }">
            <span
              v-if="item.status === 'scored' && item.inheritanceScore !== 'N/A'"
              class="score-value"
              :title="`Inheritance Score: ${item.inheritanceScore}`"
            >
              {{ formatScore(item.inheritanceScore) }}
            </span>
            <span
              v-else-if="item.status === 'failed' || item.status === 'scored'"
            >
              N/A
            </span>
            <span v-else class="text-medium-emphasis">—</span>
          </template>
          <template #[`item.error`]="{ item }">
            <span
              v-if="item.status === 'cancelled'"
              class="text-medium-emphasis"
            >
              Cancelled
            </span>
            <p v-else-if="item.error" class="row-error">{{ item.error }}</p>
            <span
              v-else-if="item.status !== 'scored' && isLoading"
              class="text-medium-emphasis"
            >
              In progress...
            </span>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </ContentContainer>
</template>

<script setup>
import { ref, reactive, computed, onBeforeUnmount } from 'vue';
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

const hasTranscriptVersion = (variant) => /^[A-Z]{2}_\d+\.\d+:/i.test(variant);
const stripTranscriptVersion = (variant) =>
  variant.replace(/(\.[0-9]+)(:)/, '$2');

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
const variantCountExceeded = computed(() => inputCount.value > MAX_VARIANTS);
const completedCount = computed(
  () =>
    batchResults.value.filter(
      (row) => row.status === 'scored' || row.status === 'failed',
    ).length,
);
const successfulCount = computed(
  () =>
    batchResults.value.filter(
      (row) => row.status === 'scored' || (row.ncs !== 'N/A' && !row.error),
    ).length,
);
const unavailableCount = computed(
  () =>
    batchResults.value.filter(
      (row) =>
        row.status === 'failed' ||
        Boolean(row.error) ||
        (row.status !== 'pending' && row.ncs === 'N/A'),
    ).length,
);
let activeRun = 0;
let activeAbortController = null;
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
    segregation:
      parts[2] !== undefined && parts[2].trim() !== '' ? parts[2].trim() : null,
  };
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

function assignAnnotationToRow(row, annotation) {
  if (!annotation) {
    row.error = 'No annotation data found in response';
    row.status = 'failed';
    return;
  }
  if (annotation.error) {
    row.error =
      typeof annotation.error === 'string'
        ? annotation.error
        : annotation.error.message || 'Annotation failed';
    row.status = 'failed';
    return;
  }
  try {
    row.variantScore = parseApiScore(
      annotation.nephro_variant_score,
      'variant',
    );
  } catch (err) {
    row.error = err.message || 'Invalid variant score';
    row.status = 'failed';
    return;
  }
  row.geneSymbol = getPrioritizedGeneSymbol(annotation) || 'N/A';
}

async function processVariants() {
  if (isLoading.value) return;
  clearResults();
  const run = activeRun;
  const selectedAssembly = assembly.value;
  const geneResults = new Map();
  isLoading.value = true;
  activeAbortController = new AbortController();
  const signal = activeAbortController.signal;

  const lines = variantsInput.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length > MAX_VARIANTS) {
    errorMsg.value = `Maximum ${MAX_VARIANTS} variants allowed. You entered ${lines.length}.`;
    isLoading.value = false;
    return;
  }

  // Preallocate rows in exact input order as reactive objects
  const rows = reactive(
    lines.map((line) => {
      const { variant, inheritance, segregation } = parseInputLine(line);
      return {
        variant,
        inheritance,
        segregation,
        normalizedVariant: null,
        variantScore: 'N/A',
        geneSymbol: 'N/A',
        geneScore: 'N/A',
        inheritanceScore: 'N/A',
        ncs: 'N/A',
        error: '',
        status: 'pending',
      };
    }),
  );

  // Local validation per row
  for (const row of rows) {
    if (!row.variant) {
      row.error = 'Empty variant input.';
      row.status = 'failed';
      continue;
    }
    if (/^[A-Za-z][A-Za-z0-9]*$/.test(row.variant)) {
      row.error =
        'Gene symbols alone cannot be scored. Enter a specific HGVS variant or chromosome-position-reference-alternate coordinates.';
      row.status = 'failed';
      continue;
    }
    const normalized = normalizeVariant(row.variant);
    const validation = validateVariant(normalized);
    if (validation !== true) {
      row.error =
        typeof validation === 'string' ? validation : 'Invalid variant format';
      row.status = 'failed';
    } else {
      row.normalizedVariant = normalized;
      row.status = 'pending';
    }
  }

  // Immediately bind results so input order and local validation errors are rendered reactively
  batchResults.value = rows;

  const validRows = rows.filter((r) => r.normalizedVariant && !r.error);

  if (validRows.length === 0) {
    if (run !== activeRun) return;
    progress.value = 100;
    isLoading.value = false;
    processingStatus.value = 'Processing complete.';
    return;
  }

  // Single variant path: when only 1 row is valid and input length is 1
  if (validRows.length === 1 && rows.length === 1) {
    const row = validRows[0];
    processingStatus.value = `Annotating ${row.variant}.`;
    try {
      const variantResult = await queryVariant(row.normalizedVariant, {
        skipCache: true,
        assembly: selectedAssembly,
        signal,
      });
      if (signal.aborted || run !== activeRun) return;

      let responseData = variantResult?.data;
      if (Array.isArray(responseData)) responseData = responseData[0];
      if (!responseData)
        throw new Error('No response data returned from variant API');

      if (!responseData.annotationData) {
        if (responseData.most_severe_consequence || responseData.gene_symbol) {
          responseData = { annotationData: [responseData] };
        } else {
          responseData = { annotationData: [] };
        }
      }

      const annotation = responseData.annotationData?.[0];
      assignAnnotationToRow(row, annotation);

      if (!row.error) {
        if (row.geneSymbol !== 'N/A') {
          processingStatus.value = `Loading gene evidence for ${row.geneSymbol} (${row.variant}).`;
          let geneResult = geneResults.get(row.geneSymbol);
          if (!geneResult) {
            geneResult = await fetchGeneDetails(row.geneSymbol, {
              skipCache: true,
            });
            geneResults.set(row.geneSymbol, geneResult);
          }
          if (signal.aborted || run !== activeRun) return;
          row.geneScore = parseApiScore(geneResult?.data?.ngs, 'gene');
        } else {
          throw new Error(
            'No gene could be resolved. Check the variant and genome assembly before processing again.',
          );
        }

        row.inheritanceScore = calculateInheritanceScore(
          row.inheritance,
          row.segregation,
        );
        if (row.geneScore !== 'N/A' && row.variantScore !== 'N/A') {
          row.ncs = calculateNCS(
            row.geneScore,
            row.variantScore,
            row.inheritanceScore,
          ).toFixed(3);
          row.status = 'scored';
        }
      }
    } catch (e) {
      if (signal.aborted || run !== activeRun) return;
      const serviceError = e.response?.data?.error;
      row.error =
        typeof serviceError === 'string'
          ? serviceError
          : e.message || 'Unknown processing error';
      row.status = 'failed';
    }

    if (run !== activeRun) return;
    progress.value = 100;
    isLoading.value = false;
    processingStatus.value = 'Processing complete.';
    return;
  }

  // Official batch path: when multiple variants are processed
  try {
    processingStatus.value = `Annotating batch of ${validRows.length} variants.`;
    progress.value = 25;

    const batchVariants = validRows.map((r) => r.normalizedVariant);
    let variantResult;
    try {
      variantResult = await queryVariant(batchVariants, {
        skipCache: true,
        assembly: selectedAssembly,
        signal,
      });
    } catch (batchError) {
      if (signal.aborted || run !== activeRun) return;
      // If batch rejection was input-specific (HTTP 400 or message indicates reference/allele/unresolved mismatch),
      // gracefully recover by querying valid rows individually so 1 bad variant doesn't ruin the whole batch.
      const isInputRejection =
        batchError.response?.status === 400 ||
        /mismatch|unresolved|transcript|reference/i.test(batchError.message);
      if (isInputRejection && validRows.length > 1) {
        for (const row of validRows) {
          if (signal.aborted || run !== activeRun) return;
          try {
            const singleResult = await queryVariant(row.normalizedVariant, {
              skipCache: true,
              assembly: selectedAssembly,
              signal,
            });
            if (signal.aborted || run !== activeRun) return;
            let singleData = singleResult?.data;
            if (Array.isArray(singleData)) singleData = singleData[0];
            const anno = singleData?.annotationData?.[0] || singleData;
            assignAnnotationToRow(row, anno);
          } catch (singleErr) {
            if (signal.aborted || run !== activeRun) return;
            const srvErr = singleErr.response?.data?.error;
            row.error =
              typeof srvErr === 'string'
                ? srvErr
                : singleErr.message || 'Annotation failed';
            row.status = 'failed';
          }
        }
      } else {
        throw batchError;
      }
    }

    if (signal.aborted || run !== activeRun) return;
    progress.value = 50;

    let responseData = variantResult?.data;
    if (
      Array.isArray(responseData) &&
      responseData.length === 1 &&
      responseData[0]?.annotationData
    ) {
      responseData = responseData[0];
    }
    const annotations = Array.isArray(responseData)
      ? responseData
      : responseData?.annotationData || [];

    // Map annotations by variant identity to avoid misattributing consequences
    // and correctly handle duplicate inputs
    if (annotations.length > 0) {
      const annotationsByVariant = new Map();
      for (const anno of annotations) {
        if (!anno) continue;
        const keys = [
          anno.originalInput,
          anno.input,
          anno.variantKey,
          anno.vcfString,
        ].filter(Boolean);
        for (const key of keys) {
          if (!annotationsByVariant.has(key)) {
            annotationsByVariant.set(key, anno);
          }
        }
      }

      const hasExplicitKeys = annotationsByVariant.size > 0;

      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        if (row.error) continue;

        let matchedAnno = null;
        if (hasExplicitKeys) {
          matchedAnno =
            annotationsByVariant.get(row.normalizedVariant) ||
            annotationsByVariant.get(row.variant) ||
            null;
        } else if (annotations.length === validRows.length) {
          matchedAnno = annotations[i];
        }

        if (matchedAnno) {
          assignAnnotationToRow(row, matchedAnno);
        } else {
          row.error =
            'No matching annotation data returned for this variant in batch response';
          row.status = 'failed';
        }
      }
    }

    // Check for versioned HGVS rows that failed due to transcript versioning and retry without version
    for (const row of validRows) {
      if (
        row.error &&
        hasTranscriptVersion(row.normalizedVariant) &&
        /No valid VCF string found/i.test(row.error)
      ) {
        if (signal.aborted || run !== activeRun) return;
        const unversioned = stripTranscriptVersion(row.normalizedVariant);
        try {
          const fallbackRes = await queryVariant(unversioned, {
            skipCache: true,
            assembly: selectedAssembly,
            signal,
          });
          if (signal.aborted || run !== activeRun) return;
          let fbData = fallbackRes?.data;
          if (Array.isArray(fbData)) fbData = fbData[0];
          const fbAnno = fbData?.annotationData?.[0] || fbData;
          row.error = '';
          assignAnnotationToRow(row, fbAnno);
        } catch {
          // Keep original error if fallback also fails
        }
      }
    }

    // Deduplicated gene fetching across batch with bounded concurrency
    const uniqueGenes = [
      ...new Set(
        validRows
          .filter((r) => r.geneSymbol !== 'N/A' && !r.error)
          .map((r) => r.geneSymbol),
      ),
    ];

    if (uniqueGenes.length > 0) {
      processingStatus.value = `Loading gene evidence for ${uniqueGenes.length} gene${uniqueGenes.length === 1 ? '' : 's'}.`;
      progress.value = 75;

      const CONCURRENCY_LIMIT = 5;
      for (let i = 0; i < uniqueGenes.length; i += CONCURRENCY_LIMIT) {
        if (signal.aborted || run !== activeRun) return;
        const chunk = uniqueGenes.slice(i, i + CONCURRENCY_LIMIT);
        await Promise.all(
          chunk.map(async (sym) => {
            if (!geneResults.has(sym)) {
              try {
                const res = await fetchGeneDetails(sym, { skipCache: true });
                geneResults.set(sym, res);
              } catch (err) {
                geneResults.set(sym, {
                  error: err.message || 'Failed to fetch gene details',
                });
              }
            }
          }),
        );
      }
      if (signal.aborted || run !== activeRun) return;
    }

    // Score calculation
    for (const row of validRows) {
      if (row.error) {
        row.status = 'failed';
        continue;
      }
      if (row.geneSymbol === 'N/A') {
        row.error =
          'No gene could be resolved. Check the variant and genome assembly before processing again.';
        row.status = 'failed';
        continue;
      }
      const geneRes = geneResults.get(row.geneSymbol);
      if (geneRes?.error) {
        row.error = geneRes.error;
        row.status = 'failed';
        continue;
      }
      try {
        row.geneScore = parseApiScore(geneRes?.data?.ngs, 'gene');
        row.inheritanceScore = calculateInheritanceScore(
          row.inheritance,
          row.segregation,
        );
        if (row.variantScore !== 'N/A' && row.geneScore !== 'N/A') {
          row.ncs = calculateNCS(
            row.geneScore,
            row.variantScore,
            row.inheritanceScore,
          ).toFixed(3);
          row.status = 'scored';
        }
      } catch (err) {
        row.error = err.message || 'Scoring calculation failed';
        row.status = 'failed';
      }
    }
  } catch (e) {
    if (signal.aborted || run !== activeRun) return;
    const serviceError = e.response?.data?.error;
    const msg =
      typeof serviceError === 'string'
        ? serviceError
        : e.message || 'Unknown processing error';
    for (const r of validRows) {
      if (!r.error) {
        r.error = msg;
        r.status = 'failed';
      }
    }
  }

  if (run === activeRun) {
    progress.value = 100;
    isLoading.value = false;
    processingStatus.value = 'Processing complete.';
  }
}

function downloadResults(format) {
  if (isLoading.value) return;
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
  activeAbortController?.abort();
  activeAbortController = null;
  isLoading.value = false;
  batchResults.value = [];
  progress.value = 0;
  errorMsg.value = '';
  processingStatus.value = '';
  tableSearch.value = '';
}

function cancelProcessing() {
  activeRun += 1;
  activeAbortController?.abort();
  activeAbortController = null;
  isLoading.value = false;
  processingStatus.value = 'Processing cancelled.';
  for (const row of batchResults.value) {
    if (row.status !== 'scored' && row.status !== 'failed') {
      row.status = 'cancelled';
    }
  }
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
