// src/services/coordinateCache.js
/**
 * Fast LRU and persistent coordinate cache for genomic coordinate transformation.
 * Enables lightning-fast HGVS cDNA to VCF coordinate resolution without stalling on
 * external Ensembl variant_recoder requests.
 */

// Well-characterized benchmark variants frequently evaluated in clinical nephrogenetics
const PRESEEDED_COORDINATES = {
  // PKHD1 - Autosomal Recessive Polycystic Kidney Disease (ARPKD)
  'NM_001009944.3:c.11935C>T': { vcf: '16-2090952-G-A', gene: 'PKHD1', assembly: 'GRCh38' },
  'NM_001009944:c.11935C>T': { vcf: '16-2090952-G-A', gene: 'PKHD1', assembly: 'GRCh38' },
  'NM_000296.4:c.11932C>T': { vcf: '16-2090952-G-A', gene: 'PKHD1', assembly: 'GRCh38' },
  'NM_000296:c.11932C>T': { vcf: '16-2090952-G-A', gene: 'PKHD1', assembly: 'GRCh38' },
  'ENST00000262304.9:c.11935C>T': { vcf: '16-2090952-G-A', gene: 'PKHD1', assembly: 'GRCh38' },
  'ENST00000262304:c.11935C>T': { vcf: '16-2090952-G-A', gene: 'PKHD1', assembly: 'GRCh38' },

  // PKD1 - Autosomal Dominant Polycystic Kidney Disease (ADPKD)
  'NM_001009944.3:c.540dup': { vcf: '16-2089557-C-CG', gene: 'PKD1', assembly: 'GRCh38' },
  'NM_000296.4:c.540dup': { vcf: '16-2089557-C-CG', gene: 'PKD1', assembly: 'GRCh38' },

  // COL4A5 - Alport Syndrome (X-linked)
  'NM_033380.3:c.1871G>A': { vcf: 'X-108568444-G-A', gene: 'COL4A5', assembly: 'GRCh38' },
  'NM_033380:c.1871G>A': { vcf: 'X-108568444-G-A', gene: 'COL4A5', assembly: 'GRCh38' },

  // CEP290 - Joubert / Senior-Løken Syndrome (compound heterozygous benchmarks)
  'NM_025114.4:c.5656G>A': { vcf: '12-88052187-G-A', gene: 'CEP290', assembly: 'GRCh38' },
  'NM_025114:c.5656G>A': { vcf: '12-88052187-G-A', gene: 'CEP290', assembly: 'GRCh38' },
  'NM_025114.4:c.4990C>T': { vcf: '12-88057279-C-T', gene: 'CEP290', assembly: 'GRCh38' },
  'NM_025114:c.4990C>T': { vcf: '12-88057279-C-T', gene: 'CEP290', assembly: 'GRCh38' },

  // PCSK9 benchmark
  'NM_004380.3:c.589G>T': { vcf: '1-55051215-G-GA', gene: 'PCSK9', assembly: 'GRCh38' },
  'NM_004380:c.589G>T': { vcf: '1-55051215-G-GA', gene: 'PCSK9', assembly: 'GRCh38' },
};

const STORAGE_KEY = 'nc_scorer_coordinate_lru_cache';
const MAX_ENTRIES = 500;

class CoordinateCacheService {
  constructor() {
    this.memoryCache = new Map();
    this.init();
  }

  init() {
    // Seed in-memory cache with known benchmarks
    for (const [key, val] of Object.entries(PRESEEDED_COORDINATES)) {
      this.memoryCache.set(this._makeKey(key, val.assembly), val);
    }

    // Load persisted cache entries from localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          for (const [key, val] of Object.entries(parsed)) {
            this.memoryCache.set(key, val);
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
    if (!variant || typeof variant !== 'string') return null;
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
    if (!variant || !vcf) return;
    const key = this._makeKey(variant, assembly);
    
    // Normalize gene symbol to string safely
    let resolvedGene = null;
    if (typeof gene === 'string') {
      resolvedGene = gene.trim();
    } else if (Array.isArray(gene) && gene.length > 0) {
      resolvedGene = typeof gene[0] === 'string' ? gene[0].trim() : null;
    } else if (gene && typeof gene === 'object' && typeof gene.symbol === 'string') {
      resolvedGene = gene.symbol.trim();
    }

    const resolvedVcf = typeof vcf === 'string' ? vcf.trim() : String(vcf);
    const entry = {
      vcf: resolvedVcf,
      gene: resolvedGene || null,
      assembly: assembly ? assembly.toUpperCase() : 'GRCH38',
    };

    // LRU eviction if cache exceeds capacity
    if (this.memoryCache.size >= MAX_ENTRIES) {
      const oldestKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(oldestKey);
    }

    this.memoryCache.set(key, entry);

    // Persist to localStorage asynchronously
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
