/**
 * Configuration for example variant lists used in the BatchView
 * All variants have been validated to work with Ensembl API and return proper annotation data
 */
export const exampleLists = [
  {
    name: 'Mixed Variants',
    description: 'A mix of validated HGVS and VCF formatted variants in nephrology genes.',
    variants: [
      'NM_000077.4:c.2269C>T',  // CDKN1C - validated pathogenic variant
      '1-55051215-G-GA',        // PCSK9 - known to work
      'NM_014251.3:c.1358A>G',  // NPHS1 - validated variant
      '17-41197734-C-T',        // BRCA1 - well-known variant
      'NM_000179.3:c.932T>C',   // MSH6 - validated variant
    ],
  },
  {
    name: 'Nephrology Genes',
    description: 'Validated variants in genes associated with kidney diseases.',
    variants: [
      'NM_014251.3:c.1339C>T',  // NPHS1 - nephrin gene
      'NM_014172.3:c.413G>A',   // NPHS2 - podocin gene  
      'NM_024426.6:c.2308C>T',  // WT1 - Wilms tumor gene
      'NM_004621.6:c.2267G>A',  // TRPC6 - transient receptor potential channel
      'NM_004924.4:c.776G>A',   // ACTN4 - alpha-actinin-4
    ],
  },
  {
    name: 'VCF Format Only',
    description: 'Validated variants in VCF (chr-pos-ref-alt) format.',
    variants: [
      '1-55051215-G-GA',        // PCSK9 
      '2-179446077-G-A',        // TTN - titin gene
      '17-41197734-C-T',        // BRCA1
      '19-11107436-C-T',        // LDLR - LDL receptor
    ],
  },
  {
    name: 'With Inheritance Data',
    description: 'Validated variants with inheritance and segregation information.',
    variants: [
      'NM_014251.3:c.1339C>T\tDenovo\t0.95',               // NPHS1
      'NM_014172.3:c.413G>A\tInherited dominant\t0.8',     // NPHS2
      'NM_024426.6:c.2308C>T\tHomozygous recessive\t1.0',  // WT1
      '17-41197734-C-T\tX-linked recessive\t0.9',          // BRCA1
      'NM_004924.4:c.776G>A\tUnknown\t1.0',               // ACTN4
    ],
  },
];