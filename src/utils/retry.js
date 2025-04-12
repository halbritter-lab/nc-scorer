// src/utils/retry.js

/**
 * Retry a promise-returning function with exponential backoff
 *
 * This utility provides a robust way to retry failed API calls with exponential backoff.
 * It categorizes errors and only retries on transient issues that could resolve with time.
 * @param {Function} fn - Function that returns a promise
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 4)
 * @param {number} options.initialDelay - Initial delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 16000)
 * @param {Function} options.shouldRetry - Override default retry logic (receives error object, returns boolean)
 * @param {Object} options.errorConfig - Configuration of error statuses by type (overrides defaults)
 * @param {Function} options.onRetry - Optional callback for retry attempts (receives error, attempt)
 * @param {Function} options.onSuccess - Optional callback when the function succeeds after retries
 * @param {Object} options.retryState - Optional external state object to track retries across components
 * @returns {Promise} - The result of the function call
 */
export async function retryWithBackoff(fn, options = {}) {
  // Default error configuration - can be overridden by options.errorConfig
  const defaultErrorConfig = {
    // Network error patterns
    networkErrorPatterns: ['network', 'timeout', 'Failed to fetch', 'Network Error'],
    // Network error codes
    networkErrorCodes: ['ECONNABORTED', 'ECONNREFUSED', 'ECONNRESET'],
    // Always retry these status codes
    retryableStatusCodes: [429, 500, 501, 502, 503, 504],
    // Never retry these status codes
    nonRetryableStatusCodes: [400, 401, 403, 404, 405, 422],
  };
  
  const {
    maxRetries = 4, // Cap at maximum 4 retries
    initialDelay = 1000, // Start with 1 second
    maxDelay = 16000, // Max delay of 16 seconds (2^4 * 1000)
    errorConfig = {},
    shouldRetry = null, // If null, use the default logic
    onRetry = null,
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

      // If we've reached max retries, throw
      if (retryState.attempts >= maxRetries) {
        throw error;
      }

      // Determine if we should retry based on the error
      let shouldRetryError = false;

      // Use override function if provided
      if (typeof shouldRetry === 'function') {
        shouldRetryError = shouldRetry(error);
      } else {
        // Use default retry logic
        shouldRetryError = determineRetryBehavior(error, { ...defaultErrorConfig, ...errorConfig });
      }

      // If error isn't retryable, throw
      if (!shouldRetryError) {
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
 * Determines if an error should be retried based on its type and the error configuration
 *
 * @param {Error} error - The error to examine
 * @param {Object} config - The error configuration object
 * @returns {boolean} - Whether to retry the error
 */
function determineRetryBehavior(error, config) {
  // Extract configurations
  const { networkErrorPatterns, networkErrorCodes, retryableStatusCodes, nonRetryableStatusCodes } = config;

  // Handle network errors (no response object)
  if (!error.response) {
    // Check for network error patterns in message
    const hasNetworkErrorPattern = networkErrorPatterns.some(
      (pattern) => error.message && error.message.includes(pattern)
    );

    // Check for specific error codes
    const hasNetworkErrorCode = networkErrorCodes.some((code) => error.code === code);

    // Check for TypeError (often indicates network issues)
    const isTypeError = error instanceof TypeError;

    const isNetworkError = hasNetworkErrorPattern || hasNetworkErrorCode || isTypeError;
    if (isNetworkError) {
      return true;
    }

    return false;
  }

  // Handle HTTP status code based errors
  const status = error.response.status;

  // Check if status is in the retryable list
  if (retryableStatusCodes.includes(status)) {
    return true;
  }

  // Check if status is in the non-retryable list
  if (nonRetryableStatusCodes.includes(status)) {
    return false;
  }

  // For status codes not explicitly configured, use ranges
  if (status >= 500 && status < 600) {
    return true;
  }

  if (status >= 400 && status < 500) {
    return false;
  }

  // Default to not retrying for any other cases
  return false;
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
