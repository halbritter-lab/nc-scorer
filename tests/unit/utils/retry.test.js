import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRetryState, retryWithBackoff } from '@/utils/retry.js';

afterEach(() => vi.useRealTimers());

describe('retryWithBackoff', () => {
  it.each([400, 418, 302])('does not retry HTTP status %i', async (status) => {
    let calls = 0;
    const error = { response: { status } };
    await expect(
      retryWithBackoff(async () => {
        calls++;
        throw error;
      }),
    ).rejects.toBe(error);
    expect(calls).toBe(1);
  });

  it.each([
    { response: { status: 429 } },
    { response: { status: 599 } },
    { code: 'ECONNRESET' },
  ])('recovers recognized transient errors: %j', async (error) => {
    vi.useFakeTimers();
    let calls = 0;
    await Promise.all([
      expect(
        retryWithBackoff(async () => {
          if (++calls === 1) throw error;
          return 'ready';
        }),
      ).resolves.toBe('ready'),
      vi.runAllTimersAsync(),
    ]);
    expect(calls).toBe(2);
  });

  it('caps exponential delays and reports recovery after the final retry', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const callsAt = [];
    const recovered = vi.fn();
    await Promise.all([
      expect(
        retryWithBackoff(
          async () => {
            callsAt.push(Date.now());
            if (callsAt.length <= 3) throw new Error('timeout');
            return 'ready';
          },
          { initialDelay: 100, maxDelay: 150, onSuccess: recovered },
        ),
      ).resolves.toBe('ready'),
      vi.runAllTimersAsync(),
    ]);
    expect(callsAt).toEqual([0, 100, 250, 400]);
    expect(recovered).toHaveBeenCalledWith(3);
  });

  it('stops at the retry limit and retains the final failure until reset', async () => {
    vi.useFakeTimers();
    const state = createRetryState();
    state.component = 'VariantCard';
    state.inProgress = true;
    const error = new Error('custom transient failure');
    let calls = 0;
    await Promise.all([
      expect(
        retryWithBackoff(
          async () => {
            calls++;
            throw error;
          },
          {
            maxRetries: 1,
            shouldRetry: () => true,
            retryState: state,
          },
        ),
      ).rejects.toBe(error),
      vi.runAllTimersAsync(),
    ]);
    expect(calls).toBe(2);
    expect(state.lastError).toBe(error);
    expect(state.attempts).toBe(2);
    state.reset();
    expect(state).toMatchObject({
      attempts: 0,
      lastError: null,
      inProgress: false,
      component: '',
    });
  });
  it('does not repeat a successful HTTP request after a local processing TypeError', async () => {
    let calls = 0;
    const error = new TypeError(
      'consequence_terms_variant.map is not a function',
    );
    await expect(
      retryWithBackoff(
        async () => {
          calls++;
          throw error;
        },
        { initialDelay: 0 },
      ),
    ).rejects.toBe(error);
    expect(calls).toBe(1);
  });
  it('allows the configured number of retries after the initial request', async () => {
    vi.useFakeTimers();
    let calls = 0;
    const result = retryWithBackoff(
      async () => {
        if (++calls <= 2) throw new TypeError('Failed to fetch');
        return 'recovered';
      },
      { maxRetries: 2 },
    );
    await Promise.all([
      expect(result).resolves.toBe('recovered'),
      vi.runAllTimersAsync(),
    ]);
    expect(calls).toBe(3);
  });
  it('recovers from a transient failure without optional callbacks', async () => {
    vi.useFakeTimers();
    let calls = 0;
    const result = retryWithBackoff(async () => {
      if (++calls === 1) throw new TypeError('Failed to fetch');
      return 'recovered';
    });
    const assertion = expect(result).resolves.toBe('recovered');
    await vi.runAllTimersAsync();
    await assertion;
    expect(calls).toBe(2);
  });

  it('uses default retry policy when a custom policy returns undefined', async () => {
    vi.useFakeTimers();
    let calls = 0;
    const result = retryWithBackoff(
      async () => {
        if (++calls === 1) throw { response: { status: 503 } };
        return 'recovered';
      },
      { shouldRetry: () => undefined, onRetry: () => {} },
    );
    const assertion = expect(result).resolves.toBe('recovered');
    await vi.runAllTimersAsync();
    await assertion;
  });

  it('starts a new retry budget when reusing feedback state', async () => {
    vi.useFakeTimers();
    let calls = 0;
    const retryState = {
      attempts: 3,
      lastError: new Error('previous request'),
    };
    const result = retryWithBackoff(
      async () => {
        if (++calls === 1) throw new TypeError('Failed to fetch');
        return 'new request';
      },
      { retryState, maxRetries: 3, onRetry: () => {} },
    );
    const assertion = expect(result).resolves.toBe('new request');
    await vi.runAllTimersAsync();
    await assertion;
    expect(retryState.attempts).toBe(1);
  });

  it('does not retry an explicitly rejected error', async () => {
    let calls = 0;
    const error = new Error('invalid input');
    await expect(
      retryWithBackoff(
        async () => {
          calls++;
          throw error;
        },
        { shouldRetry: () => false },
      ),
    ).rejects.toBe(error);
    expect(calls).toBe(1);
  });
});
