<template>
  <ContentContainer>
    <header class="page-header">
      <div>
        <h1 class="page-title">Prioritize kidney disease variants</h1>
        <p>
          Prioritize candidate variants using gene, variant, and inheritance
          evidence.
        </p>
      </div>
      <router-link class="page-header-link" to="/methodology"
        >How the score works
        <v-icon size="18">mdi-arrow-right</v-icon></router-link
      >
    </header>
    <section class="search-workspace" aria-label="Variant and gene search">
      <v-tabs v-model="activeTab" grow color="primary" aria-label="Search type">
        <v-tab value="scoring">Score a variant</v-tab>
        <v-tab value="variant">Variant details</v-tab>
        <v-tab value="gene">Find a gene</v-tab>
      </v-tabs>
      <div class="search-panel">
        <v-tabs-window v-model="activeTab">
          <v-tabs-window-item value="scoring"
            ><ScoringSearch
          /></v-tabs-window-item>
          <v-tabs-window-item value="variant"
            ><VariantSearch
          /></v-tabs-window-item>
          <v-tabs-window-item value="gene"><GeneSearch /></v-tabs-window-item>
        </v-tabs-window>
      </div>
    </section>
    <p class="batch-shortcut">
      Working with a list?
      <router-link to="/batch">Score variants in batch</router-link>
    </p>
    <PreprintBanner />
  </ContentContainer>
</template>

<script setup>
import { ref, defineAsyncComponent } from 'vue';
import ScoringSearch from '@/components/ScoringSearch.vue';
import ContentContainer from '@/components/ContentContainer.vue';
import PreprintBanner from '@/components/PreprintBanner.vue';

const GeneSearch = defineAsyncComponent(
  () => import('@/components/GeneSearch.vue'),
);
const VariantSearch = defineAsyncComponent(
  () => import('@/components/VariantSearch.vue'),
);
const activeTab = ref('scoring');
</script>

<style scoped>
.search-workspace {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
}
.search-workspace :deep(.v-tabs) {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.search-panel {
  padding: 28px;
}
.batch-shortcut {
  padding: 20px 0 28px;
  font-size: 0.95rem;
}
@media (max-width: 600px) {
  .search-panel {
    padding: 20px 16px;
  }
  .search-workspace :deep(.v-tab) {
    min-width: 0;
    padding-inline: 10px;
    font-size: 0.8rem;
  }
}
</style>
