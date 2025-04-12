// src/api/geneApi.js
import axios from 'axios';
import geneApiConfig from '@/config/geneApiConfig.json';
import { retryWithBackoff } from '@/utils/retry.js';

/**
 * Fetch the index of gene symbols.
 * @returns {Promise<Array>} The symbols index.
 */
export async function fetchSymbolsIndex() {
  return retryWithBackoff(async () => {
    const response = await axios.get(geneApiConfig.symbolsIndexUrl);
    return response.data;
  });
}

/**
 * Fetch detailed gene data for a given symbol.
 * @param {string} symbol - The gene symbol.
 * @returns {Promise<Object>} The gene data.
 */
export async function fetchGeneDetails(symbol, options = {}) {
  const { retryState, onRetry, onSuccess } = options;
  
  return retryWithBackoff(
    async () => {
      // Construct the URL using the base URL from config and the symbol.
      const url = `${geneApiConfig.geneDetailsBaseUrl}${symbol}.json`;
      const response = await axios.get(url);
      return response.data;
    },
    {
      maxRetries: 3,
      initialDelay: 500,
      maxDelay: 5000,
      // Use our refined shouldRetry logic from the utility
      // This will automatically handle network errors and specific HTTP status codes
      shouldRetry: (error) => {
        // Don't retry 404 errors for genes - likely the gene symbol doesn't exist
        if (error.response && error.response.status === 404) {
          console.debug(`Gene symbol '${symbol}' not found (404)`);
          return false;
        }
        // Default retry logic will handle other error types
        return undefined; // Use the default logic from retry.js
      },
      onRetry: (error, attempt) => {
        console.warn(`Retry attempt ${attempt} for gene ${symbol} after error: ${error.message}`);
        if (onRetry) onRetry(error, attempt);
      },
      onSuccess: (attempts) => {
        if (attempts > 0) {
          console.info(`Successfully fetched gene ${symbol} after ${attempts} retries`);
        }
        if (onSuccess) onSuccess(attempts);
      },
      retryState, // Pass through retry state if provided
    }
  );
}
