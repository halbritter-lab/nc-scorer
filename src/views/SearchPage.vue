<!-- src/views/SearchPage.vue -->
<template>
  <ContentContainer>
    <v-row>
      <v-col cols="12">
        <v-alert
          border="start"
          variant="flat"
          color="primary-darken-1"
          class="mb-4 text-white"
        >
          <h1 class="text-h6 font-weight-bold">Welcome to NC-Scorer</h1>
          <p class="mt-2 text-body-2">
            This tool helps standardize and automate the assessment of candidate variants found via
            high throughput sequencing (e.g., exome or genome Sequencing) for patients with Chronic
            Kidney Disease of unknown etiology (CKDu). It uses the Nephro Candidate Score (NCS) to
            prioritize variants for further investigation. Use the tabs below to search for genes,
            variants, or directly calculate a score.
          </p>
        </v-alert>
      </v-col>
    </v-row>
    <v-card class="elevation-2">
      <v-tabs v-model="activeTab" fixed-tabs>
        <v-tab value="scoring" min-height="48" class="font-weight-medium">Scoring Search</v-tab>
        <v-tab value="variant" min-height="48" class="font-weight-medium">Variant Search</v-tab>
        <v-tab value="gene" min-height="48" class="font-weight-medium">Gene Search</v-tab>
      </v-tabs>

      <v-card-text>
        <v-tabs-window v-model="activeTab">
          <v-tabs-window-item value="scoring">
            <ScoringSearch />
          </v-tabs-window-item>
          <v-tabs-window-item value="variant">
            <VariantSearch />
          </v-tabs-window-item>
          <v-tabs-window-item value="gene">
            <GeneSearch />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>
    </v-card>
  </ContentContainer>
</template>

<script>
import { ref } from 'vue';
import GeneSearch from '../components/GeneSearch.vue';
import VariantSearch from '../components/VariantSearch.vue';
import ScoringSearch from '../components/ScoringSearch.vue';
import ContentContainer from '@/components/ContentContainer.vue';

export default {
  name: 'SearchPage',
  components: {
    GeneSearch,
    VariantSearch,
    ScoringSearch,
    ContentContainer,
  },
  setup() {
    // Set activeTab to 'scoring' by default.
    const activeTab = ref('scoring');
    return { activeTab };
  },
};
</script>

<style scoped>
/* Additional styling if needed */
</style>
