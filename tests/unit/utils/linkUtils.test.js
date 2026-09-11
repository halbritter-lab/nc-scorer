import { describe, expect, it } from 'vitest';
import { generateVariantLinks } from '@/utils/linkUtils';
import { externalDbUrls } from '@/config/variantAnnotationConfig';

describe('Variant resource links', () => {
  it('uses canonical assembly spellings and avoids links for unsupported assemblies', () => {
    const links = generateVariantLinks(
      '12-88101183-A-G',
      externalDbUrls,
      ' grch37 ',
    );
    expect(new URL(links.ensembl).hostname).toBe('grch37.ensembl.org');
    expect(
      generateVariantLinks('12-88101183-A-G', externalDbUrls, 'GRCh36'),
    ).toEqual({});
  });
  it('preserves the selected genome assembly when leaving the app', () => {
    const links = generateVariantLinks(
      '12-88101183-A-G',
      externalDbUrls,
      'GRCh37',
    );
    expect(new URL(links.ensembl).hostname).toBe('grch37.ensembl.org');
    expect(new URL(links.ucsc).searchParams.get('db')).toBe('hg19');
    expect(new URL(links.gnomad).searchParams.get('dataset')).toBe(
      'gnomad_r2_1',
    );
  });
  it('does not misinterpret an HGVS expression with dashes as genomic coordinates', () => {
    expect(
      generateVariantLinks('NM_000000.1:c.1-2-3-4', externalDbUrls),
    ).toEqual({});
  });
});
