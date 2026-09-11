<template>
  <ContentContainer class="gene-scores-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">Gene Scores Overview</h1>
        <p>
          Browse, search, and download the complete set of Nephro Candidate Gene
          Scores.
        </p>
        <p class="source-note">
          Data source:
          <a
            href="https://github.com/halbritter-lab/nephro_candidate_score"
            target="_blank"
            rel="noopener noreferrer"
            >Nephro Candidate Score</a
          >
        </p>
      </div>
    </header>

    <!-- Search and Download Controls -->
    <div
      class="gene-table-toolbar"
      role="group"
      aria-label="Gene table controls"
    >
      <div class="gene-table-search">
        <v-text-field
          v-model="searchQuery"
          clearable
          hide-details
          density="comfortable"
          label="Search by Gene Symbol or HGNC ID"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          min-height="44"
        ></v-text-field>
      </div>
      <div class="gene-table-download">
        <!-- Download menu with format options -->
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              color="primary"
              prepend-icon="mdi-download"
              v-bind="props"
              variant="flat"
              min-height="44"
              min-width="160"
              class="font-weight-medium"
              :disabled="
                loadingState.loading ||
                loadingState.error ||
                filteredGenes.length === 0
              "
            >
              Download Data
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item
              @click="downloadGeneScores('csv')"
              prepend-icon="mdi-file-delimited"
              title="Download as CSV"
              min-height="44"
            />
            <v-list-item
              @click="downloadGeneScores('excel')"
              prepend-icon="mdi-file-excel"
              title="Download as Excel"
              min-height="44"
            />
          </v-list>
        </v-menu>
      </div>
    </div>

    <!-- Error and Empty States -->
    <v-alert v-if="loadingState.error" type="error" class="mb-3">
      Failed to load gene scores: {{ loadingState.errorMessage }}
      <template v-slot:append>
        <v-btn variant="text" @click="fetchGeneScores">Retry</v-btn>
      </template>
    </v-alert>

    <v-alert
      v-else-if="
        !loadingState.loading && filteredGenes.length === 0 && searchQuery
      "
      type="info"
      class="mb-3"
    >
      No genes found matching "{{ searchQuery }}". Try a different search term.
    </v-alert>

    <!-- Gene Scores Table Container with stable min-height -->
    <p class="gene-table-scroll-hint">
      Scroll horizontally to see all columns.
    </p>
    <div class="gene-table-wrapper">
      <v-data-table
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="filteredGenes"
        :loading="loadingState.loading"
        loading-text="Loading gene scores..."
        :mobile="false"
        class="gene-data-table"
      >
        <!-- Custom column for gene symbol with router-link -->
        <template #[`item.symbol`]="{ item }">
          <router-link
            :to="{ name: 'GeneView', params: { symbol: item.symbol } }"
            class="gene-table-link font-weight-bold"
          >
            {{ item.symbol }}
          </router-link>
        </template>

        <!-- Format the score with 2 decimal places -->
        <template #[`item.ngs`]="{ item }">
          <span class="gene-score" :class="getScoreClass(item.ngs)">{{
            formatScore(item.ngs)
          }}</span>
        </template>

        <!-- Format the HGNC ID with HGNC: prefix -->
        <template #[`item.hgncIdInt`]="{ item }">
          {{ formatHgncId(item.hgncIdInt) }}
        </template>

        <!-- Format the gene set with capitalization -->
        <template #[`item.geneSet`]="{ item }">
          <v-chip
            class="gene-set-label"
            size="small"
            :color="getGeneSetColor(item.geneSet)"
            variant="outlined"
          >
            {{ formatGeneSet(item.geneSet) }}
          </v-chip>
        </template>
      </v-data-table>
    </div>
  </ContentContainer>
</template>

<script>
import { ref, onMounted, computed, reactive, watch } from 'vue';
import { logService } from '@/services/logService';
import { fetchAllGeneScores } from '@/api/geneApi';
import { generateExcel, generateCSV } from '@/utils/exportUtils';
import ContentContainer from '@/components/ContentContainer.vue';

export default {
  name: 'GeneScoresTableView',
  components: {
    ContentContainer,
  },

  setup() {
    // Table configuration
    const itemsPerPage = ref(10);
    const page = ref(1);
    const searchQuery = ref('');
    watch(searchQuery, () => {
      page.value = 1;
    });

    // Data loading state
    const loadingState = reactive({
      loading: true,
      error: false,
      errorMessage: '',
    });

    // Gene scores data
    const allGenes = ref([]);

    // Table headers
    const headers = [
      { title: 'Gene Symbol', key: 'symbol', sortable: true },
      { title: 'HGNC ID', key: 'hgncIdInt', sortable: true },
      { title: 'Nephro Candidate Gene Score', key: 'ngs', sortable: true },
      { title: 'Evidence Count', key: 'evidenceCount', sortable: true },
      { title: 'Gene Set', key: 'geneSet', sortable: true },
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
          logService.info(
            `Loaded ${allGenes.value.length} genes from ${response.source?.fromCache ? 'cache' : 'API'}`,
          );
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

      const query = searchQuery.value.trim().toLowerCase();
      const hgncQuery = query.replace(/^hgnc:\s*/, '');
      return allGenes.value.filter((gene) => {
        return (
          gene.symbol.toLowerCase().includes(query) ||
          (gene.hgncIdInt &&
            (query.startsWith('hgnc:')
              ? gene.hgncIdInt.toString() === hgncQuery
              : gene.hgncIdInt.toString().includes(query)))
        );
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
      try {
        link.click();
      } finally {
        link.remove();
        URL.revokeObjectURL(url);
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
        'Gene Set',
      ];

      // Generate data rows
      const rows = genesToDownload.map((gene) => [
        gene.symbol,
        formatHgncId(gene.hgncIdInt),
        formatScore(gene.ngs),
        gene.evidenceCount || 0,
        formatGeneSet(gene.geneSet),
      ]);

      // Generate file based on format selection
      if (format === 'excel') {
        try {
          await generateExcel(headers, rows, generateFilename('excel'));
        } catch (error) {
          logService.error('Error generating Excel file:', error);
          alert(
            'Failed to generate Excel file. CSV download will be attempted instead.',
          );
          downloadGeneScores('csv');
        }
      } else {
        // Generate CSV and trigger download
        const csvContent = generateCSV(headers, rows);
        const blob = new Blob([csvContent], {
          type: 'text/csv;charset=utf-8;',
        });
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
      page,
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
      getGeneSetColor,
    };
  },
};
</script>

<style scoped>
.gene-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}
.gene-table-search {
  flex: 1;
  max-width: 620px;
  min-width: 0;
}
.gene-table-download :deep(.v-btn) {
  text-transform: none;
  letter-spacing: normal;
}
.gene-table-wrapper {
  min-height: 580px;
  width: 100%;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  overflow: hidden;
}
.gene-table-scroll-hint {
  display: none;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 14px;
  margin-bottom: 12px;
}

.gene-data-table :deep(.v-table__wrapper) {
  min-height: 520px;
}

.gene-data-table :deep(table) {
  min-width: 600px;
}

.text-success {
  color: #2e7d32;
}

.text-warning {
  color: #ed6c02;
}

.text-grey {
  color: rgba(var(--v-theme-on-surface), 0.75);
}
.source-note {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.85rem;
  margin-top: 6px;
}
.gene-score,
.gene-set-label {
  color: rgb(var(--v-theme-on-surface)) !important;
}

.gene-table-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  min-width: 44px;
  padding: 4px 8px;
  text-decoration: underline;
  text-underline-offset: 3px;
}
@media (max-width: 600px) {
  .gene-table-scroll-hint {
    display: block;
  }
  .gene-table-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 20px;
  }
  .gene-table-search {
    max-width: none;
  }
  .gene-table-download :deep(.v-btn) {
    width: 100%;
  }
  .gene-data-table :deep(.v-data-table-footer) {
    justify-content: center;
    gap: 12px;
    padding: 16px;
  }
}
</style>
