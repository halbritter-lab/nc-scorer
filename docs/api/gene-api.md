# Gene API

The Gene API module (`src/api/geneApi.js`) provides functions for fetching gene-related data with built-in caching and retry mechanisms.

## Functions

### `fetchGeneSearchIndices(options)`

Fetches gene symbol and HGNC indices for search functionality.

**Parameters:**
- `options` (Object, optional)
  - `skipCache` (boolean) - Bypass cache if true
  - `apiCache` (Object) - API cache instance

**Returns:** `Promise<Object>`
```javascript
{
  symbolsIndex: string[],      // Array of gene symbols
  hgncIndex: string[],        // Array of HGNC IDs
  hgncToSymbolMap: Object,    // HGNC ID to symbol mapping
  combinedItems: Array<{      // Combined search items
    symbol: string,
    hgncId: string,
    display: string
  }>
}
```

**Usage:**
```javascript
import { fetchGeneSearchIndices } from '@/api/geneApi';
import { useApiCache } from '@/composables/useApiCache';

const apiCache = useApiCache();
const indices = await fetchGeneSearchIndices({ apiCache });
```

### `fetchAllGeneScores(options)`

Fetches comprehensive gene scores for all genes.

**Parameters:**
- `options` (Object, optional)
  - `retryState` (Object) - Retry tracking state
  - `onRetry` (Function) - Callback: `(error, attempt) => void`
  - `onSuccess` (Function) - Callback: `(attempts) => void`
  - `skipCache` (boolean) - Bypass cache
  - `cacheTTL` (number) - Cache TTL in ms (default: 12 hours)
  - `apiCache` (Object) - API cache instance

**Returns:** `Promise<Object>`
```javascript
{
  data: Object,          // Gene scores data
  source: {
    fromCache: boolean,
    cachedAt?: number    // Timestamp if from cache
  }
}
```

### `fetchGeneDetails(symbol, options)`

Fetches detailed information for a specific gene.

**Parameters:**
- `symbol` (string, required) - Gene symbol
- `options` (Object, optional) - Same as `fetchAllGeneScores`

**Returns:** `Promise<Object>`
```javascript
{
  data: Object,          // Gene details
  source: {
    fromCache: boolean
  }
}
```

**Note:** Does not retry on 404 errors (gene not found).

## Configuration

### Cache TTL Defaults
- Search indices: 24 hours
- Gene scores: 12 hours
- Gene details: 30 minutes

### Retry Configuration
All functions use exponential backoff with:
- Max attempts: 3
- Initial delay: 1000ms
- Max delay: 10000ms