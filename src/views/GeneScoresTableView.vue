<template>
  <v-container>
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
            <v-btn
              color="primary"
              prepend-icon="mdi-download"
              @click="downloadGeneScores"
              :disabled="loadingState.loading || loadingState.error || filteredGenes.length === 0"
            >
              Download Data
            </v-btn>
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
  </v-container>
</template>

<script>
import { ref, computed, reactive, onMounted } from 'vue';
import { fetchAllGeneScores } from '@/api/geneApi';

export default {
  name: 'GeneScoresTableView',
  
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
          console.log(`Loaded ${allGenes.value.length} genes from ${response.source?.fromCache ? 'cache' : 'API'}`);
        } else {
          throw new Error('No data received');
        }
      } catch (error) {
        console.error('Failed to fetch gene scores:', error);
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
    
    // Download gene scores as CSV
    const downloadGeneScores = () => {
      const genesToDownload = filteredGenes.value;
      
      if (genesToDownload.length === 0) {
        console.warn('No data to download');
        return;
      }
      
      // Generate CSV header
      const headers = [
        'Gene Symbol',
        'HGNC ID',
        'Nephro Candidate Gene Score',
        'Evidence Count',
        'Gene Set'
      ];
      
      // Generate CSV rows
      const rows = genesToDownload.map(gene => [
        gene.symbol,
        formatHgncId(gene.hgncIdInt),
        formatScore(gene.ngs),
        gene.evidenceCount || 0,
        formatGeneSet(gene.geneSet)
      ]);
      
      // Combine header and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.setAttribute('href', url);
      link.setAttribute('download', `nc_scorer_gene_scores_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
