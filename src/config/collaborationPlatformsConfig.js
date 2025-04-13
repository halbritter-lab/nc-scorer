/**
 * Configuration for researcher collaboration platforms
 * These platforms help researchers connect with others studying the same genes/variants
 */
export const collaborationPlatformsConfig = {
  // Main platforms that are directly integrated
  primaryPlatforms: [
    {
      id: 'genematcher',
      name: 'GeneMatcher',
      description: 'Connect with researchers studying the same gene',
      url: 'https://genematcher.org/',
      icon: 'mdi-dna',
      geneParam: 'gene', // URL parameter for gene symbol
      color: 'primary',
    },
    {
      id: 'matchmaker',
      name: 'Matchmaker Exchange',
      description: 'Federated network for rare disease gene discovery',
      url: 'https://www.matchmakerexchange.org/',
      icon: 'mdi-account-group',
      color: 'secondary',
    },
  ],
  
  // Additional platforms that may be of interest
  additionalPlatforms: [
    {
      id: 'decipher',
      name: 'DECIPHER',
      description: 'Database for sharing and comparing phenotypic and genotypic data',
      url: 'https://www.deciphergenomics.org/',
      icon: 'mdi-database',
      color: 'info',
    },
    {
      id: 'varsome',
      name: 'VarSome Connect',
      description: 'Find others who have queried the same variant',
      url: 'https://varsome.com/',
      icon: 'mdi-share-variant',
      color: 'info',
    },
  ],
  
  // Text for menu and tooltips
  uiText: {
    menuTitle: 'Find Collaborators',
    buttonTooltip: 'Connect with researchers studying similar genes/variants',
    learnMoreLink: '/docs/collaboration-platforms',
  }
};
