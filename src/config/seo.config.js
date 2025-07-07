export const seoConfig = {
  baseUrl: 'https://nc-scorer.kidney-genetics.org',
  siteName: 'NC-Scorer',
  siteDescription: 'Automated assessment tool for candidate variants in Exome Sequencing for patients with Chronic Kidney Disease of unknown etiology (CKDu)',
  siteKeywords: ['nephrology', 'genetics', 'variant analysis', 'kidney disease', 'CKD', 'exome sequencing', 'genetic testing', 'nephro candidate score'],
  defaultImage: '/og-image.png',
  twitterHandle: '@kidney_genetics',
  locale: 'en_US',
  
  routes: {
    home: {
      title: 'NC-Scorer - Nephro Candidate Score for Genetic Variant Assessment',
      description: 'Free online tool for automated assessment of genetic variants in kidney disease using the Nephro Candidate Score (NCS) algorithm.',
      keywords: ['nephro candidate score', 'kidney disease genetics', 'variant scoring', 'CKD genetics']
    },
    search: {
      title: 'Search Genes & Variants | NC-Scorer',
      description: 'Search for genes and genetic variants associated with kidney disease. Get instant Nephro Candidate Scores for variant prioritization.',
      keywords: ['gene search', 'variant search', 'kidney gene database']
    },
    batch: {
      title: 'Batch Variant Processing | NC-Scorer',
      description: 'Process up to 200 genetic variants simultaneously. Export results in multiple formats including CSV, TSV, JSON, and VCF.',
      keywords: ['batch processing', 'variant analysis', 'bulk scoring']
    },
    methodology: {
      title: 'Methodology - Nephro Candidate Score | NC-Scorer',
      description: 'Learn about the Nephro Candidate Score (NCS) algorithm and scoring methodology for genetic variant assessment in kidney disease.',
      keywords: ['scoring methodology', 'NCS algorithm', 'variant prioritization']
    },
    about: {
      title: 'About NC-Scorer | Kidney Genetics Tool',
      description: 'NC-Scorer is developed by the Halbritter Lab for automated genetic variant assessment in chronic kidney disease research.',
      keywords: ['about', 'Halbritter Lab', 'kidney genetics research']
    },
    gene: {
      titleTemplate: '%s Gene Analysis | NC-Scorer',
      descriptionTemplate: 'Comprehensive analysis of %s gene variants in kidney disease. View inheritance patterns, associated phenotypes, and variant scores.',
      keywords: ['gene analysis', 'kidney disease', 'genetic variants']
    },
    variant: {
      titleTemplate: '%s Variant Analysis | NC-Scorer',
      descriptionTemplate: 'Detailed analysis of genetic variant %s including Nephro Candidate Score, population frequency, and clinical significance.',
      keywords: ['variant analysis', 'clinical significance', 'population frequency']
    }
  },
  
  openGraph: {
    type: 'website',
    site_name: 'NC-Scorer',
    image: {
      width: 1200,
      height: 630,
      alt: 'NC-Scorer - Nephro Candidate Score Tool'
    }
  },
  
  twitter: {
    card: 'summary_large_image',
    creator: '@kidney_genetics',
    site: '@kidney_genetics'
  },
  
  jsonLd: {
    organization: {
      '@type': 'Organization',
      name: 'Halbritter Lab',
      url: 'https://halbritter-lab.com',
      logo: 'https://nc-scorer.kidney-genetics.org/halbritter-lab-logo.png',
      sameAs: [
        'https://github.com/halbritter-lab',
        'https://twitter.com/kidney_genetics'
      ]
    },
    webApplication: {
      '@type': 'WebApplication',
      name: 'NC-Scorer',
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      featureList: [
        'Genetic variant scoring',
        'Batch processing',
        'Export functionality',
        'Gene search',
        'Variant annotation'
      ]
    }
  }
};

export function getRouteConfig(routeName, params = {}) {
  const route = seoConfig.routes[routeName] || seoConfig.routes.home;
  const config = { ...route };
  
  // Handle dynamic routes
  if (routeName === 'gene' && params.gene) {
    config.title = route.titleTemplate.replace('%s', params.gene.toUpperCase());
    config.description = route.descriptionTemplate.replace('%s', params.gene.toUpperCase());
    config.keywords = [...route.keywords, params.gene.toLowerCase(), `${params.gene} mutations`];
  } else if (routeName === 'variant' && params.variant) {
    config.title = route.titleTemplate.replace('%s', params.variant);
    config.description = route.descriptionTemplate.replace('%s', params.variant);
    config.keywords = [...route.keywords, params.variant];
  }
  
  return config;
}

export function generateMetaTags(route, customMeta = {}) {
  const config = getRouteConfig(route.name, route.params);
  const baseUrl = seoConfig.baseUrl;
  const currentUrl = `${baseUrl}${route.fullPath}`;
  
  return {
    title: customMeta.title || config.title,
    meta: [
      // Basic meta tags
      { name: 'description', content: customMeta.description || config.description },
      { name: 'keywords', content: (customMeta.keywords || config.keywords).join(', ') },
      { name: 'author', content: 'Halbritter Lab' },
      
      // Open Graph
      { property: 'og:title', content: customMeta.title || config.title },
      { property: 'og:description', content: customMeta.description || config.description },
      { property: 'og:type', content: seoConfig.openGraph.type },
      { property: 'og:url', content: currentUrl },
      { property: 'og:site_name', content: seoConfig.openGraph.site_name },
      { property: 'og:image', content: `${baseUrl}${customMeta.image || seoConfig.defaultImage}` },
      { property: 'og:image:width', content: seoConfig.openGraph.image.width },
      { property: 'og:image:height', content: seoConfig.openGraph.image.height },
      { property: 'og:image:alt', content: seoConfig.openGraph.image.alt },
      { property: 'og:locale', content: seoConfig.locale },
      
      // Twitter Card
      { name: 'twitter:card', content: seoConfig.twitter.card },
      { name: 'twitter:title', content: customMeta.title || config.title },
      { name: 'twitter:description', content: customMeta.description || config.description },
      { name: 'twitter:image', content: `${baseUrl}${customMeta.image || seoConfig.defaultImage}` },
      { name: 'twitter:site', content: seoConfig.twitter.site },
      { name: 'twitter:creator', content: seoConfig.twitter.creator },
      
      // Other
      { name: 'robots', content: 'index, follow' },
      { name: 'googlebot', content: 'index, follow' }
    ],
    link: [
      { rel: 'canonical', href: currentUrl }
    ]
  };
}