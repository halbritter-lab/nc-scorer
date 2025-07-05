# Variant API

The Variant API module (`src/api/variantApi.js`) provides variant analysis using the variant-linker library with Ensembl integration.

## Functions

### `queryVariant(variantInput, options)`

Analyzes genetic variants with comprehensive annotations.

**Parameters:**
- `variantInput` (string|string[], required) - Single variant or array (max 200)
- `options` (Object, optional)
  - `recoderOptions` (Object) - Variant Recoder options
    - Default: `{ vcf_string: '1' }`
  - `vepOptions` (Object) - VEP annotation options
    - Default: `{ CADD: '1', hgvs: '1', merged: '1', mane: '1' }`
  - `skipCache` (boolean) - Bypass cache
  - `cacheTTL` (number) - Cache TTL in ms (default: 30 min)
  - `output` (string) - Format: 'JSON', 'CSV', 'TSV', 'VCF'
  - `filter` (string) - Filtering criteria
  - `assembly` (string) - 'GRCh37' or 'GRCh38' (default)
  - `onRetry` (Function) - Retry callback
  - `onSuccess` (Function) - Success callback
  - `apiCache` (Object) - API cache instance

**Returns:** `Promise<Object|string>`
- JSON format: Object with `data` and `source`
- Other formats: String representation

**Usage:**
```javascript
import { queryVariant } from '@/api/variantApi';
import { useApiCache } from '@/composables/useApiCache';

const apiCache = useApiCache();

// Single variant
const result = await queryVariant('NM_001009944.3:c.11798G>A', {
  apiCache,
  assembly: 'GRCh38',
  output: 'JSON'
});

// Batch processing
const variants = [
  'chr16:2138253:G:A',
  'rs121913240'
];
const results = await queryVariant(variants, {
  output: 'CSV',
  skipCache: true  // Cache disabled for batch
});
```

## Supported Formats

### Input Formats
- **HGVS**: `NM_001009944.3:c.11798G>A`
- **VCF**: `chr16:2138253:G:A`
- **rsID**: `rs121913240`

### Output Formats
- **JSON**: Structured data with annotations
- **CSV/TSV**: Spreadsheet-compatible
- **VCF**: Standard variant call format

## Error Handling

### Non-retryable Errors
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Unprocessable Entity

### Retryable Errors
- 429: Too Many Requests
- 500+: Server errors

## Limitations

- Maximum 200 variants per batch
- Cache disabled for batch requests
- Assembly-specific Ensembl endpoints