/**
 * Configuration for example variant lists used in the BatchView
 */
export const exampleLists = [
  {
    name: 'Mixed Variants',
    description: 'A mix of common HGVS and VCF formatted variants.',
    variants: [
      'NM_004380.3:c.589G>T',
      '1-55051215-G-GA',
      'ENST00000275493.7:c.2551C>T',
      '17-41197799-A-G',
      'NM_000059.3:c.5242C>T',
    ],
  },
  {
    name: 'Common FSGS Genes',
    description: 'A list of variants in genes frequently associated with Focal Segmental Glomerulosclerosis.',
    variants: [
      'NPHS1:c.340C>T',
      'NPHS2:c.413G>A',
      'WT1:c.1180C>T',
      'TRPC6:c.320A>G',
      'ACTN4:c.311C>T',
    ],
  },
  {
    name: 'VCF Format Only',
    description: 'A list of variants exclusively in VCF (chr-pos-ref-alt) format.',
    variants: [
      '1-978810-G-A',
      '2-215881023-C-T',
      'X-153380481-C-T',
      '11-64354518-G-A',
    ],
  },
];