import { useHead } from '@vueuse/head';
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { generateMetaTags } from '@/config/seo.config';

export function useSeo(customMeta = {}) {
  const route = useRoute();
  
  const metaTags = computed(() => {
    return generateMetaTags(route, customMeta);
  });
  
  // Update head tags
  const head = useHead(metaTags);
  
  // Watch for route changes
  watch(route, () => {
    head.value = metaTags.value;
  });
  
  return {
    metaTags,
    updateMeta: (newMeta) => {
      Object.assign(customMeta, newMeta);
      head.value = generateMetaTags(route, customMeta);
    }
  };
}

export function useGenePageSeo(geneData) {
  const customMeta = computed(() => {
    if (!geneData.value) return {};
    
    const gene = geneData.value;
    const description = `Explore ${gene.symbol} (${gene.name || 'Gene'}) variants associated with kidney disease. 
      ${gene.inheritance ? `Inheritance: ${gene.inheritance}.` : ''} 
      ${gene.phenotypes ? `Associated conditions: ${gene.phenotypes.slice(0, 3).join(', ')}.` : ''}`;
    
    return {
      title: `${gene.symbol} - ${gene.name || 'Gene Analysis'} | NC-Scorer`,
      description: description.replace(/\s+/g, ' ').trim(),
      keywords: [
        gene.symbol.toLowerCase(),
        'kidney disease',
        'genetic variants',
        ...(gene.phenotypes || []).slice(0, 5).map(p => p.toLowerCase())
      ]
    };
  });
  
  return useSeo(customMeta.value);
}

export function useVariantPageSeo(variantData) {
  const route = useRoute();
  
  const customMeta = computed(() => {
    if (!variantData.value) return {};
    
    const variant = variantData.value;
    const gene = variant.gene || route.params.gene || '';
    const variantId = variant.id || variant.rsid || route.params.variant || '';
    
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
  
  return useSeo(customMeta.value);
}

export function useBatchPageSeo(batchData) {
  const customMeta = computed(() => {
    if (!batchData.value || batchData.value.length === 0) {
      return {
        title: 'Batch Variant Processing - Upload Your Data | NC-Scorer',
        description: 'Process multiple genetic variants at once. Upload VCF, CSV, or TSV files with up to 200 variants for automated Nephro Candidate Score analysis.'
      };
    }
    
    return {
      title: `Processing ${batchData.value.length} Variants | NC-Scorer Batch Analysis`,
      description: `Currently analyzing ${batchData.value.length} genetic variants. Export results in multiple formats with comprehensive scoring and annotations.`
    };
  });
  
  return useSeo(customMeta.value);
}