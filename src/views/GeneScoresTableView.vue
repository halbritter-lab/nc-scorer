<template>
  <ContentContainer>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Gene Scores Overview</h1>
        
        <v-card elevation="2" class="mb-6">
          <v-card-text>
            <p class="mb-2">Browse, search, and download the complete set of Nephro Candidate Gene Scores.</p>
            <p class="text-caption text-grey">Data source: <a href="https://github.com/halbritter-lab/nephro_candidate_score" target="_blank">Nephro Candidate Score</a></p>
          </v-card-text>
        </v-card>
        
        <!-- Search and Download Controls -->
        <v-row class="mb-3">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="searchQuery"
              clearable
              hide-details
              density="compact"
              label="Search by Gene Symbol or HGNC ID"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6" class="d-flex justify-end align-center">
            <!-- Download menu with format options -->
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn
                  color="primary"
                  prepend-icon="mdi-download"
                  v-bind="props"
                  size="small"
                  variant="tonal"
                  :disabled="loadingState.loading || loadingState.error || filteredGenes.length === 0"
                >
                  Download Data
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item
                  @click="downloadGeneScores('csv')"
                  prepend-icon="mdi-file-delimited"
                  title="Download as CSV"
                />
                <v-list-item
                  @click="downloadGeneScores('excel')"
                  prepend-icon="mdi-file-excel"
                  title="Download as Excel"
                />
              </v-list>
            </v-menu>
          </v-col>
        </v-row>
        
        <!-- Loading, Error, and Empty States -->
        <v-card v-if="loadingState.loading" class="mb-3">
          <v-card-text class="text-center py-6">
            <v-progress-circular indeterminate color="primary" size="24" class="mr-2"></v-progress-circular>
            Loading gene scores...
          </v-card-text>
        </v-card>
        
        <v-alert v-else-if="loadingState.error" type="error" class="mb-3">
          Failed to load gene scores: {{ loadingState.errorMessage }}
          <template v-slot:append>
            <v-btn variant="text" @click="fetchGeneScores">Retry</v-btn>
          </template>
        </v-alert>
        
        <v-alert v-else-if="filteredGenes.length === 0 && searchQuery" type="info" class="mb-3">
          No genes found matching "{{ searchQuery }}". Try a different search term.
        </v-alert>
        
        <!-- Gene Scores Table -->
        <v-data-table
          v-model:items-per-page="itemsPerPage"
          :headers="headers"
          :items="filteredGenes"
          :loading="loadingState.loading"
          :search="searchQuery"
          class="elevation-1"
        >
          <!-- Custom column for gene symbol with router-link -->
          <template #[`item.symbol`]="{ item }">
            <router-link :to="{ name: 'GeneView', params: { symbol: item.symbol } }">
              {{ item.symbol }}
            </router-link>
          </template>
          
          <!-- Format the score with 2 decimal places -->
          <template #[`item.ngs`]="{ item }">
            <span :class="getScoreClass(item.ngs)">{{ formatScore(item.ngs) }}</span>
          </template>
          
          <!-- Format the HGNC ID with HGNC: prefix -->
          <template #[`item.hgncIdInt`]="{ item }">
            {{ formatHgncId(item.hgncIdInt) }}
          </template>
          
          <!-- Format the gene set with capitalization -->
          <template #[`item.geneSet`]="{ item }">
            <v-chip
              size="small"
              :color="getGeneSetColor(item.geneSet)"
              variant="outlined"
            >
              {{ formatGeneSet(item.geneSet) }}
            </v-chip>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </ContentContainer>
</template>

<script>
import { ref, onMounted, computed, reactive } from 'vue';
import { logService } from '@/services/logService';
import { fetchAllGeneScores } from '@/api/geneApi';
import ContentContainer from '@/components/ContentContainer.vue';

export default {
  name: 'GeneScoresTableView',
  components: {
    ContentContainer,
  },
  
  setup() {
    // Table configuration
    const itemsPerPage = ref(10);
    const searchQuery = ref('');
    
    // Data loading state
    const loadingState = reactive({
      loading: true,
      error: false,
      errorMessage: ''
    });
    
    // Gene scores data
    const allGenes = ref([]);
    
    // Table headers
    const headers = [
      { title: 'Gene Symbol', key: 'symbol', sortable: true },
      { title: 'HGNC ID', key: 'hgncIdInt', sortable: true },
      { title: 'Nephro Candidate Gene Score', key: 'ngs', sortable: true },
      { title: 'Evidence Count', key: 'evidenceCount', sortable: true },
      { title: 'Gene Set', key: 'geneSet', sortable: true }
    ];
    
    // Fetch gene scores data
    const fetchGeneScores = async () => {
      try {
        loadingState.loading = true;
        loadingState.error = false;
        loadingState.errorMessage = '';
        
        const response = await fetchAllGeneScores();
        
        if (response.data) {
          allGenes.value = response.data;
          logService.info(`Loaded ${allGenes.value.length} genes from ${response.source?.fromCache ? 'cache' : 'API'}`);
        } else {
          throw new Error('No data received');
        }
      } catch (error) {
        logService.error('Failed to fetch gene scores:', error);
        loadingState.error = true;
        loadingState.errorMessage = error.message || 'Unknown error';
      } finally {
        loadingState.loading = false;
      }
    };
    
    // Filter genes based on search query
    const filteredGenes = computed(() => {
      if (!searchQuery.value) {
        return allGenes.value;
      }
      
      const query = searchQuery.value.toLowerCase();
      return allGenes.value.filter(gene => {
        return gene.symbol.toLowerCase().includes(query) || 
               (gene.hgncIdInt && gene.hgncIdInt.toString().includes(query));
      });
    });
    
    // Formatting functions
    const formatScore = (score) => {
      return typeof score === 'number' ? score.toFixed(2) : 'N/A';
    };
    
    const formatHgncId = (id) => {
      return id ? `HGNC:${id}` : 'N/A';
    };
    
    const formatGeneSet = (geneSet) => {
      if (!geneSet || geneSet === 'none') return 'None';
      return geneSet.charAt(0).toUpperCase() + geneSet.slice(1);
    };
    
    // Get color and style classes based on values
    const getScoreClass = (score) => {
      if (score >= 0.8) return 'text-success font-weight-bold';
      if (score >= 0.5) return 'text-warning';
      return 'text-grey';
    };
    
    const getGeneSetColor = (geneSet) => {
      if (geneSet === 'train') return 'primary';
      if (geneSet === 'test') return 'secondary';
      return 'grey';
    };
    
    /**
     * Generate a filename for the downloaded results
     * 
     * @param {string} format - The file format ('csv' or 'excel')
     * @returns {string} - Sanitized filename with appropriate extension
     */
    const generateFilename = (format = 'csv') => {
      // Get current date in YYYY-MM-DD format
      const date = new Date().toISOString().split('T')[0];
      // Base filename
      const filename = `nc_scorer_gene_scores_${date}`;
      
      // Add appropriate extension
      return format === 'excel' ? `${filename}.xlsx` : `${filename}.csv`;
    };

    /**
     * Generate a CSV string from headers and data
     * 
     * @param {string[]} headers - Column headers
     * @param {string[][]} rows - Data rows
     * @returns {string} - CSV content
     */
    const generateCSV = (headers, rows) => {
      return [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
    };

    /**
     * Trigger file download from blob
     * 
     * @param {Blob} blob - File blob
     * @param {string} filename - Download filename
     */
    const triggerDownload = (blob, filename) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    /**
     * Generate Excel file using SheetJS library
     * 
     * @param {string[]} headers - Column headers
     * @param {string[][]} rows - Data rows
     * @param {string} filename - Output filename
     */
    const generateExcel = async (headers, rows, filename) => {
      try {
        // Dynamically import SheetJS (xlsx) library
        const XLSX = await import('xlsx');
        
        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        
        // Create workbook and add worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Gene Scores');
        
        // Generate Excel file and trigger download
        const excelBlob = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        triggerDownload(new Blob([excelBlob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
      } catch (error) {
        logService.error('Error generating Excel file:', error);
        alert('Failed to generate Excel file. CSV download will be attempted instead.');
        
        // Fallback to CSV download
        downloadGeneScores('csv');
      }
    };

    /**
     * Download gene scores in the specified format
     * 
     * @param {string} format - Format to download ('csv' or 'excel')
     */
    const downloadGeneScores = async (format = 'csv') => {
      const genesToDownload = filteredGenes.value;
      
      if (genesToDownload.length === 0) {
        logService.warn('No data to download');
        return;
      }
      
      // Define data structure
      const headers = [
        'Gene Symbol',
        'HGNC ID',
        'Nephro Candidate Gene Score',
        'Evidence Count',
        'Gene Set'
      ];
      
      // Generate data rows
      const rows = genesToDownload.map(gene => [
        gene.symbol,
        formatHgncId(gene.hgncIdInt),
        formatScore(gene.ngs),
        gene.evidenceCount || 0,
        formatGeneSet(gene.geneSet)
      ]);
      
      // Generate file based on format selection
      if (format === 'excel') {
        // Generate Excel file
        generateExcel(headers, rows, generateFilename('excel'));
      } else {
        // Generate CSV and trigger download
        const csvContent = generateCSV(headers, rows);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        triggerDownload(blob, generateFilename('csv'));
      }
    };
    
    // Fetch data on component mount
    onMounted(() => {
      fetchGeneScores();
    });
    
    return {
      // Data
      allGenes,
      headers,
      itemsPerPage,
      loadingState,
      searchQuery,
      
      // Computed
      filteredGenes,
      
      // Methods
      fetchGeneScores,
      downloadGeneScores,
      formatScore,
      formatHgncId,
      formatGeneSet,
      getScoreClass,
      getGeneSetColor
    };
  }
};
</script>

<style scoped>
.text-success {
  color: #4caf50;
}

.text-warning {
  color: #ff9800;
}

.text-grey {
  color: #757575;
}
</style>
