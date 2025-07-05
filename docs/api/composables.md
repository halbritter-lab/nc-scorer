# Composables

Vue 3 composition functions that provide reusable logic across the application.

## API Cache

### `useApiCache()`

Client-side caching for API responses using sessionStorage.

**Features:**
- TTL-based expiration
- Cache statistics
- User preference integration
- Maximum 50 entries per type

**Functions:**
```javascript
import { useApiCache } from '@/composables/useApiCache';

const { 
  generateCacheKey,
  getCachedItem,
  setCachedItem,
  clearCache,
  stats,
  cacheEnabled
} = useApiCache();

// Generate unique key
const key = generateCacheKey('variant', 'NM_001009944', { assembly: 'GRCh38' });

// Get cached data
const cached = getCachedItem(key);

// Store data
setCachedItem(key, data, 3600000); // 1 hour TTL

// Clear specific type or all
clearCache('variant');
clearCache(); // Clear all

// Access statistics
console.log(stats.value.hitRate); // Cache hit rate percentage
```

## Notifications

### `useNotifications()`

Unified notification system via Vuetify snackbars.

**Functions:**
```javascript
import { useNotifications } from '@/composables/useNotifications';

const {
  notify,
  notifyError,
  notifyWarning,
  notifySuccess,
  notifyRetry,
  closeNotification
} = useNotifications();

// Show notifications
notifySuccess('Operation completed');
notifyError('Failed to load data');
notifyWarning('Cache disabled');
notifyRetry('Retrying...', 2, 'Connection timeout');

// General notification with options
notify('Custom message', {
  color: 'blue',
  timeout: 5000
});
```

## Retry State

### `useRetryState()`

Manages retry state for API calls.

**Functions:**
```javascript
import { useRetryState } from '@/composables/useRetryState';

const {
  retryStates,
  anyRetryInProgress,
  getRetryState,
  updateRetryState,
  resetRetryState
} = useRetryState();

// Update retry state
updateRetryState('gene-fetch', {
  isRetrying: true,
  attempt: 1,
  lastError: 'Network error'
});

// Check if any retry in progress
if (anyRetryInProgress.value) {
  // Show loading indicator
}

// Reset state
resetRetryState('gene-fetch');
```

## Theme Toggle

### `useThemeToggle()`

Manages light/dark theme switching.

**Functions:**
```javascript
import { useThemeToggle } from '@/composables/useThemeToggle';

const { darkTheme, toggleTheme, setTheme } = useThemeToggle();

// Toggle theme
toggleTheme();

// Set specific theme
setTheme(true); // Dark mode
setTheme(false); // Light mode

// Check current theme
if (darkTheme.value) {
  // Dark mode active
}
```

## Tour

### `useTour()`

Interactive onboarding tour using Shepherd.js.

**Functions:**
```javascript
import { useTour } from '@/composables/useTour';

const {
  tour,
  isTourActive,
  startTour,
  cancelTour,
  completeTour,
  shouldShowTour,
  restartTour
} = useTour();

// Start tour for new users
if (shouldShowTour()) {
  startTour();
}

// Control tour
cancelTour(); // Mark as skipped
completeTour(); // Mark as completed
restartTour(); // Reset and restart
```

## Disclaimer

### `useDisclaimer()`

Manages disclaimer dialog state.

**Functions:**
```javascript
import { useDisclaimer } from '@/composables/useDisclaimer';

const {
  hasAcceptedDisclaimer,
  showDisclaimer,
  acceptDisclaimer,
  resetDisclaimer
} = useDisclaimer();

// Check if disclaimer accepted
if (!hasAcceptedDisclaimer.value) {
  showDisclaimer.value = true;
}

// Accept disclaimer
acceptDisclaimer();
```