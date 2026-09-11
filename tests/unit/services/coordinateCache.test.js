/* global localStorage */
import { beforeEach, describe, expect, it, vi } from 'vitest';

async function loadCache() {
  return (await import('@/services/coordinateCache.js')).coordinateCache;
}

beforeEach(() => vi.resetModules());

describe('coordinate cache', () => {
  it('uses the same canonical assembly for reads and writes', async () => {
    const cache = await loadCache();
    cache.set('NM_TEST:c.1A>G', '1-100-A-G', null, ' grch37 ');
    expect(cache.getVcf('NM_TEST:c.1A>G', 'GRCh37')).toBe('1-100-A-G');
    expect(cache.getVcf('NM_TEST:c.1A>G', 'grch37')).toBe('1-100-A-G');
    expect(cache.getVcf('NM_TEST:c.1A>G', 'GRCh38')).toBeNull();
    expect(cache.getVcf('NM_TEST:c.1A>G', null)).toBeNull();
    expect(cache.getVcf('NM_TEST:c.1A>G', 'GRCh36')).toBeNull();
  });

  it.each(['null', '[]', '12', '{bad json'])(
    'recovers from malformed persisted data %s',
    async (stored) => {
      localStorage.setItem('nc_scorer_coordinate_lru_cache_v2', stored);
      const cache = await loadCache();
      cache.set('new', '1-100-A-G');
      expect(cache.getVcf('new')).toBe('1-100-A-G');
    },
  );

  it('ignores persisted entries with invalid coordinates, assembly, key, or gene shape', async () => {
    localStorage.setItem(
      'nc_scorer_coordinate_lru_cache_v2',
      JSON.stringify({
        'GRCH38:null': null,
        'GRCH38:coordinate': { vcf: {}, assembly: 'GRCH38', gene: null },
        'GRCH38:format': { vcf: 'invalid', assembly: 'GRCH38', gene: null },
        'GRCH38:assembly': { vcf: '1-100-A-G', assembly: 'GRCH36', gene: null },
        'GRCH37:mismatch': { vcf: '1-100-A-G', assembly: 'GRCH38', gene: null },
        'GRCH38:gene': { vcf: '1-100-A-G', assembly: 'GRCH38', gene: {} },
        'GRCH38:valid': { vcf: '1-100-A-G', assembly: 'GRCH38', gene: 'TEST' },
      }),
    );
    const cache = await loadCache();
    expect(cache.getGeneSymbol('valid')).toBe('TEST');
    expect(cache.memoryCache.size).toBe(1);
  });

  it.each([
    [[' TEST ', 'OTHER'], 'TEST'],
    [[{}], null],
    [{ symbol: ' TEST ' }, 'TEST'],
    [[], null],
    [{ symbol: 12 }, null],
    [' ', null],
  ])('normalizes supported API gene payloads %j', async (gene, expected) => {
    const cache = await loadCache();
    cache.set(' NM_TEST:c.1A>G ', ' 1-100-A-G ', gene, 'grch38');
    expect(cache.getGeneSymbol('NM_TEST:c.1A>G')).toBe(expected);
    expect(cache.getVcf('NM_TEST:c.1A>G')).toBe('1-100-A-G');
  });

  it.each([
    ['', '1-100-A-G', 'GRCh38'],
    ['variant', 'invalid', 'GRCh38'],
    ['variant', '1-100-A-G', null],
    ['variant', '1-100-A-G', 'GRCh36'],
  ])(
    'rejects malformed coordinate input without changing the cache',
    async (variant, vcf, assembly) => {
      const cache = await loadCache();
      cache.set(variant, vcf, null, assembly);
      expect(cache.getVcf(variant)).toBeNull();
      expect(cache.get({})).toBeNull();
    },
  );

  it('evicts the least recently used entry when adding beyond capacity', async () => {
    const cache = await loadCache();
    for (let i = 0; i < 500; i++) cache.set(`variant-${i}`, `1-${i + 1}-A-G`);
    cache.get('variant-0');
    cache.set('extra', '2-100-A-G');
    expect(cache.getVcf('variant-0')).toBe('1-1-A-G');
    expect(cache.getVcf('variant-1')).toBeNull();
    expect(cache.getVcf('extra')).toBe('2-100-A-G');
  });

  it('keeps in-memory coordinates usable when storage is blocked', async () => {
    localStorage.getItem.mockImplementationOnce(() => {
      throw new Error('Storage blocked');
    });
    const cache = await loadCache();
    localStorage.setItem.mockImplementationOnce(() => {
      throw new Error('Storage blocked');
    });
    cache.set('variant', '1-100-A-G');
    expect(cache.getVcf('variant')).toBe('1-100-A-G');
  });
  it('does not rewrite an unresolved substitution to an invented insertion', async () => {
    const cache = await loadCache();
    expect(cache.getVcf('NM_004380.3:c.589G>T')).toBeNull();
  });

  it('ignores old persisted shortcuts with unverified coordinate provenance', async () => {
    localStorage.setItem(
      'nc_scorer_coordinate_lru_cache',
      JSON.stringify({
        'GRCH38:NM_004380.3:c.589G>T': {
          vcf: '1-55051215-G-GA',
          gene: 'PCSK9',
          assembly: 'GRCh38',
        },
      }),
    );
    const cache = await loadCache();
    expect(cache.getVcf('NM_004380.3:c.589G>T')).toBeNull();
  });

  it('keeps resolved coordinates isolated by assembly and persists them', async () => {
    const cache = await loadCache();
    cache.set('NM_TEST:c.1A>G', '1-100-A-G', 'TEST', 'GRCh37');
    expect(cache.getVcf('NM_TEST:c.1A>G', 'GRCh38')).toBeNull();
    vi.resetModules();
    expect((await loadCache()).getVcf('NM_TEST:c.1A>G', 'GRCh37')).toBe(
      '1-100-A-G',
    );
  });

  it('updates a full cache without evicting an unrelated entry', async () => {
    const cache = await loadCache();
    for (let i = 0; i < 500; i++) cache.set(`variant-${i}`, `1-${i + 1}-A-G`);
    cache.set('variant-499', '1-999-A-G');
    expect(cache.getVcf('variant-0')).toBe('1-1-A-G');
  });

  it('ignores malformed coordinates instead of caching object coercions', async () => {
    const cache = await loadCache();
    cache.set('variant', { position: 1 });
    expect(cache.getVcf('variant')).toBeNull();
    expect(() => cache.set({}, '1-1-A-G')).not.toThrow();
  });
});
