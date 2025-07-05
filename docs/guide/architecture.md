# Architecture

NC-Scorer is built with Vue 3, Vuetify 3, and Vite, following modern web development best practices.

## Technology Stack

- **Frontend Framework**: Vue 3 with Composition API
- **UI Library**: Vuetify 3 (Material Design)
- **Build Tool**: Vite
- **State Management**: Pinia
- **HTTP Client**: Axios
- **Routing**: Vue Router

## Directory Structure

### `/src/api/`
API service modules with built-in caching:
- `geneApi.js` - Gene lookup and HGNC data
- `variantApi.js` - Variant annotation services
- `github.js` - Version checking

### `/src/components/`
Reusable Vue components:
- Layout: `AppBar`, `FooterBar`, `ContentContainer`
- Domain: `GeneCard`, `VariantCard`, `CombinedScoreCard`
- Search: `GeneSearch`, `VariantSearch`

### `/src/views/`
Page components mapped to routes:
- `SearchPage` - Main search interface
- `GeneView` - Gene details and variants
- `VariantView` - Single variant analysis
- `BatchView` - Batch processing

### `/src/composables/`
Shared composition functions:
- `useApiCache` - Caching with sessionStorage
- `useNotifications` - Toast notifications
- `useRetryState` - API retry tracking

### `/src/stores/`
Pinia state management:
- `settingsStore` - Persistent user preferences
- `uiStore` - Transient UI state

### `/src/config/`
JSON-based configuration:
- Scoring formulas
- UI configurations
- API endpoints

## Key Patterns

### API Integration
```javascript
// Retry with exponential backoff
const data = await retryWithBackoff(async () => {
  return await axios.get(url);
});

// Client-side caching
const { getCachedItem, setCachedItem } = useApiCache();
```

### State Management
```javascript
// Settings (persistent)
const settings = useSettingsStore();
settings.darkMode = true;

// UI state (transient)
const ui = useUIStore();
ui.notify('Success!');
```

### Configuration-Driven
- UI elements configured via JSON
- Scoring algorithms in configuration files
- Easy customization without code changes

## Performance

- **Code Splitting**: Dynamic imports for routes
- **Caching**: SessionStorage with TTL
- **Bundle Optimization**: Separate chunks for vendor libraries
- **Asset Optimization**: Content-hash naming