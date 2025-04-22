<template>
  <v-menu>
    <template v-slot:activator="{ props }">
      <v-btn
        color="secondary"
        prepend-icon="mdi-account-group"
        class="ml-2"
        v-bind="props"
        :disabled="!isActive"
        size="small"
        variant="tonal"
        :title="platformsConfig.uiText.buttonTooltip"
      >
        {{ platformsConfig.uiText.menuTitle }}
      </v-btn>
    </template>
    
    <v-list density="compact" width="320">
      <v-list-subheader>Connect with researchers studying:</v-list-subheader>
      
      <v-list-item
        v-for="platform in platformsConfig.primaryPlatforms"
        :key="platform.id"
        :title="platform.name"
        :subtitle="platform.description"
        :prepend-icon="platform.icon"
        :href="getPlatformUrl(platform)"
        target="_blank"
        rel="noopener noreferrer"
        link
      >
        <template v-slot:append>
          <v-icon size="small">mdi-open-in-new</v-icon>
        </template>
      </v-list-item>
      
      <v-divider class="my-2"></v-divider>
      
      <v-list-subheader>Additional platforms:</v-list-subheader>
      
      <v-list-item
        v-for="platform in platformsConfig.additionalPlatforms"
        :key="platform.id"
        :title="platform.name"
        :subtitle="platform.description"
        :prepend-icon="platform.icon"
        :href="platform.url"
        target="_blank"
        rel="noopener noreferrer"
        link
      >
        <template v-slot:append>
          <v-icon size="small">mdi-open-in-new</v-icon>
        </template>
      </v-list-item>
      
      <v-divider class="my-2"></v-divider>
      
      <v-list-item
        class="text-caption text-center"
        :title="`Learn more about collaboration platforms`"
        href="https://github.com/halbritter-lab/nc-scorer/wiki/Collaboration-Platforms"
        target="_blank"
        rel="noopener noreferrer"
        link
      >
        <template v-slot:prepend>
          <v-icon size="small">mdi-information-outline</v-icon>
        </template>
        <template v-slot:append>
          <v-icon size="small">mdi-open-in-new</v-icon>
        </template>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
import { computed, watch } from 'vue';
import { logService } from '@/services/logService';
import { collaborationPlatformsConfig } from '@/config/collaborationPlatformsConfig';

export default {
  name: 'CollaborationLinks',
  
  props: {
    /**
     * Gene symbol to use for platform links
     */
    geneSymbol: {
      type: String,
      default: '',
    },
    
    /**
     * Variant input string (optional)
     */
    variantInput: {
      type: String,
      default: '',
    },
  },
  
  setup(props) {
    // Make config available to the template
    const platformsConfig = collaborationPlatformsConfig;
    
    // Reactive ref to track if button should be active
    const isActive = computed(() => {
      // Debug the value to help diagnose issues
      logService.debug('CollaborationLinks - geneSymbol computed check:', props.geneSymbol);
      return !!props.geneSymbol && typeof props.geneSymbol === 'string' && props.geneSymbol.trim().length > 0;
    });
    
    // Watch for changes to geneSymbol prop for debugging
    watch(() => props.geneSymbol, (newValue) => {
      logService.debug('CollaborationLinks - geneSymbol changed:', newValue);
    });
    
    /**
     * Generate platform-specific URL with gene/variant parameters if supported
     * @param {Object} platform - Platform configuration object
     * @returns {String} - URL with parameters if applicable
     */
    const getPlatformUrl = (platform) => {
      // Skip parameter addition if gene symbol is not available
      if (!props.geneSymbol) {
        return platform.url;
      }
      
      try {
        // Handle different URL parameter formats for each platform
        if (platform.id === 'genematcher' && platform.geneParam) {
          // GeneMatcher accepts a gene parameter
          const baseUrl = platform.url.endsWith('/') 
            ? platform.url 
            : `${platform.url}/`;
            
          return `${baseUrl}?${platform.geneParam}=${props.geneSymbol}`;
        }
        
        // Default to the basic URL if no special handling is needed
        return platform.url;
      } catch (error) {
        logService.error('Error generating platform URL:', error);
        return platform.url;
      }
    };
    
    return {
      platformsConfig,
      getPlatformUrl,
      isActive,
    };
  },
};
</script>

<style scoped>
.platform-link {
  text-decoration: none;
}
</style>
