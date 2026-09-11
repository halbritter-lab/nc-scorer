/**
 * Configuration for example variant lists used in the BatchView
 * Checked against Ensembl GRCh38 on 2026-09-11. Examples demonstrate input
 * formats, not a clinical classification. Selecting a preset selects its assembly.
 */
export const exampleLists = [
  {
    name: 'Mixed Variants',
    description:
      'HGVS and GRCh38 coordinate examples in PKD1, COL4A5, and CEP290.',
    assembly: 'GRCh38',
    variants: [
      'NM_001009944.3:c.11935C>T', // PKD1
      'NM_033380.3:c.1871G>A', // COL4A5
      '12-88101183-A-G', // CEP290
    ],
  },
  {
    name: 'Nephrology Genes',
    description: 'Specific variants in PKD1, COL4A5, and CEP290 on GRCh38.',
    assembly: 'GRCh38',
    variants: [
      'NM_001009944.3:c.11935C>T', // PKD1
      'NM_033380.3:c.1871G>A', // COL4A5
      '12-88101183-A-G', // CEP290
    ],
  },
  {
    name: 'VCF Format Only',
    description: 'GRCh38 chromosome-position-reference-alternate examples.',
    assembly: 'GRCh38',
    variants: [
      '16-2090952-G-A', // PKD1
      '12-88101183-A-G', // CEP290
    ],
  },
  {
    name: 'With Inheritance Data',
    description: 'GRCh38 variants with illustrative inheritance inputs.',
    assembly: 'GRCh38',
    variants: [
      'NM_001009944.3:c.11935C>T\tInherited dominant\t0.95',
      'NM_033380.3:c.1871G>A\tX-linked recessive\t0.9',
      '12-88101183-A-G\tHomozygous recessive\t1',
    ],
  },
];
