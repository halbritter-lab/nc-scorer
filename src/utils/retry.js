// src/utils/retry.js

/**
 * Retry a promise-returning function with exponential backoff
 *
 * @param {Function} fn - Function that returns a promise
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 300)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 3000)
 * @param {Function} options.shouldRetry - Function to determine if error should trigger retry (default: retry on network errors and 5xx)
 * @param {Function} options.onRetry - Optional callback for retry attempts
 * @param {Function} options.onSuccess - Optional callback when the function succeeds after retries
 * @param {Object} options.retryState - Optional external state object to track retries across components
 * @returns {Promise} - The result of the function call
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 300,
    maxDelay = 3000,
    shouldRetry = (error) => {
      // Handle network errors (no response object)
      if (!error.response) {
        const isNetworkError = 
          error.message.includes('network') ||
          error.message.includes('timeout') ||
          error.message.includes('Failed to fetch') ||
          error.code === 'ECONNABORTED' ||
          error.code === 'ECONNREFUSED' ||
          error.code === 'ECONNRESET' ||
          error.message.includes('Network Error') ||
          error instanceof TypeError;
        
        if (isNetworkError) {
          console.debug('Retrying network error:', error.message);
          return true;
        }
        return false;
      }

      // Handle HTTP status code based errors
      const status = error.response.status;
      
      // Server errors (5xx) and rate limiting (429)
      if ((status >= 500 && status < 600) || status === 429 || status === 504) {
        console.debug(`Retrying error with status code ${status}:`, error.message);
        return true;
      }
      
      // Client errors (4xx) - don't retry
      if (status >= 400 && status < 500) {
        console.debug(`Not retrying client error (${status}):`, error.message);
        return false;
      }
      
      // Default to not retrying for any other cases
      return false;
    },
    onRetry = (error, attempt) => {
      console.warn(`Retry attempt ${attempt} after error: ${error.message}`);
    },
    onSuccess = null,
    retryState = { attempts: 0, lastError: null },
  } = options;

  // Initialize attempt counter if not already set
  retryState.attempts = retryState.attempts || 0;

  while (true) {
    try {
      const result = await fn();

      // Call onSuccess if we had previous attempts and finally succeeded
      if (retryState.attempts > 0 && onSuccess) {
        onSuccess(retryState.attempts);
      }

      return result;
    } catch (error) {
      retryState.attempts++;
      retryState.lastError = error;

      // If we've reached max retries or the error shouldn't be retried, throw
      if (retryState.attempts >= maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff, but cap at maxDelay
      const delay = Math.min(initialDelay * Math.pow(2, retryState.attempts - 1), maxDelay);

      // Call the onRetry callback
      onRetry(error, retryState.attempts);

      // Wait for the calculated delay
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Create a reusable retry state object that can be shared between components
 * to track retry information for visual feedback.
 *
 * @returns {Object} A retry state object with reactive properties
 */
export function createRetryState() {
  return {
    attempts: 0,
    lastError: null,
    inProgress: false,
    component: '',
    reset() {
      this.attempts = 0;
      this.lastError = null;
      this.inProgress = false;
      this.component = '';
    },
  };
}
