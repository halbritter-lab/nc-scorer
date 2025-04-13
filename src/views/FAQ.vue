<template>
  <ContentContainer>
    <v-container class="px-4 px-md-8">
      <!-- Page Header -->
      <v-row class="mb-6">
        <v-col cols="12" class="text-center">
          <h1 class="text-h4 font-weight-bold mb-2">{{ faqConfig.title }}</h1>
          <p class="text-body-1 text-medium-emphasis">{{ faqConfig.subtitle }}</p>
        </v-col>
      </v-row>

      <!-- Search Input (future enhancement) -->
      <v-row justify="center" class="mb-6">
        <v-col cols="12" md="8">
          <v-text-field
            v-model="searchQuery"
            prepend-inner-icon="mdi-magnify"
            label="Search FAQs"
            variant="outlined"
            hide-details
            density="comfortable"
            clearable
            @update:model-value="filterFAQs"
          ></v-text-field>
        </v-col>
      </v-row>

      <!-- Category Navigation Tabs -->
      <v-row class="mb-0">
        <v-col cols="12">
          <v-tabs
            v-model="activeTab"
            color="primary"
            align-tabs="center"
            grow
            show-arrows
            center-active
            slider-color="primary"
          >
            <v-tab
              v-for="category in faqConfig.categories"
              :key="category.id"
              :value="category.id"
              class="tab-item"
            >
              <v-icon start :icon="category.icon"></v-icon>
              {{ category.title }}
            </v-tab>
          </v-tabs>
        </v-col>
      </v-row>

      <!-- Tab Content / Category Sections -->
      <v-row class="mt-0 pt-0">
        <v-col cols="12">
          <v-window v-model="activeTab">
            <v-window-item
              v-for="category in faqConfig.categories"
              :key="category.id"
              :value="category.id"
            >
              <v-card
                variant="flat"
                :class="`border-l-5 border-${category.color}`"
                class="pa-2 mb-6"
              >
                <v-card-text class="pa-4">
                  <v-expansion-panels variant="accordion" class="faq-panels">
                    <v-expansion-panel
                      v-for="(item, index) in visibleSections(category)"
                      :key="index"
                      :value="index"
                      :title="item.header"
                      class="mb-2"
                      rounded="lg"
                      elevation="1"
                    >
                      <template v-slot:title>
                        <div class="d-flex align-center">
                          <v-icon :color="category.color" size="small" class="mr-2">mdi-help-circle</v-icon>
                          <h3 class="text-subtitle-1 font-weight-medium">{{ item.header }}</h3>
                        </div>
                      </template>
                      <v-expansion-panel-text>
                        <div class="pa-2">
                          <!-- Content with markdown support -->
                          <div class="text-body-1 mb-4" v-html="formatContent(item.content)"></div>
                          
                          <!-- Links section -->
                          <div v-if="item.links && item.links.length > 0" class="d-flex flex-wrap gap-2 mt-3">
                            <v-btn
                              v-for="(link, linkIndex) in item.links"
                              :key="linkIndex"
                              :prepend-icon="link.icon || 'mdi-link'"
                              :to="!link.external ? link.url : undefined"
                              :href="link.external ? link.url : undefined"
                              :target="link.external ? '_blank' : undefined"
                              :rel="link.external ? 'noopener noreferrer' : undefined"
                              size="small"
                              :color="category.color"
                              variant="outlined"
                              class="mr-2 mb-2"
                            >
                              {{ link.title }}
                              <v-icon v-if="link.external" size="x-small" class="ml-1">mdi-open-in-new</v-icon>
                            </v-btn>
                          </div>
                        </div>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-card-text>
              </v-card>
            </v-window-item>
          </v-window>
        </v-col>
      </v-row>

      <!-- No Results Message -->
      <v-row v-if="searchActive && allVisibleSections.length === 0" justify="center">
        <v-col cols="12" md="8" class="text-center">
          <v-alert type="info" variant="tonal" class="mb-4">
            <template v-slot:prepend>
              <v-icon icon="mdi-information-outline"></v-icon>
            </template>
            <div class="text-body-1">No FAQ items match your search query. Try a different search term.</div>
          </v-alert>
          <v-btn color="primary" @click="clearSearch">Clear Search</v-btn>
        </v-col>
      </v-row>

      <v-divider class="my-6"></v-divider>
      
      <!-- Help section with tour button -->
      <v-row justify="center" class="mb-4">
        <v-col cols="12" md="8" class="text-center">
          <v-card variant="outlined" rounded="lg" class="pa-4">
            <v-card-title class="font-weight-bold">Need more help?</v-card-title>
            <v-card-text>
              <p class="text-body-1 mb-4">If you need help navigating the application, you can restart the guided tour:</p>
              <RestartTourButton />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </ContentContainer>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import ContentContainer from '@/components/ContentContainer.vue';
import RestartTourButton from '@/components/RestartTourButton.vue';
import faqConfig from '@/config/faqPageConfig.json';

// Reactive state
const activeTab = ref(faqConfig.categories[0]?.id || '');
const searchQuery = ref('');
const searchActive = computed(() => searchQuery.value.trim() !== '');

// Filter questions based on search query
const filterFAQs = () => {
  // If search is empty, show all sections
  if (!searchActive.value) return;
  
  // If the first category doesn't have any visible sections after filtering,
  // switch to the first category that does
  if (visibleSections(faqConfig.categories[0]).length === 0) {
    for (const category of faqConfig.categories) {
      if (visibleSections(category).length > 0) {
        activeTab.value = category.id;
        break;
      }
    }
  }
};

// Get all visible sections across all categories
const allVisibleSections = computed(() => {
  let sections = [];
  faqConfig.categories.forEach(category => {
    sections = [...sections, ...visibleSections(category)];
  });
  return sections;
});

// Function to filter sections based on search query
const visibleSections = (category) => {
  if (!searchActive.value) return category.sections;
  
  const query = searchQuery.value.toLowerCase().trim();
  return category.sections.filter(section => {
    return (
      section.header.toLowerCase().includes(query) ||
      section.content.toLowerCase().includes(query) ||
      (section.links && section.links.some(link => link.title.toLowerCase().includes(query)))
    );
  });
};

// Clear search
const clearSearch = () => {
  searchQuery.value = '';
};

// Format content with markdown-like support
const formatContent = (content) => {
  if (!content) return '';
  
  // Replace line breaks with <br>
  let formatted = content.replace(/\n\n/g, '<br><br>');
  
  // Bold text
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic text
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Code
  formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
  
  return formatted;
};

// Set initial active tab on mount
onMounted(() => {
  activeTab.value = faqConfig.categories[0]?.id || '';
});
</script>

<style scoped>
.faq-panels :deep(.v-expansion-panel-title) {
  min-height: 48px;
  padding: 12px 16px;
}

.faq-panels :deep(.v-expansion-panel-text__wrapper) {
  padding: 0 16px 16px;
}

.search-highlight {
  background-color: rgba(var(--v-theme-primary), 0.15);
  padding: 0 2px;
  border-radius: 2px;
}

.tab-item {
  text-transform: none;
  font-weight: 500;
}

/* Custom border classes */
.border-l-5 {
  border-left-width: 5px;
  border-left-style: solid;
}

.border-primary {
  border-left-color: rgb(var(--v-theme-primary));
}

.border-secondary {
  border-left-color: rgb(var(--v-theme-secondary));
}

.border-info {
  border-left-color: rgb(var(--v-theme-info));
}

.border-warning {
  border-left-color: rgb(var(--v-theme-warning));
}

.border-success {
  border-left-color: rgb(var(--v-theme-success));
}

.gap-2 {
  gap: 8px;
}
</style>
