import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchLastCommit } from '@/api/github.js';

afterEach(() => vi.unstubAllGlobals());

describe('GitHub commit lookup', () => {
  it('requests the latest commit and returns its short revision', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ sha: 'abc1234def56789' }],
    });
    vi.stubGlobal('fetch', fetch);
    expect(await fetchLastCommit('owner/repo')).toBe('abc1234');
    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/owner/repo/commits?per_page=1',
    );
  });

  it('reports an empty repository without attempting to read a missing commit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => [] }),
    );
    expect(await fetchLastCommit('owner/repo')).toBe('N/A');
  });

  it('rejects a failed request instead of displaying a revision', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    await expect(fetchLastCommit('owner/repo')).rejects.toThrow(
      'Network response',
    );
  });
});
