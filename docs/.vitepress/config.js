import { defineConfig } from 'vitepress';
import { fileURLToPath } from 'url';

export default defineConfig({
  base: '/docs/',
  title: 'NC-Scorer Documentation',
  description: 'Automated assessment of candidate variants in Exome Sequencing for CKD patients',
  
  head: [
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
  ],

  themeConfig: {
    logo: '/logo.png',
    
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'API Reference', link: '/api/' },
      { text: 'FAQ', link: '/faq' },
      { text: '← Back to NC-Scorer App', link: '../' }
    ],
    
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/halbritter-lab/nc-scorer' }
    ],
    
    search: {
      provider: 'local'
    },
    
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 Halbritter Lab'
    }
  }
});