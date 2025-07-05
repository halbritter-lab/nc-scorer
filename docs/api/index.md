# API Reference

This section provides technical documentation for developers working with NC-Scorer.

## Overview

NC-Scorer is organized into several key modules:

- **[Gene API](./gene-api)** - Gene lookup and data fetching
- **[Variant API](./variant-api)** - Variant annotation services
- **[Composables](./composables)** - Reusable Vue composition functions
- **[Services](./services)** - Core application services

## Architecture Principles

### API Integration
All external API calls follow these patterns:
- Exponential backoff retry logic
- Client-side caching with TTL
- Error handling with user notifications
- Loading state management

### State Management
- **Settings**: Persistent preferences in localStorage
- **UI State**: Transient state in Pinia stores
- **Cache**: SessionStorage with configurable TTL

### Configuration
- JSON-based configuration files
- Hot-reloadable in development
- Type-safe imports

## Common Patterns

### API Calls with Retry
```javascript
import { retryWithBackoff } from '@/utils/retry';

const data = await retryWithBackoff(
  async () => await axios.get(url),
  { maxAttempts: 3, initialDelay: 1000 }
);
```

### Caching
```javascript
import { useApiCache } from '@/composables/useApiCache';

const { getCachedItem, setCachedItem } = useApiCache();
const cached = getCachedItem(key);
if (!cached) {
  const data = await fetchData();
  setCachedItem(key, data, ttl);
}
```

### Logging
```javascript
import { logService } from '@/services/logService';

logService.info('Operation completed', { details });
logService.error('Operation failed', error);
```