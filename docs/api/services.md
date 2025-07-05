# Services

Core application services that provide centralized functionality.

## Log Service

### Overview

The `logService` (`src/services/logService.js`) provides centralized logging with configurable levels and an in-app viewer.

### Log Levels

| Level | Value | Use Case |
|-------|-------|----------|
| DEBUG | 0 | Detailed debugging |
| INFO | 1 | General operations |
| WARN | 2 | Potential issues |
| ERROR | 3 | Critical failures |

### API

```javascript
import { logService, LogLevel } from '@/services/logService';

// Logging methods
logService.debug('Component loaded', { component: 'GeneView' });
logService.info('Search performed', { query: 'PKD1' });
logService.warn('API slow response', { duration: 5000 });
logService.error('Failed to fetch', error);

// Configuration
logService.setLevel(LogLevel.INFO); // Minimum level
logService.setConsoleEcho(true);    // Enable console output

// Management
logService.clear();                 // Clear all entries

// Properties
const logs = logService.entries.value;        // All log entries
const level = logService.currentLogLevel.value; // Current level
```

### Log Entry Structure

```javascript
{
  timestamp: '2024-01-01T12:00:00.000Z',
  level: 'INFO',
  displayMessage: 'Search performed',
  rawData: { query: 'PKD1' }
}
```

### Features

- **Maximum 50 entries** to prevent memory issues
- **Level persistence** in localStorage
- **Circular reference handling** for complex objects
- **Console echo control** (disabled by default)

## Export Utils

### Overview

The `exportUtils` module provides data export functionality for various formats.

### Functions

```javascript
import { 
  exportAsCSV,
  exportAsJSON,
  exportAsVCF,
  downloadFile
} from '@/utils/exportUtils';

// Export data
const csvContent = exportAsCSV(data, columns);
const jsonContent = exportAsJSON(data);
const vcfContent = exportAsVCF(variants);

// Trigger download
downloadFile(content, 'results.csv', 'text/csv');
```

## Validation Utils

### Overview

Input validation utilities for variant formats and data integrity.

### Functions

```javascript
import {
  isValidHGVS,
  isValidGenomicPosition,
  isValidRsID,
  detectVariantFormat
} from '@/utils/validationUtils';

// Validate formats
if (isValidHGVS('NM_001009944.3:c.11798G>A')) {
  // Process HGVS variant
}

// Detect format
const format = detectVariantFormat(variantString);
// Returns: 'hgvs', 'genomic', 'rsid', or null
```

## Retry Utils

### Overview

Exponential backoff retry logic for API calls.

### Functions

```javascript
import { retryWithBackoff } from '@/utils/retry';

// Basic usage
const data = await retryWithBackoff(
  async () => await fetch(url),
  {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  }
);

// With callbacks
const result = await retryWithBackoff(
  fetchFunction,
  {
    onRetry: (error, attempt) => {
      console.log(`Retry ${attempt}: ${error.message}`);
    },
    shouldRetry: (error) => {
      return error.status !== 404; // Don't retry 404s
    }
  }
);
```

## Scoring Utils

### Overview

Utilities for calculating NC scores and formatting results.

### Functions

```javascript
import {
  calculateNCS,
  formatScore,
  getScoreInterpretation
} from '@/utils/scoringUtils';

// Calculate score
const ncs = calculateNCS({
  geneScore: 0.8,
  variantScore: 0.9,
  inheritanceScore: 0.7
});

// Format for display
const formatted = formatScore(ncs); // "8.2"

// Get interpretation
const interpretation = getScoreInterpretation(ncs);
// Returns: { level: 'high', label: 'High Priority', color: 'red' }
```