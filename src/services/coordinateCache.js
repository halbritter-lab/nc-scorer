// src/services/coordinateCache.js
import { normalizeAssembly } from '@/utils/assemblyUtils.js';
/**
 * Fast LRU and persistent coordinate cache for genomic coordinate transformation.
 * Enables lightning-fast HGVS cDNA to VCF coordinate resolution without stalling on
 * external Ensembl variant_recoder requests.
 */

// Only cache coordinates returned by the API. The legacy cache contained
// unverified shortcuts, so its persisted entries must not be reused.
const STORAGE_KEY = 'nc_scorer_coordinate_lru_cache_v2';
const MAX_ENTRIES = 500;
const VCF_PATTERN =
  /^(?:chr)?(?:[1-9]|1\d|2[0-2]|X|Y|M|MT)-[1-9]\d*-[ACGTN]+-[ACGTN]+$/i;

class CoordinateCacheService {
  constructor() {
    this.memoryCache = new Map();
    this.init();
  }

  init() {
    // Load persisted cache entries from localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
            return;
          for (const [key, val] of Object.entries(parsed).slice(-MAX_ENTRIES)) {
            if (
              val &&
              typeof val.vcf === 'string' &&
              VCF_PATTERN.test(val.vcf) &&
              ['GRCH37', 'GRCH38'].includes(val.assembly) &&
              key.startsWith(`${val.assembly}:`) &&
              (val.gene === null || typeof val.gene === 'string')
            ) {
              this.memoryCache.set(key, val);
            }
          }
        }
      } catch {
        // Fallback gracefully on storage quota or private browsing
      }
    }
  }

  _makeKey(variant, assembly = 'GRCh38') {
    return `${assembly.toUpperCase()}:${variant.trim()}`;
  }

  get(variant, assembly = 'GRCh38') {
    assembly = normalizeAssembly(assembly);
    if (!variant || typeof variant !== 'string' || !assembly) return null;
    const key = this._makeKey(variant, assembly);
    if (this.memoryCache.has(key)) {
      const item = this.memoryCache.get(key);
      // Promote item for LRU eviction order
      this.memoryCache.delete(key);
      this.memoryCache.set(key, item);
      return item;
    }
    return null;
  }

  getVcf(variant, assembly = 'GRCh38') {
    const item = this.get(variant, assembly);
    return item ? item.vcf : null;
  }

  getGeneSymbol(variant, assembly = 'GRCh38') {
    const item = this.get(variant, assembly);
    return item ? item.gene : null;
  }

  set(variant, vcf, gene = null, assembly = 'GRCh38') {
    assembly = normalizeAssembly(assembly);
    if (
      typeof variant !== 'string' ||
      !variant.trim() ||
      typeof vcf !== 'string' ||
      !VCF_PATTERN.test(vcf.trim()) ||
      !assembly
    )
      return;
    const key = this._makeKey(variant, assembly);

    // Normalize gene symbol to string safely
    let resolvedGene = null;
    if (typeof gene === 'string') {
      resolvedGene = gene.trim();
    } else if (Array.isArray(gene) && gene.length > 0) {
      resolvedGene = typeof gene[0] === 'string' ? gene[0].trim() : null;
    } else if (
      gene &&
      typeof gene === 'object' &&
      typeof gene.symbol === 'string'
    ) {
      resolvedGene = gene.symbol.trim();
    }

    const resolvedVcf = typeof vcf === 'string' ? vcf.trim() : String(vcf);
    const entry = {
      vcf: resolvedVcf,
      gene: resolvedGene || null,
      assembly: assembly.toUpperCase(),
    };

    // Updating an entry promotes it without evicting an unrelated coordinate.
    this.memoryCache.delete(key);
    if (this.memoryCache.size >= MAX_ENTRIES) {
      const oldestKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(oldestKey);
    }

    this.memoryCache.set(key, entry);

    // Persist resolved entries to localStorage.
    if (typeof window !== 'undefined') {
      try {
        const serialized = {};
        for (const [k, v] of this.memoryCache.entries()) {
          serialized[k] = v;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
      } catch {
        // Storage limit exceeded or disabled
      }
    }
  }
}

export const coordinateCache = new CoordinateCacheService();
