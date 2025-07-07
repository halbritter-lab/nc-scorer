import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read gene database - with fallback for missing file
const genesPath = path.join(__dirname, '../src/data/genes.json');
let genes = [];
try {
  if (fs.existsSync(genesPath)) {
    genes = JSON.parse(fs.readFileSync(genesPath, 'utf8'));
  }
} catch (error) {
  console.warn('Warning: Could not read genes.json, using empty gene list for sitemap');
}

// Generate routes for all genes
function generateGeneRoutes() {
  const routes = [];
  
  genes.forEach(gene => {
    // Gene detail page
    routes.push({
      url: `/symbols/${gene.symbol}`,
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: new Date().toISOString()
    });
    
    // Add common variant routes for high-priority genes
    if (gene.priority === 'high' || gene.symbol.startsWith('PKD')) {
      routes.push({
        url: `/search?gene=${gene.symbol}`,
        changefreq: 'weekly',
        priority: 0.7
      });
    }
  });
  
  return routes;
}

// Generate static routes
function generateStaticRoutes() {
  return [
    { url: '/', changefreq: 'weekly', priority: 1.0 },
    { url: '/genes', changefreq: 'weekly', priority: 0.9 },
    { url: '/batch', changefreq: 'weekly', priority: 0.8 },
    { url: '/about', changefreq: 'monthly', priority: 0.7 },
    { url: '/methodology', changefreq: 'monthly', priority: 0.7 },
    { url: '/search', changefreq: 'daily', priority: 0.9 },
    { url: '/privacy', changefreq: 'monthly', priority: 0.5 },
    { url: '/terms', changefreq: 'monthly', priority: 0.5 },
  ];
}

// Main function to generate all routes
export function generateSitemapRoutes() {
  const staticRoutes = generateStaticRoutes();
  const geneRoutes = generateGeneRoutes();
  
  // Combine all routes
  const allRoutes = [...staticRoutes, ...geneRoutes];
  
  // Add timestamps
  const timestamp = new Date().toISOString();
  allRoutes.forEach(route => {
    if (!route.lastmod) {
      route.lastmod = timestamp;
    }
  });
  
  return allRoutes;
}

// Export for use in vite config
export default generateSitemapRoutes;

// If run directly, output the routes
if (import.meta.url === `file://${process.argv[1]}`) {
  const routes = generateSitemapRoutes();
  console.log(`Generated ${routes.length} routes for sitemap`);
  console.log('Sample routes:', routes.slice(0, 5));
}