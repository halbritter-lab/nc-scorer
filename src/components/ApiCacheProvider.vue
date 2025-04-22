<!-- src/components/ApiCacheProvider.vue -->
<script>
import { provide } from 'vue';
import { API_CACHE_KEY, useApiCache } from '@/composables/useApiCache';

export default {
  name: 'ApiCacheProvider',
  setup() {
    // Create a single instance of the API cache
    const apiCache = useApiCache();
    
    // Provide it to all child components
    provide(API_CACHE_KEY, apiCache);
    
    // No template needed, this is just a provider component
    return {};
  },
  // Render nothing - this is just a provider
  render() {
    return this.$slots.default ? this.$slots.default() : null;
  }
};
</script>
