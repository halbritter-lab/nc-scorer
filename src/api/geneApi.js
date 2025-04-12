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
export async function fetchGeneDetails(symbol) {
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
      onRetry: (error, attempt) => {
        console.warn(`Retry attempt ${attempt} for gene ${symbol} after error: ${error.message}`);
      },
    }
  );
}
