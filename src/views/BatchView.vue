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
          <br>
          <strong>Note:</strong> Omitting segregation data for inheritance patterns that expect it may result in a penalty (20% score reduction).
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

        <div class="mb-4">
          <p class="text-subtitle-1 mb-2">Genome Assembly:</p>
          <v-select
            v-model="assembly"
            :items="assemblyOptions"
            label="Select Genome Assembly"
            variant="outlined"
            density="comfortable"
            :disabled="isLoading"
            class="mb-2"
            style="max-width: 300px;"
          ></v-select>
          <p class="text-caption">
            Select GRCh37 for variants with hg19 coordinates, or GRCh38 for hg38 coordinates.
          </p>
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
                <v-list-item @click="downloadResults('VCF')" title="Download as VCF" />
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
            <span v-else class="text-grey">N/A</span>
          </template>
          <template #[`item.ncs`]="{ item }">
            <v-chip 
              v-if="item.ncs !== 'N/A'" 
              :color="getScoreColor(item.ncs, 'ncs')" 
              size="small"
              :title="`NCS Score: ${item.ncs}`"
            >
              {{ item.ncs }}
            </v-chip>
            <span v-else class="text-grey">N/A</span>
          </template>
          <template #[`item.geneScore`]="{ item }">
            <v-chip 
              v-if="item.geneScore !== 'N/A'" 
              :color="getScoreColor(item.geneScore, 'gene')" 
              size="small"
              variant="tonal"
              :title="`Gene Score: ${item.geneScore}`"
            >
              {{ formatScore(item.geneScore) }}
            </v-chip>
            <span v-else class="text-grey">N/A</span>
          </template>
          <template #[`item.variantScore`]="{ item }">
            <v-chip 
              v-if="item.variantScore !== 'N/A'" 
              :color="getScoreColor(item.variantScore, 'variant')" 
              size="small"
              variant="tonal"
              :title="`Variant Score: ${item.variantScore}`"
            >
              {{ formatScore(item.variantScore) }}
            </v-chip>
            <span v-else class="text-grey">N/A</span>
          </template>
          <template #[`item.inheritanceScore`]="{ item }">
            <v-chip 
              v-if="item.inheritanceScore !== 'N/A'" 
              :color="getScoreColor(item.inheritanceScore, 'inheritance')" 
              size="small"
              variant="tonal"
              :title="`Inheritance Score: ${item.inheritanceScore}`"
            >
              {{ formatScore(item.inheritanceScore) }}
            </v-chip>
            <span v-else class="text-grey">N/A</span>
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
import { scoreInterpretationConfig } from '@/config/scoreInterpretationConfig.js';

const MAX_VARIANTS = 200;

// Component State
const variantsInput = ref('');
const assembly = ref('GRCh38');
const isLoading = ref(false);
const errorMsg = ref('');
const progress = ref(0);
const batchResults = ref([]);
const tableSearch = ref('');

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
    segregation: parts[2]?.trim() || null, // Use null for missing segregation data
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
      logService.info(`Processing variant ${index + 1}/${total}: "${variant}"`);
      
      // Call queryVariant with batch-specific options
      const variantResult = await queryVariant(variant, { 
        skipCache: true, 
        assembly: assembly.value 
      });
      
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
      resultRow.variantScore = annotation.nephro_variant_score ?? 0;
      logService.debug(`Variant score: ${resultRow.variantScore}`);
      
      // Extract gene symbol using prioritization logic
      resultRow.geneSymbol = getPrioritizedGeneSymbol(annotation) || 'N/A';
      logService.debug(`Gene symbol: ${resultRow.geneSymbol}`);

      // Get gene score if we have a valid gene symbol
      if (resultRow.geneSymbol !== 'N/A') {
        logService.debug(`Fetching gene details for: ${resultRow.geneSymbol}`);
        const geneResult = await fetchGeneDetails(resultRow.geneSymbol, { skipCache: true });
        logService.debug('Gene result:', geneResult);
        resultRow.geneScore = geneResult.data?.ngs ?? 0;
        logService.debug(`Gene score: ${resultRow.geneScore}`);
      }

      // Calculate inheritance score
      resultRow.inheritanceScore = calculateInheritanceScore(inheritance, segregation);
      logService.debug(`Inheritance score: ${resultRow.inheritanceScore}`);
      
      // Calculate final NCS score
      if (resultRow.geneScore !== 'N/A' && resultRow.variantScore !== 'N/A') {
        resultRow.ncs = calculateNCS(resultRow.geneScore, resultRow.variantScore, resultRow.inheritanceScore).toFixed(3);
        logService.debug(`Final NCS: ${resultRow.ncs}`);
      }
      
      logService.info(`Successfully processed variant "${variant}" - NCS: ${resultRow.ncs}`);
      
    } catch (e) {
      logService.error(`Failed to process variant "${variant}":`, e);
      resultRow.error = e.message || 'Unknown processing error';
    }
    
    // Add to results and update progress
    batchResults.value.push(resultRow);
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
    JSON: 'application/json',
    VCF: 'text/x-vcard'
  }[format];
  
  const extension = format.toLowerCase();
  const filename = `nc_scorer_batch_results_${new Date().toISOString().split('T')[0]}.${extension}`;
  
  if (format === 'JSON') {
    downloadFile(JSON.stringify(batchResults.value, null, 2), filename, mimeType);
  } else if (format === 'VCF') {
    // Generate VCF format with scoring information in INFO field
    const vcfHeader = [
      '##fileformat=VCFv4.2',
      `##fileDate=${new Date().toISOString().split('T')[0].replace(/-/g, '')}`,
      '##source=NC-Scorer_BatchProcessing',
      '##INFO=<ID=NCS,Number=1,Type=Float,Description="Nephro Candidate Score">',
      '##INFO=<ID=VS,Number=1,Type=Float,Description="Variant Score">',
      '##INFO=<ID=GS,Number=1,Type=Float,Description="Gene Score">',
      '##INFO=<ID=INH,Number=1,Type=String,Description="Inheritance Pattern">',
      '##INFO=<ID=GENE,Number=1,Type=String,Description="Gene Symbol">',
      '#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO'
    ];
    
    const vcfLines = batchResults.value
      .filter(row => row.variant && row.ncs !== 'N/A')
      .map(row => {
        // Parse basic variant info (this is simplified - real implementation would need more robust parsing)
        const variantParts = row.variant.split(':');
        const chrom = variantParts[0] || '.';
        const pos = '1'; // Simplified - would need proper coordinate parsing
        const id = '.';
        const ref = '.';
        const alt = '.';
        const qual = '.';
        const filter = 'PASS';
        const info = [
          `NCS=${row.ncs}`,
          `VS=${row.variantScore}`,
          `GS=${row.geneScore}`,
          `INH=${row.inheritance}`,
          `GENE=${row.geneSymbol}`
        ].join(';');
        
        return `${chrom}\t${pos}\t${id}\t${ref}\t${alt}\t${qual}\t${filter}\t${info}`;
      });
    
    const vcfContent = [...vcfHeader, ...vcfLines].join('\n');
    downloadFile(vcfContent, filename, mimeType);
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

function getScoreColor(score, scoreType = 'ncs') {
  const numericScore = parseFloat(score);
  if (isNaN(numericScore)) return 'grey';
  
  // For NCS (combined) scores, use the standard interpretation ranges
  if (scoreType === 'ncs') {
    const ranges = scoreInterpretationConfig.ranges;
    if (numericScore >= ranges[2].min) return 'error';      // High (7-10): Red
    if (numericScore >= ranges[1].min) return 'warning';    // Moderate (3-7): Orange
    return 'grey';                                          // Low (0-3): Grey
  }
  
  // For sub-scores, use theme colors consistent with ScoringView
  switch (scoreType) {
    case 'gene':
      return 'indigo';           // Blue-based for gene scores
    case 'variant':
      return 'deep-purple';      // Purple-based for variant scores  
    case 'inheritance':
      return 'teal';             // Teal-based for inheritance scores
    default:
      return 'grey';
  }
}

function formatScore(score) {
  const numericScore = parseFloat(score);
  if (isNaN(numericScore)) return 'N/A';
  
  // Format to 2 decimal places, removing trailing zeros
  return numericScore.toFixed(2).replace(/\.?0+$/, '');
}
</script>