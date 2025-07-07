import { defineConfig } from 'vitepress';
import { fileURLToPath } from 'url';

export default defineConfig({
  base: '/docs/',
  title: 'NC-Scorer Documentation',
  description: 'Comprehensive guide for using NC-Scorer - Automated assessment tool for genetic variants in kidney disease',
  lang: 'en-US',
  
  head: [
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    ['meta', { name: 'author', content: 'Halbritter Lab' }],
    ['meta', { name: 'keywords', content: 'NC-Scorer, documentation, kidney disease, genetics, variant analysis, API reference' }],
    
    // Open Graph
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'NC-Scorer Documentation' }],
    ['meta', { property: 'og:image', content: 'https://nc-scorer.kidney-genetics.org/og-image.png' }],
    ['meta', { property: 'og:locale', content: 'en_US' }],
    
    // Twitter Card
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:site', content: '@kidney_genetics' }],
    ['meta', { name: 'twitter:creator', content: '@kidney_genetics' }],
    ['meta', { name: 'twitter:image', content: 'https://nc-scorer.kidney-genetics.org/og-image.png' }],
    
    // Canonical URL
    ['link', { rel: 'canonical', href: 'https://nc-scorer.kidney-genetics.org/docs/' }],
    
    // JSON-LD
    ['script', {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: 'NC-Scorer Documentation',
        description: 'Comprehensive guide for using NC-Scorer - Automated assessment tool for genetic variants in kidney disease',
        author: {
          '@type': 'Organization',
          name: 'Halbritter Lab',
          url: 'https://halbritter-lab.com'
        },
        publisher: {
          '@type': 'Organization',
          name: 'Halbritter Lab',
          url: 'https://halbritter-lab.com'
        },
        datePublished: '2023-01-01',
        dateModified: new Date().toISOString()
      })
    }]
  ],
  
  // Generate sitemap
  sitemap: {
    hostname: 'https://nc-scorer.kidney-genetics.org',
    transformItems: (items) => {
      return items.map(item => ({
        ...item,
        changefreq: 'weekly',
        priority: item.url.includes('/guide/') ? 0.8 : 0.7
      }))
    }
  },

  themeConfig: {
    logo: '/logo.png',
    
    // SEO-friendly navigation
    nav: [
      { text: 'Guide', link: '/guide/', activeMatch: '^/guide/' },
      { text: 'API Reference', link: '/api/', activeMatch: '^/api/' },
      { text: 'FAQ', link: '/faq', activeMatch: '^/faq' },
      { text: 'NC-Scorer App', link: 'https://nc-scorer.kidney-genetics.org' }
    ],
    
    // Sidebar with better structure for SEO
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Installation', link: '/guide/installation' }
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Nephro Candidate Score', link: '/guide/ncs-score' },
            { text: 'Gene Analysis', link: '/guide/gene-analysis' },
            { text: 'Variant Assessment', link: '/guide/variant-assessment' }
          ]
        },
        {
          text: 'Features',
          items: [
            { text: 'Search', link: '/guide/search' },
            { text: 'Batch Processing', link: '/guide/batch-processing' },
            { text: 'Export Options', link: '/guide/export' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Gene API', link: '/api/genes' },
            { text: 'Variant API', link: '/api/variants' },
            { text: 'Scoring API', link: '/api/scoring' }
          ]
        }
      ]
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/halbritter-lab/nc-scorer' },
      { icon: 'twitter', link: 'https://twitter.com/kidney_genetics' }
    ],
    
    // Enhanced search with better indexing
    search: {
      provider: 'local',
      options: {
        detailedView: true,
        _render(src, env, md) {
          const html = md.render(src, env)
          // Add structured data to search results
          if (env.frontmatter?.search !== false) {
            return html
          }
          return ''
        }
      }
    },
    
    editLink: {
      pattern: 'https://github.com/halbritter-lab/nc-scorer/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },
    
    lastUpdated: {
      text: 'Last updated',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    },
    
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 Halbritter Lab. All rights reserved.'
    }
  },
  
  // Markdown configuration for better SEO
  markdown: {
    attrs: {
      leftDelimiter: '{',
      rightDelimiter: '}'
    },
    headers: {
      level: [2, 3, 4]
    }
  },
  
  // Clean URLs
  cleanUrls: true,
  
  // Better meta descriptions
  transformPageData(pageData) {
    // Auto-generate description from content if not provided
    if (!pageData.frontmatter.description && pageData.content) {
      const firstParagraph = pageData.content.match(/^[^#\n].*$/m)
      if (firstParagraph) {
        pageData.description = firstParagraph[0].substring(0, 160) + '...'
      }
    }
    
    // Add default meta tags
    pageData.frontmatter.head = pageData.frontmatter.head || []
    
    // Add page-specific meta tags
    if (pageData.frontmatter.description) {
      pageData.frontmatter.head.push([
        'meta',
        { name: 'description', content: pageData.frontmatter.description }
      ])
    }
    
    // Add Open Graph tags for each page
    pageData.frontmatter.head.push(
      ['meta', { property: 'og:title', content: pageData.title + ' | NC-Scorer Documentation' }],
      ['meta', { property: 'og:description', content: pageData.frontmatter.description || pageData.description }],
      ['meta', { property: 'og:url', content: `https://nc-scorer.kidney-genetics.org/docs${pageData.relativePath.replace(/\.md$/, '.html')}` }]
    )
  }
});