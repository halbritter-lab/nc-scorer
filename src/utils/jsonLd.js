import { seoConfig } from '@/config/seo.config';

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${seoConfig.baseUrl}/#organization`,
    name: 'Halbritter Lab',
    url: 'https://halbritter-lab.com',
    logo: {
      '@type': 'ImageObject',
      url: `${seoConfig.baseUrl}/halbritter-lab-logo.png`,
      width: 200,
      height: 60
    },
    sameAs: seoConfig.jsonLd.organization.sameAs,
    memberOf: {
      '@type': 'Organization',
      name: 'Leipzig University Medical Center'
    }
  };
}

export function generateWebApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${seoConfig.baseUrl}/#webapp`,
    name: seoConfig.siteName,
    url: seoConfig.baseUrl,
    description: seoConfig.siteDescription,
    applicationCategory: 'HealthApplication',
    applicationSubCategory: 'MedicalCalculator',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript enabled',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    },
    featureList: seoConfig.jsonLd.webApplication.featureList,
    screenshot: `${seoConfig.baseUrl}/screenshot.png`,
    creator: {
      '@id': `${seoConfig.baseUrl}/#organization`
    },
    maintainer: {
      '@id': `${seoConfig.baseUrl}/#organization`
    }
  };
}

export function generateBreadcrumbSchema(breadcrumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url ? `${seoConfig.baseUrl}${item.url}` : undefined
    }))
  };
}

export function generateGeneSchema(geneData) {
  const gene = geneData;
  return {
    '@context': 'https://schema.org',
    '@type': 'Gene',
    '@id': `${seoConfig.baseUrl}/gene/${gene.symbol}#gene`,
    name: gene.symbol,
    alternativeName: gene.name,
    identifier: [
      {
        '@type': 'PropertyValue',
        propertyID: 'HGNC',
        value: gene.hgnc_id
      },
      {
        '@type': 'PropertyValue',
        propertyID: 'Ensembl',
        value: gene.ensembl_id
      }
    ],
    associatedDisease: gene.phenotypes?.map(phenotype => ({
      '@type': 'MedicalCondition',
      name: phenotype
    })) || [],
    isPartOf: {
      '@type': 'Dataset',
      name: 'NC-Scorer Gene Database',
      description: 'Curated database of genes associated with kidney disease'
    }
  };
}

export function generateVariantSchema(variantData) {
  const variant = variantData;
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `Variant ${variant.id || variant.rsid}`,
    description: `Genetic variant analysis for ${variant.id || variant.rsid} in ${variant.gene}`,
    variableMeasured: [
      {
        '@type': 'PropertyValue',
        name: 'Nephro Candidate Score',
        value: variant.score
      },
      {
        '@type': 'PropertyValue',
        name: 'Consequence',
        value: variant.consequence
      },
      {
        '@type': 'PropertyValue',
        name: 'Population Frequency',
        value: variant.frequency
      }
    ],
    isPartOf: {
      '@type': 'MedicalStudy',
      name: 'Kidney Disease Genetic Variant Analysis',
      studySubject: {
        '@type': 'MedicalCondition',
        name: 'Chronic Kidney Disease'
      }
    }
  };
}

export function generateMethodologySchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: 'Nephro Candidate Score (NCS) Methodology',
    description: 'Scientific methodology for automated genetic variant assessment in kidney disease',
    author: {
      '@id': `${seoConfig.baseUrl}/#organization`
    },
    publisher: {
      '@id': `${seoConfig.baseUrl}/#organization`
    },
    datePublished: '2023-01-01',
    dateModified: new Date().toISOString().split('T')[0],
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${seoConfig.baseUrl}/methodology`
    },
    keywords: 'genetic scoring, variant prioritization, kidney disease, bioinformatics',
    articleSection: 'Methodology',
    about: {
      '@type': 'MedicalCondition',
      name: 'Chronic Kidney Disease of Unknown Etiology',
      alternateName: 'CKDu'
    }
  };
}

export function generateSearchActionSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${seoConfig.baseUrl}/#website`,
    url: seoConfig.baseUrl,
    name: seoConfig.siteName,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${seoConfig.baseUrl}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

export function generateFAQSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

export function generateHowToSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Use NC-Scorer for Genetic Variant Analysis',
    description: 'Step-by-step guide for using NC-Scorer to analyze genetic variants in kidney disease',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Search for a gene',
        text: 'Enter a gene symbol (e.g., PKD1) in the search box',
        image: `${seoConfig.baseUrl}/tutorial/step1.png`
      },
      {
        '@type': 'HowToStep',
        name: 'Select variant',
        text: 'Choose a specific variant from the results',
        image: `${seoConfig.baseUrl}/tutorial/step2.png`
      },
      {
        '@type': 'HowToStep',
        name: 'Review score',
        text: 'Examine the Nephro Candidate Score and variant details',
        image: `${seoConfig.baseUrl}/tutorial/step3.png`
      },
      {
        '@type': 'HowToStep',
        name: 'Export results',
        text: 'Download results in your preferred format',
        image: `${seoConfig.baseUrl}/tutorial/step4.png`
      }
    ],
    totalTime: 'PT5M',
    supply: [],
    tool: [
      {
        '@type': 'HowToTool',
        name: 'Web browser with JavaScript enabled'
      }
    ]
  };
}

export function combineSchemas(...schemas) {
  return schemas.filter(Boolean);
}

export function wrapInScriptTag(schema) {
  return {
    type: 'application/ld+json',
    innerHTML: JSON.stringify(Array.isArray(schema) ? schema : [schema])
  };
}