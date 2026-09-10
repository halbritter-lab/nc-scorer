import { useHead } from '@unhead/vue';
import { computed, toValue } from 'vue';
import { useRoute } from 'vue-router';
import { generateMetaTags } from '@/config/seo.config';

export function useSeo(customMeta = {}) {
  const route = useRoute();
  
  const metaTags = computed(() => {
    const meta = toValue(customMeta) || {};
    return generateMetaTags(route, meta);
  });
  
  // Unhead automatically tracks computed refs reactively
  const head = useHead(metaTags);
  
  return {
    head,
    metaTags,
    updateMeta: (newMeta) => {
      const meta = toValue(customMeta) || {};
      Object.assign(meta, newMeta);
      if (head && typeof head.patch === 'function') {
        head.patch(generateMetaTags(route, meta));
      }
    }
  };
}

export function useGenePageSeo(geneData) {
  const customMeta = computed(() => {
    const gene = toValue(geneData);
    if (!gene || !gene.symbol) return {};
    
    const description = `Explore ${gene.symbol} (${gene.name || 'Gene'}) variants associated with kidney disease. 
      ${gene.inheritance ? `Inheritance: ${gene.inheritance}.` : ''} 
      ${gene.phenotypes ? `Associated conditions: ${gene.phenotypes.slice(0, 3).join(', ')}.` : ''}`;
    
    return {
      title: `${gene.symbol} - ${gene.name || 'Gene Analysis'} | NC-Scorer`,
      description: description.replace(/\s+/g, ' ').trim(),
      keywords: [
        (gene.symbol || '').toLowerCase(),
        'kidney disease',
        'genetic variants',
        ...(gene.phenotypes || []).slice(0, 5).map(p => p.toLowerCase())
      ]
    };
  });
  
  // Pass the computed ref directly so Unhead reacts when geneData resolves!
  return useSeo(customMeta);
}

export function useVariantPageSeo(variantData) {
  const route = useRoute();
  
  const customMeta = computed(() => {
    const variant = toValue(variantData);
    if (!variant) return {};
    
    const gene = variant.gene || (route && route.params ? route.params.gene : '') || '';
    const variantId = variant.id || variant.rsid || (route && route.params ? route.params.variant : '') || '';
    
    const description = `Analysis of ${gene} variant ${variantId}. 
      ${variant.consequence ? `Consequence: ${variant.consequence}.` : ''} 
      ${variant.frequency ? `Population frequency: ${variant.frequency}.` : ''} 
      View Nephro Candidate Score and clinical significance.`;
    
    return {
      title: `${variantId} in ${gene} - Variant Analysis | NC-Scorer`,
      description: description.replace(/\s+/g, ' ').trim(),
      keywords: [
        variantId,
        gene.toLowerCase(),
        'variant analysis',
        'kidney disease',
        variant.consequence?.toLowerCase() || 'genetic variant'
      ]
    };
  });
  
  // Pass computed ref directly
  return useSeo(customMeta);
}

export function useBatchPageSeo(batchData) {
  const customMeta = computed(() => {
    const batch = toValue(batchData);
    if (!batch || batch.length === 0) {
      return {
        title: 'Batch Variant Processing - Upload Your Data | NC-Scorer',
        description: 'Process multiple genetic variants at once. Upload VCF, CSV, or TSV files with up to 200 variants for automated Nephro Candidate Score analysis.'
      };
    }
    
    return {
      title: `Processing ${batch.length} Variants | NC-Scorer Batch Analysis`,
      description: `Currently analyzing ${batch.length} genetic variants. Export results in multiple formats with comprehensive scoring and annotations.`
    };
  });
  
  // Pass computed ref directly
  return useSeo(customMeta);
}